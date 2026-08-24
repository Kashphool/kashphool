import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import SponsorsSection from "@/components/sections/SponsorsSection";
import Constitution from "./Constitution";
import Sponsors from "./Sponsors";

const renderedText = (html: string) => html.replace(/<[^>]+>/g, "");

describe("Constitution page", () => {
  it("offers the constitution inline and as a direct download", () => {
    const html = renderToStaticMarkup(<Constitution />);

    expect(renderedText(html)).toContain("Our Constitution");
    expect(html).toContain('data="/documents/constitution/Kashphool - North Kent Bengali Association Constitution v1.0.pdf"');
    expect(html).toContain('href="/documents/constitution/Kashphool - North Kent Bengali Association Constitution v1.0.pdf"');
    expect(html).toContain("download");
  });
});

describe("Sponsors page", () => {
  it("shows event media and event formats", () => {
    const html = renderToStaticMarkup(<Sponsors />);

    const text = renderedText(html);
    expect(text).toContain("Partner with Kashphool");
    expect(text).toContain("Durga Puja");
    expect(html).toContain('/sponsors/media/photos/2025_1.jpg');
    expect(html).toContain('/sponsors/media/videos/hero-bg.mp4');
  });

  it("showcases the current partner before the sponsorship tiers", () => {
    const html = renderToStaticMarkup(<Sponsors />);
    const text = renderedText(html);

    expect(text).toContain("Our current partner");
    expect(text).toContain("Dartford Borough Council");
    expect(html).toContain('src="/sponsors/dartford_logo.jpg"');
    expect(html).toContain('href="https://www.dartford.gov.uk"');
    expect(text.indexOf("Past celebrations")).toBeLessThan(
      text.indexOf("Our current partner"),
    );
    expect(text.indexOf("Our current partner")).toBeLessThan(
      text.indexOf("Sponsorship"),
    );
  });

  it("uses modal buttons for every sponsor enquiry entry point", () => {
    const html = renderToStaticMarkup(<Sponsors />);

    expect(html.match(/<button[^>]*>Enquire /g)).toHaveLength(4);
    expect(html).toMatch(/<button[^>]*>Start a conversation /);
    expect(html).toMatch(/<button[^>]*><svg[^>]*>.*Contact our team<\/button>/);
  });

  it("shows the sponsorship packages and prices supplied for Durga Puja", () => {
    const text = renderedText(renderToStaticMarkup(<Sponsors />));

    expect(text).toContain("Coupon Sponsor");
    expect(text).toContain("£100");
    expect(text).toContain("Banner Sponsor");
    expect(text).toContain("£250");
    expect(text).toContain("Title Sponsor");
    expect(text).toContain("£800");
    expect(text).toContain("Food / non-food stalls");
    expect(text).toContain("Starting from £200 for all four days");
  });

  it("presents negotiable benefits as bespoke partnership possibilities", () => {
    const text = renderedText(renderToStaticMarkup(<Sponsors />));

    expect(text).toContain("Bespoke partnership possibilities");
    expect(text).toContain("Prominent branding across the venue over all four days");
    expect(text).toContain("Stage acknowledgements during cultural programmes");
    expect(text).toContain("Inclusion in our digital and social-media promotion");
    expect(text).toContain("A dedicated promotional or information presence at the event");
    expect(text).toContain("Distribution of QR codes, offers, subscriptions or service-related promotional material");
    expect(text).toContain("Branding on complimentary lunch and dinner coupons distributed to visitors");
  });
});

describe("site navigation", () => {
  it("separates the homepage sponsor section from the partnership page", () => {
    const navbar = renderToStaticMarkup(<Navbar />);
    const footer = renderToStaticMarkup(<Footer />);

    expect(navbar).toContain('href="/#sponsors"');
    expect(footer).toContain('href="/sponsors"');
    expect(navbar).toContain('href="/constitution"');
    expect(footer).toContain('href="/constitution"');
  });

  it("offers a partnership link below the homepage sponsor showcase", () => {
    const html = renderToStaticMarkup(<SponsorsSection />);

    expect(renderedText(html)).toContain("Partner with Us");
    expect(html).toContain('href="/sponsors"');
  });
});
