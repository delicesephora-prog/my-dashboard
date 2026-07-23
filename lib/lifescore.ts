import {
  DashboardData,
  dailyReviewEntryFor,
  isDailyReviewEntryFilled,
  weekDataFor,
} from "./types";
import { dateKey, daysBetween, todayKey } from "./date";
import { weekKeyFor } from "./week";
import { todayHabitProgress } from "./frontpage";
import { ROUTINE_KEYS, completionForDate } from "./routines";
import { isEveningNow } from "./appearance";
import { currentPeriodKey, isPeriodComplete } from "./payday";

export type LifeScoreCategory =
  | "routines"
  | "habits"
  | "tasks"
  | "dailyReview"
  | "workouts"
  | "payday";

export const LIFE_SCORE_CATEGORIES: LifeScoreCategory[] = [
  "routines",
  "habits",
  "tasks",
  "dailyReview",
  "workouts",
  "payday",
];

export const LIFE_SCORE_CATEGORY_LABELS: Record<LifeScoreCategory, string> = {
  routines: "Routines",
  habits: "Habits",
  tasks: "Tasks",
  dailyReview: "Daily Review",
  workouts: "Workouts",
  payday: "Payday Checklist",
};

export type LifeScoreWeights = Record<LifeScoreCategory, number>;

export function defaultLifeScoreWeights(): LifeScoreWeights {
  return { routines: 20, habits: 20, tasks: 20, dailyReview: 15, workouts: 15, payday: 10 };
}

export type LifeScoreData = {
  weights: LifeScoreWeights;
  // Date -> score (0-100), one snapshot per day.
  history: Record<string, number>;
  // Date -> true if that day was declared PTO/a day off - the score still
  // computes normally underneath (for her own curiosity later), but the
  // label never judges a day she deliberately stepped away from.
  ptoLog: Record<string, boolean>;
};

export function emptyLifeScoreData(): LifeScoreData {
  return { weights: defaultLifeScoreWeights(), history: {}, ptoLog: {} };
}

export function normalizeLifeScoreData(
  partial: Partial<LifeScoreData> | null | undefined
): LifeScoreData {
  const fallback = emptyLifeScoreData();
  return {
    weights: { ...fallback.weights, ...partial?.weights },
    history: partial?.history ?? {},
    ptoLog: partial?.ptoLog ?? {},
  };
}

export function isPtoDay(lifeScore: LifeScoreData, key: string): boolean {
  return !!lifeScore.ptoLog[key];
}

export function setPtoDay(lifeScore: LifeScoreData, key: string, value: boolean): LifeScoreData {
  return { ...lifeScore, ptoLog: { ...lifeScore.ptoLog, [key]: value } };
}

export type CategoryResult = { included: boolean; score: number; detail: string };

function routinesResult(data: DashboardData, now: Date): CategoryResult {
  const pcts: number[] = [];
  for (const key of ROUTINE_KEYS) {
    const { total, pct } = completionForDate(data.routines.config, data.routines, key, now);
    if (total > 0 && pct !== null) pcts.push(pct);
  }
  if (pcts.length === 0) {
    return { included: false, score: 0, detail: "No routine steps set up yet" };
  }
  const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  return { included: true, score: avg, detail: `${avg}% of today's routine steps done` };
}

function habitsResult(data: DashboardData, now: Date): CategoryResult {
  const { total, done, pct } = todayHabitProgress(data.habits, now);
  if (total === 0) return { included: false, score: 0, detail: "No habits set up yet" };
  return { included: true, score: pct, detail: `${done} of ${total} habits done today` };
}

function tasksResult(data: DashboardData, now: Date): CategoryResult {
  const today = todayKey(now);
  const dueToday = data.workOps.tasks.filter((t) => t.dueDate === today);
  if (dueToday.length > 0) {
    const done = dueToday.filter((t) => t.status === "completed").length;
    const pct = Math.round((done / dueToday.length) * 100);
    return { included: true, score: pct, detail: `${done} of ${dueToday.length} tasks due today done` };
  }
  const topPriority = data.workOps.tasks.filter((t) => t.topPriority);
  if (topPriority.length > 0) {
    const done = topPriority.filter((t) => t.status === "completed").length;
    const pct = Math.round((done / topPriority.length) * 100);
    return { included: true, score: pct, detail: `${done} of ${topPriority.length} top priorities done` };
  }
  return { included: false, score: 0, detail: "No tasks due today or marked top priority" };
}

function dailyReviewResult(data: DashboardData, now: Date): CategoryResult {
  const entry = dailyReviewEntryFor(data.dailyReview, todayKey(now));
  const filled = isDailyReviewEntryFilled(entry);
  return {
    included: true,
    score: filled ? 100 : 0,
    detail: filled ? "Today's Daily Review is filled in" : "Today's Daily Review isn't filled in yet",
  };
}

function workoutsResult(data: DashboardData, now: Date): CategoryResult {
  const weekKey = weekKeyFor(now);
  const weekData = weekDataFor(data.lifeWeekly, weekKey);
  const goal = data.lifeWeekly.workoutGoal;
  if (goal <= 0) return { included: false, score: 0, detail: "No workout goal set" };
  const pct = Math.min(100, Math.round((weekData.workouts.length / goal) * 100));
  return {
    included: true,
    score: pct,
    detail: `${weekData.workouts.length} of ${goal} workouts this week`,
  };
}

function paydayResult(data: DashboardData, now: Date): CategoryResult {
  const anchor = data.lifeQuarterly.paydayChecklist.anchorDate;
  if (!anchor) return { included: false, score: 0, detail: "No payday anchor date set" };
  const periodKey = currentPeriodKey(anchor, now);
  if (isPeriodComplete(data.lifeQuarterly.paydayChecklist, periodKey)) {
    return { included: true, score: 100, detail: "This pay period's checklist is complete" };
  }
  const daysSincePayday = daysBetween(periodKey, todayKey(now));
  if (daysSincePayday <= 3) {
    return { included: true, score: 50, detail: "Payday checklist not finished yet - still fresh" };
  }
  return { included: true, score: 0, detail: "Payday checklist fell behind this period" };
}

const RESULT_FNS: Record<LifeScoreCategory, (data: DashboardData, now: Date) => CategoryResult> = {
  routines: routinesResult,
  habits: habitsResult,
  tasks: tasksResult,
  dailyReview: dailyReviewResult,
  workouts: workoutsResult,
  payday: paydayResult,
};

// "Quiet Day" (never a harsher word than that) is the bottom of the plain
// score ladder - used as-is for historical days (Year in Pixels). Today's
// own live label goes through resolveTodayLabel below first, which can
// soften a would-be "Quiet Day" into something gentler before it's ever
// shown, without changing how past days are labeled.
const LABEL_THRESHOLDS: { min: number; label: string }[] = [
  { min: 85, label: "Aligned" },
  { min: 65, label: "Steady" },
  { min: 40, label: "Drifting" },
  { min: 0, label: "Quiet Day" },
];

export function labelForScore(score: number): string {
  for (const t of LABEL_THRESHOLDS) {
    if (score >= t.min) return t.label;
  }
  return "Quiet Day";
}

export const LABEL_COLORS: Record<string, string> = {
  Aligned: "#4B5A24",
  Steady: "#C7A46B",
  Drifting: "#C1815F",
  "Quiet Day": "#BE8A3D",
  "Still Unfolding": "#B08B4F",
  "Gentle Day": "#9B7B94",
  PTO: "#8FA37E",
};

export type LifeScoreBreakdown = {
  score: number;
  label: string;
  categories: Record<LifeScoreCategory, CategoryResult & { weight: number }>;
};

// Today's label is never just the raw threshold: a declared PTO day always
// wins outright, and a would-be "Quiet Day" gets one more chance to be
// read kindly - as the day still being underway, or as a low-capacity day
// she already told the Daily Review about - before it's shown as a verdict
// at all.
function resolveTodayLabel(data: DashboardData, score: number, now: Date): string {
  const today = todayKey(now);
  if (isPtoDay(data.lifeScore, today)) return "PTO";

  const baseline = labelForScore(score);
  if (baseline !== "Quiet Day") return baseline;

  const entry = dailyReviewEntryFor(data.dailyReview, today);
  const lowCapacity =
    entry.mood === "low" || entry.mood === "rough" || entry.energy === "low" || entry.energy === "drained";
  if (lowCapacity) return "Gentle Day";

  if (!isEveningNow(now)) return "Still Unfolding";

  return "Quiet Day";
}

export function computeLifeScoreBreakdown(
  data: DashboardData,
  now: Date = new Date()
): LifeScoreBreakdown {
  const weights = data.lifeScore.weights;
  const categories = {} as LifeScoreBreakdown["categories"];
  let weightedSum = 0;
  let totalWeight = 0;

  for (const key of LIFE_SCORE_CATEGORIES) {
    const result = RESULT_FNS[key](data, now);
    categories[key] = { ...result, weight: weights[key] };
    if (result.included && weights[key] > 0) {
      weightedSum += result.score * weights[key];
      totalWeight += weights[key];
    }
  }

  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  return { score, label: resolveTodayLabel(data, score, now), categories };
}

export function recordTodayScore(
  lifeScore: LifeScoreData,
  score: number,
  now: Date = new Date()
): LifeScoreData {
  const today = dateKey(now);
  if (lifeScore.history[today] === score) return lifeScore;
  return { ...lifeScore, history: { ...lifeScore.history, [today]: score } };
}

export type ScoreHistoryDay = { date: string; score: number | null };

export function last30DaysScoreHistory(
  lifeScore: LifeScoreData,
  now: Date = new Date()
): ScoreHistoryDay[] {
  const result: ScoreHistoryDay[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    result.push({ date: key, score: lifeScore.history[key] ?? null });
  }
  return result;
}
