import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import net from "node:net";

const WORKER_PORT = 8788;
const EMAIL_FIXTURE_PORT = 8790;
const LOCAL_ADMIN_TOKEN = "local-development-only-change-me";
const TURNSTILE_TEST_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";
const STARTUP_TIMEOUT_MS = 20_000;
const REQUEST_TIMEOUT_MS = 5_000;

const projectRoot = path.resolve(import.meta.dirname, "..");
const pnpmExecutable = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const temporaryRoot = await mkdtemp(
  path.join(tmpdir(), "kashphool-leads-smoke-")
);
const persistencePath = path.join(temporaryRoot, "wrangler-state");
const wranglerLogPath = path.join(temporaryRoot, "wrangler.log");

let workerProcess;
let emailFixture;
let workerOutput = "";

const boundedText = text =>
  text.length > 4_000 ? `${text.slice(-4_000)}\n[output truncated]` : text;

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const assertPortAvailable = port =>
  new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", () => reject(new Error(`Port ${port} is unavailable`)));
    probe.listen(port, "127.0.0.1", () => {
      probe.close(error => (error ? reject(error) : resolve()));
    });
  });

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: {
        ...process.env,
        CI: "true",
        WRANGLER_LOG_PATH: wranglerLogPath,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", chunk => {
      output = boundedText(output + String(chunk));
    });
    child.stderr.on("data", chunk => {
      output = boundedText(output + String(chunk));
    });
    child.once("error", reject);
    child.once("exit", code => {
      if (code === 0) resolve(output);
      else reject(new Error(`Command failed with exit ${code}\n${output}`));
    });
  });

const request = async (url, init = {}) => {
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  return fetch(url, { ...init, signal });
};

const waitForWorker = async () => {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (workerProcess?.exitCode !== null) {
      throw new Error(
        `Wrangler exited before startup (${workerProcess?.exitCode})`
      );
    }
    try {
      const response = await request(`http://127.0.0.1:${WORKER_PORT}/health`);
      if (response.status === 404) return;
    } catch {
      // Wrangler is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for the local Worker");
};

const json = async response => {
  const value = await response.json();
  assert(value && typeof value === "object", "Expected a JSON object response");
  return value;
};

const stopWorker = async () => {
  if (!workerProcess || workerProcess.exitCode !== null) return;
  workerProcess.kill("SIGTERM");
  await Promise.race([
    once(workerProcess, "exit"),
    new Promise(resolve => setTimeout(resolve, 2_000)),
  ]);
  if (workerProcess.exitCode === null) {
    workerProcess.kill("SIGKILL");
    await once(workerProcess, "exit");
  }
};

try {
  await Promise.all([
    assertPortAvailable(WORKER_PORT),
    assertPortAvailable(EMAIL_FIXTURE_PORT),
  ]);

  emailFixture = createServer((incoming, outgoing) => {
    if (incoming.method !== "POST" || incoming.url !== "/emailjs") {
      outgoing.writeHead(404).end();
      return;
    }
    incoming.resume();
    incoming.once("end", () => outgoing.writeHead(200).end("OK"));
  });
  emailFixture.listen(EMAIL_FIXTURE_PORT, "127.0.0.1");
  await once(emailFixture, "listening");

  await run(pnpmExecutable, [
    "exec",
    "wrangler",
    "d1",
    "migrations",
    "apply",
    "kashphool",
    "--local",
    "--config",
    "worker/wrangler.jsonc",
    "--persist-to",
    persistencePath,
  ]);

  workerProcess = spawn(
    pnpmExecutable,
    [
      "exec",
      "wrangler",
      "dev",
      "--cwd",
      "worker",
      "--config",
      "wrangler.jsonc",
      "--local",
      "--ip",
      "127.0.0.1",
      "--host",
      "127.0.0.1",
      "--port",
      String(WORKER_PORT),
      "--inspector-port",
      "0",
      "--persist-to",
      persistencePath,
      "--log-level",
      "error",
      "--show-interactive-dev-session=false",
    ],
    {
      cwd: projectRoot,
      env: { ...process.env, WRANGLER_LOG_PATH: wranglerLogPath },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  workerProcess.stdout.on("data", chunk => {
    workerOutput = boundedText(workerOutput + String(chunk));
  });
  workerProcess.stderr.on("data", chunk => {
    workerOutput = boundedText(workerOutput + String(chunk));
  });
  workerProcess.once("error", error => {
    workerOutput = boundedText(`${workerOutput}\n${String(error)}`);
  });

  await waitForWorker();

  const idempotencyKey = crypto.randomUUID();
  const enquiryPayload = {
    idempotencyKey,
    type: "contact",
    name: "Local Smoke Test",
    email: "smoke@example.invalid",
    message: "Synthetic local verification record.",
    sponsorshipTier: null,
    sourcePage: "home",
    turnstileToken: TURNSTILE_TEST_TOKEN,
  };
  const submit = () =>
    request(`http://127.0.0.1:${WORKER_PORT}/api/enquiries`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://127.0.0.1:3000",
      },
      body: JSON.stringify(enquiryPayload),
    });

  const firstResponse = await submit();
  assert(
    firstResponse.status === 201,
    `First submission returned ${firstResponse.status}`
  );
  const firstReceipt = await json(firstResponse);
  assert(
    typeof firstReceipt.id === "string",
    "First submission omitted its ID"
  );

  const repeatedResponse = await submit();
  assert(
    repeatedResponse.status === 200,
    `Repeated submission returned ${repeatedResponse.status}`
  );
  const repeatedReceipt = await json(repeatedResponse);
  assert(
    repeatedReceipt.id === firstReceipt.id,
    "Idempotent submission created another ID"
  );

  const adminHeaders = { "X-Kashphool-Local-Admin": LOCAL_ADMIN_TOKEN };
  const listResponse = await request(
    `http://127.0.0.1:${WORKER_PORT}/api/admin/leads`,
    { headers: adminHeaders }
  );
  assert(
    listResponse.status === 200,
    `Authenticated list returned ${listResponse.status}`
  );
  const list = await json(listResponse);
  assert(list.totals?.all === 1, "Expected exactly one local enquiry row");
  assert(
    Array.isArray(list.items) && list.items.length === 1,
    "Expected one list item"
  );

  const detailResponse = await request(
    `http://127.0.0.1:${WORKER_PORT}/api/admin/leads/${firstReceipt.id}`,
    { headers: adminHeaders }
  );
  assert(
    detailResponse.status === 200,
    `Authenticated detail returned ${detailResponse.status}`
  );
  const detail = await json(detailResponse);
  assert(detail.id === firstReceipt.id, "Detail returned a different enquiry");

  const unauthenticatedResponse = await request(
    `http://127.0.0.1:${WORKER_PORT}/api/admin/leads`
  );
  assert(
    unauthenticatedResponse.status === 401,
    "Unauthenticated admin access was not rejected"
  );

  console.log(
    "Lead Worker smoke passed: create, idempotency, admin reads and auth boundary."
  );
} catch (error) {
  if (workerProcess && workerProcess.exitCode !== null) {
    console.error("Local Worker output:\n" + boundedText(workerOutput));
  }
  throw error;
} finally {
  await stopWorker();
  if (emailFixture) {
    emailFixture.close();
    await once(emailFixture, "close");
  }
  await rm(temporaryRoot, { recursive: true, force: true });
}
