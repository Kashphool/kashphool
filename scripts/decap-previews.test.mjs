import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile("admin/previews.js", "utf8");

const sharedEvents = {
  nextEventId: "event-upcoming",
  events: [
    {
      id: "event-upcoming",
      name: "Shared upcoming event",
      description: "Shared event description",
      date: { type: "range", start: "2026-10-17", end: "2026-10-20" },
      venue: {
        name: "Shared event venue",
        address: "Shared venue address",
        googleMapsUrl: "https://maps.example/shared-event",
      },
      stallOpeningHours: [
        {
          date: "2026-10-17",
          start: "12:00",
          end: "20:00",
          optionalStart: "15:00",
        },
      ],
      image: "/assets/uploads/event.jpg",
      registrationUrl: "https://example.com/register",
    },
  ],
};

const sharedSponsors = {
  sponsors: [
    {
      id: "shared-sponsor",
      name: "Shared sponsor name",
      logo: "/assets/uploads/sponsor.png",
      website: "https://sponsor.example",
    },
  ],
};

const sharedSiteContent = {
  footer: { email: "shared-contact@example.com" },
};

const sharedMediaCoverage = {
  eyebrow: "Shared media eyebrow",
  headingPrefix: "Shared media heading",
  headingAccent: "Shared media accent",
  year: 2025,
  intro: "Shared media introduction",
  featuredVideo: {
    outlet: "Shared media outlet",
    title: "Shared media title",
    src: "/assets/uploads/shared-media.mp4",
    poster: "/assets/uploads/shared-media.jpg",
  },
  article: {
    outlet: "Shared article outlet",
    title: "Shared article title",
    previewImage: "/assets/uploads/shared-article.jpg",
    fullImage: "/assets/uploads/shared-article-full.jpg",
  },
  supportingVideos: [],
  articleLinkLabel: "Shared article action",
};

function nestedValue(data, path) {
  return path.reduce(
    (value, key) => (value === undefined ? undefined : value?.[key]),
    data
  );
}

function renderText(node) {
  if (node === undefined || node === null || node === false) return "";
  if (typeof node !== "object") return String(node);
  const properties = Object.entries(node.props || {})
    .filter(([, value]) => typeof value === "string")
    .map(([, value]) => value);
  return [...properties, ...(node.children || [])].map(renderText).join(" ");
}

function loadTemplates() {
  const templates = new Map();
  const context = {
    console,
    Intl,
    Date,
    fetch: async url => {
      const pathname = String(url);
      const data = pathname.includes("sponsors.json")
        ? sharedSponsors
        : pathname.includes("site-content.json")
          ? sharedSiteContent
          : pathname.includes("media-coverage.json")
            ? sharedMediaCoverage
            : sharedEvents;
      return { ok: true, json: async () => data };
    },
  };
  context.window = {
    CMS: {
      registerPreviewStyle() {},
      registerPreviewTemplate(name, template) {
        templates.set(name, template);
      },
    },
    createClass: specification => specification,
    h: (type, props, ...children) => ({
      type,
      props: props || {},
      children: children.flat(Infinity),
    }),
  };
  vm.runInNewContext(source, context, { filename: "admin/previews.js" });
  return templates;
}

async function renderPreview(name, data) {
  const template = loadTemplates().get(name);
  assert.ok(template, `${name} preview must be registered`);
  const instance = {
    ...template,
    props: {
      entry: { getIn: path => nestedValue(data, path.slice(1)) },
      getAsset: value => ({ toString: () => value }),
    },
    state:
      typeof template.getInitialState === "function"
        ? template.getInitialState()
        : {},
    setState(update) {
      this.state = { ...this.state, ...update };
    },
  };
  if (typeof instance.componentDidMount === "function") {
    await instance.componentDidMount();
  }
  return renderText(instance.render());
}

test("homepage preview represents every editable public section", async () => {
  const output = await renderPreview("home_page", {
    hero: {
      welcome: "Home welcome",
      name: "Home name",
      description: "Home description",
      eventsCta: "Home events action",
      aboutCta: "Home about action",
    },
    about: {
      eyebrow: "About eyebrow",
      heading: "About heading",
      paragraphs: ["About paragraph"],
      stats: [{ value: "About value", label: "About statistic" }],
    },
    events: {
      eyebrow: "Events eyebrow",
      heading: "Events heading",
      registrationCta: "Registration action",
    },
    gallery: {
      eyebrow: "Gallery eyebrow",
      heading: "Gallery heading",
      intro: "Gallery introduction",
    },
    sponsors: {
      eyebrow: "Sponsors eyebrow",
      heading: "Sponsors heading",
      intro: "Sponsors introduction",
      prompt: "Sponsors prompt",
      cta: "Sponsors action",
    },
    contact: {
      eyebrow: "Contact eyebrow",
      heading: "Contact heading",
      form: {
        nameLabel: "Contact name label",
        namePlaceholder: "Contact name placeholder",
        emailLabel: "Contact email label",
        emailPlaceholder: "Contact email placeholder",
        messageLabel: "Contact message label",
        messagePlaceholder: "Contact message placeholder",
        submit: "Contact submit action",
      },
      supportEyebrow: "Support eyebrow",
      supportHeading: "Support heading",
      supportIntro: "Support introduction",
      supportCards: [
        { title: "Support card", description: "Support description" },
      ],
      donateCta: "Donate action",
    },
  });

  for (const value of [
    "Home events action",
    "Home about action",
    "About paragraph",
    "Registration action",
    "Gallery introduction",
    "Sponsors prompt",
    "Contact name label",
    "Contact message placeholder",
    "Support card",
    "Donate action",
  ]) {
    assert.match(output, new RegExp(value));
  }
});

test("events preview represents venue links, registration and optional stall starts", async () => {
  const output = await renderPreview("events", sharedEvents);

  for (const value of [
    "Shared upcoming event",
    "Shared event venue",
    "https://maps.example/shared-event",
    "https://example.com/register",
    "15:00",
  ]) {
    assert.match(output, new RegExp(value.replaceAll("/", "\\/")));
  }
});

test("sponsor preview represents every page section and its shared data", async () => {
  const output = await renderPreview("sponsor_page", {
    hero: {
      eyebrow: "Sponsor hero eyebrow",
      headingPrefix: "Sponsor hero prefix",
      headingAccent: "Sponsor hero accent",
      description: "Sponsor hero description",
      cta: "Sponsor hero action",
    },
    highlights: [{ value: "Highlight value", label: "Highlight label" }],
    tiersSection: {
      eyebrow: "Tier eyebrow",
      headingPrefix: "Tier prefix",
      headingAccent: "Tier accent",
      intro: "Tier introduction",
    },
    tiers: [
      {
        name: "Tier name",
        guide: "Tier price",
        description: "Tier description",
        benefits: ["Tier benefit"],
        enquiryLabel: "Tier enquiry action",
      },
    ],
    bespoke: {
      heading: "Bespoke heading",
      intro: "Bespoke introduction",
      possibilities: ["Bespoke possibility"],
      cta: "Bespoke action",
    },
    eventInfo: {
      eyebrow: "Event information eyebrow",
      headingSuffix: "Event information heading",
      datesLabel: "Dates label",
      venueLabel: "Venue label",
      stallHoursLabel: "Hours label",
      emailLabel: "Email label",
      mapLinkLabel: "Map link label",
      optionalStartPrefix: "Optional start label",
    },
    sponsors: {
      eyebrow: "Current sponsors eyebrow",
      heading: "Current sponsors heading",
      intro: "Current sponsors introduction",
    },
    pastCelebrations: {
      eyebrow: "Celebrations eyebrow",
      headingPrefix: "Celebrations prefix",
      headingAccent: "Celebrations accent",
      intro: "Celebrations introduction",
      video: "/assets/uploads/celebration.mp4",
      poster: "/assets/uploads/celebration.jpg",
      photos: [
        {
          image: "/assets/uploads/photo.jpg",
          alt: "Celebration photo alternative text",
          caption: "Celebration photo caption",
        },
      ],
    },
    eventTypesSection: {
      eyebrow: "Event types eyebrow",
      headingPrefix: "Event types prefix",
      headingAccent: "Event types accent",
      intro: "Event types introduction",
    },
    eventTypes: [
      { title: "Event type", description: "Event type description" },
    ],
    finalCta: {
      headingPrefix: "Final action prefix",
      headingAccent: "Final action accent",
      description: "Final action description",
      button: "Final action button",
    },
    enquiryModal: {
      eyebrow: "Enquiry eyebrow",
      generalTitle: "Enquiry title",
      generalDescription: "Enquiry description",
      nameLabel: "Enquiry name label",
      namePlaceholder: "Enquiry name placeholder",
      emailLabel: "Enquiry email label",
      emailPlaceholder: "Enquiry email placeholder",
      messageLabel: "Enquiry message label",
      messagePlaceholder: "Enquiry message placeholder",
      submit: "Enquiry submit action",
    },
  });

  for (const value of [
    "Tier introduction",
    "Tier benefit",
    "Bespoke possibility",
    "Shared upcoming event",
    "Optional start label",
    "Shared sponsor name",
    "shared-contact@example.com",
    "Shared media title",
    "Celebrations introduction",
    "Celebration photo caption",
    "Event type description",
    "Final action button",
    "Enquiry name placeholder",
    "Enquiry submit action",
  ]) {
    assert.match(output, new RegExp(value));
  }
});

test("media preview represents year, playable files and article action", async () => {
  const output = await renderPreview("media_coverage", {
    eyebrow: "Media eyebrow",
    headingPrefix: "Media prefix",
    headingAccent: "Media accent",
    year: 2025,
    intro: "Media introduction",
    featuredVideo: {
      outlet: "Featured outlet",
      title: "Featured title",
      src: "/assets/uploads/featured.mp4",
      poster: "/assets/uploads/featured.jpg",
    },
    article: {
      outlet: "Article outlet",
      title: "Article title",
      previewImage: "/assets/uploads/article-preview.jpg",
      fullImage: "/assets/uploads/article-full.jpg",
    },
    supportingVideos: [
      {
        outlet: "Supporting outlet",
        title: "Supporting title",
        src: "/assets/uploads/supporting.mp4",
        poster: "/assets/uploads/supporting.jpg",
      },
    ],
    articleLinkLabel: "Read full article action",
  });

  for (const value of [
    "2025",
    "/assets/uploads/featured.mp4",
    "/assets/uploads/supporting.mp4",
    "/assets/uploads/article-full.jpg",
    "Read full article action",
  ]) {
    assert.match(output, new RegExp(value.replaceAll("/", "\\/")));
  }
});
