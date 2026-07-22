"use client";

import { useEffect, useRef, useState } from "react";
import { RoutineKey, RoutineStep, ROUTINE_COLORS, ROUTINE_ICONS, ROUTINE_LABELS } from "@/lib/routines";
import { playGentleChime } from "@/lib/gentle-chime";

function formatDuration(minutes: number | null): string | null {
  if (minutes === null || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function GuidedRoutine({
  routineKey,
  steps,
  doneIds,
  onToggleStep,
  onClose,
}: {
  routineKey: RoutineKey;
  steps: RoutineStep[];
  doneIds: string[];
  onToggleStep: (stepId: string) => void;
  onClose: () => void;
}) {
  const doneSet = new Set(doneIds);
  const firstIncomplete = steps.findIndex((s) => !doneSet.has(s.id));
  const [index, setIndex] = useState(firstIncomplete === -1 ? steps.length : firstIncomplete);
  const chimePlayed = useRef(false);

  const allDone = steps.length > 0 && steps.every((s) => doneSet.has(s.id));
  const color = ROUTINE_COLORS[routineKey];

  useEffect(() => {
    if (allDone && !chimePlayed.current) {
      chimePlayed.current = true;
      playGentleChime();
    }
  }, [allDone]);

  if (steps.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper-surface px-6 animate-fade-in">
        <p className="mb-6 text-center font-serif text-lg italic text-paper-muted">
          No steps set up for {ROUTINE_LABELS[routineKey]} yet.
        </p>
        <button
          onClick={onClose}
          className="rounded-full bg-life px-5 py-2.5 text-sm font-medium text-paper-surface"
        >
          Close
        </button>
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper-surface px-6 animate-fade-in">
        <div
          className="mb-5 flex h-20 w-20 items-center justify-center rounded-full animate-pop-in"
          style={{ backgroundColor: color }}
        >
          <svg viewBox="0 0 24 24" className="h-10 w-10 text-paper-surface" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="mb-1 text-center font-serif text-xl text-paper-ink">
          {ROUTINE_LABELS[routineKey]} Routine complete
        </p>
        <p className="mb-8 text-center text-sm italic text-paper-muted">
          Well done. That&apos;s one more day.
        </p>
        <button
          onClick={onClose}
          className="rounded-full px-6 py-2.5 text-sm font-medium text-paper-surface"
          style={{ backgroundColor: color }}
        >
          Done
        </button>
      </div>
    );
  }

  const clampedIndex = Math.min(index, steps.length - 1);
  const step = steps[clampedIndex];
  const stepDone = doneSet.has(step.id);
  const duration = formatDuration(step.durationMinutes);

  function markDoneAndAdvance() {
    if (!stepDone) onToggleStep(step.id);
    setIndex((i) => Math.min(i + 1, steps.length));
  }

  function skip() {
    setIndex((i) => Math.min(i + 1, steps.length));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper-surface animate-fade-in">
      <div className="safe-top flex items-center justify-between px-5 pb-2 pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-paper-muted">
          {ROUTINE_ICONS[routineKey]} {ROUTINE_LABELS[routineKey]} · Step {clampedIndex + 1} of {steps.length}
        </p>
        <button type="button" onClick={onClose} aria-label="Close" className="text-paper-muted">
          ✕
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="mb-4 flex gap-1.5">
          {steps.map((s, i) => (
            <span
              key={s.id}
              className="h-1.5 w-6 rounded-full"
              style={{ backgroundColor: i <= clampedIndex ? color : "#E8DFD0" }}
            />
          ))}
        </div>

        <p className="mb-2 text-center font-serif text-[1.6rem] leading-snug text-paper-ink">
          {step.text}
          {step.linkedHabitId && (
            <span className="ml-2 align-middle text-[13px] text-paper-faint" title="Linked to a habit">
              🔗
            </span>
          )}
        </p>

        {(step.targetTime || duration) && (
          <p className="text-center text-sm text-paper-muted">
            {[step.targetTime, duration].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <div className="safe-bottom flex flex-col items-center gap-3 px-8 pb-6">
        <button
          type="button"
          onClick={markDoneAndAdvance}
          className="w-full rounded-xl2 py-4 text-center text-base font-medium text-paper-surface transition active:scale-[0.98]"
          style={{ backgroundColor: color }}
        >
          Done, next →
        </button>
        <button type="button" onClick={skip} className="text-xs text-paper-faint underline underline-offset-2">
          Skip this step
        </button>
      </div>
    </div>
  );
}
