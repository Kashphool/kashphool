/*
  DESIGN: Sacred Geometry Modernism
  - Asymmetric two-column layout: text left, image right
  - Alpona pattern as subtle background texture
  - Gold accent lines and decorative borders
  - Fade-up animations on scroll
*/

import { useInView } from "@/hooks/useInView";
import { IMAGES } from "@/config";
import { homePageContent } from "@/content";

export default function AboutSection() {
  const { ref, isInView } = useInView();
  const { ref: ref2, isInView: isInView2 } = useInView();

  return (
    <section id="about" className="relative py-24 md:py-32 overflow-hidden">
      {/* Subtle Alpona pattern background */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <img
          src={IMAGES.ALPONA}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="container relative z-10">
        {/* Section Header */}
        <div ref={ref} className="mb-16">
          <div
            className={`transition-all duration-700 ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase">
              {homePageContent.about.eyebrow}
            </span>
            <h2 className="font-[var(--font-display)] text-4xl md:text-5xl lg:text-6xl font-bold mt-3 mb-4">
              <span className="text-gold-gradient">
                {homePageContent.about.heading}
              </span>
            </h2>
            <div className="h-[2px] w-20 bg-gradient-to-r from-saffron to-transparent" />
          </div>
        </div>

        {/* Content Grid - Asymmetric */}
        <div
          ref={ref2}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center"
        >
          {/* Text Content - Takes 7 columns */}
          <div
            className={`lg:col-span-7 space-y-6 transition-all duration-700 delay-200 ${
              isInView2
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            {homePageContent.about.paragraphs.map((paragraph, index) => (
              <p
                key={paragraph}
                className={
                  index === 0
                    ? "text-ivory/80 text-lg leading-relaxed"
                    : "text-ivory/70 text-lg leading-relaxed"
                }
              >
                {paragraph}
              </p>
            ))}

            <div className="mt-4 text-center">
              <span className="text-3xl text-saffron/40 font-[var(--font-bengali)]">
                ❀ ❀ ❀
              </span>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gold/10">
              {homePageContent.about.stats.map(stat => (
                <div key={stat.label}>
                  <div className="font-[var(--font-display)] text-3xl md:text-4xl font-bold text-saffron">
                    {stat.value}
                  </div>
                  <div className="text-ivory/50 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Image - Takes 5 columns */}
          <div
            className={`lg:col-span-5 transition-all duration-700 delay-400 ${
              isInView2
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8"
            }`}
          >
            <div className="relative">
              {/* Decorative border */}
              <div className="absolute -inset-4 border border-gold/20 rounded-sm" />
              <div className="absolute -inset-8 border border-gold/10 rounded-sm hidden md:block" />

              {/* Image container */}
              <div className="relative rounded-sm overflow-hidden">
                <img
                  src={IMAGES.ABOUT_LOGO}
                  alt="Kashphool Organization"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Gold corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold/40 -translate-x-4 -translate-y-4" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold/40 translate-x-4 translate-y-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
