import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { privacyPageContent } from "@/content";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-charcoal text-ivory">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-gold/10 pb-14 pt-32 md:pb-20 md:pt-40">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-charcoal-light via-charcoal to-charcoal" />
          <div className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full border border-gold/10" />
          <div className="container relative z-10">
            <div className="max-w-3xl">
              <span className="text-sm font-medium uppercase tracking-[0.3em] text-saffron/80">
                {privacyPageContent.eyebrow}
              </span>
              <h1 className="mt-4 font-[var(--font-display)] text-5xl font-bold text-gold-gradient md:text-7xl">
                {privacyPageContent.heading}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ivory/60 md:text-xl">
                {privacyPageContent.intro}
              </p>
              <p className="mt-5 text-sm text-ivory/40">
                Last updated: {privacyPageContent.lastUpdated}
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="container max-w-4xl space-y-6">
            {privacyPageContent.sections.map(section => (
              <article
                key={section.heading}
                className="rounded-sm border border-gold/15 bg-charcoal-light/45 p-6 md:p-8"
              >
                <h2 className="font-[var(--font-display)] text-2xl font-semibold text-gold md:text-3xl">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4 text-base leading-relaxed text-ivory/65">
                  {section.paragraphs.map(paragraph => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}

            <article className="rounded-sm border border-saffron/25 bg-saffron/5 p-6 md:p-8">
              <h2 className="font-[var(--font-display)] text-2xl font-semibold text-gold md:text-3xl">
                {privacyPageContent.contactHeading}
              </h2>
              <p className="mt-4 leading-relaxed text-ivory/65">
                {privacyPageContent.contactText}{" "}
                <a
                  href={`mailto:${privacyPageContent.contactEmail}`}
                  className="font-semibold text-saffron underline underline-offset-4"
                >
                  {privacyPageContent.contactEmail}
                </a>
                .
              </p>
              <p className="mt-4 leading-relaxed text-ivory/65">
                {privacyPageContent.icoText}{" "}
                <a
                  href={privacyPageContent.icoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-saffron underline underline-offset-4"
                >
                  {privacyPageContent.icoUrl}
                </a>
              </p>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
