import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import SponsorsSection from "@/components/sections/SponsorsSection";
import { getNextEvent } from "@/lib/eventData";
import { formatEventDateRange, formatEventDays } from "@/lib/eventPresentation";
import Constitution from "./Constitution";
import NotFound from "./NotFound";
import * as sponsorsPageModule from "./Sponsors";

const Sponsors = sponsorsPageModule.default;

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

describe("Not found page", () => {
  it("uses Kashphool branding and gives visitors clear recovery routes", () => {
    const html = renderToStaticMarkup(
      <Router ssrPath="/missing">
        <NotFound />
      </Router>,
    );
    const text = renderedText(html);

    expect(text).toContain("This page has wandered");
    expect(html).toContain('src="/images/logo.png"');
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/#contact"');
  });
});

describe("Sponsors page", () => {
  it("shows event media and event formats", () => {
    const html = renderToStaticMarkup(<Sponsors />);

    const text = renderedText(html);
    expect(text).toContain("Partner with Kashphool");
    expect(text).toContain("Durga Pujo");
    expect(html).toContain('/sponsors/media/photos/2025_1.jpg');
    expect(html).toContain('/sponsors/media/videos/hero-bg.mp4');
  });

  it("showcases 2025 television and print coverage without preloading videos", () => {
    const html = renderToStaticMarkup(<Sponsors />);
    const text = renderedText(html);

    expect(text).toContain("In the Media");
    expect(text).toContain("TV9 Bangla");
    expect(text).toContain("Republic Bangla");
    expect(text).toContain("NKTv Bangla");
    expect(text).toContain("Bartaman");
    expect(html).toContain('src="/sponsors/media/videos/tv9-bangla-kashphool-durga-pujo-2025.mp4"');
    expect(html).toContain('src="/sponsors/media/videos/republic-bangla-kashphool-durga-pujo-2025.mp4"');
    expect(html).toContain('src="/sponsors/media/videos/nktv-bangla-kashphool-durga-pujo-2025.mp4"');
    expect(html.match(/<video[^>]*preload="none"/g)).toHaveLength(3);
    expect(html).toContain('src="/sponsors/media/photos/bartaman-kashphool-durga-pujo-2025-preview.jpg"');
    expect(html).toContain('href="/sponsors/media/photos/bartaman-kashphool-durga-pujo-2025-full.jpg"');
    expect(html.match(/lucide-tv/g)).toHaveLength(3);
    expect(text.indexOf("Dartford Borough Council")).toBeLessThan(text.indexOf("In the Media"));
    expect(text.indexOf("In the Media")).toBeLessThan(text.indexOf("Past celebrations"));
  });

  it("places the article beside a featured video and a vertical pair of supporting videos", () => {
    const html = renderToStaticMarkup(<Sponsors />);

    expect(html.match(/data-media-size="featured"/g)).toHaveLength(1);
    expect(html.match(/data-media-size="compact"/g)).toHaveLength(3);
    expect(html.match(/data-media-layout="featured-article-video-stack"/g)).toHaveLength(1);
    expect(html.match(/data-media-stack="supporting-videos"/g)).toHaveLength(1);
  });

  it("showcases sponsors after the offer and before the media coverage", () => {
    const html = renderToStaticMarkup(<Sponsors />);
    const text = renderedText(html);

    expect(text).toContain("Dartford Borough Council");
    expect(html).toContain('src="/sponsors/dartford_logo.jpg"');
    expect(html).toContain('href="https://www.dartford.gov.uk"');
    expect(text.indexOf("Sponsorship")).toBeLessThan(text.indexOf("Dartford Borough Council"));
    expect(text.indexOf("Dartford Borough Council")).toBeLessThan(text.indexOf("In the Media"));
  });

  it("puts sponsorship choices and practical details before supporting proof", () => {
    const text = renderedText(renderToStaticMarkup(<Sponsors />));
    const journey = [
      "Partner with Kashphool",
      "1,000+",
      "Sponsorship tiers",
      "Bespoke partnership possibilities",
      "Upcoming event",
      "Dartford Borough Council",
      "In the Media",
      "Past celebrations",
      "Events with heart",
      "Let’s create something meaningful",
    ];

    journey.slice(0, -1).forEach((section, index) => {
      expect(text.indexOf(section)).toBeLessThan(text.indexOf(journey[index + 1]));
    });
  });

  it("uses modal buttons for every sponsor enquiry entry point", () => {
    const html = renderToStaticMarkup(<Sponsors />);

    expect(html.match(/<button[^>]*>Enquire /g)).toHaveLength(4);
    expect(html).toMatch(/<button[^>]*>Start a conversation /);
    expect(html).toMatch(/<button[^>]*><svg[^>]*>.*Contact our team<\/button>/);
  });

  it("shows the sponsorship packages and prices supplied for Durga Pujo", () => {
    const text = renderedText(renderToStaticMarkup(<Sponsors />));

    expect(text).toContain("Coupon Sponsor");
    expect(text).toContain("£100");
    expect(text).toContain("Banner Sponsor");
    expect(text).toContain("£250");
    expect(text).toContain("Title Sponsor");
    expect(text).toContain("£800");
    expect(text).toContain("Event Stalls");
    expect(text).toContain("Starting from");
    expect(text).toContain("£200");
    expect(text).toContain("for all four days");
  });

  it("presents the configured event details to prospective sponsors", () => {
    const html = renderToStaticMarkup(<Sponsors />);
    const text = renderedText(html);

    expect(text).toContain("17–20 October 2026");
    expect(text).not.toContain("Sat 17, Sun 18, Mon 19, Tue 20 October");
    expect(text).toContain("Elite Venue, Dunkirk Cl, Gravesend DA12 5ND");
    expect(text).toContain("Upcoming event");
    expect(text).toContain("Durga Pujo 2026: event &amp; stall information");
    expect(text).toContain("Sat 17 October12:00 pm–8:00 pm*");
    expect(text).toContain("Sun 18 October12:00 pm–8:00 pm*");
    expect(text).toContain("Mon 19 October4:00 pm–8:00 pm");
    expect(text).toContain("Tue 20 October3:00 pm–7:00 pm");
    expect(text).toContain("* Optional start from 3:00 pm on Saturday and Sunday.");
    expect(html.match(/aria-describedby="optional-stall-start"/g)).toHaveLength(2);
    expect(html).toMatch(
      /id="optional-stall-start"[^>]*><span[^>]*class="text-saffron"[^>]*>\*<\/span> Optional start/,
    );
    expect(text).toContain("info@kashphool.co.uk");
    expect(html).toContain('title="Map showing Elite Venue"');
    expect(html).toContain('src="https://www.google.com/maps?q=51.4462,0.2186&amp;z=15&amp;output=embed"');
    expect(text).toContain("Open in Google Maps");
  });

  it("breaks the upcoming event heading into an event line and a detail line", () => {
    const html = renderToStaticMarkup(<Sponsors />);

    expect(html).toMatch(
      /<h2[^>]*><span[^>]*class="block"[^>]*>Durga Pujo 2026:<\/span>\s*<span[^>]*class="[^\"]*block[^\"]*text-gold-gradient[^\"]*"[^>]*>event &amp; stall information<\/span><\/h2>/,
    );
  });

  it("describes the coupon and title sponsorship propositions clearly", () => {
    const text = renderedText(renderToStaticMarkup(<Sponsors />));

    expect(text).toContain(
      "Your branding will feature on approximately 1,500 complimentary lunch and dinner coupons distributed to visitors across the four-day celebration.",
    );
    expect(text).toContain("Premium");
    expect(text).toContain("Premium venue branding");
    expect(text).toContain("Stage acknowledgements");
    expect(text).toContain("Prominent digital and social-media inclusion");
    expect(text).toContain("Sponsor spotlight");
    expect(text).toContain("Flyer and QR-code distribution");
    expect(text).toContain("Promotional stall");
    expect(text).toContain("Potential category exclusivity, subject to agreement");
  });

  it("presents every type of event stall with a consistent price hierarchy", () => {
    const html = renderToStaticMarkup(<Sponsors />);
    const text = renderedText(html);

    expect(text).toContain("Event Stalls");
    expect(text).toContain(
      "Meet visitors in person and bring your food, products, services or organisation into the heart of the four-day celebration.",
    );
    expect(text).toContain(
      "A dedicated venue space to showcase your brand, promote your services or sell your products.",
    );
    expect(html).toMatch(/text-xs[^>]*>Starting from<\/p><div[^>]*items-baseline[^>]*><p[^>]*text-sm[^>]*text-saffron[^>]*>£200<\/p><p[^>]*text-xs[^>]*>for all four days<\/p><\/div>/);
  });

  it("labels the grant funder section as sponsors", () => {
    const text = renderedText(renderToStaticMarkup(<Sponsors />));

    expect(text).toContain("Sponsors");
    expect(text).not.toContain("Our current partner");
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

describe("event presentation", () => {
  it("formats a configured range and its individual days in British style", () => {
    expect(formatEventDateRange("2026-10-17", "2026-10-20")).toBe(
      "17–20 October 2026",
    );
    expect(formatEventDays("2026-10-17", "2026-10-20")).toBe(
      "Sat 17, Sun 18, Mon 19, Tue 20 October",
    );
  });

  it("selects the configured next event instead of assuming the first event", () => {
    const selected = getNextEvent({
      nextEventId: "second-event",
      events: [
        {
          id: "first-event",
          name: "First event",
          description: "First event description",
          date: { type: "single", start: "2026-01-01" },
          venue: { name: "First venue", address: "First address", coordinates: { lat: 1, lng: 1 } },
          image: "/first.jpg",
        },
        {
          id: "second-event",
          name: "Second event",
          description: "Second event description",
          date: { type: "single", start: "2026-02-01" },
          venue: { name: "Second venue", address: "Second address", coordinates: { lat: 2, lng: 2 } },
          image: "/second.jpg",
        },
      ],
    });

    expect(selected).toMatchObject({ id: "second-event", name: "Second event" });
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
