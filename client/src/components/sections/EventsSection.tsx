/*
  DESIGN: Sacred Geometry Modernism
  - Event cards with goddess illustrations
  - Alternating left-right layout for visual rhythm
  - Gold accent borders and hover glow effects
  - Calendar-style date badges
*/

import { useInView } from "@/hooks/useInView";
import { Calendar, Clock, MapPin, Timer } from "lucide-react";
import { IMAGES } from "@/config";
import type { EventData } from "@/types";

const events: EventData[] = [
  {
    title: "Saraswati Puja",
    description:
      "Join us for the annual Saraswati Puja, a celebration of the goddess Saraswati, the goddess of knowledge and music.",
    date: "January 23, 2026",
    dateLabel: "JAN 23",
    time: "10:00 AM - 8:00 PM",
    location: "Elite Venue, Dartford",
    duration: "10 hours",
    image: IMAGES.SARASWATI,
  },
  {
    title: "Durga Puja",
    description:
      "Experience the grandeur of Durga Puja, our most celebrated festival honoring Goddess Durga's victory over evil.",
    date: "October 10, 2026",
    dateLabel: "OCT 10",
    time: "9:00 AM - 10:00 PM",
    location: "Elite Venue, Dartford",
    duration: "13 hours",
    image: IMAGES.DURGA,
  },
];

function EventCard({ event, index }: { event: EventData; index: number }) {
  const { ref, isInView } = useInView();
  const isEven = index % 2 === 0;

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
    >
      {/* Image */}
      <div
        className={`lg:col-span-5 ${isEven ? "lg:order-1" : "lg:order-2"}`}
      >
        <div className="relative group">
          <div className="absolute -inset-3 bg-gradient-to-br from-saffron/20 to-gold/10 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative overflow-hidden rounded-sm">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />

            {/* Date Badge */}
            <div className="absolute top-4 left-4 bg-charcoal/90 backdrop-blur-sm border border-gold/30 px-4 py-2 rounded-sm">
              <div className="font-[var(--font-display)] text-saffron font-bold text-lg tracking-wide">
                {event.dateLabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className={`lg:col-span-7 ${isEven ? "lg:order-2" : "lg:order-1"}`}
      >
        <div className="space-y-5">
          <h3 className="font-[var(--font-display)] text-3xl md:text-4xl font-bold text-gold-gradient">
            {event.title}
          </h3>
          <p className="text-ivory/70 text-lg leading-relaxed">
            {event.description}
          </p>

          {/* Event Details */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 text-ivory/60">
              <Calendar size={18} className="text-saffron/80 shrink-0" />
              <span>{event.date}</span>
            </div>
            {event.duration && (
              <div className="flex items-center gap-3 text-ivory/60">
                <Timer size={18} className="text-saffron/80 shrink-0" />
                <span>Duration: {event.duration}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-ivory/60">
              <Clock size={18} className="text-saffron/80 shrink-0" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-3 text-ivory/60">
              <MapPin size={18} className="text-saffron/80 shrink-0" />
              <span>{event.location}</span>
            </div>
          </div>

          {/* Decorative gold line */}
          <div className="h-[1px] w-24 bg-gradient-to-r from-gold/50 to-transparent mt-6" />
        </div>
      </div>
    </div>
  );
}

export default function EventsSection() {
  const { ref, isInView } = useInView();

  return (
    <section id="events" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background mandala decoration */}
      <div className="absolute left-[-15%] top-1/4 w-[400px] h-[400px] opacity-[0.03] animate-slow-spin pointer-events-none">
        <img src={IMAGES.MANDALA} alt="" className="w-full h-full object-contain" />
      </div>

      <div className="container relative z-10">
        {/* Section Header */}
        <div ref={ref} className="mb-20 text-center">
          <div
            className={`transition-all duration-700 ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase">
              Celebrations
            </span>
            <h2 className="font-[var(--font-display)] text-4xl md:text-5xl lg:text-6xl font-bold mt-3 mb-6">
              <span className="text-gold-gradient">Upcoming Events</span>
            </h2>
            <div className="h-[2px] w-20 bg-gradient-to-r from-transparent via-saffron to-transparent mx-auto" />
          </div>
        </div>

        {/* Events */}
        <div className="space-y-24">
          {events.map((event, i) => (
            <EventCard key={event.title} event={event} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
