"use client";

import { useState } from "react";
import {
  PLANNER_CATEGORIES,
  PLANNER_CATEGORY_COLORS,
  PLANNER_DAYS,
  PLANNER_DAY_SHORT_LABELS,
  PlannerBlock,
  PlannerCategory,
  PlannerDayKey,
} from "@/lib/planner";

export default function BlockEditorSheet({
  block,
  defaultDate,
  onSave,
  onDelete,
  onClose,
}: {
  block: PlannerBlock | null;
  defaultDate: string;
  onSave: (block: PlannerBlock) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(block?.title ?? "");
  const [category, setCategory] = useState<PlannerCategory>(block?.category ?? "Work");
  const [notes, setNotes] = useState(block?.notes ?? "");
  const [startTime, setStartTime] = useState(block?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(block?.endTime ?? "09:30");
  const [repeatDays, setRepeatDays] = useState<PlannerDayKey[]>(block?.repeatDays ?? []);

  function toggleDay(day: PlannerDayKey) {
    setRepeatDays((days) => (days.includes(day) ? days.filter((d) => d !== day) : [...days, day]));
  }

  function submit() {
    if (!title.trim()) return;
    onSave({
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
        <p className="mb-4 font-serif text-[1.1rem] text-paper-ink">{block ? "Edit Block" : "New Block"}</p>

        <div className="flex flex-col gap-3.5">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's this block?"
            className="rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[14px] text-paper-ink outline-none"
          />

          <div>
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Category
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PLANNER_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className="rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition"
                  style={
                    category === c
                      ? {
                          backgroundColor: PLANNER_CATEGORY_COLORS[c],
                          borderColor: PLANNER_CATEGORY_COLORS[c],
                          color: "#FBF8F2",
                        }
                      : { borderColor: PLANNER_CATEGORY_COLORS[c], color: PLANNER_CATEGORY_COLORS[c] }
                  }
                >
                  {c}
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

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[13.5px] text-paper-ink outline-none"
          />
        </div>

        <div className="mt-5 flex gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
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
