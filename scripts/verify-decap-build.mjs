import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("dist/public");
const uploads = path.resolve("assets/uploads");
const builtUploads = path.join(output, "assets/uploads");
const expected = ["admin/index.html", "admin/config.yml"];

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
