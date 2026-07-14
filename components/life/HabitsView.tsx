"use client";

import { Habit, HabitsData, habitCompletionsFor } from "@/lib/types";
import { weekKeyFor } from "@/lib/week";
import HabitCell from "./HabitCell";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export default function HabitsView({
  habitsData,
  onChange,
  onManage,
}: {
  habitsData: HabitsData;
  onChange: (updater: (h: HabitsData) => HabitsData) => void;
  onManage: () => void;
}) {
  const weekKey = weekKeyFor(new Date());
  const faith = habitsData.habits.filter((h) => h.section === "faith").sort((a, b) => a.order - b.order);
  const daily = habitsData.habits.filter((h) => h.section === "daily").sort((a, b) => a.order - b.order);

  function toggleDay(habitId: string, dayIndex: number) {
    onChange((h) => {
      const week = h.weeks[weekKey] ?? { completions: {} };
      const current = week.completions[habitId] ?? [false, false, false, false, false, false, false];
      const next = [...current];
      next[dayIndex] = !next[dayIndex];
      return {
        ...h,
        weeks: {
          ...h.weeks,
          [weekKey]: { completions: { ...week.completions, [habitId]: next } },
        },
      };
    });
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
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            This Week&apos;s Habits
          </p>
          <p className="font-serif text-2xl text-paper-ink">{pct}%</p>
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
        <DayHeader />

        {faith.length > 0 && (
          <>
            <SectionLabel label="Faith" />
            {faith.map((habit) => (
              <HabitRow key={habit.id} habit={habit} habitsData={habitsData} weekKey={weekKey} onToggle={toggleDay} />
            ))}
          </>
        )}

        {daily.length > 0 && (
          <>
            <SectionLabel label="Daily" />
            {daily.map((habit) => (
              <HabitRow key={habit.id} habit={habit} habitsData={habitsData} weekKey={weekKey} onToggle={toggleDay} />
            ))}
          </>
        )}

        {habitsData.habits.length === 0 && (
          <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
            No habits yet. Tap Manage Habits to add one.
          </p>
        )}
      </div>

      {habitsData.habits.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {habitsData.habits.map((habit) => {
            const cells = habitCompletionsFor(habitsData, weekKey, habit.id);
            const count = cells.filter(Boolean).length;
            return (
              <div
                key={habit.id}
                className="rounded-xl border-l-4 bg-paper-surface p-2.5 shadow-paper"
                style={{ borderColor: habit.color }}
              >
                <div className="flex items-center gap-1.5 text-[13px] text-paper-ink">
                  <span aria-hidden>{habit.icon}</span>
                  <span className="truncate">{habit.label}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-paper-muted">
                  {count} of {habit.weeklyGoal} this week
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DayHeader() {
  return (
    <div className="mb-2 grid grid-cols-[108px_repeat(7,1fr)] items-center gap-1">
      <span />
      {DAY_LABELS.map((d, i) => (
        <span key={i} className="text-center text-[10px] font-medium text-paper-muted">
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
  onToggle,
}: {
  habit: Habit;
  habitsData: HabitsData;
  weekKey: string;
  onToggle: (habitId: string, dayIndex: number) => void;
}) {
  const cells = habitCompletionsFor(habitsData, weekKey, habit.id);

  return (
    <div className="mb-1.5 grid grid-cols-[108px_repeat(7,1fr)] items-center gap-1">
      <div className="flex min-w-0 items-center gap-1.5 pr-1">
        <span className="shrink-0" aria-hidden>
          {habit.icon}
        </span>
        <span className="text-[10.5px] leading-tight text-paper-ink">{habit.label}</span>
      </div>
      {cells.map((done, i) => (
        <div key={i} className="flex justify-center">
          <HabitCell
            done={done}
            color={habit.color}
            onToggle={() => onToggle(habit.id, i)}
            ariaLabel={`${habit.label} - day ${i + 1}`}
          />
        </div>
      ))}
    </div>
  );
}
