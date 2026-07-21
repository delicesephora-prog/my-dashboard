import { DashboardData } from "./types";
import { isDateInWeek } from "./week";

// Only the free-text reflection is persisted per week - the numeric
// summary below is always computed live from the real underlying records
// (meetings, waiting-on, fire drills, tasks), so it can never go stale or
// drift from what actually happened.
export type FridayLedgerData = {
  // Keyed by weekKey (the Monday's date).
  reflections: Record<string, string>;
};

export function emptyFridayLedgerData(): FridayLedgerData {
  return { reflections: {} };
}

export function normalizeFridayLedgerData(
  partial: Partial<FridayLedgerData> | null | undefined
): FridayLedgerData {
  return { reflections: partial?.reflections ?? {} };
}

export function reflectionFor(data: FridayLedgerData, weekKey: string): string {
  return data.reflections[weekKey] ?? "";
}

export function setReflection(
  data: FridayLedgerData,
  weekKey: string,
  text: string
): FridayLedgerData {
  return { ...data, reflections: { ...data.reflections, [weekKey]: text } };
}

export type WeekLedgerSummary = {
  meetingsHeld: number;
  waitingOnResolved: number;
  fireDrills: number;
  deadlinesHit: number;
};

export function computeWeekLedger(data: DashboardData, weekKey: string): WeekLedgerSummary {
  const meetingsHeld = data.meetingOps.meetings.filter(
    (m) => !m.archived && isDateInWeek(m.date, weekKey)
  ).length;
  const waitingOnResolved = data.waitingOn.items.filter(
    (i) => i.resolvedDate && isDateInWeek(i.resolvedDate, weekKey)
  ).length;
  const fireDrills = data.fireDrillLog.entries.filter((e) => isDateInWeek(e.date, weekKey)).length;
  const deadlinesHit = data.workOps.tasks.filter(
    (t) => t.status === "completed" && t.dueDate && isDateInWeek(t.dueDate, weekKey)
  ).length;
  return { meetingsHeld, waitingOnResolved, fireDrills, deadlinesHit };
}
