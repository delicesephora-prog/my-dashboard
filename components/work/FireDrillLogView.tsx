"use client";

import { useState } from "react";
import {
  FireDrillLogData,
  addEntry,
  deleteEntry,
  newFireDrillEntry,
  entriesThisMonth,
  sortedEntries,
  updateEntry,
} from "@/lib/firedrill";
import { dateKey } from "@/lib/date";

export default function FireDrillLogView({
  fireDrillLog,
  onChange,
  onBack,
}: {
  fireDrillLog: FireDrillLogData;
  onChange: (updater: (f: FireDrillLogData) => FireDrillLogData) => void;
  onBack: () => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(dateKey(new Date()));
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const now = new Date();
  const list = sortedEntries(fireDrillLog);
  const thisMonthCount = entriesThisMonth(fireDrillLog, now).length;

  function addNew() {
    if (!title.trim() || !date) return;
    const e = newFireDrillEntry(title.trim(), date);
    onChange((data) => addEntry(data, e));
    setTitle("");
    setExpandedId(e.id);
  }

  return (
    <div className="scroll-quiet flex flex-1 flex-col gap-3 overflow-y-auto pb-6">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to Ops"
        className="flex items-center gap-1.5 self-start text-[12px] text-paper-muted"
      >
        <span>←</span> Ops
      </button>

      <div>
        <h2 className="font-serif text-[1.15rem] text-paper-ink">Fire Drill Log</h2>
        <p className="mt-0.5 text-[0.8rem] text-paper-muted">
          {thisMonthCount} logged this month. What broke, how it got fixed, what to remember.
        </p>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What happened, in a few words"
          className="mb-2 w-full rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[14px] text-paper-ink outline-none focus:border-work"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none"
          />
          <button
            type="button"
            onClick={addNew}
            className="shrink-0 rounded-lg bg-work px-4 py-2 text-[13px] font-medium text-paper-surface active:scale-95"
          >
            Log it
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="py-3 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No fires logged. Long may that continue.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((e) => {
            const expanded = expandedId === e.id;
            return (
              <div key={e.id} className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : e.id)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-paper-ink">{e.title}</p>
                    <p className="mt-0.5 text-[11px] text-paper-muted">{e.date}</p>
                  </div>
                  <span className="shrink-0 text-paper-faint">{expanded ? "︿" : "﹀"}</span>
                </button>
                {expanded && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-paper-border pt-3">
                    <Field
                      label="What happened"
                      value={e.whatHappened}
                      onChange={(v) => onChange((data) => updateEntry(data, e.id, (x) => ({ ...x, whatHappened: v })))}
                    />
                    <Field
                      label="How it was resolved"
                      value={e.howResolved}
                      onChange={(v) => onChange((data) => updateEntry(data, e.id, (x) => ({ ...x, howResolved: v })))}
                    />
                    <Field
                      label="Lesson learned"
                      value={e.lessonLearned}
                      onChange={(v) => onChange((data) => updateEntry(data, e.id, (x) => ({ ...x, lessonLearned: v })))}
                    />
                    <button
                      type="button"
                      onClick={() => onChange((data) => deleteEntry(data, e.id))}
                      className="self-start text-[11px] text-paper-faint"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-paper-muted">{label}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
      />
    </div>
  );
}
