import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import SponsorEnquiryModal from "@/components/sponsors/SponsorEnquiryModal";
import MediaCoverageSection from "@/components/sections/MediaCoverageSection";
import {
  ArrowRight,
  Calendar,
  Check,
  Clock3,
  Handshake,
  Heart,
  Mail,
  MapPin,
  Music2,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { EventCollection } from "@/types";
import {
  formatEventDay,
  formatEventDateRange,
  formatEventTime,
  formatEventTimeRange,
  formatEventWeekday,
} from "@/lib/eventPresentation";
import { getNextEvent } from "@/lib/eventData";
import eventData from "../../public/data/events.json";
import sponsors from "../../public/data/sponsors.json";

const featuredEvent = getNextEvent(eventData as EventCollection);

const sponsorPhotos = Array.from(
  { length: 6 },
  (_, index) => `/sponsors/media/photos/2025_${index + 1}.jpg`,
);

const eventTypes = [
  {
    icon: Sparkles,
    title: "Durga Pujo",
    description: "Our flagship celebration brings together worship, performance, food and a warm community welcome.",
  },
  {
    icon: Music2,
    title: "Cultural programmes",
    description: "Music, dance and creative performances give local talent a stage and Bengali traditions a living voice.",
  },
  {
    icon: Users,
    title: "Community gatherings",
    description: "Inclusive social events help families, neighbours and generations form lasting connections across North Kent.",
  },
];

const tiers = [
  {
    name: "Coupon Sponsor",
    guide: "£100",
    description: "Your branding will feature on approximately 1,500 complimentary lunch and dinner coupons distributed to visitors across the four-day celebration.",
    benefits: ["Visible branding on complimentary lunch and dinner coupons"],
  },
  {
    name: "Banner Sponsor",
    guide: "£250",
    description: "Build consistent visibility for your organisation throughout the celebration.",
    benefits: ["High visibility across the venue"],
  },
  {
    name: "Title Sponsor",
    guide: "£800",
    description: "Take the leading sponsorship position for Kashphool's 2026 Durga Pujo.",
    benefits: [
      "Premium venue branding",
      "Stage acknowledgements",
      "Prominent digital and social-media inclusion",
      "Sponsor spotlight",
      "Flyer and QR-code distribution",
      "Promotional stall",
      "Potential category exclusivity, subject to agreement",
    ],
    featured: true,
  },
  {
    name: "Event Stalls",
    guide: "£200",
    guidePrefix: "Starting from",
    guideSuffix: "for all four days",
    description: "Meet visitors in person and bring your food, products, services or organisation into the heart of the four-day celebration.",
    benefits: ["A dedicated venue space to showcase your brand, promote your services or sell your products."],
  },
];

const eventHighlights = [
  { value: "1,000+", label: "Visitors last year" },
  { value: "North Kent's", label: "Biggest Durga Pujo" },
  { value: "4 days", label: "Of event visibility" },
  { value: "Wide reach", label: "Bengali and UK media coverage" },
];

const bespokePossibilities = [
  "Prominent branding across the venue over all four days",
  "Stage acknowledgements during cultural programmes",
  "Inclusion in our digital and social-media promotion",
  "A dedicated promotional or information presence at the event",
  "Distribution of QR codes, offers, subscriptions or service-related promotional material",
  "Branding on complimentary lunch and dinner coupons distributed to visitors",
];

export default function Sponsors() {
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryTier, setEnquiryTier] = useState<string | null>(null);
  const optionalStallStarts =
    featuredEvent.stallOpeningHours?.filter(hours => hours.optionalStart) ?? [];
  const optionalStart = optionalStallStarts[0]?.optionalStart;
  const optionalStartDays = new Intl.ListFormat("en-GB", {
    style: "long",
    type: "conjunction",
  }).format(optionalStallStarts.map(hours => formatEventWeekday(hours.date)));
  const selectedTierDetails = tiers.find(tier => tier.name === enquiryTier) ?? null;

  const openEnquiry = (tier: string | null) => {
    setEnquiryTier(tier);
    setEnquiryOpen(true);
  };

  return (
    <div className="min-h-screen bg-charcoal text-ivory">
      <Navbar />
      <main>
        <section className="relative min-h-[78vh] overflow-hidden pt-16 md:pt-20">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/sponsors/media/photos/2025_1.jpg"
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/sponsors/media/videos/hero-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/85 to-charcoal/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-charcoal/40" />
          <div className="container relative z-10 flex min-h-[calc(78vh-5rem)] items-center py-20">
            <div className="max-w-3xl">
              <span className="text-saffron text-sm font-semibold tracking-[0.3em] uppercase">
                Grow with our community
              </span>
              <h1 className="font-[var(--font-display)] text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mt-5 mb-7">
                Partner with{" "}
                <span className="text-gold-gradient">Kashphool</span>
              </h1>
              <p className="max-w-2xl text-lg md:text-xl leading-relaxed text-ivory/70">
                Help us create joyful, inclusive cultural experiences while
                introducing your organisation to families and communities across
                North Kent.
              </p>
              <button
                type="button"
                onClick={() => openEnquiry(null)}
                className="mt-9 inline-flex items-center gap-2 rounded bg-gradient-to-r from-saffron to-gold px-7 py-3.5 font-semibold text-charcoal transition-transform hover:scale-[1.02]"
              >
                Start a conversation <ArrowRight aria-hidden="true" size={18} />
              </button>
            </div>
          </div>
        </section>

        <section className="relative z-20 -mt-px border-y border-gold/10 bg-charcoal-light/80">
          <div className="container grid grid-cols-2 divide-x divide-y divide-gold/10 md:grid-cols-4 md:divide-y-0">
            {eventHighlights.map(highlight => (
              <div
                key={highlight.label}
                className="px-4 py-7 text-center md:px-6 md:py-9"
              >
                <p className="font-[var(--font-display)] text-2xl font-bold text-gold md:text-3xl">
                  {highlight.value}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-ivory/45">
                  {highlight.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-24 md:py-32">
          <div className="container">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <span className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase">
                Ways to partner
              </span>
              <h2 className="mt-3 text-4xl md:text-6xl font-bold">
                Sponsorship <span className="text-gold-gradient">tiers</span>
              </h2>
              <p className="mt-5 text-lg text-ivory/55">
                Choose a clear package or speak with us about shaping a bespoke
                partnership around your goals.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {tiers.map(tier => (
                <article
                  key={tier.name}
                  className={`relative flex flex-col rounded-sm border p-7 ${tier.featured ? "border-saffron/60 bg-gradient-to-b from-gold/12 to-charcoal-light/60 shadow-xl shadow-saffron/5" : "border-gold/10 bg-charcoal-light/45"}`}
                >
                  {tier.featured && (
                    <span className="absolute right-5 top-0 -translate-y-1/2 rounded-full bg-saffron px-3 py-1 text-xs font-bold uppercase tracking-wide text-charcoal">
                      Premium
                    </span>
                  )}
                  {tier.guidePrefix && (
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-ivory/45">
                      {tier.guidePrefix}
                    </p>
                  )}
                  {tier.guideSuffix ? (
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-saffron/80">
                        {tier.guide}
                      </p>
                      <p className="text-xs font-medium tracking-[0.14em] text-ivory/45">
                        {tier.guideSuffix}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-saffron/80">
                      {tier.guide}
                    </p>
                  )}
                  <h3 className="mt-3 text-2xl font-semibold text-ivory/95">
                    {tier.name}
                  </h3>
                  <p className="mt-4 min-h-20 leading-relaxed text-ivory/50">
                    {tier.description}
                  </p>
                  <ul className="mt-6 space-y-3 border-t border-gold/10 pt-6">
                    {tier.benefits.map(benefit => (
                      <li
                        key={benefit}
                        className="flex gap-3 text-sm leading-relaxed text-ivory/65"
                      >
                        <Check
                          aria-hidden="true"
                          size={17}
                          className="mt-0.5 shrink-0 text-saffron"
                        />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-8">
                    <button
                      type="button"
                      onClick={() => openEnquiry(tier.name)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded border border-gold/30 px-4 py-3 text-sm font-semibold text-gold transition-colors hover:bg-gold/10"
                    >
                      Enquire <ArrowRight aria-hidden="true" size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-gold/10 bg-charcoal-light/25 py-24 md:py-28">
          <div className="container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="max-w-xl">
              <span className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase">
                Tailored to your goals
              </span>
              <h2 className="mt-3 text-4xl font-bold md:text-6xl">
                Bespoke partnership{" "}
                <span className="text-gold-gradient">possibilities</span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-ivory/55">
                Depending on the agreed partnership level, we can combine
                selected opportunities into a package that supports your
                objectives.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {bespokePossibilities.map(possibility => (
                <div
                  key={possibility}
                  className="flex gap-4 rounded-sm border border-gold/10 bg-charcoal/55 p-5 text-ivory/70"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/10 text-saffron">
                    <Check aria-hidden="true" size={16} />
                  </div>
                  <p className="leading-relaxed">{possibility}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-gold/10 bg-charcoal-light/25 py-20 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase">
                Upcoming event
              </span>
              <h2 className="mt-3 text-4xl font-bold md:text-5xl">
                <span className="block">{featuredEvent.name}:</span>{" "}
                <span className="mt-1 block text-gold-gradient">
                  event &amp; stall information
                </span>
              </h2>
            </div>
            <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-sm border border-gold/10 bg-charcoal/55 p-5">
                <Calendar
                  aria-hidden="true"
                  className="text-saffron"
                  size={20}
                />
                <h3 className="mt-4 font-semibold text-ivory/90">
                  Event dates
                </h3>
                <p className="mt-2 text-ivory/65">
                  {formatEventDateRange(
                    featuredEvent.date.start,
                    featuredEvent.date.end!
                  )}
                </p>
              </div>
              <div className="rounded-sm border border-gold/10 bg-charcoal/55 p-5">
                <MapPin aria-hidden="true" className="text-saffron" size={20} />
                <h3 className="mt-4 font-semibold text-ivory/90">Venue</h3>
                <a
                  href={featuredEvent.venue.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-ivory/65 underline decoration-gold/30 hover:text-saffron"
                >
                  {featuredEvent.venue.name}, {featuredEvent.venue.address}
                </a>
              </div>
              <div className="rounded-sm border border-gold/10 bg-charcoal/55 p-5">
                <Clock3 aria-hidden="true" className="text-saffron" size={20} />
                <h3 className="mt-4 font-semibold text-ivory/90">
                  Stall opening hours
                </h3>
                {featuredEvent.stallOpeningHours?.length ? (
                  <div className="mt-2 space-y-2 text-sm">
                    {featuredEvent.stallOpeningHours.map(hours => (
                      <div
                        key={hours.date}
                        className="flex items-baseline justify-between gap-4 text-ivory/65"
                      >
                        <span>{formatEventDay(hours.date)}</span>
                        <span
                          className="shrink-0 text-ivory/45"
                          aria-describedby={
                            hours.optionalStart ? "optional-stall-start" : undefined
                          }
                        >
                          {formatEventTimeRange(hours.start, hours.end)}
                          {hours.optionalStart && (
                            <sup aria-hidden="true" className="ml-0.5 text-saffron">
                              *
                            </sup>
                          )}
                        </span>
                      </div>
                    ))}
                    {optionalStart && (
                      <p
                        id="optional-stall-start"
                        className="border-t border-gold/10 pt-2 text-xs leading-relaxed text-ivory/50"
                      >
                        <span className="text-saffron">*</span> Optional start from{" "}
                        {formatEventTime(optionalStart)} on{" "}
                        {optionalStartDays}.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-ivory/65">To be confirmed</p>
                )}
              </div>
              <div className="rounded-sm border border-gold/10 bg-charcoal/55 p-5 sm:col-span-2 lg:col-span-3">
                <Mail aria-hidden="true" className="text-saffron" size={20} />
                <h3 className="mt-4 font-semibold text-ivory/90">Contact</h3>
                <a
                  href="mailto:info@kashphool.co.uk"
                  className="mt-2 inline-block text-ivory/65 underline decoration-gold/30 hover:text-saffron"
                >
                  info@kashphool.co.uk
                </a>
              </div>
            </div>
            <div className="mx-auto mt-4 max-w-5xl overflow-hidden rounded-sm border border-gold/10 bg-charcoal/55">
              <iframe
                title={`Map showing ${featuredEvent.venue.name}`}
                src={`https://www.google.com/maps?q=${featuredEvent.venue.coordinates.lat},${featuredEvent.venue.coordinates.lng}&z=15&output=embed`}
                className="h-80 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="flex flex-col gap-3 border-t border-gold/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-ivory/55">
                  {featuredEvent.venue.name}, {featuredEvent.venue.address}
                </p>
                <a
                  href={featuredEvent.venue.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-saffron hover:text-gold"
                >
                  Open in Google Maps{" "}
                  <ArrowRight aria-hidden="true" size={15} />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-gold/10 py-20 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase">
                Our Partners &
              </span>
              <h2 className="mt-3 text-4xl font-bold md:text-5xl">
                <span className="text-gold-gradient">Sponsors</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-ivory/55">
                We are grateful to the organisations whose support helps us
                bring our community celebrations to life.
              </p>
            </div>
            <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-6">
              {sponsors.map(sponsor => (
                <a
                  key={sponsor.id}
                  href={sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-52 rounded-sm border border-gold/10 bg-charcoal-light/45 p-5 text-center transition-all hover:-translate-y-1 hover:border-gold/30 hover:shadow-xl hover:shadow-black/20"
                >
                  <div className="flex aspect-[4/3] items-center justify-center rounded-sm bg-ivory/95 p-4">
                    <img
                      src={sponsor.logo}
                      alt={sponsor.name}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="mt-4 font-semibold text-ivory/80 transition-colors group-hover:text-gold">
                    {sponsor.name}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <MediaCoverageSection />

        <section className="border-y border-gold/10 bg-charcoal-light/25 py-24 md:py-32">
          <div className="container">
            <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase">
                  Past celebrations
                </span>
                <h2 className="mt-3 text-4xl md:text-6xl font-bold">
                  See the <span className="text-gold-gradient">experience</span>
                </h2>
              </div>
              <p className="max-w-lg text-ivory/50 md:text-right">
                A glimpse of the colour, devotion and togetherness that our
                partners help make possible.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-sm border border-gold/10 bg-black">
                <video
                  controls
                  playsInline
                  poster="/sponsors/media/photos/2025_1.jpg"
                  className="aspect-video h-full w-full object-cover"
                >
                  <source
                    src="/sponsors/media/videos/hero-bg.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support video playback.
                </video>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-2">
                {sponsorPhotos.slice(0, 4).map((photo, index) => (
                  <img
                    key={photo}
                    src={photo}
                    alt={`Kashphool Durga Pujo celebration ${index + 1}`}
                    loading="lazy"
                    className="aspect-video h-full w-full rounded-sm border border-gold/10 object-cover"
                  />
                ))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {sponsorPhotos.map((photo, index) => (
                <img
                  key={`strip-${photo}`}
                  src={photo}
                  alt={`Community celebration moment ${index + 1}`}
                  loading="lazy"
                  className="aspect-square w-full rounded-sm border border-gold/10 object-cover"
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 md:py-32">
          <div className="container">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <span className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase">
                What we create
              </span>
              <h2 className="mt-3 text-4xl md:text-6xl font-bold">
                Events with <span className="text-gold-gradient">heart</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-ivory/55">
                Our events celebrate heritage, nurture local talent and build
                meaningful connections.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {eventTypes.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="group border border-gold/10 bg-charcoal-light/45 p-7 transition-all hover:-translate-y-1 hover:border-gold/30 hover:shadow-xl hover:shadow-black/20 md:p-8"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/10 text-saffron">
                    <Icon aria-hidden="true" size={22} />
                  </div>
                  <h3 className="text-2xl font-semibold text-ivory/90">
                    {title}
                  </h3>
                  <p className="mt-4 leading-relaxed text-ivory/50">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-gold/10 py-24">
          <div className="absolute inset-0 bg-gradient-to-r from-vermillion/15 via-gold/10 to-saffron/15" />
          <div className="container relative z-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-charcoal/50 text-saffron">
              <Handshake aria-hidden="true" size={26} />
            </div>
            <h2 className="mt-6 text-4xl md:text-6xl font-bold">
              Let’s create something{" "}
              <span className="text-gold-gradient">meaningful</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ivory/60">
              Tell us what matters to your organisation. We’ll explore a
              partnership that feels authentic, useful and memorable.
            </p>
            <button
              type="button"
              onClick={() => openEnquiry(null)}
              className="mt-8 inline-flex items-center gap-2 rounded bg-gradient-to-r from-saffron to-gold px-7 py-3.5 font-semibold text-charcoal transition-transform hover:scale-[1.02]"
            >
              <Heart aria-hidden="true" size={18} /> Contact our team
            </button>
          </div>
        </section>
      </main>
      <Footer />
      <SponsorEnquiryModal
        open={enquiryOpen}
        tier={enquiryTier}
        tierDetails={selectedTierDetails}
        onOpenChange={setEnquiryOpen}
      />
    </div>
  );
}
