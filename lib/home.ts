import { dateKey } from "./date";

// This covers only what "Today's Home Zone" on the Front Page needs -
// the weekday-assigned cleaning zones. Daily Reset, Monthly, and the
// who's-on-it tag belong to the dedicated Home tab, built separately.

export type HomeDayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export type HomeZoneTask = {
  id: string;
  text: string;
};

export type HomeZone = {
  id: string;
  day: HomeDayKey;
  label: string;
  tasks: HomeZoneTask[];
};

export type HomeZonesData = {
  zones: HomeZone[];
  // Keyed by YYYY-MM-DD -> zone id -> completed task ids. Only today's key
  // is ever written to, same "past days locked" pattern as Routines.
  logs: Record<string, Record<string, string[]>>;
};

function task(text: string): HomeZoneTask {
  return { id: crypto.randomUUID(), text };
}

function zone(day: HomeDayKey, label: string, taskTexts: string[]): HomeZone {
  return { id: crypto.randomUUID(), day, label, tasks: taskTexts.map(task) };
}

function seedZones(): HomeZone[] {
  return [
    zone("sunday", "Floors + Bedding", ["Floors", "Bedding", "Trash out"]),
    zone("tuesday", "Bathroom", ["Sink", "Toilet", "Mirror"]),
    zone("friday", "Laundry", ["Wash", "Dry", "Fold", "Put away"]),
    zone("saturday", "Kitchen", ["Stove", "Microwave", "Fridge"]),
  ];
}

export function emptyHomeZonesData(): HomeZonesData {
  return { zones: seedZones(), logs: {} };
}

export function normalizeHomeZonesData(
  partial: Partial<HomeZonesData> | null | undefined
): HomeZonesData {
  if (!partial) return emptyHomeZonesData();
  return {
    zones: partial.zones ?? seedZones(),
    logs: partial.logs ?? {},
  };
}

const HOME_DAY_BY_JS_DAY: HomeDayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function homeDayKeyForDate(d: Date): HomeDayKey {
  return HOME_DAY_BY_JS_DAY[d.getDay()];
}

export function zoneForDate(data: HomeZonesData, d: Date): HomeZone | null {
  const dayKey = homeDayKeyForDate(d);
  return data.zones.find((z) => z.day === dayKey) ?? null;
}

export function completedTaskIds(data: HomeZonesData, dateStr: string, zoneId: string): string[] {
  return data.logs[dateStr]?.[zoneId] ?? [];
}

// Past days are locked - only today's log can ever be written to.
export function toggleZoneTask(
  data: HomeZonesData,
  zoneId: string,
  taskId: string,
  now: Date = new Date()
): HomeZonesData {
  const today = dateKey(now);
  const dayLog = data.logs[today] ?? {};
  const current = dayLog[zoneId] ?? [];
  const next = current.includes(taskId)
    ? current.filter((id) => id !== taskId)
    : [...current, taskId];
  return {
    ...data,
    logs: { ...data.logs, [today]: { ...dayLog, [zoneId]: next } },
  };
}
