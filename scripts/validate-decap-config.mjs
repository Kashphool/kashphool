import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";

const required = (widget, paths) =>
  Object.fromEntries(paths.map(path => [path, { widget, required: true }]));
const optional = (widget, paths) =>
  Object.fromEntries(paths.map(path => [path, { widget, required: false }]));

const documentManifest = {
  site_content: {
    file: "client/public/data/site-content.json",
    format: "json",
    fields: {
      ...required("object", [
        "navigation",
        "navigation.home",
        "navigation.about",
        "navigation.events",
        "navigation.gallery",
        "navigation.sponsors",
        "navigation.constitution",
        "navigation.contact",
        "navigation.donate",
        "footer",
        "footer.navigation",
        "footer.navigation.home",
        "footer.navigation.about",
        "footer.navigation.events",
        "footer.navigation.gallery",
        "footer.navigation.sponsors",
        "footer.navigation.constitution",
        "footer.navigation.contact",
        "links",
      ]),
      ...required("string", [
        "navigation.home.label",
        "navigation.about.label",
        "navigation.events.label",
        "navigation.gallery.label",
        "navigation.sponsors.label",
        "navigation.constitution.label",
        "navigation.contact.label",
        "navigation.donate.label",
        "footer.quickLinksHeading",
        "footer.connectHeading",
        "footer.followHeading",
        "footer.location",
        "footer.established",
        "footer.email",
        "footer.supportLabel",
        "footer.copyrightSuffix",
        "footer.closingLine",
        "footer.navigation.home.label",
        "footer.navigation.about.label",
        "footer.navigation.events.label",
        "footer.navigation.gallery.label",
        "footer.navigation.sponsors.label",
        "footer.navigation.constitution.label",
        "footer.navigation.contact.label",
        "links.donate",
        "links.instagram",
        "links.facebook",
        "links.youtube",
      ]),
      ...required("text", ["footer.description"]),
    },
  },
  home_page: {
    file: "client/public/data/home-page.json",
    format: "json",
    fields: {
      ...required("object", [
        "hero",
        "about",
        "events",
        "gallery",
        "sponsors",
        "contact",
        "contact.form",
      ]),
      ...required("list", [
        "about.paragraphs",
        "about.stats",
        "contact.supportCards",
      ]),
      ...required("string", [
        "hero.welcome",
        "hero.eventsCta",
        "hero.aboutCta",
        "about.eyebrow",
        "about.heading",
        "about.stats.value",
        "about.stats.label",
        "events.eyebrow",
        "events.heading",
        "events.registrationCta",
        "gallery.eyebrow",
        "gallery.heading",
        "sponsors.eyebrow",
        "sponsors.heading",
        "sponsors.cta",
        "contact.eyebrow",
        "contact.heading",
        "contact.form.nameLabel",
        "contact.form.namePlaceholder",
        "contact.form.emailLabel",
        "contact.form.emailPlaceholder",
        "contact.form.messageLabel",
        "contact.form.messagePlaceholder",
        "contact.form.submit",
        "contact.supportEyebrow",
        "contact.supportHeading",
        "contact.supportCards.title",
        "contact.donateCta",
      ]),
      ...required("text", [
        "hero.description",
        "about.paragraphs.field",
        "gallery.intro",
        "sponsors.intro",
        "sponsors.prompt",
        "contact.supportIntro",
        "contact.supportCards.description",
      ]),
      ...required("hidden", [
        "hero.name",
        "events.loading",
        "sponsors.loading",
        "contact.form.submitting",
      ]),
    },
  },
  events: {
    file: "client/public/data/events.json",
    format: "json",
    fields: {
      ...required("list", ["events"]),
      ...optional("list", ["events.stallOpeningHours"]),
      ...required("object", [
        "events.date",
        "events.venue",
        "events.venue.coordinates",
      ]),
      ...required("string", [
        "nextEventId",
        "events.id",
        "events.name",
        "events.venue.name",
        "events.stallOpeningHours.start",
        "events.stallOpeningHours.end",
      ]),
      ...optional("string", [
        "events.venue.googleMapsUrl",
        "events.stallOpeningHours.optionalStart",
        "events.registrationUrl",
      ]),
      ...required("text", ["events.description", "events.venue.address"]),
      ...required("select", ["events.date.type"]),
      ...required("datetime", [
        "events.date.start",
        "events.stallOpeningHours.date",
      ]),
      ...optional("datetime", ["events.date.end"]),
      ...required("number", [
        "events.venue.coordinates.lat",
        "events.venue.coordinates.lng",
      ]),
      ...required("image", ["events.image"]),
    },
  },
  gallery: {
    file: "client/public/data/gallery.json",
    format: "json",
    fields: {
      ...required("list", ["images"]),
      ...required("image", ["images.image"]),
      ...required("string", ["images.alt"]),
      ...optional("text", ["images.caption"]),
    },
  },
  sponsors: {
    file: "client/public/data/sponsors.json",
    format: "json",
    fields: {
      ...required("list", ["sponsors"]),
      ...required("string", ["sponsors.id", "sponsors.name"]),
      ...required("image", ["sponsors.logo"]),
      ...optional("string", ["sponsors.website"]),
    },
  },
  sponsor_page: {
    file: "client/public/data/sponsor-page.json",
    format: "json",
    fields: {
      ...required("object", [
        "hero",
        "tiersSection",
        "bespoke",
        "eventInfo",
        "sponsors",
        "pastCelebrations",
        "eventTypesSection",
        "finalCta",
        "enquiryModal",
      ]),
      ...required("list", [
        "highlights",
        "tiers",
        "tiers.benefits",
        "bespoke.possibilities",
        "pastCelebrations.photos",
        "eventTypes",
      ]),
      ...required("string", [
        "hero.eyebrow",
        "hero.headingPrefix",
        "hero.headingAccent",
        "hero.cta",
        "highlights.value",
        "highlights.label",
        "tiersSection.eyebrow",
        "tiersSection.headingPrefix",
        "tiersSection.headingAccent",
        "tiers.name",
        "tiers.guide",
        "tiers.enquiryLabel",
        "bespoke.heading",
        "bespoke.cta",
        "eventInfo.eyebrow",
        "eventInfo.headingSuffix",
        "eventInfo.datesLabel",
        "eventInfo.venueLabel",
        "eventInfo.stallHoursLabel",
        "eventInfo.stallHoursFallback",
        "eventInfo.emailLabel",
        "eventInfo.mapLinkLabel",
        "eventInfo.optionalStartPrefix",
        "sponsors.eyebrow",
        "sponsors.heading",
        "pastCelebrations.eyebrow",
        "pastCelebrations.headingPrefix",
        "pastCelebrations.headingAccent",
        "pastCelebrations.photos.alt",
        "eventTypesSection.eyebrow",
        "eventTypesSection.headingPrefix",
        "eventTypesSection.headingAccent",
        "eventTypes.title",
        "finalCta.headingPrefix",
        "finalCta.headingAccent",
        "finalCta.button",
        "enquiryModal.eyebrow",
        "enquiryModal.tierTitlePrefix",
        "enquiryModal.generalTitle",
        "enquiryModal.selectedPackageLabel",
        "enquiryModal.nameLabel",
        "enquiryModal.namePlaceholder",
        "enquiryModal.emailLabel",
        "enquiryModal.emailPlaceholder",
        "enquiryModal.messageLabel",
        "enquiryModal.messagePlaceholder",
        "enquiryModal.submit",
      ]),
      ...optional("string", ["tiers.guidePrefix", "tiers.guideSuffix"]),
      ...required("text", [
        "hero.description",
        "tiersSection.intro",
        "tiers.description",
        "tiers.benefits.field",
        "bespoke.intro",
        "bespoke.possibilities.field",
        "sponsors.intro",
        "pastCelebrations.intro",
        "eventTypesSection.intro",
        "eventTypes.description",
        "finalCta.description",
        "enquiryModal.tierDescription",
        "enquiryModal.generalDescription",
      ]),
      ...optional("text", ["pastCelebrations.photos.caption"]),
      ...required("file", ["pastCelebrations.video"]),
      ...required("image", [
        "pastCelebrations.poster",
        "pastCelebrations.photos.image",
      ]),
      ...required("hidden", ["eventTypes.icon", "enquiryModal.submitting"]),
      ...optional("hidden", ["tiers.featured", "tiers.badge"]),
    },
  },
  media_coverage: {
    file: "client/public/data/media-coverage.json",
    format: "json",
    fields: {
      ...required("object", ["featuredVideo", "article"]),
      ...required("list", ["supportingVideos"]),
      ...required("string", [
        "eyebrow",
        "headingPrefix",
        "headingAccent",
        "featuredVideo.id",
        "featuredVideo.outlet",
        "featuredVideo.title",
        "article.id",
        "article.outlet",
        "article.title",
        "supportingVideos.id",
        "supportingVideos.outlet",
        "supportingVideos.title",
        "articleLinkLabel",
      ]),
      ...required("text", ["intro"]),
      ...required("number", ["year"]),
      ...required("file", ["featuredVideo.src", "supportingVideos.src"]),
      ...required("image", [
        "featuredVideo.poster",
        "article.previewImage",
        "article.fullImage",
        "supportingVideos.poster",
      ]),
      ...required("hidden", [
        "featuredVideo.type",
        "article.type",
        "supportingVideos.type",
      ]),
    },
  },
  constitution_page: {
    file: "client/public/data/constitution-page.json",
    format: "json",
    fields: {
      ...required("string", [
        "eyebrow",
        "headingPrefix",
        "headingAccent",
        "documentTitle",
        "openLabel",
        "downloadLabel",
        "fallback",
        "fallbackLinkLabel",
      ]),
      ...required("text", ["intro", "documentDescription"]),
      ...required("file", ["pdf"]),
    },
  },
  not_found_page: {
    file: "client/public/data/not-found-page.json",
    format: "json",
    fields: {
      ...required("string", [
        "eyebrow",
        "headingPrefix",
        "headingAccent",
        "homeLabel",
        "contactLabel",
        "identityLine",
      ]),
      ...required("text", ["description"]),
    },
  },
};

const capacities = {
  "gallery.images": [1, 9],
  "home_page.about.stats": [3, 3],
  "home_page.contact.supportCards": [3, 3],
  "media_coverage.supportingVideos": [2, 2],
  "sponsor_page.highlights": [4, 4],
  "sponsor_page.tiers": [4, 4],
  "sponsor_page.pastCelebrations.photos": [1, 10],
  "sponsor_page.eventTypes": [3, 3],
};

const datePaths = [
  "events.events.date.start",
  "events.events.date.end",
  "events.events.stallOpeningHours.date",
];
const timePaths = [
  "events.events.stallOpeningHours.start",
  "events.events.stallOpeningHours.end",
  "events.events.stallOpeningHours.optionalStart",
];
const timePattern = [
  "^([01]\\d|2[0-3]):[0-5]\\d$",
  "Use 24-hour HH:mm, for example 15:00",
];

const config = parse(await readFile("admin/config.yml", "utf8"));

assert.equal(config.backend.name, "github");
assert.equal(config.backend.repo, "Kashphool/kashphool");
assert.equal(config.backend.branch, "main");
assert.equal(config.backend.auth_endpoint, "/auth");
assert.match(
  config.backend.base_url,
  /^https:\/\/kashphool-decap-oauth\.[a-z0-9-]+\.workers\.dev$/
);
assert.equal(config.media_folder, "assets/uploads");
assert.equal(config.public_folder, "/assets/uploads");
assert.equal(config.publish_mode, undefined);
assert.equal(config.local_backend, undefined);

assert.deepEqual(
  config.collections.map(collection => collection.name),
  ["website"],
  "collections: expected exact collection names"
);
const websiteCollection = config.collections[0];
assert.equal(
  websiteCollection.editor?.preview,
  false,
  "website.editor.preview"
);

const expectedDocumentNames = Object.keys(documentManifest).sort();
const actualDocumentNames = websiteCollection.files
  .map(document => document.name)
  .sort();
assert.deepEqual(
  actualDocumentNames,
  expectedDocumentNames,
  "website.files: expected exact document names"
);

function collectFields(documentName, fields) {
  const collected = new Map();

  function visit(field, path) {
    const fullPath = `${documentName}.${path}`;
    assert.notEqual(
      field.widget,
      "markdown",
      `${fullPath}.widget must not be markdown`
    );
    assert.ok(!collected.has(path), `${fullPath}: duplicate field path`);
    collected.set(path, field);

    for (const child of field.fields ?? []) {
      assert.equal(typeof child.name, "string", `${fullPath}.fields.name`);
      visit(child, `${path}.${child.name}`);
    }
    if (field.field) visit(field.field, `${path}.field`);
  }

  for (const field of fields ?? []) {
    assert.equal(typeof field.name, "string", `${documentName}.fields.name`);
    visit(field, field.name);
  }
  return collected;
}

const fieldsByFullPath = new Map();

for (const document of websiteCollection.files) {
  const specification = documentManifest[document.name];
  assert.ok(specification, `${document.name}: unexpected document`);
  assert.equal(document.file, specification.file, `${document.name}.file`);
  assert.equal(
    document.format,
    specification.format,
    `${document.name}.format`
  );

  const actualFields = collectFields(document.name, document.fields);
  for (const path of Object.keys(specification.fields)) {
    assert.ok(
      actualFields.has(path),
      `${document.name}.${path}: missing field`
    );
  }
  for (const path of actualFields.keys()) {
    assert.ok(
      Object.hasOwn(specification.fields, path),
      `${document.name}.${path}: unexpected field`
    );
  }

  for (const [path, expected] of Object.entries(specification.fields)) {
    const field = actualFields.get(path);
    const fullPath = `${document.name}.${path}`;
    assert.equal(field.widget, expected.widget, `${fullPath}.widget`);
    assert.equal(
      field.required !== false,
      expected.required,
      `${fullPath}.required`
    );
    fieldsByFullPath.set(fullPath, field);

    if (field.widget === "list") {
      const [expectedMin, expectedMax] = capacities[fullPath] ?? [
        undefined,
        undefined,
      ];
      assert.equal(field.min, expectedMin, `${fullPath}.min`);
      assert.equal(field.max, expectedMax, `${fullPath}.max`);
    }
  }
}

for (const fullPath of datePaths) {
  const field = fieldsByFullPath.get(fullPath);
  assert.ok(field, `${fullPath}: missing date field`);
  assert.equal(field.format, "YYYY-MM-DD", `${fullPath}.format`);
  assert.equal(field.date_format, "DD/MM/YYYY", `${fullPath}.date_format`);
  assert.equal(field.time_format, false, `${fullPath}.time_format`);
}

for (const fullPath of timePaths) {
  const field = fieldsByFullPath.get(fullPath);
  assert.ok(field, `${fullPath}: missing time field`);
  assert.deepEqual(field.pattern, timePattern, `${fullPath}.pattern`);
}

assert.deepEqual(
  fieldsByFullPath.get("events.events.date.type").options,
  ["single", "range"],
  "events.events.date.type.options"
);

console.log("Decap CMS configuration is valid.");
