import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
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
const USE_PROCESS_GROUP = process.platform !== "win32";

const projectRoot = path.resolve(import.meta.dirname, "..");
const pnpmExecutable = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const temporaryRoot = await mkdtemp(
  path.join(tmpdir(), "kashphool-leads-smoke-")
);
const persistencePath = path.join(temporaryRoot, "wrangler-state");
const wranglerLogPath = path.join(temporaryRoot, "wrangler.log");
const localVarsPath = path.join(temporaryRoot, ".dev.vars");
const smokeConfigPath = path.join(temporaryRoot, "wrangler.smoke.jsonc");
const workerSourcePath = path.join(projectRoot, "worker", "src", "index.ts");
const migrationsPath = path.join(projectRoot, "worker", "migrations");
const wranglerSchemaPath = path.join(
  projectRoot,
  "node_modules",
  "wrangler",
  "config-schema.json"
);

const localVars = `ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
TURNSTILE_EXPECTED_HOSTNAME=localhost
TURNSTILE_VERIFY_URL=https://challenges.cloudflare.com/turnstile/v0/siteverify
EMAILJS_SERVICE_ID=local_service
EMAILJS_TEMPLATE_ID=local_template
EMAILJS_PUBLIC_KEY=local_public_key
EMAILJS_SEND_URL=http://127.0.0.1:8790/emailjs
ACCESS_TEAM_DOMAIN=local.invalid
ACCESS_AUD=local-audience
LOCAL_ADMIN_TOKEN=${LOCAL_ADMIN_TOKEN}
`;

const smokeConfig = JSON.stringify(
  {
    $schema: wranglerSchemaPath,
    name: "kashphool-api-smoke",
    main: workerSourcePath,
    compatibility_date: "2026-09-01",
    compatibility_flags: ["nodejs_compat"],
    d1_databases: [
      {
        binding: "DB",
        database_name: "kashphool-smoke",
        migrations_dir: migrationsPath,
      },
    ],
  },
  null,
  2
);

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
  if (!workerProcess) return;
  const signal = value => {
    try {
      if (USE_PROCESS_GROUP && workerProcess.pid) {
        process.kill(-workerProcess.pid, value);
      } else if (workerProcess.exitCode === null) {
        workerProcess.kill(value);
      }
    } catch (error) {
      if (error?.code !== "ESRCH") throw error;
    }
  };

  signal("SIGTERM");
  if (workerProcess.exitCode === null) {
    await Promise.race([
      once(workerProcess, "exit"),
      new Promise(resolve => setTimeout(resolve, 2_000)),
    ]);
  }
  if (workerProcess.exitCode === null) {
    signal("SIGKILL");
    await once(workerProcess, "exit");
  }
};

try {
  await Promise.all([
    writeFile(localVarsPath, localVars, { mode: 0o600 }),
    writeFile(smokeConfigPath, `${smokeConfig}\n`, { mode: 0o600 }),
  ]);

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
    "DB",
    "--local",
    "--config",
    smokeConfigPath,
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
      temporaryRoot,
      "--config",
      smokeConfigPath,
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
      detached: USE_PROCESS_GROUP,
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
