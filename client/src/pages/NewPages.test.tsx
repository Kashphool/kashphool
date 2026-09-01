import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Route, Router } from "wouter";
import {
  constitutionPageContent,
  eventsContent,
  galleryContent,
  homePageContent,
  mediaCoverageContent,
  notFoundPageContent,
  siteContent,
  sponsorPageContent,
  sponsorsContent,
} from "@/content";
import AboutSection from "@/components/sections/AboutSection";
import Footer from "@/components/layout/Footer";
import GallerySection from "@/components/sections/GallerySection";
import HeroSection from "@/components/sections/HeroSection";
import Navbar from "@/components/layout/Navbar";
import SponsorsSection from "@/components/sections/SponsorsSection";
import { getNextEvent } from "@/lib/eventData";
import {
  formatEventDate,
  formatEventDateRange,
  formatEventDays,
} from "@/lib/eventPresentation";
import Constitution from "./Constitution";
import NotFound from "./NotFound";
import * as sponsorsPageModule from "./Sponsors";

const Sponsors = sponsorsPageModule.default;

const renderedText = (html: string) => html.replace(/<[^>]+>/g, "");

describe("Constitution page", () => {
  it("renders constitution content and document path from CMS data", () => {
    const originalIntro = constitutionPageContent.intro;
    const originalPdf = constitutionPageContent.pdf;

    try {
      constitutionPageContent.intro = "A CMS constitution introduction";
      constitutionPageContent.pdf =
        "/documents/constitution/cms-constitution.pdf";
      const html = renderToStaticMarkup(<Constitution />);

      expect(renderedText(html)).toContain(constitutionPageContent.intro);
      expect(html).toContain(`data="${constitutionPageContent.pdf}"`);
      expect(html).toContain(`href="${constitutionPageContent.pdf}"`);
      expect(html).toContain("download");
    } finally {
      constitutionPageContent.intro = originalIntro;
      constitutionPageContent.pdf = originalPdf;
    }
  });
});

describe("Not found page", () => {
  it("renders editable 404 copy with fixed recovery destinations", () => {
    const originalDescription = notFoundPageContent.description;

    try {
      notFoundPageContent.description = "A CMS 404 description";
      const html = renderToStaticMarkup(
        <Router ssrPath="/missing">
          <NotFound />
        </Router>
      );
      const text = renderedText(html);

      expect(text).toContain(notFoundPageContent.description);
      expect(html).toContain('src="/images/logo.png"');
      expect(html).toContain('href="/"');
      expect(html).toContain('href="/#contact"');
    } finally {
      notFoundPageContent.description = originalDescription;
    }
  });
});

describe("Sponsors page", () => {
  it("renders a CMS-valid single-date event through the /sponsors route", () => {
    const event = getNextEvent(eventsContent);
    const originalDate = { ...event.date };

    try {
      event.date = { type: "single", start: "2026-10-17" };
      const html = renderToStaticMarkup(
        <Router ssrPath="/sponsors">
          <Route path="/sponsors" component={Sponsors} />
        </Router>
      );

      expect(renderedText(html)).toContain(formatEventDate("2026-10-17"));
    } finally {
      event.date = originalDate;
    }
  });

  it("renders a sponsor without a website as an unlinked card on /sponsors", () => {
    const sponsor = sponsorsContent.sponsors[0];
    const originalWebsite = sponsor.website;

    try {
      delete sponsor.website;
      const html = renderToStaticMarkup(
        <Router ssrPath="/sponsors">
          <Route path="/sponsors" component={Sponsors} />
        </Router>
      );
      const escapedLogo = sponsor.logo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const linkedLogo = new RegExp(
        `<a\\b[^>]*>(?:(?!<\\/a>)[\\s\\S])*<img[^>]*src="${escapedLogo}"(?:(?!<\\/a>)[\\s\\S])*<\\/a>`
      );

      expect(html).toContain(`src="${sponsor.logo}"`);
      expect(html).toContain(
        'class="group w-52 rounded-sm border border-gold/10 bg-charcoal-light/45 p-5 text-center"'
      );
      expect(html).not.toMatch(linkedLogo);
    } finally {
      sponsor.website = originalWebsite;
    }
  });

  it("renders venue details without map anchors on /sponsors when no map URL is configured", () => {
    const event = getNextEvent(eventsContent);
    const originalGoogleMapsUrl = event.venue.googleMapsUrl;

    try {
      delete event.venue.googleMapsUrl;
      const html = renderToStaticMarkup(
        <Router ssrPath="/sponsors">
          <Route path="/sponsors" component={Sponsors} />
        </Router>
      );
      const escapedVenue =
        `${event.venue.name}, ${event.venue.address}`.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );
      const linkedVenue = new RegExp(
        `<a\\b[^>]*>(?:(?!<\\/a>)[\\s\\S])*${escapedVenue}(?:(?!<\\/a>)[\\s\\S])*<\\/a>`
      );
      const linkedMapLabel = new RegExp(
        `<a\\b[^>]*>(?:(?!<\\/a>)[\\s\\S])*${sponsorPageContent.eventInfo.mapLinkLabel}(?:(?!<\\/a>)[\\s\\S])*<\\/a>`
      );

      expect(
        renderedText(html).match(new RegExp(escapedVenue, "g"))
      ).toHaveLength(2);
      expect(html).not.toMatch(linkedVenue);
      expect(html).not.toMatch(linkedMapLabel);
    } finally {
      event.venue.googleMapsUrl = originalGoogleMapsUrl;
    }
  });

  it("renders each bounded past-celebration photo once", () => {
    const html = renderToStaticMarkup(<Sponsors />);

    sponsorPageContent.pastCelebrations.photos.forEach(photo => {
      const escaped = photo.image.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expect(
        html.match(new RegExp(`<img[^>]*src="${escaped}"`, "g"))
      ).toHaveLength(1);
    });
  });

  it("keeps the six-photo lower strip compact on desktop", () => {
    const html = renderToStaticMarkup(<Sponsors />);

    expect(html).toContain(
      'class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6"'
    );
  });

  it("shows event media and event formats", () => {
    const html = renderToStaticMarkup(<Sponsors />);

    const text = renderedText(html);
    expect(text).toContain("Partner with Kashphool");
    expect(text).toContain("Durga Pujo");
    expect(html).toContain("/images/hero-bg.jpeg");
    expect(html).toContain("/images/hero-bg.mp4");
  });

  it("showcases 2025 television and print coverage without preloading videos", () => {
    const html = renderToStaticMarkup(<Sponsors />);
    const text = renderedText(html);

    expect(text).toContain("In the Media");
    expect(text).toContain("TV9 Bangla");
    expect(text).toContain("Republic Bangla");
    expect(text).toContain("NKTv Bangla");
    expect(text).toContain("Bartaman");
    expect(html).toContain(
      'src="/assets/uploads/media-tv9-bangla-kashphool-durga-pujo-2025.mp4"'
    );
    expect(html).toContain(
      'src="/assets/uploads/media-republic-bangla-kashphool-durga-pujo-2025.mp4"'
    );
    expect(html).toContain(
      'src="/assets/uploads/media-nktv-bangla-kashphool-durga-pujo-2025.mp4"'
    );
    expect(html.match(/<video[^>]*preload="none"/g)).toHaveLength(3);
    expect(html).toContain(
      'src="/assets/uploads/celebration-kashphool-durga-pujo-2025.mov" type="video/quicktime"'
    );
    expect(html.match(/type="video\/mp4"/g)).toHaveLength(4);
    expect(html).toContain(
      'src="/assets/uploads/media-bartaman-kashphool-durga-pujo-2025-preview.jpg"'
    );
    expect(html).toContain(
      'href="/assets/uploads/media-bartaman-kashphool-durga-pujo-2025-full.jpg"'
    );
    expect(html.match(/lucide-tv/g)).toHaveLength(3);
    expect(text.indexOf("Dartford Borough Council")).toBeLessThan(
      text.indexOf("In the Media")
    );
    expect(text.indexOf("In the Media")).toBeLessThan(
      text.indexOf("Past celebrations")
    );
  });

  it("preserves the fixed media coverage layout", () => {
    const html = renderToStaticMarkup(<Sponsors />);

    expect(html.match(/data-media-size="featured"/g)).toHaveLength(1);
    expect(html.match(/data-media-size="compact"/g)).toHaveLength(3);
    expect(mediaCoverageContent.supportingVideos).toHaveLength(2);
    expect(sponsorPageContent.highlights).toHaveLength(4);
    expect(sponsorPageContent.tiers).toHaveLength(4);
    expect(
      html.match(/data-media-layout="featured-article-video-stack"/g)
    ).toHaveLength(1);
    expect(html.match(/data-media-stack="supporting-videos"/g)).toHaveLength(1);
  });

  it("uses the configured article title as the media image alternative text", () => {
    const html = renderToStaticMarkup(<Sponsors />);
    const expectedAlt = renderToStaticMarkup(
      <img alt={mediaCoverageContent.article.title} />
    ).match(/alt="[^"]+"/)?.[0];

    expect(html).toContain(expectedAlt);
  });

  it("showcases sponsors after the offer and before the media coverage", () => {
    const html = renderToStaticMarkup(<Sponsors />);
    const text = renderedText(html);

    expect(text).toContain("Dartford Borough Council");
    expect(html).toContain(
      'src="/assets/uploads/sponsor-dartford-borough-council.jpg"'
    );
    expect(html).toContain('href="https://www.dartford.gov.uk"');
    expect(text.indexOf("Sponsorship")).toBeLessThan(
      text.indexOf("Dartford Borough Council")
    );
    expect(text.indexOf("Dartford Borough Council")).toBeLessThan(
      text.indexOf("In the Media")
    );
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
      expect(text.indexOf(section)).toBeLessThan(
        text.indexOf(journey[index + 1])
      );
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
    expect(text).toContain(
      "* Optional start from 3:00 pm on Saturday and Sunday."
    );
    expect(html.match(/aria-describedby="optional-stall-start"/g)).toHaveLength(
      2
    );
    expect(html).toMatch(
      /id="optional-stall-start"[^>]*><span[^>]*class="text-saffron"[^>]*>\*<\/span> Optional start/
    );
    expect(text).toContain("info@kashphool.co.uk");
    expect(html).toContain('title="Map showing Elite Venue"');
    expect(html).toContain(
      'src="https://www.google.com/maps?q=51.4462,0.2186&amp;z=15&amp;output=embed"'
    );
    expect(text).toContain("Open in Google Maps");
  });

  it("uses the configured stall-hours fallback when the event has no hours", () => {
    const event = eventsContent.events.find(
      item => item.id === eventsContent.nextEventId
    )!;
    const originalHours = event.stallOpeningHours;

    try {
      event.stallOpeningHours = undefined;
      expect(renderedText(renderToStaticMarkup(<Sponsors />))).toContain(
        sponsorPageContent.eventInfo.stallHoursFallback
      );
    } finally {
      event.stallOpeningHours = originalHours;
    }
  });

  it("breaks the upcoming event heading into an event line and a detail line", () => {
    const html = renderToStaticMarkup(<Sponsors />);

    expect(html).toMatch(
      /<h2[^>]*><span[^>]*class="block"[^>]*>Durga Pujo 2026:<\/span>\s*<span[^>]*class="[^\"]*block[^\"]*text-gold-gradient[^\"]*"[^>]*>event &amp; stall information<\/span><\/h2>/
    );
  });

  it("describes the coupon and title sponsorship propositions clearly", () => {
    const text = renderedText(renderToStaticMarkup(<Sponsors />));

    expect(text).toContain(
      "Your branding will feature on approximately 1,500 complimentary lunch and dinner coupons distributed to visitors across the four-day celebration."
    );
    expect(text).toContain("Premium");
    expect(text).toContain("Premium venue branding");
    expect(text).toContain("Stage acknowledgements");
    expect(text).toContain("Prominent digital and social-media inclusion");
    expect(text).toContain("Sponsor spotlight");
    expect(text).toContain("Flyer and QR-code distribution");
    expect(text).toContain("Promotional stall");
    expect(text).toContain(
      "Potential category exclusivity, subject to agreement"
    );
  });

  it("presents every type of event stall with a consistent price hierarchy", () => {
    const html = renderToStaticMarkup(<Sponsors />);
    const text = renderedText(html);

    expect(text).toContain("Event Stalls");
    expect(text).toContain(
      "Meet visitors in person and bring your food, products, services or organisation into the heart of the four-day celebration."
    );
    expect(text).toContain(
      "A dedicated venue space to showcase your brand, promote your services or sell your products."
    );
    expect(html).toMatch(
      /text-xs[^>]*>Starting from<\/p><div[^>]*items-baseline[^>]*><p[^>]*text-sm[^>]*text-saffron[^>]*>£200<\/p><p[^>]*text-xs[^>]*>for all four days<\/p><\/div>/
    );
  });

  it("labels the grant funder section as sponsors", () => {
    const text = renderedText(renderToStaticMarkup(<Sponsors />));

    expect(text).toContain("Sponsors");
    expect(text).not.toContain("Our current partner");
  });

  it("presents negotiable benefits as bespoke partnership possibilities", () => {
    const text = renderedText(renderToStaticMarkup(<Sponsors />));

    expect(text).toContain("Bespoke partnership possibilities");
    expect(text).toContain(
      "Prominent branding across the venue over all four days"
    );
    expect(text).toContain("Stage acknowledgements during cultural programmes");
    expect(text).toContain(
      "Inclusion in our digital and social-media promotion"
    );
    expect(text).toContain(
      "A dedicated promotional or information presence at the event"
    );
    expect(text).toContain(
      "Distribution of QR codes, offers, subscriptions or service-related promotional material"
    );
    expect(text).toContain(
      "Branding on complimentary lunch and dinner coupons distributed to visitors"
    );
  });
});

describe("Gallery section", () => {
  it("renders homepage editorial content from the CMS data boundary", () => {
    expect(renderedText(renderToStaticMarkup(<HeroSection />))).toContain(
      homePageContent.hero.description
    );
    expect(renderedText(renderToStaticMarkup(<AboutSection />))).toContain(
      homePageContent.about.paragraphs[0]
    );
    expect(renderedText(renderToStaticMarkup(<GallerySection />))).toContain(
      homePageContent.gallery.intro
    );
  });

  it("renders every configured gallery and sponsor asset", () => {
    const gallery = renderToStaticMarkup(<GallerySection />);

    galleryContent.images.forEach(item =>
      expect(gallery).toContain(`src="${item.image}"`)
    );
    expect(
      gallery.match(/<img[^>]*src="\/assets\/uploads\/gallery-/g)
    ).toHaveLength(galleryContent.images.length);
    expect(sponsorsContent.sponsors).toHaveLength(1);
  });

  it("includes the seventh 2025 celebration photo", () => {
    const html = renderToStaticMarkup(<GallerySection />);

    expect(html).toContain(
      'src="/assets/uploads/gallery-durga-pujo-2025-07.jpg"'
    );
  });
});

describe("event presentation", () => {
  it("formats a configured range and its individual days in British style", () => {
    expect(formatEventDateRange("2026-10-17", "2026-10-20")).toBe(
      "17–20 October 2026"
    );
    expect(formatEventDays("2026-10-17", "2026-10-20")).toBe(
      "Sat 17, Sun 18, Mon 19, Tue 20 October"
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
          venue: {
            name: "First venue",
            address: "First address",
            coordinates: { lat: 1, lng: 1 },
          },
          image: "/first.jpg",
        },
        {
          id: "second-event",
          name: "Second event",
          description: "Second event description",
          date: { type: "single", start: "2026-02-01" },
          venue: {
            name: "Second venue",
            address: "Second address",
            coordinates: { lat: 2, lng: 2 },
          },
          image: "/second.jpg",
        },
      ],
    });

    expect(selected).toMatchObject({
      id: "second-event",
      name: "Second event",
    });
  });
});

describe("site navigation", () => {
  it("uses CMS labels without making internal routes editable", () => {
    const navbar = renderToStaticMarkup(<Navbar />);

    expect(navbar).toContain(siteContent.navigation.events.label);
    expect(navbar).toContain('href="/#events"');
  });

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
