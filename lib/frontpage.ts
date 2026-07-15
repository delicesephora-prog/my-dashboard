import {
  Achievement,
  DashboardData,
  Habit,
  HabitsData,
  WorkTask,
  habitCompletionsFor,
  quarterDataFor,
  weekDataFor,
} from "./types";
import { isOverdue, sortWorkTasks } from "./work-style";
import { todayKey } from "./date";
import { weekKeyFor } from "./week";
import { quarterKeyFor } from "./quarter";
import { hasMeetingThisWeek } from "./boardmeeting";
import { suggestedAnchorText } from "./rhythm";

export type FrontPageNavTarget =
  | { world: "work"; workView?: "dashboard" | "backbeat" | "reference" }
  | {
      world: "life";
      lifeView?: "week" | "habits" | "quarter" | "rhythm" | "books" | "bucketList" | "year";
      openBoardMeeting?: boolean;
    };

// Monday = 0 ... Sunday = 6, matching how habit weeks are stored.
function mondayFirstDayIndex(d: Date): number {
  const jsDay = d.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function pinnedFocusTasks(data: DashboardData, limit = 3): WorkTask[] {
  const topPriority = data.workOps.tasks.filter(
    (t) => t.topPriority && t.status !== "completed"
  );
  return sortWorkTasks(topPriority).slice(0, limit);
}

export function todayHabitProgress(
  habits: HabitsData,
  now: Date = new Date()
): { done: number; total: number; pct: number } {
  const dayIndex = mondayFirstDayIndex(now);
  const weekKey = weekKeyFor(now);
  const total = habits.habits.length;
  if (total === 0) return { done: 0, total: 0, pct: 0 };
  const done = habits.habits.filter(
    (h) => habitCompletionsFor(habits, weekKey, h.id)[dayIndex]
  ).length;
  return { done, total, pct: Math.round((done / total) * 100) };
}

export type HabitAtRisk = { habit: Habit; doneCount: number };

// Habits where there's little or no slack left to still hit the weekly
// goal - i.e. the number of days remaining this week barely covers (or
// doesn't cover) what's still needed.
export function habitsAtRisk(habits: HabitsData, now: Date = new Date()): HabitAtRisk[] {
  const dayIndex = mondayFirstDayIndex(now);
  const weekKey = weekKeyFor(now);
  const daysLeftInclusive = 7 - dayIndex;
  const risky: HabitAtRisk[] = [];

  for (const habit of habits.habits) {
    const completions = habitCompletionsFor(habits, weekKey, habit.id);
    const doneCount = completions.filter(Boolean).length;
    const remaining = habit.weeklyGoal - doneCount;
    if (remaining > 0 && remaining >= daysLeftInclusive - 1) {
      risky.push({ habit, doneCount });
    }
  }
  return risky;
}

export type FrontPageRecommendation = { text: string; target: FrontPageNavTarget };

export function computeRecommendation(
  data: DashboardData,
  now: Date = new Date()
): FrontPageRecommendation | null {
  const today = todayKey(now);

  const dueToday = data.workOps.tasks.find(
    (t) => t.topPriority && t.status !== "completed" && t.dueDate === today
  );
  if (dueToday) {
    return {
      text: `"${dueToday.title}" is due today.`,
      target: { world: "work", workView: "dashboard" },
    };
  }

  // The day's rhythm is the main driver of "what's next" - gentle,
  // time-of-day aware, and Sunday's Board Meeting anchor routes straight
  // into the guided flow instead of just pointing at a tab.
  const anchorText = suggestedAnchorText(
    data.rhythm,
    data.lifeQuarterly.paydayChecklist.anchorDate,
    now
  );
  if (anchorText) {
    const isBoardMeeting =
      anchorText.toLowerCase() === "board meeting" && !hasMeetingThisWeek(data.boardMeetings, now);
    return {
      text: `Up next: ${anchorText}`,
      target: isBoardMeeting
        ? { world: "life", lifeView: "quarter", openBoardMeeting: true }
        : { world: "life", lifeView: "rhythm" },
    };
  }

  const overdueCount = data.workOps.tasks.filter((t) =>
    isOverdue(t.dueDate, today, t.status)
  ).length;
  if (overdueCount > 0) {
    return {
      text:
        overdueCount === 1
          ? "You have 1 overdue task."
          : `You have ${overdueCount} overdue tasks.`,
      target: { world: "work", workView: "dashboard" },
    };
  }

  const habitProgress = todayHabitProgress(data.habits, now);
  if (now.getHours() < 12 && habitProgress.total > 0 && habitProgress.done === 0) {
    return {
      text: "Your morning routine hasn't been started yet.",
      target: { world: "life", lifeView: "habits" },
    };
  }

  return null;
}

export type WeekRecap = {
  tasksDone: number;
  tasksTotal: number;
  workoutsLogged: number;
  workoutGoal: number;
  avgHabitPct: number;
  winOfWeek: Achievement | null;
};

export function computeWeekRecap(data: DashboardData, now: Date = new Date()): WeekRecap {
  const weekKey = weekKeyFor(now);
  const weekData = weekDataFor(data.lifeWeekly, weekKey);
  const tasksDone = weekData.tasks.filter((t) => t.done).length;

  const dayIndex = mondayFirstDayIndex(now);
  const daysElapsed = dayIndex + 1;
  const habits = data.habits.habits;
  let avgHabitPct = 0;
  if (habits.length > 0) {
    let possible = 0;
    let done = 0;
    for (const habit of habits) {
      const completions = habitCompletionsFor(data.habits, weekKey, habit.id);
      for (let i = 0; i < daysElapsed; i++) {
        possible++;
        if (completions[i]) done++;
      }
    }
    avgHabitPct = possible > 0 ? Math.round((done / possible) * 100) : 0;
  }

  const quarterKey = quarterKeyFor(now);
  const quarterData = quarterDataFor(data.lifeQuarterly, quarterKey);
  const winOfWeek =
    [...quarterData.achievements]
      .filter((a) => a.date >= weekKey)
      .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;

  return {
    tasksDone,
    tasksTotal: weekData.tasks.length,
    workoutsLogged: weekData.workouts.length,
    workoutGoal: data.lifeWeekly.workoutGoal,
    avgHabitPct,
    winOfWeek,
  };
}
