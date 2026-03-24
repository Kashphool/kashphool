/*
  DESIGN: Sacred Geometry Modernism
  - Event cards with goddess illustrations
  - Alternating left-right layout for visual rhythm
  - Gold accent borders and hover glow effects
  - Calendar-style date badges
*/

import { useInView } from "@/hooks/useInView";
import { Calendar, MapPin } from "lucide-react";
import type { Event } from "@/types";
import { useState, useEffect } from "react";

// Helper function to format date
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// Helper function to format date label (e.g., "JAN 23")
const formatDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  return `${month} ${day}`;
};

// Helper function to format date range
const formatDateRange = (start: string, end: string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'long' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'long' });
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  
  // Same month and year - show month for both dates
  if (startMonth === endMonth && startYear === endYear) {
    return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${startYear}`;
  }
  
  // Different months, same year
  if (startYear === endYear) {
    return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${startYear}`;
  }
  
  // Different years
  return `${startMonth} ${startDate.getDate()}, ${startYear} - ${endMonth} ${endDate.getDate()}, ${endYear}`;
};

function EventCard({ event, index }: { event: Event; index: number }) {
  const { ref, isInView } = useInView();
  const isEven = index % 2 === 0;

  // Format date display
  const dateDisplay = event.date.type === 'range' && event.date.end
    ? formatDateRange(event.date.start, event.date.end)
    : formatDate(event.date.start);
  
  // Format date label for badge - show range for range-type events
  const dateLabel = event.date.type === 'range' && event.date.end
    ? `${formatDateLabel(event.date.start)} - ${formatDateLabel(event.date.end)}`
    : formatDateLabel(event.date.start);

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
              alt={event.name}
              className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />

            {/* Date Badge */}
            <div className="absolute top-4 left-4 bg-charcoal/90 backdrop-blur-sm border border-gold/30 px-4 py-2 rounded-sm">
              <div className="font-[var(--font-display)] text-saffron font-bold text-lg tracking-wide">
                {dateLabel}
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
            {event.name}
          </h3>
          <p className="text-ivory/70 text-lg leading-relaxed">
            {event.description}
          </p>

          {/* Event Details */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 text-ivory/60">
              <Calendar size={18} className="text-saffron/80 shrink-0" />
              <span>{dateDisplay}</span>
            </div>
            <div className="flex items-center gap-3 text-ivory/60">
              <MapPin size={18} className="text-saffron/80 shrink-0" />
              <span>
                <a
                  href={
                    event.venue.googleMapsUrl ||
                    `https://www.google.com/maps/search/?api=1&query=${event.venue.coordinates.lat},${event.venue.coordinates.lng}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-saffron/80 hover:text-saffron transition-colors underline decoration-saffron/30 hover:decoration-saffron"
                >
                  {event.venue.name}
                </a>
                , {event.venue.address}
              </span>
            </div>
          </div>

          {/* Pre-Registration Button */}
          {event.registrationUrl && (
            <div className="pt-6">
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-saffron to-gold text-charcoal font-semibold rounded-sm hover:shadow-lg hover:shadow-saffron/20 transition-all duration-300 hover:scale-105"
              >
                Pre-Registration
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 7h10v10" />
                  <path d="M7 17 17 7" />
                </svg>
              </a>
            </div>
          )}

          {/* Decorative gold line */}
          <div className="h-[1px] w-24 bg-gradient-to-r from-gold/50 to-transparent mt-6" />
        </div>
      </div>
    </div>
  );
}

export default function EventsSection() {
  const { ref, isInView } = useInView();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load events from JSON file
    fetch('/data/events.json')
      .then(response => response.json())
      .then((data: Event[]) => {
        setEvents(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load events:', error);
        setLoading(false);
      });
  }, []);

  return (
    <section id="events" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background mandala decoration */}
      <div className="absolute left-[-15%] top-1/4 w-[400px] h-[400px] opacity-[0.03] animate-slow-spin pointer-events-none">
        <img src="/images/mandala-pattern.webp" alt="" className="w-full h-full object-contain" />
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
        {loading ? (
          <div className="text-center">
            <p className="text-ivory/50">Loading events...</p>
          </div>
        ) : (
          <div className="space-y-24">
            {events.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
