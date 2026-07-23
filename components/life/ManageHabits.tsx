"use client";

import { useState } from "react";
import {
  Habit,
  HabitSection,
  HabitsData,
  HABIT_COLOR_OPTIONS,
  HABIT_ICON_OPTIONS,
} from "@/lib/types";

export default function ManageHabits({
  habitsData,
  onChange,
  onBack,
}: {
  habitsData: HabitsData;
  onChange: (updater: (h: HabitsData) => HabitsData) => void;
  onBack: () => void;
}) {
  function addHabit() {
    const section: HabitSection = "daily";
    const siblingCount = habitsData.habits.filter((h) => h.section === section).length;
    const habit: Habit = {
      id: crypto.randomUUID(),
      label: "New Habit",
      icon: HABIT_ICON_OPTIONS[0],
      color: HABIT_COLOR_OPTIONS[siblingCount % HABIT_COLOR_OPTIONS.length],
      section,
      weeklyGoal: 5,
      order: siblingCount,
    };
    onChange((h) => ({ ...h, habits: [...h.habits, habit] }));
  }

  function updateHabit(id: string, updater: (h: Habit) => Habit) {
    onChange((h) => ({ ...h, habits: h.habits.map((x) => (x.id === id ? updater(x) : x)) }));
  }

  function deleteHabit(id: string) {
    onChange((h) => ({ ...h, habits: h.habits.filter((x) => x.id !== id) }));
  }

  function moveHabit(id: string, direction: -1 | 1) {
    onChange((h) => {
      const habit = h.habits.find((x) => x.id === id);
      if (!habit) return h;
      const siblings = h.habits
        .filter((x) => x.section === habit.section)
        .sort((a, b) => a.order - b.order);
      const idx = siblings.findIndex((x) => x.id === id);
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= siblings.length) return h;
      const other = siblings[swapIdx];
      return {
        ...h,
        habits: h.habits.map((x) => {
          if (x.id === habit.id) return { ...x, order: other.order };
          if (x.id === other.id) return { ...x, order: habit.order };
          return x;
        }),
      };
    });
  }

  const faith = habitsData.habits.filter((h) => h.section === "faith").sort((a, b) => a.order - b.order);
  const daily = habitsData.habits.filter((h) => h.section === "daily").sort((a, b) => a.order - b.order);

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-paper-border bg-paper-surface text-paper-muted"
          aria-label="Back to habits"
        >
          ‹
        </button>
        <p className="font-serif text-[1.05rem] text-backdrop-ink">Manage Habits</p>
        <button
          type="button"
          onClick={addHabit}
          className="rounded-full bg-life px-3 py-1.5 text-xs font-medium text-paper-surface"
        >
          + Add
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {faith.length > 0 && (
          <div>
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-faint">
              Faith
            </p>
            <div className="flex flex-col gap-2">
              {faith.map((habit, i) => (
                <HabitEditor
                  key={habit.id}
                  habit={habit}
                  onUpdate={(u) => updateHabit(habit.id, u)}
                  onDelete={() => deleteHabit(habit.id)}
                  onMoveUp={i > 0 ? () => moveHabit(habit.id, -1) : undefined}
                  onMoveDown={i < faith.length - 1 ? () => moveHabit(habit.id, 1) : undefined}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-faint">
            Daily
          </p>
          {daily.length === 0 ? (
            <p className="py-2 text-center text-xs italic text-paper-muted">No daily habits yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {daily.map((habit, i) => (
                <HabitEditor
                  key={habit.id}
                  habit={habit}
                  onUpdate={(u) => updateHabit(habit.id, u)}
                  onDelete={() => deleteHabit(habit.id)}
                  onMoveUp={i > 0 ? () => moveHabit(habit.id, -1) : undefined}
                  onMoveDown={i < daily.length - 1 ? () => moveHabit(habit.id, 1) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HabitEditor({
  habit,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  habit: Habit;
  onUpdate: (updater: (h: Habit) => Habit) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-paper-border bg-paper-surface shadow-paper">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm"
          style={{ backgroundColor: habit.color }}
        >
          {habit.icon}
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] text-paper-ink">{habit.label}</span>
        <span className="shrink-0 text-[11px] text-paper-muted">{habit.weeklyGoal}/7</span>
      </button>

      {expanded && (
        <div className="animate-fade-in space-y-3 border-t border-paper-border px-3.5 py-3">
          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Label
            </p>
            <input
              value={habit.label}
              onChange={(e) => onUpdate((h) => ({ ...h, label: e.target.value }))}
              className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[14px] text-paper-ink outline-none"
            />
          </div>

          <div>
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Icon
            </p>
            <div className="flex flex-wrap gap-1.5">
              {HABIT_ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => onUpdate((h) => ({ ...h, icon }))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
                  style={{
                    backgroundColor: habit.icon === icon ? "#EEE0E3" : "transparent",
                    border: `1px solid ${habit.icon === icon ? "#5B2333" : "#E8DFD0"}`,
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Color
            </p>
            <div className="flex flex-wrap gap-1.5">
              {HABIT_COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Choose color ${color}`}
                  onClick={() => onUpdate((h) => ({ ...h, color }))}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: color,
                    outline: habit.color === color ? "2px solid #2B2620" : "none",
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Section
              </p>
              <div className="flex gap-1.5">
                {(["faith", "daily"] as HabitSection[]).map((section) => (
                  <button
                    key={section}
                    type="button"
                    onClick={() => onUpdate((h) => ({ ...h, section }))}
                    className={`flex-1 rounded-lg py-1.5 text-[12px] font-medium capitalize transition ${
                      habit.section === section
                        ? "bg-life text-paper-surface"
                        : "border border-paper-border text-paper-muted"
                    }`}
                  >
                    {section}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-[110px]">
              <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Weekly Goal
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Decrease weekly goal"
                  onClick={() => onUpdate((h) => ({ ...h, weeklyGoal: Math.max(1, h.weeklyGoal - 1) }))}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-paper-border text-paper-muted"
                >
                  −
                </button>
                <span className="w-4 text-center text-[13px] text-paper-ink">{habit.weeklyGoal}</span>
                <button
                  type="button"
                  aria-label="Increase weekly goal"
                  onClick={() => onUpdate((h) => ({ ...h, weeklyGoal: Math.min(7, h.weeklyGoal + 1) }))}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-paper-border text-paper-muted"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-2">
              {onMoveUp && (
                <button type="button" onClick={onMoveUp} className="text-xs text-paper-muted">
                  ↑ Move up
                </button>
              )}
              {onMoveDown && (
                <button type="button" onClick={onMoveDown} className="text-xs text-paper-muted">
                  ↓ Move down
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-paper-faint underline underline-offset-2"
            >
              Delete habit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
