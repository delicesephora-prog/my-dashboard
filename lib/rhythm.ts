import { dateKey } from "./date";
import { currentPeriodKey } from "./payday";

export type RhythmDayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const RHYTHM_DAYS: RhythmDayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const RHYTHM_DAY_LABELS: Record<RhythmDayKey, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

// Same office/remote/weekend mapping as Routines, shown for context only -
// Rhythm itself is keyed by the actual weekday, not the day type.
export const RHYTHM_DAY_TYPE_LABELS: Record<RhythmDayKey, string> = {
  monday: "Office",
  tuesday: "Remote",
  wednesday: "Office",
  thursday: "Office",
  friday: "Remote",
  saturday: "Weekend",
  sunday: "Weekend",
};

export type RhythmAnchor = {
  id: string;
  text: string;
  order: number;
  // Only ever "payday" today - shown on its day only when that day is
  // actually (near) a pay date, once a payday anchor date is set.
  conditional?: "payday";
  // "" or "HH:MM" 24h - when set, a one-time text nudge fires close to
  // this time on the anchor's day, unless it's already done.
  nudgeTime?: string;
};

export type RhythmDayLog = {
  completedAnchorIds: string[];
  nudgedAnchorIds: string[];
};

export type RhythmData = {
  days: Record<RhythmDayKey, RhythmAnchor[]>;
  // Keyed by YYYY-MM-DD - only today's key is ever written to.
  logs: Record<string, RhythmDayLog>;
};

function anchor(text: string, order: number, conditional?: "payday"): RhythmAnchor {
  return { id: crypto.randomUUID(), text, order, conditional };
}

// Sephora's actual ideal week, seeded as the starting template.
function seedDays(): Record<RhythmDayKey, RhythmAnchor[]> {
  return {
    monday: [anchor("10-Minute Home Reset", 0), anchor("Night Routine", 1)],
    tuesday: [anchor("AM Workout", 0), anchor("Bathroom Zone", 1), anchor("Deep-Work Day", 2)],
    wednesday: [
      anchor("Midweek Prep (meals for Thu-Fri)", 0),
      anchor("10-Min Week Checkpoint: what's slipping, Thursday's One Thing", 1),
    ],
    thursday: [],
    friday: [
      anchor("Laundry Day (put it away!)", 0),
      anchor("Week Shutdown Ritual (5:30)", 1),
      anchor("Evening Free - Protect It", 2),
      anchor("Payday Checklist", 3, "payday"),
    ],
    saturday: [
      anchor("Kitchen Zone", 0),
      anchor("Errands / Groceries", 1),
      anchor("Fun with O", 2),
    ],
    sunday: [
      anchor("Worship + Unhurried Devotional", 0),
      anchor("Sunday Reset", 1),
      anchor("Floors + Bedding", 2),
      anchor("Board Meeting", 3),
      anchor("Plan the Week", 4),
    ],
  };
}

export function emptyRhythmDays(): Record<RhythmDayKey, RhythmAnchor[]> {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };
}

export function emptyRhythmData(): RhythmData {
  return { days: seedDays(), logs: {} };
}

// If `days` is missing entirely (the field never existed on this saved
// data before), fall back to the real seeded rhythm rather than blanks -
// this only fires once, the first time this field appears for existing
// data. A day that's been intentionally emptied out stays empty.
export function normalizeRhythmData(partial: Partial<RhythmData> | null | undefined): RhythmData {
  const fallback = partial?.days ? emptyRhythmDays() : seedDays();
  const days = {} as Record<RhythmDayKey, RhythmAnchor[]>;
  for (const key of RHYTHM_DAYS) {
    days[key] = partial?.days?.[key] ?? fallback[key];
  }
  // Backfill nudgedAnchorIds on any log entries saved before that field
  // existed, so old data doesn't fail validation on its next save.
  const logs: Record<string, RhythmDayLog> = {};
  for (const [day, log] of Object.entries(partial?.logs ?? {})) {
    logs[day] = {
      completedAnchorIds: log?.completedAnchorIds ?? [],
      nudgedAnchorIds: log?.nudgedAnchorIds ?? [],
    };
  }
  return { days, logs };
}

// Monday-first weekday key for a given date.
export function dayKeyForDate(d: Date): RhythmDayKey {
  const jsDay = d.getDay();
  return RHYTHM_DAYS[jsDay === 0 ? 6 : jsDay - 1];
}

function isPaydayNearby(paydayAnchorDate: string, now: Date): boolean {
  if (!paydayAnchorDate) return true; // no anchor set yet - don't hide it
  return currentPeriodKey(paydayAnchorDate, now) === dateKey(now);
}

// Today's anchors, filtered for any conditional ones that don't apply
// today (currently just the biweekly payday anchor).
export function anchorsForDate(
  rhythmData: RhythmData,
  paydayAnchorDate: string,
  d: Date
): RhythmAnchor[] {
  const dayKey = dayKeyForDate(d);
  const anchors = [...rhythmData.days[dayKey]].sort((a, b) => a.order - b.order);
  return anchors.filter((a) => a.conditional !== "payday" || isPaydayNearby(paydayAnchorDate, d));
}

export function logFor(rhythmData: RhythmData, dateStr: string): RhythmDayLog {
  const stored = rhythmData.logs[dateStr];
  return { completedAnchorIds: stored?.completedAnchorIds ?? [], nudgedAnchorIds: stored?.nudgedAnchorIds ?? [] };
}

// Past days are locked - only today's log can ever be written to.
export function toggleAnchorDone(
  rhythmData: RhythmData,
  anchorId: string,
  now: Date = new Date()
): RhythmData {
  const today = dateKey(now);
  const log = logFor(rhythmData, today);
  const next = log.completedAnchorIds.includes(anchorId)
    ? log.completedAnchorIds.filter((id) => id !== anchorId)
    : [...log.completedAnchorIds, anchorId];
  return {
    ...rhythmData,
    logs: { ...rhythmData.logs, [today]: { ...log, completedAnchorIds: next } },
  };
}

// Marks an anchor as having already been texted about today, so the
// anchor-nudge cron never sends the same nudge twice.
export function markAnchorNudged(
  rhythmData: RhythmData,
  anchorId: string,
  now: Date = new Date()
): RhythmData {
  const today = dateKey(now);
  const log = logFor(rhythmData, today);
  if (log.nudgedAnchorIds.includes(anchorId)) return rhythmData;
  return {
    ...rhythmData,
    logs: {
      ...rhythmData.logs,
      [today]: { ...log, nudgedAnchorIds: [...log.nudgedAnchorIds, anchorId] },
    },
  };
}

// Anchors with a configured nudge time close to `now`, that aren't already
// done and haven't already been nudged today - used by the anchor-nudge
// cron. `now` should be a real-Eastern-clock Date (see servertime.ts).
export function anchorsDueForNudge(
  rhythmData: RhythmData,
  paydayAnchorDate: string,
  now: Date,
  windowMinutes = 20
): RhythmAnchor[] {
  const anchors = anchorsForDate(rhythmData, paydayAnchorDate, now);
  const log = logFor(rhythmData, dateKey(now));
  const doneIds = new Set(log.completedAnchorIds);
  const nudgedIds = new Set(log.nudgedAnchorIds);
  const nowMins = now.getHours() * 60 + now.getMinutes();

  return anchors.filter((a) => {
    if (!a.nudgeTime || doneIds.has(a.id) || nudgedIds.has(a.id)) return false;
    const [h, m] = a.nudgeTime.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return false;
    const targetMins = h * 60 + m;
    return nowMins >= targetMins && nowMins - targetMins <= windowMinutes;
  });
}

export type AnchorState = "done" | "current" | "upNext";

export type TodayRhythm = {
  anchors: { anchor: RhythmAnchor; state: AnchorState }[];
  done: number;
  total: number;
};

// Divides today's anchors into rough morning/afternoon/evening thirds by
// their position in the list, and picks the first not-done anchor in the
// current time band - falling back to anything still open from earlier
// today, then to the first open anchor at all.
export function todayRhythm(
  rhythmData: RhythmData,
  paydayAnchorDate: string,
  now: Date = new Date()
): TodayRhythm {
  const anchors = anchorsForDate(rhythmData, paydayAnchorDate, now);
  const doneIds = new Set(logFor(rhythmData, dateKey(now)).completedAnchorIds);
  const total = anchors.length;
  const done = anchors.filter((a) => doneIds.has(a.id)).length;

  if (total === 0) return { anchors: [], done: 0, total: 0 };

  const currentBand = now.getHours() < 12 ? 0 : now.getHours() < 17 ? 1 : 2;
  const bandOf = (index: number) => Math.floor((index / total) * 3);

  const notDone = anchors
    .map((a, i) => ({ a, band: bandOf(i) }))
    .filter(({ a }) => !doneIds.has(a.id));

  let currentId: string | null = null;
  const inBand = notDone.find(({ band }) => band === currentBand);
  if (inBand) {
    currentId = inBand.a.id;
  } else {
    const behind = notDone.find(({ band }) => band <= currentBand);
    currentId = (behind ?? notDone[0])?.a.id ?? null;
  }

  const result = anchors.map((a) => {
    let state: AnchorState = "upNext";
    if (doneIds.has(a.id)) state = "done";
    else if (a.id === currentId) state = "current";
    return { anchor: a, state };
  });

  return { anchors: result, done, total };
}

export function suggestedAnchorText(
  rhythmData: RhythmData,
  paydayAnchorDate: string,
  now: Date = new Date()
): string | null {
  const { anchors } = todayRhythm(rhythmData, paydayAnchorDate, now);
  const current = anchors.find((a) => a.state === "current");
  return current ? current.anchor.text : null;
}
