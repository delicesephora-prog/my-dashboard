"use client";

import { useState } from "react";
import {
  DayType,
  DAY_TYPE_LABELS,
  DAY_TYPES,
  RoutineKey,
  RoutineStep,
  RoutinesData,
  ROUTINE_ICONS,
  ROUTINE_KEYS,
  ROUTINE_LABELS,
} from "@/lib/routines";
import { HabitsData } from "@/lib/types";

export default function ManageRoutines({
  routinesData,
  onChange,
  habitsData,
  onBack,
  initialRoutineKey,
}: {
  routinesData: RoutinesData;
  onChange: (updater: (r: RoutinesData) => RoutinesData) => void;
  habitsData: HabitsData;
  onBack: () => void;
  initialRoutineKey?: RoutineKey;
}) {
  const [routineKey, setRoutineKey] = useState<RoutineKey>(initialRoutineKey ?? "morning");
  const [dayType, setDayType] = useState<DayType>("office");

  const steps = [...routinesData.config[routineKey].variants[dayType].steps].sort(
    (a, b) => a.order - b.order
  );

  function updateSteps(next: RoutineStep[]) {
    onChange((r) => ({
      ...r,
      config: {
        ...r.config,
        [routineKey]: {
          ...r.config[routineKey],
          variants: {
            ...r.config[routineKey].variants,
            [dayType]: { steps: next },
          },
        },
      },
    }));
  }

  function addStep() {
    const step: RoutineStep = {
      id: crypto.randomUUID(),
      text: "New step",
      targetTime: "",
      durationMinutes: null,
      order: steps.length,
      linkedHabitId: null,
    };
    updateSteps([...steps, step]);
  }

  function updateStep(id: string, updater: (s: RoutineStep) => RoutineStep) {
    updateSteps(steps.map((s) => (s.id === id ? updater(s) : s)));
  }

  function deleteStep(id: string) {
    updateSteps(steps.filter((s) => s.id !== id));
  }

  function moveStep(id: string, direction: -1 | 1) {
    const idx = steps.findIndex((s) => s.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= steps.length) return;
    const reordered = [...steps];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    updateSteps(reordered.map((s, i) => ({ ...s, order: i })));
  }

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-paper-border bg-paper-surface text-paper-muted"
          aria-label="Back to routines"
        >
          ‹
        </button>
        <p className="font-serif text-[1.05rem] text-backdrop-ink">Manage Routines</p>
        <button
          type="button"
          onClick={addStep}
          className="rounded-full bg-life px-3 py-1.5 text-xs font-medium text-paper-surface"
        >
          + Add
        </button>
      </div>

      <div className="mb-2 flex gap-1.5">
        {ROUTINE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setRoutineKey(key)}
            className={`flex-1 rounded-xl py-2 text-center text-[13px] font-medium transition ${
              routineKey === key
                ? "bg-life text-paper-surface"
                : "border border-paper-border text-paper-muted"
            }`}
          >
            {ROUTINE_ICONS[key]} {ROUTINE_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="mb-3 flex gap-1.5">
        {DAY_TYPES.map((dt) => (
          <button
            key={dt}
            type="button"
            onClick={() => setDayType(dt)}
            className={`flex-1 rounded-full py-1.5 text-center text-xs font-medium transition ${
              dayType === dt
                ? "bg-work text-paper-surface"
                : "border border-paper-border text-paper-muted"
            }`}
          >
            {DAY_TYPE_LABELS[dt]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {steps.length === 0 ? (
          <p className="py-6 text-center font-serif text-[0.9rem] italic text-paper-muted">
            No steps yet for {ROUTINE_LABELS[routineKey]} · {DAY_TYPE_LABELS[dayType]}.
          </p>
        ) : (
          steps.map((step, i) => (
            <StepEditor
              key={step.id}
              step={step}
              habitsData={habitsData}
              onUpdate={(u) => updateStep(step.id, u)}
              onDelete={() => deleteStep(step.id)}
              onMoveUp={i > 0 ? () => moveStep(step.id, -1) : undefined}
              onMoveDown={i < steps.length - 1 ? () => moveStep(step.id, 1) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}

function StepEditor({
  step,
  habitsData,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  step: RoutineStep;
  habitsData: HabitsData;
  onUpdate: (updater: (s: RoutineStep) => RoutineStep) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <div className="rounded-xl border border-paper-border bg-paper-surface p-3 shadow-paper">
      <input
        value={step.text}
        onChange={(e) => onUpdate((s) => ({ ...s, text: e.target.value }))}
        placeholder="Step"
        className="mb-2 w-full rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-[14px] text-paper-ink outline-none"
      />
      <div className="mb-2 flex gap-2">
        <div className="flex-1">
          <p className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
            Target Time
          </p>
          <input
            type="time"
            value={step.targetTime}
            onChange={(e) => onUpdate((s) => ({ ...s, targetTime: e.target.value }))}
            className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
          />
        </div>
        <div className="flex-1">
          <p className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
            Duration (min)
          </p>
          <input
            type="number"
            min={0}
            max={600}
            value={step.durationMinutes ?? ""}
            onChange={(e) =>
              onUpdate((s) => ({
                ...s,
                durationMinutes: e.target.value === "" ? null : Number(e.target.value),
              }))
            }
            placeholder="—"
            className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
          />
        </div>
      </div>
      <div className="mb-2">
        <p className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
          Linked Habit
        </p>
        <select
          value={step.linkedHabitId ?? ""}
          onChange={(e) =>
            onUpdate((s) => ({ ...s, linkedHabitId: e.target.value === "" ? null : e.target.value }))
          }
          className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
        >
          <option value="">No linked habit</option>
          {habitsData.habits.map((h) => (
            <option key={h.id} value={h.id}>
              {h.icon} {h.label}
            </option>
          ))}
        </select>
        {step.linkedHabitId && (
          <p className="mt-1 text-[10.5px] leading-snug text-paper-faint">
            Completing this step checks that habit for today too - never track it twice.
          </p>
        )}
      </div>
      <div className="flex items-center justify-between">
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
          Delete step
        </button>
      </div>
    </div>
  );
}
