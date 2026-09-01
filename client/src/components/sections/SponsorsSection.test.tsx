import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sponsorsContent } from "@/content";
import type { Sponsor } from "@/types";
import SponsorsSection, * as SponsorsSectionModule from "./SponsorsSection";

type SponsorItemComponent = (props: {
  sponsor: Sponsor;
  index: number;
  isInView: boolean;
}) => ReactElement;

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("SponsorsSection", () => {
  it("renders every configured sponsor and protects configured external links", () => {
    const html = renderToStaticMarkup(<SponsorsSection />);

    sponsorsContent.sponsors.forEach(sponsor => {
      expect(html).toContain(sponsor.name);
      expect(html).toContain(`src="${sponsor.logo}"`);

      if (sponsor.website) {
        expect(html).toMatch(
          new RegExp(
            `<a[^>]*href="${escapeRegExp(sponsor.website)}"[^>]*target="_blank"[^>]*rel="noopener noreferrer"`
          )
        );
      }
    });
  });

  it("wraps only website-bearing sponsors in external links", () => {
    const SponsorItem = Reflect.get(SponsorsSectionModule, "SponsorItem") as
      | SponsorItemComponent
      | undefined;

    expect(SponsorItem).toBeTypeOf("function");
    if (!SponsorItem) return;

    const noWebsiteHtml = renderToStaticMarkup(
      createElement(SponsorItem, {
        sponsor: {
          id: "community-partner",
          name: "Community Partner",
          logo: "/sponsors/community-partner.jpg",
        },
        index: 0,
        isInView: true,
      })
    );
    const websiteHtml = renderToStaticMarkup(
      createElement(SponsorItem, {
        sponsor: {
          id: "website-partner",
          name: "Website Partner",
          logo: "/sponsors/website-partner.jpg",
          website: "https://partner.example.test",
        },
        index: 1,
        isInView: true,
      })
    );

    expect(noWebsiteHtml).toContain("Community Partner");
    expect(noWebsiteHtml).toContain('src="/sponsors/community-partner.jpg"');
    expect(noWebsiteHtml).not.toContain("<a");
    expect(websiteHtml).toMatch(
      /<a[^>]*href="https:\/\/partner\.example\.test"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/
    );
  });
});
