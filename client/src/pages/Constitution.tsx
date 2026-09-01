import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { constitutionPageContent } from "@/content";
import { Download, ExternalLink, FileText } from "lucide-react";

export default function Constitution() {
  return (
    <div className="min-h-screen bg-charcoal text-ivory">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-gold/10 pt-32 pb-14 md:pt-40 md:pb-20">
          <div className="absolute inset-0 bg-gradient-to-br from-charcoal-light via-charcoal to-charcoal pointer-events-none" />
          <div className="absolute -right-24 -top-36 h-96 w-96 rounded-full border border-gold/10 pointer-events-none" />
          <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border border-saffron/10 pointer-events-none" />
          <div className="container relative z-10">
            <div className="max-w-3xl">
              <span className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase">
                {constitutionPageContent.eyebrow}
              </span>
              <h1 className="font-[var(--font-display)] text-5xl md:text-7xl font-bold mt-4 mb-6">
                {constitutionPageContent.headingPrefix}{" "}
                <span className="text-gold-gradient">
                  {constitutionPageContent.headingAccent}
                </span>
              </h1>
              <p className="max-w-2xl text-lg md:text-xl leading-relaxed text-ivory/60">
                {constitutionPageContent.intro}
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="container">
            <div className="mb-6 flex flex-col gap-5 rounded-sm border border-gold/15 bg-charcoal-light/50 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 text-saffron">
                  <FileText aria-hidden="true" size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-ivory/90">
                    {constitutionPageContent.documentTitle}
                  </h2>
                  <p className="mt-1 text-sm text-ivory/45">
                    {constitutionPageContent.documentDescription}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={constitutionPageContent.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded border border-gold/30 px-4 py-2.5 text-sm font-semibold text-gold transition-colors hover:bg-gold/10"
                >
                  <ExternalLink aria-hidden="true" size={16} />{" "}
                  {constitutionPageContent.openLabel}
                </a>
                <a
                  href={constitutionPageContent.pdf}
                  download
                  className="inline-flex items-center gap-2 rounded bg-gradient-to-r from-saffron to-gold px-4 py-2.5 text-sm font-semibold text-charcoal transition-transform hover:scale-[1.02]"
                >
                  <Download aria-hidden="true" size={16} />{" "}
                  {constitutionPageContent.downloadLabel}
                </a>
              </div>
            </div>

            <div className="overflow-hidden rounded-sm border border-gold/15 bg-charcoal-light shadow-2xl shadow-black/20">
              <object
                data={constitutionPageContent.pdf}
                type="application/pdf"
                aria-label="Kashphool constitution PDF"
                className="h-[70vh] min-h-[560px] w-full bg-ivory"
              >
                <div className="flex min-h-[560px] flex-col items-center justify-center p-8 text-center text-charcoal">
                  <FileText aria-hidden="true" size={44} />
                  <p className="mt-5 max-w-md text-lg font-semibold">
                    {constitutionPageContent.fallback}
                  </p>
                  <a
                    href={constitutionPageContent.pdf}
                    className="mt-4 font-semibold text-vermillion underline"
                  >
                    {constitutionPageContent.fallbackLinkLabel}
                  </a>
                </div>
              </object>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
