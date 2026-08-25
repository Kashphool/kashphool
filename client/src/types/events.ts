/**
 * Event-related type definitions
 */

export interface EventDate {
  type: "single" | "range";
  start: string; // ISO date format: YYYY-MM-DD
  end?: string; // ISO date format: YYYY-MM-DD (only for range type)
}

export interface EventVenue {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  googleMapsUrl?: string; // Google Maps short link (e.g., https://maps.app.goo.gl/...)
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: EventDate;
  venue: EventVenue;
  image: string;
  registrationUrl?: string; // Optional registration/ticket link
  stallOpeningHours?: Array<{
    date: string; // ISO date format: YYYY-MM-DD
    start: string; // 24-hour time format: HH:mm
    end: string; // 24-hour time format: HH:mm
    optionalStart?: string; // Optional alternative start in 24-hour time format: HH:mm
  }>;
}

export interface EventCollection {
  nextEventId: string;
  events: Event[];
}

export interface EventData {
  title: string;
  description: string;
  date: string;
  dateLabel: string;
  time: string;
  location: string;
  duration?: string;
  image: string;
}
