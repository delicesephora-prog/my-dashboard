"use client";

import { Habit, HabitsData, habitCompletionsFor } from "@/lib/types";
import { weekKeyFor } from "@/lib/week";
import { CelebrationTier } from "@/lib/celebration";
import HabitCell from "./HabitCell";
import ProgressRing from "../ProgressRing";

// Storage is Monday-first (index 0 = Monday ... 6 = Sunday). Display is
// Sunday-first per spec - this maps each displayed column back to its
// underlying storage index.
const DISPLAY_TO_STORAGE = [6, 0, 1, 2, 3, 4, 5];
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function todayDisplayIndex(): number {
  const jsDay = new Date().getDay(); // 0 = Sunday
  const storageIndex = jsDay === 0 ? 6 : jsDay - 1;
  return DISPLAY_TO_STORAGE.indexOf(storageIndex);
}

export default function HabitsView({
  habitsData,
  onChange,
  onManage,
  onCelebrate,
}: {
  habitsData: HabitsData;
  onChange: (updater: (h: HabitsData) => HabitsData) => void;
  onManage: () => void;
  onCelebrate: (tier: CelebrationTier, message: string) => void;
}) {
  const weekKey = weekKeyFor(new Date());
  const faith = habitsData.habits.filter((h) => h.section === "faith").sort((a, b) => a.order - b.order);
  const daily = habitsData.habits.filter((h) => h.section === "daily").sort((a, b) => a.order - b.order);
  const todayCol = todayDisplayIndex();
  const todayStorageIndex = DISPLAY_TO_STORAGE[todayCol];

  function toggleDay(habitId: string, storageIndex: number) {
    const turningOn = !(
      habitCompletionsFor(habitsData, weekKey, habitId)[storageIndex] ?? false
    );

    onChange((h) => {
      const week = h.weeks[weekKey] ?? { completions: {} };
      const current = week.completions[habitId] ?? [false, false, false, false, false, false, false];
      const next = [...current];
      next[storageIndex] = !next[storageIndex];
      return {
        ...h,
        weeks: {
          ...h.weeks,
          [weekKey]: { completions: { ...week.completions, [habitId]: next } },
        },
      };
    });

    if (!turningOn || habitsData.habits.length === 0) return;

    if (storageIndex === todayStorageIndex) {
      const allDoneToday = habitsData.habits.every((habit) =>
        habit.id === habitId
          ? true
          : (habitCompletionsFor(habitsData, weekKey, habit.id)[todayStorageIndex] ?? false)
      );
      if (allDoneToday) {
        onCelebrate("medium", "All of today's habits done.");
      }
    }

    const habit = habitsData.habits.find((h) => h.id === habitId);
    if (habit) {
      const cells = habitCompletionsFor(habitsData, weekKey, habitId);
      const countAfter = cells.filter(Boolean).length + 1;
      if (countAfter === 7) {
        onCelebrate("big", `${habit.label}: a perfect 7-day week.`);
      }
    }
  }

  let achieved = 0;
  let possible = 0;
  habitsData.habits.forEach((habit) => {
    const cells = habitCompletionsFor(habitsData, weekKey, habit.id);
    achieved += Math.min(cells.filter(Boolean).length, habit.weeklyGoal);
    possible += habit.weeklyGoal;
  });
  const pct = possible > 0 ? Math.round((achieved / possible) * 100) : 0;

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ProgressRing pct={pct} size={56} strokeWidth={6} color="#5B2333" label={`${pct}%`} />
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
              This Week&apos;s Habits
            </p>
            <p className="font-serif text-[0.95rem] text-paper-ink">Overall</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onManage}
          className="rounded-full border border-paper-border bg-paper-surface px-3 py-1.5 text-xs font-medium text-paper-muted"
        >
          Manage Habits
        </button>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <DayHeader todayCol={todayCol} />

        {faith.length > 0 && (
          <>
            <SectionLabel label="Faith" />
            {faith.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                habitsData={habitsData}
                weekKey={weekKey}
                todayCol={todayCol}
                onToggle={toggleDay}
              />
            ))}
          </>
        )}

        {daily.length > 0 && (
          <>
            <SectionLabel label="Daily" />
            {daily.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                habitsData={habitsData}
                weekKey={weekKey}
                todayCol={todayCol}
                onToggle={toggleDay}
              />
            ))}
          </>
        )}

        {habitsData.habits.length === 0 && (
          <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
            No habits yet. Tap Manage Habits to add one.
          </p>
        )}
      </div>
    </div>
  );
}

function DayHeader({ todayCol }: { todayCol: number }) {
  return (
    <div className="mb-2 grid grid-cols-[92px_repeat(7,1fr)] items-center gap-1">
      <span />
      {DAY_LABELS.map((d, i) => (
        <span
          key={i}
          className={`text-center text-[10px] font-medium ${
            i === todayCol ? "text-gold" : "text-paper-muted"
          }`}
        >
          {d}
        </span>
      ))}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="mb-1.5 mt-2 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-faint first:mt-0">
      {label}
    </p>
  );
}

function HabitRow({
  habit,
  habitsData,
  weekKey,
  todayCol,
  onToggle,
}: {
  habit: Habit;
  habitsData: HabitsData;
  weekKey: string;
  todayCol: number;
  onToggle: (habitId: string, storageIndex: number) => void;
}) {
  const cells = habitCompletionsFor(habitsData, weekKey, habit.id);
  const count = cells.filter(Boolean).length;
  const goalMet = count >= habit.weeklyGoal;

  return (
    <div className="mb-2 grid grid-cols-[92px_repeat(7,1fr)] items-center gap-1">
      <div className="flex min-w-0 items-center gap-1 pr-1">
        <span className="shrink-0" aria-hidden>
          {habit.icon}
        </span>
        <span className="min-w-0 truncate text-[10px] leading-tight text-paper-ink">{habit.label}</span>
        <span className={`shrink-0 text-[9.5px] ${goalMet ? "font-semibold text-sage" : "text-paper-faint"}`}>
          {count}/{habit.weeklyGoal}
        </span>
      </div>
      {DISPLAY_TO_STORAGE.map((storageIndex, displayIndex) => (
        <div key={displayIndex} className="flex justify-center">
          <HabitCell
            done={cells[storageIndex]}
            color={habit.color}
            isToday={displayIndex === todayCol}
            onToggle={() => onToggle(habit.id, storageIndex)}
            ariaLabel={`${habit.label} - ${DAY_LABELS[displayIndex]}`}
          />
        </div>
      ))}
    </div>
  );
}
