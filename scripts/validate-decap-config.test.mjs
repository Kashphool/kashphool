import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { parse, stringify } from "yaml";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = dirname(scriptDirectory);
const validatorPath = join(scriptDirectory, "validate-decap-config.mjs");
const sourceConfig = parse(
  await readFile(join(repositoryRoot, "admin/config.yml"), "utf8")
);

function findDocument(config, name) {
  return config.collections[0].files.find(document => document.name === name);
}

function findField(fields, name) {
  return fields.find(field => field.name === name);
}

function findFieldAtPath(config, documentName, path) {
  let fields = findDocument(config, documentName).fields;
  let current;
  for (const name of path) {
    current = findField(fields, name);
    assert.ok(
      current,
      `Test fixture is missing ${documentName}.${path.join(".")}`
    );
    fields = current.fields;
  }
  return current;
}

function completeBaseline() {
  const config = structuredClone(sourceConfig);
  const constitutionFields = findDocument(config, "constitution_page").fields;
  if (!findField(constitutionFields, "fallback")) {
    constitutionFields.push({
      label: "Fallback message",
      name: "fallback",
      widget: "string",
    });
  }
  const notFoundFields = findDocument(config, "not_found_page").fields;
  if (!findField(notFoundFields, "identityLine")) {
    notFoundFields.push({
      label: "Identity line",
      name: "identityLine",
      widget: "string",
    });
  }
  return config;
}

async function runValidator(config) {
  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), "kashphool-decap-validator-")
  );
  try {
    await mkdir(join(temporaryDirectory, "admin"));
    await writeFile(
      join(temporaryDirectory, "admin/config.yml"),
      stringify(config)
    );
    return spawnSync(process.execPath, [validatorPath], {
      cwd: temporaryDirectory,
      encoding: "utf8",
    });
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

function assertRejected(result, expectedPath) {
  assert.notEqual(result.status, 0, "Expected validator to reject mutation");
  assert.match(`${result.stdout}\n${result.stderr}`, expectedPath);
}

function projectThroughSchema(value, fields) {
  const projected = {};
  for (const field of fields) {
    if (!Object.hasOwn(value, field.name)) continue;
    const fieldValue = value[field.name];
    if (field.widget === "object") {
      projected[field.name] = projectThroughSchema(fieldValue, field.fields);
    } else if (field.widget === "list" && field.fields) {
      projected[field.name] = fieldValue.map(item =>
        projectThroughSchema(item, field.fields)
      );
    } else {
      projected[field.name] = fieldValue;
    }
  }
  return JSON.parse(JSON.stringify(projected));
}

test("accepts the complete production schema", async () => {
  const result = await runValidator(completeBaseline());

  assert.equal(result.status, 0, result.stderr);
});

test("schema-projected JSON round trips preserve code-controlled fields", async () => {
  const hiddenFields = [
    ["home_page", ["hero", "name"]],
    ["home_page", ["events", "loading"]],
    ["home_page", ["sponsors", "loading"]],
    ["home_page", ["contact", "form", "submitting"]],
    ["sponsor_page", ["tiers", "featured"]],
    ["sponsor_page", ["tiers", "badge"]],
    ["sponsor_page", ["eventTypes", "icon"]],
    ["sponsor_page", ["enquiryModal", "submitting"]],
    ["media_coverage", ["featuredVideo", "type"]],
    ["media_coverage", ["article", "type"]],
    ["media_coverage", ["supportingVideos", "type"]],
  ];

  for (const [documentName, fieldPath] of hiddenFields) {
    assert.equal(
      findFieldAtPath(sourceConfig, documentName, fieldPath).widget,
      "hidden",
      `${documentName}.${fieldPath.join(".")} must be schema-hidden`
    );
  }

  for (const documentName of ["home_page", "sponsor_page", "media_coverage"]) {
    const document = findDocument(sourceConfig, documentName);
    const source = JSON.parse(
      await readFile(join(repositoryRoot, document.file), "utf8")
    );
    const roundTripped = projectThroughSchema(source, document.fields);

    assert.deepEqual(
      roundTripped,
      source,
      `${documentName} loses data when serialized through its configured schema`
    );
  }
});

test("rejects Markdown in a primitive list field", async () => {
  const config = completeBaseline();
  findFieldAtPath(config, "home_page", ["about", "paragraphs"]).field.widget =
    "markdown";

  assertRejected(
    await runValidator(config),
    /home_page\.about\.paragraphs\.field/
  );
});

test("rejects a missing required editorial leaf", async () => {
  const config = completeBaseline();
  const hero = findFieldAtPath(config, "home_page", ["hero"]);
  hero.fields = hero.fields.filter(field => field.name !== "description");

  assertRejected(await runValidator(config), /home_page\.hero\.description/);
});

test("rejects an editorial leaf moved to the wrong path", async () => {
  const config = completeBaseline();
  const homePage = findDocument(config, "home_page");
  const hero = findFieldAtPath(config, "home_page", ["hero"]);
  const description = findField(hero.fields, "description");
  hero.fields = hero.fields.filter(field => field.name !== "description");
  homePage.fields.push(description);

  assertRejected(await runValidator(config), /home_page\.hero\.description/);
});

test("rejects the wrong widget for an event date", async () => {
  const config = completeBaseline();
  findFieldAtPath(config, "events", ["events", "date", "start"]).widget =
    "string";

  assertRejected(await runValidator(config), /events\.events\.date\.start/);
});

test("rejects the wrong required state", async () => {
  const config = completeBaseline();
  findFieldAtPath(config, "gallery", ["images", "caption"]).required = true;

  assertRejected(
    await runValidator(config),
    /gallery\.images\.caption\.required/
  );
});

test("rejects a changed event date format", async () => {
  const config = completeBaseline();
  findFieldAtPath(config, "events", ["events", "date", "start"]).format =
    "DD/MM/YYYY";

  assertRejected(
    await runValidator(config),
    /events\.events\.date\.start\.format/
  );
});

test("rejects a changed event time pattern", async () => {
  const config = completeBaseline();
  findFieldAtPath(config, "events", [
    "events",
    "stallOpeningHours",
    "optionalStart",
  ]).pattern = [".*", "Any time"];

  assertRejected(
    await runValidator(config),
    /events\.events\.stallOpeningHours\.optionalStart\.pattern/
  );
});

test("rejects a changed bounded-list capacity", async () => {
  const config = completeBaseline();
  findFieldAtPath(config, "sponsor_page", ["pastCelebrations", "photos"]).max =
    11;

  assertRejected(
    await runValidator(config),
    /sponsor_page\.pastCelebrations\.photos\.max/
  );
});

test("rejects an extra collection that exposes design controls", async () => {
  const config = completeBaseline();
  config.collections.push({
    name: "design",
    label: "Design",
    files: [
      {
        name: "branding",
        file: "client/src/config/branding.json",
        format: "json",
        fields: [{ label: "Logo", name: "logo", widget: "image" }],
      },
    ],
  });

  assertRejected(await runValidator(config), /collections/);
});

test("rejects an extra document in the website collection", async () => {
  const config = completeBaseline();
  config.collections[0].files.push({
    name: "design",
    label: "Design",
    file: "client/src/config/design.json",
    format: "json",
    fields: [{ label: "Background", name: "background", widget: "image" }],
  });

  assertRejected(await runValidator(config), /website\.files/);
});

test("rejects changed document file and format metadata", async () => {
  const config = completeBaseline();
  const gallery = findDocument(config, "gallery");
  gallery.file = "client/public/data/gallery-copy.json";

  assertRejected(await runValidator(config), /gallery\.file/);

  gallery.file = "client/public/data/gallery.json";
  gallery.format = "yaml";

  assertRejected(await runValidator(config), /gallery\.format/);
});

test("rejects a missing constitution fallback field", async () => {
  const config = completeBaseline();
  const document = findDocument(config, "constitution_page");
  document.fields = document.fields.filter(field => field.name !== "fallback");

  assertRejected(await runValidator(config), /constitution_page\.fallback/);
});

test("rejects a missing not-found identity line", async () => {
  const config = completeBaseline();
  const document = findDocument(config, "not_found_page");
  document.fields = document.fields.filter(
    field => field.name !== "identityLine"
  );

  assertRejected(await runValidator(config), /not_found_page\.identityLine/);
});
