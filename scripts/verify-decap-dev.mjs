import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createConnection } from "node:net";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

const port = 3000;
const baseUrl = `http://127.0.0.1:${port}`;
const localBackendUrl = "http://127.0.0.1:8081/api/v1";
const mimeUploadFixtures = [
  {
    content: "Decap dev MOV MIME verification\n",
    extension: ".mov",
    expectedContentType: /^video\/quicktime/,
  },
  {
    content: "Decap dev MP4 MIME verification\n",
    extension: ".mp4",
    expectedContentType: /^video\/mp4/,
  },
  {
    content: "Decap dev WebM MIME verification\n",
    extension: ".webm",
    expectedContentType: /^video\/webm/,
  },
].map(fixture => ({
  ...fixture,
  filename: `.cms-dev-mime-${process.pid}${fixture.extension}`,
}));

await Promise.all(
  mimeUploadFixtures.map(fixture =>
    writeFile(
      path.join("assets/uploads", fixture.filename),
      fixture.content,
      "utf8"
    )
  )
);

const devServer = spawn("pnpm", ["dev"], {
  detached: true,
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
devServer.stdout.on("data", chunk => {
  output += chunk;
});
devServer.stderr.on("data", chunk => {
  output += chunk;
});

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/admin/`);
      if (response.ok) return;
    } catch {
      // The Vite process is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Vite dev server did not start:\n${output}`);
}

async function waitForLocalBackend() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const socket = createConnection({ host: "127.0.0.1", port: 8081 });
    try {
      await once(socket, "connect");
      socket.destroy();
      return;
    } catch {
      socket.destroy();
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Decap local backend did not start:\n${output}`);
}

function collectUploadPaths(value, paths = new Set()) {
  if (typeof value === "string" && value.startsWith("/assets/uploads/")) {
    paths.add(value.slice(1));
  } else if (Array.isArray(value)) {
    value.forEach(item => collectUploadPaths(item, paths));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach(item => collectUploadPaths(item, paths));
  }
  return paths;
}

try {
  await Promise.all([waitForServer(), waitForLocalBackend()]);

  const adminRedirectResponse = await fetch(`${baseUrl}/admin`, {
    redirect: "manual",
  });
  assert.equal(adminRedirectResponse.status, 302);
  assert.equal(adminRedirectResponse.headers.get("location"), "/admin/");

  for (const pathname of ["/admin/", "/admin/index.html"]) {
    const response = await fetch(`${baseUrl}${pathname}`, {
      redirect: "manual",
    });
    assert.equal(
      response.status,
      200,
      `${pathname} should serve the Decap shell`
    );
    assert.match(response.headers.get("content-type") ?? "", /^text\/html/);
    assert.match(
      await response.text(),
      /decap-cms@3\.16\.0\/dist\/decap-cms\.js/
    );
  }

  const adminAssets = [
    ["/admin/guide.html", /^text\/html/],
    ["/admin/contacts.html", /^text\/html/],
    ["/admin/admin.css", /^text\/css/],
    ["/admin/guide.css", /^text\/css/],
    ["/admin/previews.js", /^(application|text)\/javascript/],
    ["/admin/preview.css", /^text\/css/],
    ["/admin/assets/guide-home.jpg", /^image\/jpeg/],
  ];
  for (const [pathname, expectedContentType] of adminAssets) {
    const response = await fetch(`${baseUrl}${pathname}`);
    assert.equal(response.status, 200, `${pathname} should be served locally`);
    assert.match(
      response.headers.get("content-type") ?? "",
      expectedContentType,
      `${pathname} should have the correct content type`
    );
  }

  const configResponse = await fetch(`${baseUrl}/admin/config.yml`);
  assert.equal(configResponse.status, 200);
  assert.match(
    configResponse.headers.get("content-type") ?? "",
    /^application\/x-yaml/
  );
  const localConfig = parse(await configResponse.text());
  assert.equal(localConfig.local_backend, true);
  assert.equal(localConfig.backend.repo, "Kashphool/kashphool");

  const productionConfig = parse(await readFile("admin/config.yml", "utf8"));
  assert.equal(productionConfig.local_backend, undefined);
  assert.equal(productionConfig.backend.name, "github");

  const configHeadResponse = await fetch(`${baseUrl}/admin/config.yml`, {
    method: "HEAD",
  });
  assert.equal(configHeadResponse.status, 200);
  assert.match(
    configHeadResponse.headers.get("content-type") ?? "",
    /^application\/x-yaml/
  );
  assert.equal(await configHeadResponse.text(), "");

  const contentDocuments = await Promise.all(
    [
      "events.json",
      "gallery.json",
      "media-coverage.json",
      "sponsor-page.json",
      "sponsors.json",
    ].map(async filename =>
      JSON.parse(
        await readFile(path.join("client/public/data", filename), "utf8")
      )
    )
  );
  const expectedMediaPaths = contentDocuments.reduce(
    (paths, document) => collectUploadPaths(document, paths),
    new Set()
  );
  const mediaResponse = await fetch(localBackendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "getMedia",
      params: { branch: "main", mediaFolder: "assets/uploads" },
    }),
  });
  assert.equal(mediaResponse.status, 200);
  const listedMediaPaths = new Set(
    (await mediaResponse.json()).map(asset => asset.path)
  );
  for (const mediaPath of expectedMediaPaths) {
    assert.ok(
      listedMediaPaths.has(mediaPath),
      `${mediaPath} must be visible in Decap's Media tab`
    );
  }

  const events = JSON.parse(
    await readFile("client/public/data/events.json", "utf8")
  );
  const configuredEventImage = events.events[0].image;
  assert.match(configuredEventImage, /^\/assets\/uploads\//);
  const uploadResponse = await fetch(`${baseUrl}${configuredEventImage}`);
  assert.equal(uploadResponse.status, 200);
  assert.match(uploadResponse.headers.get("content-type") ?? "", /^image\//);
  assert.deepEqual(
    Buffer.from(await uploadResponse.arrayBuffer()),
    await readFile(path.resolve(configuredEventImage.slice(1)))
  );

  for (const fixture of mimeUploadFixtures) {
    const response = await fetch(
      `${baseUrl}/assets/uploads/${fixture.filename}`
    );
    assert.equal(response.status, 200);
    assert.match(
      response.headers.get("content-type") ?? "",
      fixture.expectedContentType
    );
    assert.equal(await response.text(), fixture.content);
  }

  const traversalResponse = await fetch(
    `${baseUrl}/assets/uploads/%2e%2e%2f%2e%2e%2fvite.config.ts`
  );
  assert.equal(traversalResponse.status, 403);

  console.log(`Decap CMS dev routes are available at ${baseUrl}/admin/`);
} finally {
  try {
    if (devServer.exitCode === null) {
      try {
        process.kill(-devServer.pid, "SIGTERM");
      } catch (error) {
        if (error.code !== "ESRCH") throw error;
      }
      await once(devServer, "close");
    }
  } finally {
    await Promise.all(
      mimeUploadFixtures.map(fixture =>
        rm(path.join("assets/uploads", fixture.filename), { force: true })
      )
    );
  }
}
