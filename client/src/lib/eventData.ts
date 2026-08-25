import type { Event, EventCollection } from "@/types";

export const getNextEvent = (data: EventCollection): Event => {
  const nextEvent = data.events.find((event) => event.id === data.nextEventId);
  if (!nextEvent) throw new Error(`Next event not found: ${data.nextEventId}`);

  return nextEvent;
};
