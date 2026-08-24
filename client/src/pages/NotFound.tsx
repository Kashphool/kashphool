import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { IMAGES } from "@/config";
import { ArrowLeft, Mail } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen overflow-hidden bg-charcoal text-ivory">
      <Navbar />

      <main className="relative flex min-h-screen items-center overflow-hidden px-4 pb-20 pt-28 md:px-8 md:pt-32">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.055]"
          style={{ backgroundImage: `url(${IMAGES.MANDALA})` }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-saffron/10 blur-[110px]" />

        <div className="container relative z-10 grid items-center gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20 xl:grid-cols-[0.72fr_1.28fr]">
          <div className="relative mx-auto flex h-64 w-full max-w-xl items-center justify-center sm:h-80 lg:h-96 xl:h-[28rem]">
            <div className="absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-gold/25 sm:h-72 sm:w-72 lg:h-80 lg:w-80 xl:h-[22rem] xl:w-[22rem]" />
            <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-full border-t border-r border-gold/35 sm:h-64 sm:w-64 lg:h-72 lg:w-72 xl:h-80 xl:w-80" />
            <div className="absolute left-[13%] top-[21%] h-3 w-3 rotate-45 border border-saffron/50 bg-charcoal sm:left-[17%]" />
            <div className="absolute bottom-[19%] right-[12%] h-2.5 w-2.5 rotate-45 bg-gold/60 sm:right-[17%]" />

            <div className="relative flex items-center justify-center" aria-label="Error 404">
              <span aria-hidden="true" className="font-[var(--font-display)] text-[8rem] font-bold leading-none text-gold-gradient sm:text-[11rem] lg:text-[13rem] xl:text-[15rem]">4</span>
              <div aria-hidden="true" className="relative -mx-2 flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-charcoal-light p-2 shadow-2xl shadow-saffron/15 sm:-mx-3 sm:h-32 sm:w-32 sm:p-3 lg:h-36 lg:w-36 xl:h-40 xl:w-40">
                <div className="absolute inset-1 rounded-full border border-dashed border-gold/25" />
                <img src={IMAGES.LOGO} alt="" className="relative h-full w-full rounded-full object-contain" />
              </div>
              <span aria-hidden="true" className="font-[var(--font-display)] text-[8rem] font-bold leading-none text-gold-gradient sm:text-[11rem] lg:text-[13rem] xl:text-[15rem]">4</span>
            </div>
          </div>

          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:pl-10 lg:text-left xl:pl-16">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-saffron/80">A path went missing</span>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl font-bold leading-tight md:text-6xl">
              This page has <span className="text-gold-gradient">wandered</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ivory/55">
              The page you were looking for may have moved, changed its name, or taken a different path. Let us help you find your way back.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <a href="/" className="inline-flex items-center justify-center gap-2 rounded bg-gradient-to-r from-saffron to-gold px-7 py-3.5 font-semibold text-charcoal transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-saffron/20">
                <ArrowLeft aria-hidden="true" size={18} /> Return Home
              </a>
              <a href="/#contact" className="inline-flex items-center justify-center gap-2 rounded border border-gold/30 px-7 py-3.5 font-semibold text-gold transition-colors hover:bg-gold/10">
                <Mail aria-hidden="true" size={18} /> Contact Us
              </a>
            </div>

            <div className="mt-12 flex items-center justify-center gap-4 text-xs uppercase tracking-[0.2em] text-ivory/25 lg:justify-start">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold/35" />
              Kashphool · North Kent
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold/35" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
