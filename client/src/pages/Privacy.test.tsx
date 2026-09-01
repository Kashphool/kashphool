import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { privacyPageContent } from "@/content";
import App from "@/App";
import Privacy from "./Privacy";

const renderedText = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&");

describe("Privacy page", () => {
  it("renders every configured section and contact method through /privacy", () => {
    const html = renderToStaticMarkup(
      <Router ssrPath="/privacy">
        <App />
      </Router>
    );
    const text = renderedText(html);

    expect(text).toContain(privacyPageContent.eyebrow);
    expect(text).toContain(privacyPageContent.heading);
    expect(text).toContain(privacyPageContent.intro);
    expect(text).toContain(privacyPageContent.lastUpdated);
    privacyPageContent.sections.forEach(section => {
      expect(text).toContain(section.heading);
      section.paragraphs.forEach(paragraph =>
        expect(text).toContain(paragraph)
      );
    });
    expect(text).toContain(privacyPageContent.contactHeading);
    expect(text).toContain(privacyPageContent.contactText);
    expect(html).toContain(`href="mailto:${privacyPageContent.contactEmail}"`);
    expect(text).toContain(privacyPageContent.icoText);
    expect(html).toContain(`href="${privacyPageContent.icoUrl}"`);
  });

  it("renders CMS text as escaped text", () => {
    const originalIntro = privacyPageContent.intro;
    const originalParagraph = privacyPageContent.sections[0].paragraphs[0];

    try {
      privacyPageContent.intro = '<img src=x onerror="alert(1)">';
      privacyPageContent.sections[0].paragraphs[0] =
        '<script>alert("unsafe")</script>';
      const html = renderToStaticMarkup(<Privacy />);

      expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
      expect(html).toContain(
        "&lt;script&gt;alert(&quot;unsafe&quot;)&lt;/script&gt;"
      );
      expect(html).not.toContain("<script>");
      expect(html).not.toContain("<img src=x");
    } finally {
      privacyPageContent.intro = originalIntro;
      privacyPageContent.sections[0].paragraphs[0] = originalParagraph;
    }
  });
});

describe("GitHub Pages route preparation", () => {
  let temporaryDirectory: string | undefined;

  afterEach(async () => {
    if (temporaryDirectory) {
      await rm(temporaryDirectory, { recursive: true, force: true });
      temporaryDirectory = undefined;
    }
  });

  it("prepares a direct /privacy route", async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), "kashphool-routes-"));
    await mkdir(join(temporaryDirectory, "dist/public"), { recursive: true });
    await mkdir(join(temporaryDirectory, "admin"));
    await mkdir(join(temporaryDirectory, "assets/uploads"), {
      recursive: true,
    });
    await writeFile(
      join(temporaryDirectory, "dist/public/index.html"),
      "privacy route shell"
    );
    await writeFile(join(temporaryDirectory, "admin/index.html"), "admin");
    const script = await readFile("scripts/prepare-github-pages.mjs", "utf8");
    await writeFile(
      join(temporaryDirectory, "prepare-github-pages.mjs"),
      script
    );

    const result = spawnSync(
      process.execPath,
      [join(temporaryDirectory, "prepare-github-pages.mjs")],
      { cwd: temporaryDirectory, encoding: "utf8" }
    );

    expect(result.status, result.stderr).toBe(0);
    await expect(
      readFile(
        join(temporaryDirectory, "dist/public/privacy/index.html"),
        "utf8"
      )
    ).resolves.toBe("privacy route shell");
  });
});
