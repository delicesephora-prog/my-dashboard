import { dateKey } from "./date";

export type WorkEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // "" or "HH:MM"
  notes: string;
  archived: boolean;
};

export type EventsData = {
  events: WorkEvent[];
};

export function emptyEventsData(): EventsData {
  return { events: [] };
}

export function normalizeEventsData(
  partial: Partial<EventsData> | null | undefined
): EventsData {
  return { events: Array.isArray(partial?.events) ? partial.events : [] };
}

export function newEvent(title: string, date: string, time: string): WorkEvent {
  return {
    id: crypto.randomUUID(),
    title,
    date,
    time,
    notes: "",
    archived: false,
  };
}

function dateTimeKey(e: WorkEvent): string {
  return `${e.date} ${e.time || "00:00"}`;
}

export function upcomingEvents(data: EventsData, now: Date = new Date()): WorkEvent[] {
  const today = dateKey(now);
  return data.events
    .filter((e) => !e.archived && e.date >= today)
    .sort((a, b) => dateTimeKey(a).localeCompare(dateTimeKey(b)));
}

export function pastEvents(data: EventsData, now: Date = new Date()): WorkEvent[] {
  const today = dateKey(now);
  return data.events
    .filter((e) => !e.archived && e.date < today)
    .sort((a, b) => dateTimeKey(b).localeCompare(dateTimeKey(a)));
}

export function addEvent(data: EventsData, event: WorkEvent): EventsData {
  return { ...data, events: [event, ...data.events] };
}

export function updateEvent(
  data: EventsData,
  id: string,
  updater: (e: WorkEvent) => WorkEvent
): EventsData {
  return { ...data, events: data.events.map((e) => (e.id === id ? updater(e) : e)) };
}

export function archiveEvent(data: EventsData, id: string): EventsData {
  return updateEvent(data, id, (e) => ({ ...e, archived: true }));
}
