import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MAX_CONTENT_ASSET_BYTES = 25 * 1024 * 1024;

const supportedExtensions = {
  image: new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]),
  video: new Set([".mov", ".mp4", ".webm"]),
  document: new Set([".pdf"]),
};

function assertUnique(items, label) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) {
      throw new Error(`${label} contains duplicate ID ${item.id}`);
    }
    seen.add(item.id);
  }
}

function parseIsoDate(value, label) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) throw new Error(`${label} must use YYYY-MM-DD`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`${label} is not a real calendar date`);
  }
  return date;
}

function validateEvents(eventsDocument) {
  const events = eventsDocument.events ?? [];
  assertUnique(events, "Events");

  if (!events.some(event => event.id === eventsDocument.nextEventId)) {
    throw new Error(
      `events.nextEventId references missing event ${eventsDocument.nextEventId}`
    );
  }

  for (const event of events) {
    const label = `events.${event.id}`;
    const start = parseIsoDate(event.date?.start, `${label}.date.start`);
    let end = start;

    if (event.date?.type === "single") {
      if (event.date.end) {
        throw new Error(`${label} single date must not have an end date`);
      }
    } else if (event.date?.type === "range") {
      if (!event.date.end) {
        throw new Error(`${label} range requires an end date`);
      }
      end = parseIsoDate(event.date.end, `${label}.date.end`);
      if (end < start) {
        throw new Error(`${label} end date cannot be before its start date`);
      }
    } else {
      throw new Error(`${label}.date.type must be single or range`);
    }

    const stallDates = new Set();
    for (const hours of event.stallOpeningHours ?? []) {
      if (stallDates.has(hours.date)) {
        throw new Error(
          `${label} stall opening hours contain duplicate date ${hours.date}`
        );
      }
      stallDates.add(hours.date);
      const stallDate = parseIsoDate(
        hours.date,
        `${label}.stallOpeningHours.date`
      );
      if (stallDate < start || stallDate > end) {
        throw new Error(
          `${label} stall opening hours date ${hours.date} is outside the event range`
        );
      }
    }
  }
}

function collectAssets(documents) {
  const assets = [];
  const add = (kind, assetPath, label) =>
    assets.push({ kind, path: assetPath, label });

  for (const [index, event] of documents.events.events.entries()) {
    add("image", event.image, `events.events[${index}].image`);
  }
  for (const [index, image] of documents.gallery.images.entries()) {
    add("image", image.image, `gallery.images[${index}].image`);
  }
  for (const [index, sponsor] of documents.sponsors.sponsors.entries()) {
    add("image", sponsor.logo, `sponsors.sponsors[${index}].logo`);
  }

  const past = documents.sponsorPage.pastCelebrations;
  add("video", past.video, "sponsorPage.pastCelebrations.video");
  add("image", past.poster, "sponsorPage.pastCelebrations.poster");
  for (const [index, photo] of past.photos.entries()) {
    add(
      "image",
      photo.image,
      `sponsorPage.pastCelebrations.photos[${index}].image`
    );
  }

  const coverage = documents.mediaCoverage;
  add("video", coverage.featuredVideo.src, "mediaCoverage.featuredVideo.src");
  add(
    "image",
    coverage.featuredVideo.poster,
    "mediaCoverage.featuredVideo.poster"
  );
  add(
    "image",
    coverage.article.previewImage,
    "mediaCoverage.article.previewImage"
  );
  add("image", coverage.article.fullImage, "mediaCoverage.article.fullImage");
  for (const [index, video] of coverage.supportingVideos.entries()) {
    add("video", video.src, `mediaCoverage.supportingVideos[${index}].src`);
    add(
      "image",
      video.poster,
      `mediaCoverage.supportingVideos[${index}].poster`
    );
  }

  add("document", documents.constitutionPage.pdf, "constitutionPage.pdf");
  return assets;
}

export async function resolveContentAsset(repositoryRoot, publicPath) {
  if (typeof publicPath !== "string" || !publicPath.startsWith("/")) {
    throw new Error(
      `content asset path must be site-root relative: ${publicPath}`
    );
  }
  const segments = publicPath.split("/");
  if (
    segments.includes("..") ||
    segments.includes(".") ||
    publicPath.includes("\\")
  ) {
    throw new Error(
      `content asset path must not traverse directories: ${publicPath}`
    );
  }

  const isUpload = publicPath.startsWith("/assets/uploads/");
  const sourceRoot = isUpload
    ? repositoryRoot
    : path.join(repositoryRoot, "client/public");
  const sourcePath = path.resolve(sourceRoot, publicPath.slice(1));
  const relative = path.relative(sourceRoot, sourcePath);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(
      `content asset path must stay in its source root: ${publicPath}`
    );
  }

  const file = await stat(sourcePath);
  if (!file.isFile()) throw new Error("does not exist as a file");
  return { sourcePath, size: file.size };
}

export async function validateContentDocuments(
  documents,
  { inspectAsset } = {}
) {
  validateEvents(documents.events);
  assertUnique(documents.sponsors.sponsors, "Sponsors");
  assertUnique(
    [
      documents.mediaCoverage.featuredVideo,
      documents.mediaCoverage.article,
      ...documents.mediaCoverage.supportingVideos,
    ],
    "Media coverage"
  );

  for (const asset of collectAssets(documents)) {
    if (
      asset.kind !== "document" &&
      !asset.path?.startsWith("/assets/uploads/")
    ) {
      throw new Error(
        `${asset.label} (${asset.path}) must be stored under /assets/uploads`
      );
    }
    if (
      asset.kind !== "document" &&
      !/^\/assets\/uploads\/[^/]+$/.test(asset.path)
    ) {
      throw new Error(
        `${asset.label} (${asset.path}) must be stored directly under /assets/uploads`
      );
    }

    const extension = path.extname(asset.path ?? "").toLowerCase();
    if (!supportedExtensions[asset.kind].has(extension)) {
      throw new Error(
        `${asset.label} has unsupported ${asset.kind} extension ${extension || "(none)"}`
      );
    }

    try {
      const file = await inspectAsset(asset);
      if (file.size > MAX_CONTENT_ASSET_BYTES) {
        throw new Error(
          `exceeds the 25 MiB per-file limit (${file.size} bytes)`
        );
      }
    } catch (error) {
      throw new Error(`${asset.label} (${asset.path}): ${error.message}`);
    }
  }
}

async function readJson(repositoryRoot, relativePath) {
  return JSON.parse(
    await readFile(path.join(repositoryRoot, relativePath), "utf8")
  );
}

export async function validateRepositoryContent(
  repositoryRoot = process.cwd()
) {
  const documents = {
    events: await readJson(repositoryRoot, "client/public/data/events.json"),
    gallery: await readJson(repositoryRoot, "client/public/data/gallery.json"),
    sponsors: await readJson(
      repositoryRoot,
      "client/public/data/sponsors.json"
    ),
    sponsorPage: await readJson(
      repositoryRoot,
      "client/public/data/sponsor-page.json"
    ),
    mediaCoverage: await readJson(
      repositoryRoot,
      "client/public/data/media-coverage.json"
    ),
    constitutionPage: await readJson(
      repositoryRoot,
      "client/public/data/constitution-page.json"
    ),
  };

  await validateContentDocuments(documents, {
    inspectAsset: asset => resolveContentAsset(repositoryRoot, asset.path),
  });
}

const isCli =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isCli) {
  await validateRepositoryContent();
  console.log("CMS content is semantically valid.");
}
