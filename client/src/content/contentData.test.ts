import { describe, expect, it } from "vitest";
import {
  galleryContent,
  mediaCoverageContent,
  sponsorPageContent,
  sponsorsContent,
} from "@/content";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

describe("CMS content boundaries", () => {
  it("keeps layout-sensitive collections within their approved capacities", () => {
    expect(galleryContent.images.length).toBeGreaterThanOrEqual(1);
    expect(galleryContent.images.length).toBeLessThanOrEqual(9);
    expect(sponsorPageContent.highlights).toHaveLength(4);
    expect(sponsorPageContent.tiers).toHaveLength(4);
    expect(
      sponsorPageContent.pastCelebrations.photos.length
    ).toBeGreaterThanOrEqual(1);
    expect(
      sponsorPageContent.pastCelebrations.photos.length
    ).toBeLessThanOrEqual(10);
    expect(mediaCoverageContent.supportingVideos).toHaveLength(2);
  });

  it("uses named media slots and an object-root sponsor collection", () => {
    expect(mediaCoverageContent.featuredVideo.type).toBe("video");
    expect(mediaCoverageContent.article.type).toBe("article");
    expect(
      mediaCoverageContent.supportingVideos.every(item => item.type === "video")
    ).toBe(true);
    expect(Array.isArray(sponsorsContent.sponsors)).toBe(true);
  });

  it("validates configured CMS upload assets", () => {
    const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
    const fixture = path.join(
      repositoryRoot,
      "assets/uploads/gallery-durga-pujo-2025-01.jpg"
    );
    const result = spawnSync(
      process.execPath,
      [path.join(repositoryRoot, "scripts/validate-content.mjs")],
      { cwd: repositoryRoot, encoding: "utf8" }
    );

    expect(existsSync(fixture)).toBe(true);
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(result.stdout).toContain("CMS content is semantically valid.");
  });
});
