"use client";

import { useState } from "react";
import {
  PLANNER_DAYS,
  PLANNER_DAY_SHORT_LABELS,
  PlannerBlock,
  PlannerCategory,
  PlannerCategoryDef,
  PlannerDayKey,
  RoutineGhostBlock,
  minutesToTime,
  sortedCategories,
  timeToMinutes,
} from "@/lib/planner";
import { RoutineKey, ROUTINE_LABELS } from "@/lib/routines";

export type BlockEditTarget =
  | { kind: "block"; block: PlannerBlock | null }
  | { kind: "ghost"; ghost: RoutineGhostBlock };

export default function BlockEditorSheet({
  target,
  defaultDate,
  categories,
  onSaveBlock,
  onDeleteBlock,
  onSaveGhostOverride,
  onHideGhostForToday,
  onEditTemplate,
  onManageCategories,
  onClose,
}: {
  target: BlockEditTarget;
  defaultDate: string;
  categories: PlannerCategoryDef[];
  onSaveBlock: (block: PlannerBlock) => void;
  onDeleteBlock?: () => void;
  onSaveGhostOverride: (
    ghost: RoutineGhostBlock,
    fields: { title: string; category: PlannerCategory; notes: string; startTime: string; durationMinutes: number }
  ) => void;
  onHideGhostForToday: (ghost: RoutineGhostBlock) => void;
  onEditTemplate: (routineKey: RoutineKey) => void;
  onManageCategories: () => void;
  onClose: () => void;
}) {
  const block = target.kind === "block" ? target.block : null;
  const ghost = target.kind === "ghost" ? target.ghost : null;
  const isGhost = target.kind === "ghost";
  const sorted = sortedCategories(categories);

  const [title, setTitle] = useState(block?.title ?? ghost?.title ?? "");
  const [category, setCategory] = useState<PlannerCategory>(
    block?.category ?? ghost?.category ?? sorted[0]?.id ?? "work"
  );
  const [notes, setNotes] = useState(block?.notes ?? ghost?.notes ?? "");
  const [startTime, setStartTime] = useState(block?.startTime ?? ghost?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(
    block?.endTime ??
      (ghost ? minutesToTime(timeToMinutes(ghost.startTime) + ghost.durationMinutes) : "09:30")
  );
  const [repeatDays, setRepeatDays] = useState<PlannerDayKey[]>(block?.repeatDays ?? []);

  function toggleDay(day: PlannerDayKey) {
    setRepeatDays((days) => (days.includes(day) ? days.filter((d) => d !== day) : [...days, day]));
  }

  function submit() {
    if (!title.trim()) return;
    if (isGhost && ghost) {
      const durationMinutes = Math.max(5, timeToMinutes(endTime) - timeToMinutes(startTime));
      onSaveGhostOverride(ghost, {
        title: title.trim(),
        category,
        notes: notes.trim(),
        startTime,
        durationMinutes,
      });
      return;
    }
    onSaveBlock({
      id: block?.id ?? crypto.randomUUID(),
      title: title.trim(),
      category,
      notes: notes.trim(),
      startTime,
      endTime,
      repeatDays,
      date: repeatDays.length > 0 ? "" : block?.date || defaultDate,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 animate-fade-in" onClick={onClose}>
      <div
        className="scroll-quiet safe-bottom max-h-[85vh] overflow-y-auto rounded-t-xl3 bg-paper-surface p-5 shadow-paper-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 font-serif text-[1.1rem] text-paper-ink">
          {isGhost ? "Edit Routine Block" : block ? "Edit Block" : "New Block"}
        </p>
        {isGhost && ghost && (
          <p className="mb-4 text-[12px] text-paper-muted">
            From your {ROUTINE_LABELS[ghost.routineKey]} routine — changes here only apply to today.
          </p>
        )}
        {!isGhost && <div className="mb-4" />}

        <div className="flex flex-col gap-3.5">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's this block?"
            className="rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[14px] text-paper-ink outline-none"
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Category
              </p>
              <button
                type="button"
                onClick={onManageCategories}
                className="text-[11px] font-medium text-life underline underline-offset-2"
              >
                Edit categories
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sorted.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className="rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition"
                  style={
                    category === c.id
                      ? { backgroundColor: c.color, borderColor: c.color, color: "#FBF8F2" }
                      : { borderColor: c.color, color: c.color }
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2.5">
            <label className="flex flex-1 flex-col gap-1 text-[12px] text-paper-muted">
              Start
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-2 text-[13.5px] text-paper-ink outline-none"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-[12px] text-paper-muted">
              End
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-2 text-[13.5px] text-paper-ink outline-none"
              />
            </label>
          </div>

          {!isGhost && (
            <div>
              <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Repeat weekly
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PLANNER_DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`rounded-full border px-2.5 py-1.5 text-[12px] font-medium ${
                      repeatDays.includes(d)
                        ? "border-life bg-life text-paper-surface"
                        : "border-paper-border text-paper-muted"
                    }`}
                  >
                    {PLANNER_DAY_SHORT_LABELS[d]}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-paper-muted">
                {repeatDays.length > 0
                  ? "Repeats every week on the days above."
                  : "One-time block, just for this day."}
              </p>
            </div>
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[13.5px] text-paper-ink outline-none"
          />

          {isGhost && ghost && (
            <button
              type="button"
              onClick={() => {
                onEditTemplate(ghost.routineKey);
                onClose();
              }}
              className="self-start text-[12.5px] font-medium text-life underline underline-offset-2"
            >
              ✎ Edit the template instead
            </button>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          {isGhost && ghost && (
            <button
              type="button"
              onClick={() => onHideGhostForToday(ghost)}
              className="rounded-xl border border-[#B5574A] px-4 py-2.5 text-sm font-medium text-[#B5574A]"
            >
              Remove for today
            </button>
          )}
          {!isGhost && onDeleteBlock && (
            <button
              type="button"
              onClick={onDeleteBlock}
              className="rounded-xl border border-[#B5574A] px-4 py-2.5 text-sm font-medium text-[#B5574A]"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-paper-border py-2.5 text-sm font-medium text-paper-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="flex-1 rounded-xl bg-life py-2.5 text-sm font-medium text-paper-surface"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
