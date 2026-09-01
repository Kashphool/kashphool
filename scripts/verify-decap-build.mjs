import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("dist/public");
const uploads = path.resolve("assets/uploads");
const builtUploads = path.join(output, "assets/uploads");
const expected = [
  "admin/index.html",
  "admin/config.yml",
  "admin/admin.css",
  "admin/guide.html",
  "admin/contacts.html",
  "admin/guide.css",
  "admin/previews.js",
  "admin/preview.css",
  "admin/assets/guide-home.jpg",
  "admin/assets/guide-events.jpg",
  "admin/assets/guide-sponsors.jpg",
  "admin/assets/guide-media.jpg",
];

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(
        ...(await listFiles(path.join(directory, entry.name), relativePath))
      );
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return files.sort();
}

await Promise.all(expected.map(file => access(path.join(output, file))));
const adminHtml = await readFile(path.join(output, "admin/index.html"), "utf8");
assert.match(adminHtml, /decap-cms@3\.16\.0\/dist\/decap-cms\.js/);
assert.match(adminHtml, /id=["']nc-root["']/);
assert.match(adminHtml, /href=["']\/["']/);
assert.match(adminHtml, /href=["']\/admin\/guide\.html["']/);
assert.match(adminHtml, /href=["']\/admin\/contacts\.html["']/);
assert.match(adminHtml, /src=["']\/admin\/previews\.js["']/);

const previews = await readFile(path.join(output, "admin/previews.js"), "utf8");
for (const name of [
  "home_page",
  "events",
  "sponsor_page",
  "gallery",
  "media_coverage",
]) {
  assert.match(
    previews,
    new RegExp(`registerPreviewTemplate\\(["']${name}["']`),
    `${name} preview must be registered`
  );
}
const uploadFiles = await listFiles(uploads);
assert.ok(uploadFiles.length > 0, "CMS uploads must contain managed media");
await Promise.all(
  uploadFiles.map(async relativePath =>
    assert.deepEqual(
      await readFile(path.join(builtUploads, relativePath)),
      await readFile(path.join(uploads, relativePath)),
      `${relativePath} must be copied to the production build byte-for-byte`
    )
  )
);
console.log("Built Decap CMS assets are present.");
