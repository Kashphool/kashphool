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
