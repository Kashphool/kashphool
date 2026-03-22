/*
  DESIGN: Sacred Geometry Modernism
  - Asymmetric two-column layout: text left, image right
  - Alpona pattern as subtle background texture
  - Gold accent lines and decorative borders
  - Fade-up animations on scroll
*/

import { useInView } from "@/hooks/useInView";
import { IMAGES } from "@/config";

export default function AboutSection() {
  const { ref, isInView } = useInView();
  const { ref: ref2, isInView: isInView2 } = useInView();

  return (
    <section id="about" className="relative py-24 md:py-32 overflow-hidden">
      {/* Subtle Alpona pattern background */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <img src={IMAGES.ALPONA} alt="" className="w-full h-full object-cover" />
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
              Our Story
            </span>
            <h2 className="font-[var(--font-display)] text-4xl md:text-5xl lg:text-6xl font-bold mt-3 mb-4">
              <span className="text-gold-gradient">About Us</span>
            </h2>
            <div className="h-[2px] w-20 bg-gradient-to-r from-saffron to-transparent" />
          </div>
        </div>

        {/* Content Grid - Asymmetric */}
        <div ref={ref2} className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Text Content - Takes 7 columns */}
          <div
            className={`lg:col-span-7 space-y-6 transition-all duration-700 delay-200 ${
              isInView2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <p className="text-ivory/80 text-lg leading-relaxed">
              Kashphool is an Indian Bengali Association based in North Kent, dedicated to
              preserving and celebrating our rich cultural heritage. We are a vibrant community
              organization that brings together Bengali families and friends to honor our
              traditions and create lasting connections.
            </p>
            <p className="text-ivory/70 text-lg leading-relaxed">
              Established in 2025, Kashphool organizes various Hindu festivals and community
              events throughout the year. Our mission is to keep our cultural traditions alive
              while building a strong, supportive community in North Kent. We celebrated our
              first Durga Puja in 2025, marking a significant milestone in our journey.
            </p>
            <p className="text-ivory/70 text-lg leading-relaxed">
              Through our events and celebrations, we aim to foster a sense of belonging,
              share our cultural values with future generations, and create a welcoming space
              for all members of our community. Join us as we continue to grow and celebrate
              our shared heritage together.
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gold/10">
              <div>
                <div className="font-[var(--font-display)] text-3xl md:text-4xl font-bold text-saffron">
                  2025
                </div>
                <div className="text-ivory/50 text-sm mt-1">Established</div>
              </div>
              <div>
                <div className="font-[var(--font-display)] text-3xl md:text-4xl font-bold text-saffron">
                  5+
                </div>
                <div className="text-ivory/50 text-sm mt-1">Annual Events</div>
              </div>
              <div>
                <div className="font-[var(--font-display)] text-3xl md:text-4xl font-bold text-saffron">
                  North Kent
                </div>
                <div className="text-ivory/50 text-sm mt-1">Based In</div>
              </div>
            </div>
          </div>

          {/* Image - Takes 5 columns */}
          <div
            className={`lg:col-span-5 transition-all duration-700 delay-400 ${
              isInView2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
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
