"use client";

import { useState } from "react";
import {
  RoutineKey,
  RoutineStep,
  RoutinesData,
  ROUTINE_COLORS,
  ROUTINE_ICONS,
  ROUTINE_KEYS,
  ROUTINE_LABELS,
  DAY_TYPE_LABELS,
  completionForDate,
  dayTypeForDate,
  logFor,
  stepsForDate,
  toggleStepDone,
} from "@/lib/routines";
import { Habit, HabitsData, habitCompletionsFor, setHabitCompletion } from "@/lib/types";
import { weekKeyFor } from "@/lib/week";
import { dateKey } from "@/lib/date";
import { CelebrationTier } from "@/lib/celebration";
import { playChime } from "@/lib/sound";
import ProgressRing from "../ProgressRing";
import CheckCircle from "../CheckCircle";
import HabitCell from "./HabitCell";
import GuidedRoutine from "./routines/GuidedRoutine";
import ConsistencyChart from "./routines/ConsistencyChart";

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

export default function RitualsView({
  routinesData,
  onChangeRoutines,
  onManageRoutines,
  habitsData,
  onChangeHabits,
  onManageHabits,
  onCelebrate,
}: {
  routinesData: RoutinesData;
  onChangeRoutines: (updater: (r: RoutinesData) => RoutinesData) => void;
  onManageRoutines: () => void;
  habitsData: HabitsData;
  onChangeHabits: (updater: (h: HabitsData) => HabitsData) => void;
  onManageHabits: () => void;
  onCelebrate: (tier: CelebrationTier, message: string) => void;
}) {
  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        Rituals
      </p>
      <RoutinesSection
        routinesData={routinesData}
        onChange={onChangeRoutines}
        onManage={onManageRoutines}
        onChangeHabits={onChangeHabits}
        onCelebrate={onCelebrate}
      />
      <div className="my-4 border-t border-paper-border" />
      <HabitsSection
        habitsData={habitsData}
        onChange={onChangeHabits}
        onManage={onManageHabits}
        onCelebrate={onCelebrate}
      />
    </div>
  );
}

function RoutinesSection({
  routinesData,
  onChange,
  onManage,
  onChangeHabits,
  onCelebrate,
}: {
  routinesData: RoutinesData;
  onChange: (updater: (r: RoutinesData) => RoutinesData) => void;
  onManage: () => void;
  onChangeHabits: (updater: (h: HabitsData) => HabitsData) => void;
  onCelebrate: (tier: CelebrationTier, message: string) => void;
}) {
  const [guided, setGuided] = useState<RoutineKey | null>(null);
  const [expanded, setExpanded] = useState<RoutineKey | null>(null);
  const now = new Date();
  const dayType = dayTypeForDate(now);
  const today = dateKey(now);

  function toggleStep(
    routineKey: RoutineKey,
    step: RoutineStep,
    wasDone: boolean,
    done: number,
    total: number
  ) {
    onChange((r) => toggleStepDone(r, routineKey, step.id, now));
    if (step.linkedHabitId) {
      const linkedHabitId = step.linkedHabitId;
      const todayStorageIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
      onChangeHabits((h) =>
        setHabitCompletion(h, weekKeyFor(now), linkedHabitId, todayStorageIndex, !wasDone)
      );
    }
    if (!wasDone && total > 0 && done + 1 === total) {
      onCelebrate("medium", `${ROUTINE_LABELS[routineKey]} routine complete.`);
      playChime();
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-serif text-[1.05rem] text-backdrop-ink">
          Routines — Today: {DAY_TYPE_LABELS[dayType]}
        </p>
        <button
          type="button"
          onClick={onManage}
          className="rounded-full border border-paper-border bg-paper-surface px-3 py-1.5 text-xs font-medium text-paper-muted"
        >
          Manage Routines
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {ROUTINE_KEYS.map((key) => {
          const steps = stepsForDate(routinesData.config, key, now);
          const { done, total, pct } = completionForDate(routinesData.config, routinesData, key, now);
          const log = logFor(routinesData, today);
          const doneIds = log.completedStepIds[key] ?? [];
          const color = ROUTINE_COLORS[key];
          const nextStepId = steps.find((s) => !doneIds.includes(s.id))?.id;

          return (
            <div
              key={key}
              className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper"
            >
              <div className="flex items-center gap-3">
                <ProgressRing pct={pct ?? 0} size={56} strokeWidth={5} color={color} />
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[1.05rem] text-paper-ink">
                    {ROUTINE_ICONS[key]} {ROUTINE_LABELS[key]}
                  </p>
                  <p className="text-xs text-paper-muted">
                    {total > 0 ? `${done} of ${total} steps` : "No steps yet"}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setGuided(key)}
                  className="flex-1 rounded-xl py-2.5 text-center text-[13px] font-medium text-paper-surface transition active:scale-[0.98]"
                  style={{ backgroundColor: color }}
                >
                  Start {ROUTINE_LABELS[key]} Routine
                </button>
                {total > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => (e === key ? null : key))}
                    aria-label={expanded === key ? "Collapse checklist" : "Expand checklist"}
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-paper-border text-paper-muted transition"
                  >
                    {expanded === key ? "︿" : "﹀"}
                  </button>
                )}
              </div>

              {expanded === key && steps.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2 border-t border-paper-border pt-3">
                  {steps.map((step) => (
                    <li
                      key={step.id}
                      className={`flex items-center gap-2.5 rounded-lg px-1.5 py-1 -mx-1.5 ${
                        step.id === nextStepId ? "bg-gold-soft/60" : ""
                      }`}
                    >
                      <CheckCircle
                        done={doneIds.includes(step.id)}
                        onToggle={() =>
                          toggleStep(key, step, doneIds.includes(step.id), done, total)
                        }
                        accentClass="bg-life"
                        size="sm"
                        ariaLabel={doneIds.includes(step.id) ? "Mark not done" : "Mark done"}
                      />
                      <span
                        className={`min-w-0 flex-1 text-[13px] leading-snug ${
                          doneIds.includes(step.id) ? "text-paper-faint line-through" : "text-paper-ink"
                        }`}
                      >
                        {step.text}
                      </span>
                      {step.linkedHabitId && (
                        <span className="shrink-0 text-[10px] text-paper-faint" title="Linked to a habit">
                          🔗
                        </span>
                      )}
                      {step.targetTime && (
                        <span className="shrink-0 text-[11px] text-paper-muted">{step.targetTime}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        <ConsistencyChart config={routinesData.config} data={routinesData} now={now} />
      </div>

      {guided &&
        (() => {
          const guidedDoneIds = logFor(routinesData, today).completedStepIds[guided] ?? [];
          const { done: guidedDone, total: guidedTotal } = completionForDate(
            routinesData.config,
            routinesData,
            guided,
            now
          );
          return (
            <GuidedRoutine
              routineKey={guided}
              steps={stepsForDate(routinesData.config, guided, now)}
              doneIds={guidedDoneIds}
              onToggleStep={(stepId) => {
                const step = stepsForDate(routinesData.config, guided, now).find((s) => s.id === stepId);
                if (step) toggleStep(guided, step, guidedDoneIds.includes(stepId), guidedDone, guidedTotal);
              }}
              onClose={() => setGuided(null)}
            />
          );
        })()}
    </div>
  );
}

function HabitsSection({
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

    onChange((h) => setHabitCompletion(h, weekKey, habitId, storageIndex, turningOn));

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
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ProgressRing pct={pct} size={56} strokeWidth={6} color="#5B2333" />
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-backdrop-muted">
              This Week&apos;s Habits
            </p>
            <p className="font-serif text-[0.95rem] text-backdrop-ink">Overall</p>
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
