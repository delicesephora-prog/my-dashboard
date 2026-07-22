import {
  Achievement,
  DashboardData,
  Habit,
  HabitsData,
  habitCompletionsFor,
  quarterDataFor,
  weekDataFor,
} from "./types";
import { sortWorkTasks } from "./work-style";
import { weekKeyFor } from "./week";
import { quarterKeyFor } from "./quarter";
import { completionForDate } from "./routines";
import { weeklyProgress } from "./glowup";
import { zoneForDate, completedTaskIds } from "./home";
import { dateKey } from "./date";

export type FrontPageNavTarget =
  | {
      world: "work";
      workView?: "dashboard" | "backbeat" | "reference" | "ops";
      opsView?: "hub" | "waitingOn";
    }
  | {
      world: "life";
      lifeView?:
        | "week"
        | "rituals"
        | "money"
        | "quarter"
        | "lists"
        | "rhythm"
        | "glowUp"
        | "books"
        | "bucketList"
        | "year"
        | "verses";
      openBoardMeeting?: boolean;
    };

// Monday = 0 ... Sunday = 6, matching how habit weeks are stored.
function mondayFirstDayIndex(d: Date): number {
  const jsDay = d.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

// A pinned task from either side, for Today's Focus - both Work's
// topPriority and Life's focus flags cap at 3, so up to 6 total can show.
export type TodayFocusItem = {
  id: string;
  title: string;
  // "side" is purely a display label (Work vs Life); "source" says which
  // underlying pool to toggle, since Life has two independent places a
  // task can be pinned from (the Week checklist and the simple Life tab).
  side: "work" | "life";
  source: "workOps" | "week" | "lifeTasks";
};

export function pinnedFocusTasks(data: DashboardData): TodayFocusItem[] {
  const work = sortWorkTasks(
    data.workOps.tasks.filter((t) => t.topPriority && t.status !== "completed")
  ).map((t) => ({ id: t.id, title: t.title, side: "work" as const, source: "workOps" as const }));

  const weekKey = weekKeyFor(new Date());
  const weekData = weekDataFor(data.lifeWeekly, weekKey);
  const week = weekData.tasks
    .filter((t) => t.focus && !t.done)
    .map((t) => ({ id: t.id, title: t.text, side: "life" as const, source: "week" as const }));

  const lifeTasks = data.life.tasks
    .filter((t) => t.focus && !t.done)
    .map((t) => ({ id: t.id, title: t.text, side: "life" as const, source: "lifeTasks" as const }));

  return [...work, ...week, ...lifeTasks];
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

export type FrontPageRecommendation = { text: string; target: FrontPageNavTarget | null };

// Suggested Next, in the fixed priority order specified: morning routine,
// Sunday Reset, midday reset, night routine, an unchecked home zone, and
// finally a nudge to set tomorrow's One Thing. Only one shows at a time.
export function computeRecommendation(
  data: DashboardData,
  now: Date = new Date()
): FrontPageRecommendation {
  const hour = now.getHours();
  const jsDay = now.getDay(); // 0 = Sunday
  const isWeekday = jsDay >= 1 && jsDay <= 5;

  const morning = completionForDate(data.routines.config, data.routines, "morning", now);
  const dayRoutine = completionForDate(data.routines.config, data.routines, "day", now);
  const night = completionForDate(data.routines.config, data.routines, "night", now);

  if (hour < 11 && morning.total > 0 && morning.done < morning.total) {
    return { text: "Morning routine", target: { world: "life", lifeView: "rituals" } };
  }

  if (jsDay === 0 && hour >= 11) {
    const weekly = weeklyProgress(data.glowUp, now);
    if (weekly.total > 0 && weekly.done < weekly.total) {
      return { text: "Sunday Reset — Glow Up weekly", target: { world: "life", lifeView: "glowUp" } };
    }
  }

  if (isWeekday && hour >= 12 && hour < 17 && dayRoutine.total > 0 && dayRoutine.done < dayRoutine.total) {
    return { text: "Midday reset", target: { world: "life", lifeView: "rituals" } };
  }

  if (hour >= 20 && night.total > 0 && night.done < night.total) {
    return { text: "Night routine", target: { world: "life", lifeView: "rituals" } };
  }

  const zone = zoneForDate(data.homeZones, now);
  if (zone) {
    const doneIds = new Set(completedTaskIds(data.homeZones, dateKey(now), zone.id));
    const unchecked = zone.tasks.some((t) => !doneIds.has(t.id));
    if (unchecked) {
      // Today's Home Zone widget is already on this same page - no
      // separate tab to jump to yet.
      return { text: `${zone.label} — today's home zone`, target: null };
    }
  }

  return { text: "Set tomorrow's One Thing tonight.", target: null };
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
