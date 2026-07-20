import { dateKey } from "./date";

export type PaydayStep = {
  id: string;
  text: string;
  amount: number | null;
  order: number;
};

export type PaydayChecklistData = {
  // "" until the user sets it - one date that WAS a payday, used to
  // compute every pay period since (every 14 days).
  anchorDate: string;
  steps: PaydayStep[];
  // Keyed by pay period date (YYYY-MM-DD) -> completed step ids.
  periods: Record<string, string[]>;
  seedVersion: number;
};

// Bump whenever the seed content below changes and existing saved steps
// should be replaced rather than left alone - see the seedVersion migration
// in normalizeDashboardData. The anchor date is real user data, not seeded
// content, so a migration never touches it.
export const PAYDAY_SEED_VERSION = 1;

export function seedPaydaySteps(): PaydayStep[] {
  return [
    "Transfer → Emergency",
    "Transfer → Jamaica",
    "Debt snowball payment",
    "Personal spending → vault",
    "Update balances here",
  ].map((text, order) => ({ id: crypto.randomUUID(), text, amount: null, order }));
}

export function emptyPaydayChecklistData(): PaydayChecklistData {
  return { anchorDate: "", steps: seedPaydaySteps(), periods: {}, seedVersion: PAYDAY_SEED_VERSION };
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateKey(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function shiftDays(dateStr: string, days: number): string {
  const date = parseDateKey(dateStr)!;
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

// The most recent payday on or before `now`, given the anchor - "" if no
// anchor has been set yet.
export function currentPeriodKey(anchorDate: string, now: Date = new Date()): string {
  const anchor = parseDateKey(anchorDate);
  if (!anchor) return "";
  const anchorMidnight = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((nowMidnight.getTime() - anchorMidnight.getTime()) / DAY_MS);
  const periodsElapsed = Math.floor(diffDays / 14);
  return shiftDays(dateKey(anchorMidnight), periodsElapsed * 14);
}

export function nextPeriodKey(anchorDate: string, now: Date = new Date()): string {
  const current = currentPeriodKey(anchorDate, now);
  return current ? shiftDays(current, 14) : "";
}

export function completedStepIdsFor(data: PaydayChecklistData, periodKey: string): string[] {
  return data.periods[periodKey] ?? [];
}

export function toggleStepDone(
  data: PaydayChecklistData,
  periodKey: string,
  stepId: string
): PaydayChecklistData {
  const current = completedStepIdsFor(data, periodKey);
  const next = current.includes(stepId)
    ? current.filter((id) => id !== stepId)
    : [...current, stepId];
  return { ...data, periods: { ...data.periods, [periodKey]: next } };
}

export function isPeriodComplete(data: PaydayChecklistData, periodKey: string): boolean {
  if (data.steps.length === 0 || !periodKey) return false;
  const doneIds = new Set(completedStepIdsFor(data, periodKey));
  return data.steps.every((s) => doneIds.has(s.id));
}

// Most recent `count` pay periods, oldest first, for the history strip.
export function recentPeriods(anchorDate: string, count: number, now: Date = new Date()): string[] {
  const current = currentPeriodKey(anchorDate, now);
  if (!current) return [];
  const result: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    result.push(shiftDays(current, -i * 14));
  }
  return result;
}

// Consecutive fully-completed pay periods, counting backward. The
// still-open current period doesn't break the streak while it's in
// progress - only a period that closed incomplete does.
export function paydayStreak(
  data: PaydayChecklistData,
  anchorDate: string,
  now: Date = new Date()
): number {
  const current = currentPeriodKey(anchorDate, now);
  if (!current) return 0;

  let cursor = current;
  if (!isPeriodComplete(data, cursor)) {
    cursor = shiftDays(cursor, -14);
  }

  let streak = 0;
  for (let i = 0; i < 200; i++) {
    if (!isPeriodComplete(data, cursor)) break;
    streak++;
    cursor = shiftDays(cursor, -14);
  }
  return streak;
}

export function formatPayDate(dateStr: string): string {
  const date = parseDateKey(dateStr);
  if (!date) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
