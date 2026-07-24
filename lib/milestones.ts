import { dateKey, shiftDateKey, daysBetween } from "./date";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export type MilestoneTrackerType = "daily" | "count";

export type MilestoneTracker = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: MilestoneTrackerType;
  order: number;
  // Badge thresholds already celebrated for this tracker, so a badge only
  // pops confetti the moment it's first earned - not every time she reopens
  // the app after having already crossed it.
  celebratedThresholds: number[];
};

// trackerId -> "YYYY-MM-DD" -> value. Daily trackers only ever store 0/1;
// count trackers store any non-negative number. A missing key means 0 - no
// entry ever needs to be written just to represent "nothing happened".
export type MilestoneEntries = Record<string, Record<string, number>>;

export type MilestoneData = {
  trackers: MilestoneTracker[];
  entries: MilestoneEntries;
};

export const MILESTONE_ICON_OPTIONS = [
  "🚫", "🍷", "🏋️", "💪", "🧘", "💧", "🚭", "🥗",
  "😴", "📵", "🏃", "🚶", "💰", "📚", "🎯", "✅",
  "🔥", "🌱", "☀️", "🌙",
];

export const MILESTONE_COLOR_OPTIONS = [
  "#B08B4F", // gold
  "#5B2333", // plum
  "#3D1622", // deep plum
  "#6B7A8F", // slate blue
  "#8A9B7C", // sage
  "#A54B3F", // brick red
];

export const MILESTONE_BADGE_THRESHOLDS = [7, 30, 90, 180, 365] as const;

function seedMilestoneTrackers(): MilestoneTracker[] {
  return [
    {
      id: crypto.randomUUID(),
      name: "Alcohol-free days",
      icon: "🚫",
      color: "#8A9B7C",
      type: "daily",
      order: 0,
      celebratedThresholds: [],
    },
    {
      id: crypto.randomUUID(),
      name: "Gym visits",
      icon: "🏋️",
      color: "#A54B3F",
      type: "daily",
      order: 1,
      celebratedThresholds: [],
    },
  ];
}

export function emptyMilestoneData(): MilestoneData {
  return { trackers: [], entries: {} };
}

// Seeded once, the first time this field has never been saved before (an
// account that predates Milestones) - after that, her real trackers always
// win and this never re-seeds, even if she deletes both starter trackers.
export function defaultMilestoneData(): MilestoneData {
  return { trackers: seedMilestoneTrackers(), entries: {} };
}

export function normalizeMilestoneData(partial: Partial<MilestoneData> | null | undefined): MilestoneData {
  if (!partial) return emptyMilestoneData();
  return {
    trackers: (partial.trackers ?? []).map((t) => ({
      ...t,
      celebratedThresholds: t.celebratedThresholds ?? [],
    })),
    entries: partial.entries ?? {},
  };
}

export function addTracker(
  data: MilestoneData,
  name: string,
  icon: string,
  color: string,
  type: MilestoneTrackerType
): MilestoneData {
  const tracker: MilestoneTracker = {
    id: crypto.randomUUID(),
    name,
    icon,
    color,
    type,
    order: data.trackers.length,
    celebratedThresholds: [],
  };
  return { ...data, trackers: [...data.trackers, tracker] };
}

export function updateTracker(
  data: MilestoneData,
  id: string,
  updater: (t: MilestoneTracker) => MilestoneTracker
): MilestoneData {
  return { ...data, trackers: data.trackers.map((t) => (t.id === id ? updater(t) : t)) };
}

export function deleteTracker(data: MilestoneData, id: string): MilestoneData {
  const entries = { ...data.entries };
  delete entries[id];
  return { ...data, trackers: data.trackers.filter((t) => t.id !== id), entries };
}

export function entriesFor(data: MilestoneData, trackerId: string): Record<string, number> {
  return data.entries[trackerId] ?? {};
}

// Consecutive-day streak logic shared by every tracker AND by reward
// triggers that check a tracker's streak - a single source of truth so the
// two can never silently disagree.
export function computeStreaks(dayValues: Record<string, number>, now: Date): { current: number; longest: number } {
  const hitDates = Object.entries(dayValues)
    .filter(([, v]) => v > 0)
    .map(([k]) => k)
    .sort();
  if (hitDates.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < hitDates.length; i++) {
    run = daysBetween(hitDates[i - 1], hitDates[i]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const hitSet = new Set(hitDates);
  const today = dateKey(now);
  // Not having logged today yet doesn't break a streak that's still alive
  // through yesterday - the day just isn't over.
  let cursor = hitSet.has(today) ? today : shiftDateKey(today, -1);
  let current = 0;
  while (hitSet.has(cursor)) {
    current += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return { current, longest };
}

export type SetEntryResult = { data: MilestoneData; newlyEarnedThresholds: number[] };

export function setEntryValue(
  data: MilestoneData,
  trackerId: string,
  dateStr: string,
  value: number,
  now: Date
): SetEntryResult {
  const trackerEntries = { ...(data.entries[trackerId] ?? {}) };
  if (value <= 0) delete trackerEntries[dateStr];
  else trackerEntries[dateStr] = value;
  const entries = { ...data.entries, [trackerId]: trackerEntries };

  const tracker = data.trackers.find((t) => t.id === trackerId);
  let trackers = data.trackers;
  let newlyEarnedThresholds: number[] = [];
  if (tracker) {
    const { longest } = computeStreaks(trackerEntries, now);
    const earned = MILESTONE_BADGE_THRESHOLDS.filter((t) => longest >= t);
    newlyEarnedThresholds = earned.filter((t) => !tracker.celebratedThresholds.includes(t));
    if (newlyEarnedThresholds.length > 0) {
      trackers = data.trackers.map((t) =>
        t.id === trackerId ? { ...t, celebratedThresholds: [...t.celebratedThresholds, ...newlyEarnedThresholds] } : t
      );
    }
  }

  return { data: { ...data, entries, trackers }, newlyEarnedThresholds };
}

export type MilestoneDay = { date: string; day: number; value: number; isFuture: boolean };
export type MilestoneMonth = { month: number; label: string; days: MilestoneDay[] };

export function milestoneYearGrid(dayValues: Record<string, number>, year: number, now: Date): MilestoneMonth[] {
  const today = dateKey(now);
  const months: MilestoneMonth[] = [];
  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const days: MilestoneDay[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const key = dateKey(new Date(year, m, d));
      days.push({ date: key, day: d, value: dayValues[key] ?? 0, isFuture: key > today });
    }
    months.push({ month: m, label: MONTH_LABELS[m], days });
  }
  return months;
}

export function monthlyTotalsForYear(dayValues: Record<string, number>, year: number): number[] {
  const totals = new Array(12).fill(0);
  for (const [key, v] of Object.entries(dayValues)) {
    if (v <= 0) continue;
    const [y, m] = key.split("-").map(Number);
    if (y === year) totals[m - 1] += v;
  }
  return totals;
}

export function totalForYear(dayValues: Record<string, number>, year: number): number {
  return monthlyTotalsForYear(dayValues, year).reduce((a, b) => a + b, 0);
}

export function totalForMonth(dayValues: Record<string, number>, year: number, month1to12: number): number {
  const prefix = `${year}-${String(month1to12).padStart(2, "0")}`;
  return Object.entries(dayValues)
    .filter(([key, v]) => v > 0 && key.startsWith(prefix))
    .reduce((sum, [, v]) => sum + v, 0);
}

// Every year with at least one entry, newest first, always including the
// given fallback year (usually "now") so a brand-new tracker still has
// somewhere to land.
export function yearsWithData(dayValues: Record<string, number>, fallbackYear: number): number[] {
  const years = new Set<number>([fallbackYear]);
  for (const key of Object.keys(dayValues)) years.add(Number(key.slice(0, 4)));
  return [...years].sort((a, b) => b - a);
}

export function earnedBadgesFor(longestStreak: number): number[] {
  return MILESTONE_BADGE_THRESHOLDS.filter((t) => longestStreak >= t);
}
