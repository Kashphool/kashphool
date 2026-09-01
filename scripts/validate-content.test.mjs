import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  MAX_CONTENT_ASSET_BYTES,
  resolveContentAsset,
  validateContentDocuments,
} from "./validate-content.mjs";

const validDocuments = () => ({
  events: {
    nextEventId: "event-1",
    events: [
      {
        id: "event-1",
        date: { type: "range", start: "2026-10-17", end: "2026-10-20" },
        stallOpeningHours: [
          { date: "2026-10-17", start: "12:00", end: "20:00" },
          { date: "2026-10-20", start: "15:00", end: "19:00" },
        ],
        image: "/assets/uploads/event.jpg",
      },
    ],
  },
  gallery: { images: [{ image: "/assets/uploads/gallery-photo.jpg" }] },
  sponsors: {
    sponsors: [{ id: "sponsor-1", logo: "/assets/uploads/sponsor.svg" }],
  },
  sponsorPage: {
    pastCelebrations: {
      video: "/assets/uploads/celebration.MOV",
      poster: "/assets/uploads/celebration-poster.webp",
      photos: [{ image: "/assets/uploads/celebration-photo.png" }],
    },
  },
  mediaCoverage: {
    featuredVideo: {
      id: "video-1",
      src: "/assets/uploads/media-featured.mp4",
      poster: "/assets/uploads/media-featured.jpg",
    },
    article: {
      id: "article-1",
      previewImage: "/assets/uploads/media-article-preview.jpeg",
      fullImage: "/assets/uploads/media-article-full.avif",
    },
    supportingVideos: [
      {
        id: "video-2",
        src: "/assets/uploads/media-supporting.webm",
        poster: "/assets/uploads/media-supporting.gif",
      },
    ],
  },
  constitutionPage: { pdf: "/documents/constitution.pdf" },
});

const knownAsset = async () => ({ size: 1024 });

async function rejectsMutation(mutate, pattern) {
  const documents = validDocuments();
  mutate(documents);
  await assert.rejects(
    validateContentDocuments(documents, { inspectAsset: knownAsset }),
    pattern
  );
}

test("accepts coherent content and supported local media", async () => {
  await validateContentDocuments(validDocuments(), {
    inspectAsset: knownAsset,
  });
});

test("rejects CMS-managed media outside the flat shared upload library", async () => {
  await rejectsMutation(documents => {
    documents.gallery.images[0].image = "/gallery/legacy-photo.jpg";
  }, /gallery\.images\[0\]\.image.*must be stored under \/assets\/uploads/i);

  await rejectsMutation(documents => {
    documents.gallery.images[0].image =
      "/assets/uploads/gallery/nested-photo.jpg";
  }, /gallery\.images\[0\]\.image.*must be stored directly under \/assets\/uploads/i);
});

test("rejects a next event reference that does not exist", async () => {
  await rejectsMutation(documents => {
    documents.events.nextEventId = "missing-event";
  }, /nextEventId.*missing-event/);
});

test("rejects duplicate content IDs", async () => {
  await rejectsMutation(documents => {
    documents.events.events.push({
      ...structuredClone(documents.events.events[0]),
      image: "/images/another.jpg",
    });
  }, /events.*duplicate ID.*event-1/i);

  await rejectsMutation(documents => {
    documents.sponsors.sponsors.push({
      id: "sponsor-1",
      logo: "/images/another.jpg",
    });
  }, /sponsors.*duplicate ID.*sponsor-1/i);

  await rejectsMutation(documents => {
    documents.mediaCoverage.supportingVideos[0].id = "video-1";
  }, /media coverage.*duplicate ID.*video-1/i);
});

test("rejects incoherent single and range event dates", async () => {
  await rejectsMutation(documents => {
    documents.events.events[0].date = {
      type: "single",
      start: "2026-10-17",
      end: "2026-10-18",
    };
  }, /single.*must not have an end date/i);

  await rejectsMutation(documents => {
    documents.events.events[0].date = {
      type: "range",
      start: "2026-10-17",
    };
  }, /range.*requires an end date/i);

  await rejectsMutation(documents => {
    documents.events.events[0].date.end = "2026-10-16";
  }, /end date.*before.*start date/i);
});

test("rejects duplicate stall dates and dates outside their event", async () => {
  await rejectsMutation(documents => {
    documents.events.events[0].stallOpeningHours[1].date = "2026-10-17";
  }, /stall opening hours.*duplicate date.*2026-10-17/i);

  await rejectsMutation(documents => {
    documents.events.events[0].stallOpeningHours[1].date = "2026-10-21";
  }, /stall opening hours.*outside.*event range/i);
});

test("rejects missing, oversized and unsupported content files", async () => {
  await assert.rejects(
    validateContentDocuments(validDocuments(), {
      inspectAsset: async asset => {
        if (asset.path === "/assets/uploads/gallery-photo.jpg") {
          throw new Error("does not exist");
        }
        return { size: 1024 };
      },
    }),
    /gallery\.images\[0\]\.image.*does not exist/i
  );

  await assert.rejects(
    validateContentDocuments(validDocuments(), {
      inspectAsset: async () => ({ size: MAX_CONTENT_ASSET_BYTES + 1 }),
    }),
    /exceeds.*25 MiB/i
  );

  await rejectsMutation(documents => {
    documents.sponsorPage.pastCelebrations.video =
      "/assets/uploads/celebration-video.avi";
  }, /unsupported video extension.*\.avi/i);

  await rejectsMutation(documents => {
    documents.constitutionPage.pdf = "/documents/constitution.docx";
  }, /unsupported document extension.*\.docx/i);
});

test("resolves public documents and repository-root uploads without traversal", async () => {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), "content-assets-"));
  try {
    await mkdir(path.join(repositoryRoot, "client/public/documents"), {
      recursive: true,
    });
    await mkdir(path.join(repositoryRoot, "assets/uploads"), {
      recursive: true,
    });
    await writeFile(
      path.join(repositoryRoot, "client/public/documents/constitution.pdf"),
      "pdf"
    );
    await writeFile(
      path.join(repositoryRoot, "assets/uploads/gallery-photo.jpg"),
      "jpg"
    );

    assert.equal(
      (await resolveContentAsset(repositoryRoot, "/documents/constitution.pdf"))
        .sourcePath,
      path.join(repositoryRoot, "client/public/documents/constitution.pdf")
    );
    assert.equal(
      (
        await resolveContentAsset(
          repositoryRoot,
          "/assets/uploads/gallery-photo.jpg"
        )
      ).sourcePath,
      path.join(repositoryRoot, "assets/uploads/gallery-photo.jpg")
    );
    await assert.rejects(
      resolveContentAsset(repositoryRoot, "/assets/uploads/../secret.svg"),
      /must not traverse/i
    );
  } finally {
    await rm(repositoryRoot, { recursive: true, force: true });
  }
});
