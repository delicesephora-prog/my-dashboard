import { TransformationCategoryKey, TransformationGoal, TRANSFORMATION_CATEGORIES } from "./types";
import { dateKey } from "./date";
import { currentPeriodKey, nextPeriodKey } from "./payday";

// Fixed forever - not the rolling "next December 8" the countdown uses.
export const LETTER_UNLOCK_DATE = "2026-12-08";

export function isLetterUnlocked(now: Date = new Date()): boolean {
  return dateKey(now) >= LETTER_UNLOCK_DATE;
}

export type CategorySnapshot = { date: string; done: number; total: number };

export type CategoryWarRoomData = {
  thisWeeksMove: string;
  thisWeeksMoveSetDate: string;
  snapshots: CategorySnapshot[];
};

export type LetterToDecemberSeph = {
  text: string;
  sealed: boolean;
  sealedDate: string;
};

export type WarRoomData = {
  categories: Record<TransformationCategoryKey, CategoryWarRoomData>;
  letter: LetterToDecemberSeph;
};

function emptyCategoryWarRoomData(): CategoryWarRoomData {
  return { thisWeeksMove: "", thisWeeksMoveSetDate: "", snapshots: [] };
}

export function emptyWarRoomData(): WarRoomData {
  const categories = {} as Record<TransformationCategoryKey, CategoryWarRoomData>;
  for (const key of TRANSFORMATION_CATEGORIES) categories[key] = emptyCategoryWarRoomData();
  return { categories, letter: { text: "", sealed: false, sealedDate: "" } };
}

export function normalizeWarRoomData(partial: Partial<WarRoomData> | null | undefined): WarRoomData {
  const fallback = emptyWarRoomData();
  const categories = {} as Record<TransformationCategoryKey, CategoryWarRoomData>;
  for (const key of TRANSFORMATION_CATEGORIES) {
    const p = partial?.categories?.[key];
    categories[key] = {
      thisWeeksMove: p?.thisWeeksMove ?? "",
      thisWeeksMoveSetDate: p?.thisWeeksMoveSetDate ?? "",
      snapshots: p?.snapshots ?? [],
    };
  }
  return {
    categories,
    letter: { ...fallback.letter, ...partial?.letter },
  };
}

// The next December 8 on or after `now` - rolls to next year once it passes.
export function daysUntilDecember8(now: Date = new Date()): number {
  const year = now.getFullYear();
  let target = new Date(year, 11, 8);
  target.setHours(0, 0, 0, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (target < today) {
    target = new Date(year + 1, 11, 8);
  }
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function weeksUntilDecember8(now: Date = new Date()): number {
  return Math.ceil(daysUntilDecember8(now) / 7);
}

function parseDateKeyLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// How many pay periods land between now and the next December 8 - null if
// no payday anchor date has been set yet.
export function paydaysUntilDecember8(anchorDate: string, now: Date = new Date()): number | null {
  if (!anchorDate) return null;
  const days = daysUntilDecember8(now);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(today);
  target.setDate(target.getDate() + days);
  const targetKey = dateKey(target);

  let cursor = currentPeriodKey(anchorDate, now);
  if (!cursor) return null;

  let count = 0;
  for (let i = 0; i < 60; i++) {
    cursor = nextPeriodKey(anchorDate, parseDateKeyLocal(cursor));
    if (!cursor || cursor > targetKey) break;
    count++;
  }
  return count;
}

// Records (or refreshes) today's snapshot for a category - snapshots are
// deduplicated by date, so revisiting the same day just updates the count.
export function recordTodaySnapshot(
  categoryData: CategoryWarRoomData,
  goals: TransformationGoal[],
  now: Date = new Date()
): CategoryWarRoomData {
  const today = dateKey(now);
  const done = goals.filter((g) => g.done).length;
  const total = goals.length;
  const existingIndex = categoryData.snapshots.findIndex((s) => s.date === today);
  const snapshots = [...categoryData.snapshots];
  if (existingIndex >= 0) {
    if (snapshots[existingIndex].done === done && snapshots[existingIndex].total === total) {
      return categoryData;
    }
    snapshots[existingIndex] = { date: today, done, total };
  } else {
    snapshots.push({ date: today, done, total });
  }
  snapshots.sort((a, b) => a.date.localeCompare(b.date));
  return { ...categoryData, snapshots };
}

export type PaceStatus = "no-goals" | "insufficient-data" | "complete" | "on-pace" | "off-pace";

export function categoryPace(
  categoryData: CategoryWarRoomData,
  goals: TransformationGoal[],
  now: Date = new Date()
): PaceStatus {
  const total = goals.length;
  if (total === 0) return "no-goals";
  const done = goals.filter((g) => g.done).length;
  if (done >= total) return "complete";

  const snapshots = categoryData.snapshots;
  if (snapshots.length < 2) return "insufficient-data";

  const first = snapshots[0];
  const latest = snapshots[snapshots.length - 1];
  const daysElapsed = Math.round(
    (new Date(latest.date).getTime() - new Date(first.date).getTime()) / 86400000
  );
  if (daysElapsed <= 0) return "insufficient-data";

  const rate = (latest.done - first.done) / daysElapsed;
  if (rate <= 0) return "off-pace";

  const remaining = total - done;
  const daysNeeded = remaining / rate;
  return daysNeeded <= daysUntilDecember8(now) ? "on-pace" : "off-pace";
}

export const PACE_LABELS: Record<PaceStatus, string> = {
  "no-goals": "No goals yet",
  "insufficient-data": "Not enough history yet",
  complete: "Complete",
  "on-pace": "On pace",
  "off-pace": "Behind pace",
};
