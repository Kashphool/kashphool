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
import {
  formatEventDay,
  formatEventDate,
  formatEventDateRange,
  formatEventTime,
  formatEventTimeRange,
  formatEventWeekday,
} from "@/lib/eventPresentation";
import { getNextEvent } from "@/lib/eventData";
import {
  eventsContent,
  siteContent,
  sponsorPageContent,
  sponsorsContent,
} from "@/content";
import { getVideoMimeType } from "@/lib/mediaPresentation";
import type { Sponsor } from "@/types";

const featuredEvent = getNextEvent(eventsContent);

const eventTypeIcons = {
  sparkles: Sparkles,
  music: Music2,
  users: Users,
} as const;

function SponsorLogoCard({ sponsor }: { sponsor: Sponsor }) {
  return (
    <>
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
    </>
  );
}

export default function Sponsors() {
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryTier, setEnquiryTier] = useState<string | null>(null);
  const bespokeHeadingParts =
    sponsorPageContent.bespoke.heading.split(/ (?!.* )/);
  const optionalStallStarts =
    featuredEvent.stallOpeningHours?.filter(hours => hours.optionalStart) ?? [];
  const optionalStart = optionalStallStarts[0]?.optionalStart;
  const optionalStartDays = new Intl.ListFormat("en-GB", {
    style: "long",
    type: "conjunction",
  }).format(optionalStallStarts.map(hours => formatEventWeekday(hours.date)));
  const selectedTierDetails =
    sponsorPageContent.tiers.find(tier => tier.name === enquiryTier) ?? null;

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
            poster="/images/hero-bg.jpeg"
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/images/hero-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/85 to-charcoal/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-charcoal/40" />
          <div className="container relative z-10 flex min-h-[calc(78vh-5rem)] items-center py-20">
            <div className="max-w-3xl">
              <span className="text-saffron text-sm font-semibold tracking-[0.3em] uppercase">
                {sponsorPageContent.hero.eyebrow}
              </span>
              <h1 className="font-[var(--font-display)] text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mt-5 mb-7">
                {sponsorPageContent.hero.headingPrefix}{" "}
                <span className="text-gold-gradient">
                  {sponsorPageContent.hero.headingAccent}
                </span>
              </h1>
              <p className="max-w-2xl text-lg md:text-xl leading-relaxed text-ivory/70">
                {sponsorPageContent.hero.description}
              </p>
              <button
                type="button"
                onClick={() => openEnquiry(null)}
                className="mt-9 inline-flex items-center gap-2 rounded bg-gradient-to-r from-saffron to-gold px-7 py-3.5 font-semibold text-charcoal transition-transform hover:scale-[1.02]"
              >
                {sponsorPageContent.hero.cta}{" "}
                <ArrowRight aria-hidden="true" size={18} />
              </button>
            </div>
          </div>
        </section>

        <section className="relative z-20 -mt-px border-y border-gold/10 bg-charcoal-light/80">
          <div className="container grid grid-cols-2 divide-x divide-y divide-gold/10 md:grid-cols-4 md:divide-y-0">
            {sponsorPageContent.highlights.map(highlight => (
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
                {sponsorPageContent.tiersSection.eyebrow}
              </span>
              <h2 className="mt-3 text-4xl md:text-6xl font-bold">
                {sponsorPageContent.tiersSection.headingPrefix}{" "}
                <span className="text-gold-gradient">
                  {sponsorPageContent.tiersSection.headingAccent}
                </span>
              </h2>
              <p className="mt-5 text-lg text-ivory/55">
                {sponsorPageContent.tiersSection.intro}
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {sponsorPageContent.tiers.map(tier => (
                <article
                  key={tier.name}
                  className={`relative flex flex-col rounded-sm border p-7 ${tier.featured ? "border-saffron/60 bg-gradient-to-b from-gold/12 to-charcoal-light/60 shadow-xl shadow-saffron/5" : "border-gold/10 bg-charcoal-light/45"}`}
                >
                  {tier.featured && (
                    <span className="absolute right-5 top-0 -translate-y-1/2 rounded-full bg-saffron px-3 py-1 text-xs font-bold uppercase tracking-wide text-charcoal">
                      {tier.badge}
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
                      {tier.enquiryLabel}{" "}
                      <ArrowRight aria-hidden="true" size={16} />
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
                {sponsorPageContent.bespoke.cta}
              </span>
              <h2 className="mt-3 text-4xl font-bold md:text-6xl">
                {bespokeHeadingParts[0]}{" "}
                <span className="text-gold-gradient">
                  {bespokeHeadingParts[1]}
                </span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-ivory/55">
                {sponsorPageContent.bespoke.intro}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {sponsorPageContent.bespoke.possibilities.map(possibility => (
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
                {sponsorPageContent.eventInfo.eyebrow}
              </span>
              <h2 className="mt-3 text-4xl font-bold md:text-5xl">
                <span className="block">{featuredEvent.name}:</span>{" "}
                <span className="mt-1 block text-gold-gradient">
                  {sponsorPageContent.eventInfo.headingSuffix}
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
                  {sponsorPageContent.eventInfo.datesLabel}
                </h3>
                <p className="mt-2 text-ivory/65">
                  {featuredEvent.date.type === "range" && featuredEvent.date.end
                    ? formatEventDateRange(
                        featuredEvent.date.start,
                        featuredEvent.date.end
                      )
                    : formatEventDate(featuredEvent.date.start)}
                </p>
              </div>
              <div className="rounded-sm border border-gold/10 bg-charcoal/55 p-5">
                <MapPin aria-hidden="true" className="text-saffron" size={20} />
                <h3 className="mt-4 font-semibold text-ivory/90">
                  {sponsorPageContent.eventInfo.venueLabel}
                </h3>
                {featuredEvent.venue.googleMapsUrl ? (
                  <a
                    href={featuredEvent.venue.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-ivory/65 underline decoration-gold/30 hover:text-saffron"
                  >
                    {featuredEvent.venue.name}, {featuredEvent.venue.address}
                  </a>
                ) : (
                  <p className="mt-2 text-ivory/65">
                    {featuredEvent.venue.name}, {featuredEvent.venue.address}
                  </p>
                )}
              </div>
              <div className="rounded-sm border border-gold/10 bg-charcoal/55 p-5">
                <Clock3 aria-hidden="true" className="text-saffron" size={20} />
                <h3 className="mt-4 font-semibold text-ivory/90">
                  {sponsorPageContent.eventInfo.stallHoursLabel}
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
                            hours.optionalStart
                              ? "optional-stall-start"
                              : undefined
                          }
                        >
                          {formatEventTimeRange(hours.start, hours.end)}
                          {hours.optionalStart && (
                            <sup
                              aria-hidden="true"
                              className="ml-0.5 text-saffron"
                            >
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
                        <span className="text-saffron">*</span>{" "}
                        {sponsorPageContent.eventInfo.optionalStartPrefix}{" "}
                        {formatEventTime(optionalStart)} on {optionalStartDays}.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-ivory/65">
                    {sponsorPageContent.eventInfo.stallHoursFallback}
                  </p>
                )}
              </div>
              <div className="rounded-sm border border-gold/10 bg-charcoal/55 p-5 sm:col-span-2 lg:col-span-3">
                <Mail aria-hidden="true" className="text-saffron" size={20} />
                <h3 className="mt-4 font-semibold text-ivory/90">
                  {sponsorPageContent.eventInfo.emailLabel}
                </h3>
                <a
                  href={`mailto:${siteContent.footer.email}`}
                  className="mt-2 inline-block text-ivory/65 underline decoration-gold/30 hover:text-saffron"
                >
                  {siteContent.footer.email}
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
                {featuredEvent.venue.googleMapsUrl && (
                  <a
                    href={featuredEvent.venue.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-saffron hover:text-gold"
                  >
                    {sponsorPageContent.eventInfo.mapLinkLabel}{" "}
                    <ArrowRight aria-hidden="true" size={15} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-gold/10 py-20 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase">
                {sponsorPageContent.sponsors.eyebrow}
              </span>
              <h2 className="mt-3 text-4xl font-bold md:text-5xl">
                <span className="text-gold-gradient">
                  {sponsorPageContent.sponsors.heading}
                </span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-ivory/55">
                {sponsorPageContent.sponsors.intro}
              </p>
            </div>
            <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-6">
              {sponsorsContent.sponsors.map(sponsor =>
                sponsor.website ? (
                  <a
                    key={sponsor.id}
                    href={sponsor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group w-52 rounded-sm border border-gold/10 bg-charcoal-light/45 p-5 text-center transition-all hover:-translate-y-1 hover:border-gold/30 hover:shadow-xl hover:shadow-black/20"
                  >
                    <SponsorLogoCard sponsor={sponsor} />
                  </a>
                ) : (
                  <div
                    key={sponsor.id}
                    className="group w-52 rounded-sm border border-gold/10 bg-charcoal-light/45 p-5 text-center"
                  >
                    <SponsorLogoCard sponsor={sponsor} />
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <MediaCoverageSection />

        <section className="border-y border-gold/10 bg-charcoal-light/25 py-24 md:py-32">
          <div className="container">
            <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase">
                  {sponsorPageContent.pastCelebrations.eyebrow}
                </span>
                <h2 className="mt-3 text-4xl md:text-6xl font-bold">
                  {sponsorPageContent.pastCelebrations.headingPrefix}{" "}
                  <span className="text-gold-gradient">
                    {sponsorPageContent.pastCelebrations.headingAccent}
                  </span>
                </h2>
              </div>
              <p className="max-w-lg text-ivory/50 md:text-right">
                {sponsorPageContent.pastCelebrations.intro}
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-sm border border-gold/10 bg-black">
                <video
                  controls
                  playsInline
                  poster={sponsorPageContent.pastCelebrations.poster}
                  className="aspect-video h-full w-full object-cover"
                >
                  <source
                    src={sponsorPageContent.pastCelebrations.video}
                    type={getVideoMimeType(
                      sponsorPageContent.pastCelebrations.video
                    )}
                  />
                  Your browser does not support video playback.
                </video>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-2">
                {sponsorPageContent.pastCelebrations.photos
                  .slice(0, 4)
                  .map(photo => (
                    <img
                      key={photo.image}
                      src={photo.image}
                      alt={photo.alt}
                      title={photo.caption}
                      loading="lazy"
                      className="aspect-video h-full w-full rounded-sm border border-gold/10 object-cover"
                    />
                  ))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {sponsorPageContent.pastCelebrations.photos
                .slice(4)
                .map(photo => (
                  <img
                    key={`strip-${photo.image}`}
                    src={photo.image}
                    alt={photo.alt}
                    title={photo.caption}
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
                {sponsorPageContent.eventTypesSection.eyebrow}
              </span>
              <h2 className="mt-3 text-4xl md:text-6xl font-bold">
                {sponsorPageContent.eventTypesSection.headingPrefix}{" "}
                <span className="text-gold-gradient">
                  {sponsorPageContent.eventTypesSection.headingAccent}
                </span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-ivory/55">
                {sponsorPageContent.eventTypesSection.intro}
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {sponsorPageContent.eventTypes.map(
                ({ icon, title, description }) => {
                  const Icon = eventTypeIcons[icon];

                  return (
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
                  );
                }
              )}
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
              {sponsorPageContent.finalCta.headingPrefix}{" "}
              <span className="text-gold-gradient">
                {sponsorPageContent.finalCta.headingAccent}
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ivory/60">
              {sponsorPageContent.finalCta.description}
            </p>
            <button
              type="button"
              onClick={() => openEnquiry(null)}
              className="mt-8 inline-flex items-center gap-2 rounded bg-gradient-to-r from-saffron to-gold px-7 py-3.5 font-semibold text-charcoal transition-transform hover:scale-[1.02]"
            >
              <Heart aria-hidden="true" size={18} />{" "}
              {sponsorPageContent.finalCta.button}
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
