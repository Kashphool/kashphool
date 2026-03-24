/*
  DESIGN: Sacred Geometry Modernism
  - Masonry-inspired gallery grid
  - Hover reveals with gold overlay and zoom
  - Lightbox modal for full-size viewing
  - Staggered fade-in animations
*/

import { useInView } from "@/hooks/useInView";
import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const galleryImages = [
  { src: "/gallery/2025_1.jpg", alt: "Durga Puja 2025" },
  { src: "/gallery/2025_2.jpg", alt: "Durga Puja 2025" },
  { src: "/gallery/2025_3.jpg", alt: "Durga Puja 2025" },
  { src: "/gallery/2025_4.jpg", alt: "Durga Puja 2025" },
  { src: "/gallery/2025_5.jpg", alt: "Durga Puja 2025" },
  { src: "/gallery/2025_6.jpg", alt: "Durga Puja 2025" },
];

export default function GallerySection() {
  const { ref, isInView } = useInView();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () =>
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + galleryImages.length) % galleryImages.length : null
    );
  const nextImage = () =>
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % galleryImages.length : null
    );

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex]);

  return (
    <section id="gallery" className="relative py-24 md:py-32 overflow-hidden">
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
              Memories
            </span>
            <h2 className="font-[var(--font-display)] text-4xl md:text-5xl lg:text-6xl font-bold mt-3 mb-4">
              <span className="text-gold-gradient">Photo Gallery</span>
            </h2>
            <p className="text-ivory/50 text-lg mt-4">
              Memories from our past events
            </p>
            <div className="h-[2px] w-20 bg-gradient-to-r from-transparent via-saffron to-transparent mx-auto mt-6" />
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {galleryImages.map((image, index) => {
            const delay = index * 100;
            return (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-sm cursor-pointer transition-all duration-700 ${
                  isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                }`}
                style={{ transitionDelay: `${delay}ms` }}
                onClick={() => openLightbox(index)}
              >
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end">
                  <div className="p-5 w-full">
                    <div className="h-[1px] w-12 bg-gold/60 mb-3 transition-all duration-500 group-hover:w-20" />
                    <p className="text-ivory/90 font-medium text-sm tracking-wide">
                      {image.alt}
                    </p>
                  </div>
                </div>

                {/* Gold border on hover */}
                <div className="absolute inset-0 border border-gold/0 group-hover:border-gold/30 transition-all duration-500 rounded-sm" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-charcoal/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-ivory/60 hover:text-saffron transition-colors z-10"
          >
            <X size={28} />
          </button>

          {/* Navigation */}
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 md:left-8 text-ivory/60 hover:text-saffron transition-colors z-10"
          >
            <ChevronLeft size={36} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 md:right-8 text-ivory/60 hover:text-saffron transition-colors z-10"
          >
            <ChevronRight size={36} />
          </button>

          {/* Image */}
          <img
            src={galleryImages[lightboxIndex].src}
            alt={galleryImages[lightboxIndex].alt}
            className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Caption */}
          <div className="absolute bottom-8 text-center">
            <p className="text-ivory/70 text-sm tracking-wide">
              {galleryImages[lightboxIndex].alt} — {lightboxIndex + 1} / {galleryImages.length}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
