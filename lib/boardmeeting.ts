import { DashboardData, MoneyData, TransformationCategoryKey, TRANSFORMATION_CATEGORIES } from "./types";
import { weekKeyFor, isDateInWeek } from "./week";
import { completionForDate, ROUTINE_KEYS } from "./routines";

export type BoardMeetingRecord = {
  date: string; // the day the meeting was held
  weekKeyReviewed: string;
  lifeScoreAvg: number | null;
  routineConsistencyAvg: number | null;
  wins: string[];
  whatSlipped: string;
  vaultTotal: number;
  debtTotal: number;
  vaultDelta: number | null;
  debtDelta: number | null;
  weeklyFocus: string[];
  goals: string[];
  warRoomMoves: Record<TransformationCategoryKey, string>;
};

export type BoardMeetingData = {
  // Keyed by the date the meeting was held.
  meetings: Record<string, BoardMeetingRecord>;
};

export function emptyBoardMeetingData(): BoardMeetingData {
  return { meetings: {} };
}

export function normalizeBoardMeetingData(
  partial: Partial<BoardMeetingData> | null | undefined
): BoardMeetingData {
  return { meetings: partial?.meetings ?? {} };
}

export function moneyTotals(money: MoneyData): { vaultTotal: number; debtTotal: number } {
  return {
    vaultTotal: money.vaults.reduce((sum, v) => sum + v.currentAmount, 0),
    debtTotal: money.debts.reduce((sum, d) => sum + d.currentBalance, 0),
  };
}

// The most recent meeting held before `date`, if any.
export function previousMeeting(
  data: BoardMeetingData,
  beforeDate: string
): BoardMeetingRecord | null {
  const dates = Object.keys(data.meetings)
    .filter((d) => d < beforeDate)
    .sort((a, b) => b.localeCompare(a));
  return dates.length > 0 ? data.meetings[dates[0]] : null;
}

export function avgLifeScoreForWeek(
  history: Record<string, number>,
  weekKey: string
): number | null {
  const scores = Object.entries(history)
    .filter(([date]) => isDateInWeek(date, weekKey))
    .map(([, score]) => score);
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function avgRoutineConsistencyForWeek(data: DashboardData, weekKey: string): number | null {
  const [y, m, d] = weekKey.split("-").map(Number);
  const monday = new Date(y, m - 1, d);
  const dailyAverages: number[] = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(day.getDate() + i);
    const pcts: number[] = [];
    for (const key of ROUTINE_KEYS) {
      const { total, pct } = completionForDate(data.routines.config, data.routines, key, day);
      if (total > 0 && pct !== null) pcts.push(pct);
    }
    if (pcts.length > 0) {
      dailyAverages.push(pcts.reduce((a, b) => a + b, 0) / pcts.length);
    }
  }

  if (dailyAverages.length === 0) return null;
  return Math.round(dailyAverages.reduce((a, b) => a + b, 0) / dailyAverages.length);
}

export function weekKeyBeingReviewed(now: Date = new Date()): string {
  return weekKeyFor(now);
}

export function hasMeetingThisWeek(data: BoardMeetingData, now: Date = new Date()): boolean {
  const weekKey = weekKeyFor(now);
  return Object.keys(data.meetings).some((d) => isDateInWeek(d, weekKey));
}

export function recordMeeting(
  data: BoardMeetingData,
  record: BoardMeetingRecord
): BoardMeetingData {
  return { ...data, meetings: { ...data.meetings, [record.date]: record } };
}

export function sortedMeetingDates(data: BoardMeetingData): string[] {
  return Object.keys(data.meetings).sort((a, b) => b.localeCompare(a));
}

export function emptyWarRoomMoves(): Record<TransformationCategoryKey, string> {
  return TRANSFORMATION_CATEGORIES.reduce(
    (acc, key) => ({ ...acc, [key]: "" }),
    {} as Record<TransformationCategoryKey, string>
  );
}
