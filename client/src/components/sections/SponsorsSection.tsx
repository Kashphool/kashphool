/*
  DESIGN: Sacred Geometry Modernism
  - Sponsors logo showcase
  - Grid layout with hover effects
  - Gold accent borders
*/

import { useInView } from "@/hooks/useInView";
import { useState, useEffect } from "react";

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  website?: string;
}

export default function SponsorsSection() {
  const { ref, isInView } = useInView();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load sponsors from JSON file
    fetch('/data/sponsors.json')
      .then(response => response.json())
      .then((data: Sponsor[]) => {
        setSponsors(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load sponsors:', error);
        setLoading(false);
      });
  }, []);

  return (
    <section id="sponsors" className="relative py-24 md:py-32 overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal via-charcoal-light/30 to-charcoal pointer-events-none" />

      <div className="container relative z-10">
        {/* Section Header */}
        <div ref={ref} className="mb-16 text-center">
          <div
            className={`transition-all duration-700 ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase">
              Our Partners
            </span>
            <h2 className="font-[var(--font-display)] text-4xl md:text-5xl lg:text-6xl font-bold mt-3 mb-4">
              <span className="text-gold-gradient">Sponsors</span>
            </h2>
            <p className="text-ivory/50 text-lg mt-4">
              Thank you to our generous sponsors who make our events possible
            </p>
            <div className="h-[2px] w-20 bg-gradient-to-r from-transparent via-saffron to-transparent mx-auto mt-6" />
          </div>
        </div>

        {/* Sponsors Grid */}
        <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
          {loading ? (
            <p className="text-ivory/50">Loading sponsors...</p>
          ) : (
            sponsors.map((sponsor, index) => {
              const delay = index * 100;
              const SponsorCard = (
                <div className="relative bg-charcoal-light/50 backdrop-blur-sm border border-gold/10 rounded-sm p-4 transition-all duration-500 group-hover:border-gold/30 group-hover:shadow-lg group-hover:shadow-gold/10 w-full">
                  {/* Logo Container */}
                  <div className="aspect-square flex items-center justify-center">
                    <img
                      src={sponsor.logo}
                      alt={sponsor.name}
                      className="w-full h-full object-contain filter brightness-90 group-hover:brightness-100 transition-all duration-500"
                    />
                  </div>
                  
                  {/* Sponsor Name */}
                  <div className="mt-3 text-center">
                    <p className="text-ivory/70 text-xs font-medium group-hover:text-ivory/90 transition-colors line-clamp-2">
                      {sponsor.name}
                    </p>
                  </div>

                  {/* Gold corner accents */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/20 -translate-x-px -translate-y-px opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/20 translate-x-px translate-y-px opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              );

              return (
                <div
                  key={sponsor.id}
                  className={`group relative transition-all duration-700 w-40 ${
                    isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                  }`}
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  {sponsor.website ? (
                    <a
                      href={sponsor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {SponsorCard}
                    </a>
                  ) : (
                    SponsorCard
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
