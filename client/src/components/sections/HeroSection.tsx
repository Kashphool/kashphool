/*
  DESIGN: Sacred Geometry Modernism
  - Dramatic full-viewport hero with temple interior background
  - Asymmetric layout: content on left, decorative mandala on right
  - Breathing OM symbol, gold accent lines
  - Dark overlay with warm golden light leak
*/

import { useInView } from "@/hooks/useInView";
import { IMAGES } from "@/config";

export default function HeroSection() {
  const { ref, isInView } = useInView();

  return (
    <section id="home" className="relative min-h-screen flex items-start overflow-hidden -mt-20">
      {/* Background Video */}
      <div className="absolute inset-0 -top-20">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={IMAGES.HERO_BG_FALLBACK}
          className="w-full h-full object-cover"
        >
          <source src={IMAGES.HERO_BG_VIDEO} type="video/mp4" />
        </video>
        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 via-charcoal/70 to-charcoal/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-charcoal/50" />
      </div>

      {/* Rotating Mandala - decorative right side */}
      {/*<div className="absolute right-[-15%] top-1/2 -translate-y-1/2 w-[800px] h-[800px] md:w-[1100px] md:h-[1100px] opacity-10 animate-slow-spin pointer-events-none">*/}
      {/*  <img src={MANDALA} alt="" className="w-full h-full object-contain" />*/}
      {/*</div>*/}

      {/* Content */}
      <div ref={ref} className="container relative z-10 pt-32 md:pt-40 lg:pt-48 pb-16">
        <div className="max-w-2xl">
          {/* Gold accent line */}
          <div
            className={`h-[2px] bg-gradient-to-r from-saffron via-gold to-transparent mb-8 transition-all duration-1000 ${
              isInView ? "w-32 opacity-100" : "w-0 opacity-0"
            }`}
          />

          {/* Title */}
          <h1
            className={`font-[var(--font-display)] text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6 transition-all duration-700 delay-200 ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-ivory">Welcome to</span>
            <br />
            <span className="text-gold-gradient">Kashphool</span>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-lg md:text-xl text-ivory/70 leading-relaxed max-w-lg mb-10 transition-all duration-700 delay-400 ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            An Indian Bengali Association in North Kent, dedicated to preserving
            and celebrating our rich cultural heritage.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-wrap gap-4 transition-all duration-700 delay-[600ms] ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <a
              href="#events"
              onClick={(e) => { e.preventDefault(); document.querySelector("#events")?.scrollIntoView({ behavior: "smooth" }); }}
              className="px-8 py-3.5 bg-gradient-to-r from-saffron to-gold text-charcoal font-semibold rounded tracking-wide hover:shadow-xl hover:shadow-saffron/20 transition-all duration-300 hover:scale-105"
            >
              Upcoming Events
            </a>
            <a
              href="#about"
              onClick={(e) => { e.preventDefault(); document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" }); }}
              className="px-8 py-3.5 border border-gold/40 text-gold hover:bg-gold/10 font-semibold rounded tracking-wide transition-all duration-300"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-charcoal to-transparent" />

      {/* Decorative bottom gold line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </section>
  );
}
