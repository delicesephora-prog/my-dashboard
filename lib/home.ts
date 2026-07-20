import { dateKey, daysBetween } from "./date";

export type HomeDayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export type Assignee = "me" | "O" | "both";

export type HomeZoneTask = {
  id: string;
  text: string;
  assignee?: Assignee;
};

export type HomeZone = {
  id: string;
  day: HomeDayKey;
  label: string;
  tasks: HomeZoneTask[];
};

export type HomeDailyItem = {
  id: string;
  text: string;
  assignee?: Assignee;
};

export type HomeMonthlyItem = {
  id: string;
  text: string;
  assignee?: Assignee;
  lastDoneDate: string;
  // How many days can pass before the overdue dot lights up - e.g. 30 for
  // a monthly task, 60 for "every other month".
  expectedIntervalDays: number;
};

export type HomeZonesData = {
  zones: HomeZone[];
  // Keyed by YYYY-MM-DD -> zone id -> completed task ids. Only today's key
  // is ever written to, same "past days locked" pattern as Routines.
  logs: Record<string, Record<string, string[]>>;
  dailyReset: {
    items: HomeDailyItem[];
    // Keyed by YYYY-MM-DD -> completed item ids. Only today's key is ever
    // written to.
    logs: Record<string, string[]>;
  };
  monthly: HomeMonthlyItem[];
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

function dailyItem(text: string): HomeDailyItem {
  return { id: crypto.randomUUID(), text };
}

function seedDailyItems(): HomeDailyItem[] {
  return [
    dailyItem("Dishes done / dishwasher on"),
    dailyItem("Counters wiped"),
    dailyItem("5-min floor pickup"),
    dailyItem("Trash out if full"),
  ];
}

function monthlyItem(text: string, expectedIntervalDays: number): HomeMonthlyItem {
  return { id: crypto.randomUUID(), text, lastDoneDate: "", expectedIntervalDays };
}

function seedMonthlyItems(): HomeMonthlyItem[] {
  return [
    monthlyItem("Fridge/freezer clean-out", 30),
    monthlyItem("Bathroom deep clean", 30),
    monthlyItem("Dust: baseboards, vents, fan", 30),
    monthlyItem("Mattress rotate", 60),
  ];
}

export function emptyHomeZonesData(): HomeZonesData {
  return {
    zones: seedZones(),
    logs: {},
    dailyReset: { items: seedDailyItems(), logs: {} },
    monthly: seedMonthlyItems(),
  };
}

export function normalizeHomeZonesData(
  partial: Partial<HomeZonesData> | null | undefined
): HomeZonesData {
  const fallback = emptyHomeZonesData();
  if (!partial) return fallback;
  return {
    zones: partial.zones ?? fallback.zones,
    logs: partial.logs ?? {},
    dailyReset: {
      items: partial.dailyReset?.items ?? fallback.dailyReset.items,
      logs: partial.dailyReset?.logs ?? {},
    },
    monthly: partial.monthly ?? fallback.monthly,
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

export function completedDailyResetIds(data: HomeZonesData, dateStr: string): string[] {
  return data.dailyReset.logs[dateStr] ?? [];
}

// Past days are locked - only today's log can ever be written to.
export function toggleDailyResetItem(
  data: HomeZonesData,
  itemId: string,
  now: Date = new Date()
): HomeZonesData {
  const today = dateKey(now);
  const current = data.dailyReset.logs[today] ?? [];
  const next = current.includes(itemId)
    ? current.filter((id) => id !== itemId)
    : [...current, itemId];
  return {
    ...data,
    dailyReset: { ...data.dailyReset, logs: { ...data.dailyReset.logs, [today]: next } },
  };
}

// Marking a monthly task done stamps lastDoneDate - the persistent record
// used for the "it's been N days" overdue dot.
export function markMonthlyDone(
  data: HomeZonesData,
  itemId: string,
  now: Date = new Date()
): HomeZonesData {
  return {
    ...data,
    monthly: data.monthly.map((m) => (m.id === itemId ? { ...m, lastDoneDate: dateKey(now) } : m)),
  };
}

export function daysSinceLastDone(item: HomeMonthlyItem, now: Date = new Date()): number | null {
  if (!item.lastDoneDate) return null;
  return daysBetween(item.lastDoneDate, dateKey(now));
}

// Never red per spec - overdue always renders as a warm amber dot.
export function isMonthlyOverdue(item: HomeMonthlyItem, now: Date = new Date()): boolean {
  const days = daysSinceLastDone(item, now);
  return days === null || days >= item.expectedIntervalDays;
}
