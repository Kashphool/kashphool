const parseIsoDate = (date: string): Date => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Invalid event date: ${date}`);

  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
};

const formatMonth = (date: Date, length: "short" | "long" = "long") =>
  new Intl.DateTimeFormat("en-GB", { month: length, timeZone: "UTC" }).format(date);

const formatWeekday = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(date);

export const formatEventWeekday = (date: string): string =>
  new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(
    parseIsoDate(date),
  );

export const formatEventDay = (date: string): string => {
  const parsedDate = parseIsoDate(date);
  return `${formatWeekday(parsedDate)} ${parsedDate.getUTCDate()} ${formatMonth(parsedDate)}`;
};

export const formatEventDate = (date: string): string => {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseIsoDate(date));
};

export const formatEventDateRange = (start: string, end: string): string => {
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);

  if (endDate < startDate) throw new Error("Event end date cannot be before its start date");

  const sameYear = startDate.getUTCFullYear() === endDate.getUTCFullYear();
  const sameMonth = sameYear && startDate.getUTCMonth() === endDate.getUTCMonth();

  if (sameMonth) {
    return `${startDate.getUTCDate()}–${endDate.getUTCDate()} ${formatMonth(startDate)} ${startDate.getUTCFullYear()}`;
  }

  if (sameYear) {
    return `${startDate.getUTCDate()} ${formatMonth(startDate)}–${endDate.getUTCDate()} ${formatMonth(endDate)} ${startDate.getUTCFullYear()}`;
  }

  return `${formatEventDate(start)}–${formatEventDate(end)}`;
};

export const formatEventDays = (start: string, end: string): string => {
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);

  if (endDate < startDate) throw new Error("Event end date cannot be before its start date");

  const days: Date[] = [];
  for (
    let date = startDate;
    date <= endDate && days.length < 370;
    date = new Date(date.getTime() + 86_400_000)
  ) {
    days.push(date);
  }

  const sameMonth = days.every(
    (date) =>
      date.getUTCMonth() === startDate.getUTCMonth() &&
      date.getUTCFullYear() === startDate.getUTCFullYear(),
  );

  if (sameMonth) {
    return `${days.map((date) => `${formatWeekday(date)} ${date.getUTCDate()}`).join(", ")} ${formatMonth(endDate)}`;
  }

  return days
    .map((date) => `${formatWeekday(date)} ${date.getUTCDate()} ${formatMonth(date, "short")}`)
    .join(", ");
};

export const formatEventDateBadge = (start: string, end?: string): string => {
  const startDate = parseIsoDate(start);
  if (!end) return `${startDate.getUTCDate()} ${formatMonth(startDate, "short").toUpperCase()}`;

  const endDate = parseIsoDate(end);
  const sameMonth =
    startDate.getUTCMonth() === endDate.getUTCMonth() &&
    startDate.getUTCFullYear() === endDate.getUTCFullYear();

  return sameMonth
    ? `${startDate.getUTCDate()}–${endDate.getUTCDate()} ${formatMonth(endDate, "short").toUpperCase()}`
    : `${startDate.getUTCDate()} ${formatMonth(startDate, "short").toUpperCase()}–${endDate.getUTCDate()} ${formatMonth(endDate, "short").toUpperCase()}`;
};

export const formatEventTime = (time: string): string => {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) throw new Error(`Invalid event time: ${time}`);

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error(`Invalid event time: ${time}`);

  const suffix = hours < 12 ? "am" : "pm";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

export const formatEventTimeRange = (start: string, end: string): string =>
  `${formatEventTime(start)}–${formatEventTime(end)}`;
