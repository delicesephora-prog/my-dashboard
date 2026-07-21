"use client";

import { useState } from "react";
import { TimelineEvent } from "@/lib/wedding";

function formatTime(t: string): string {
  if (!t) return "";
  const [hStr, m] = t.split(":");
  const h = Number(hStr);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

export default function TimelineTab({
  events,
  onAdd,
  onDelete,
}: {
  events: TimelineEvent[];
  onAdd: (time: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [time, setTime] = useState("");
  const [text, setText] = useState("");
  const sorted = [...events].sort((a, b) => a.time.localeCompare(b.time));

  function submit() {
    if (!time || !text.trim()) return;
    onAdd(time, text.trim());
    setText("");
  }

  return (
    <div>
      <p className="mb-3 text-[12.5px] text-paper-muted">
        The wedding-day schedule, hour by hour.
      </p>

      <div className="mb-4 flex gap-2">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-28 rounded-lg border border-paper-border bg-paper-surface2 px-2 py-2 text-[13px] text-paper-ink outline-none"
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="e.g. Ceremony begins"
          className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-2 text-[13px] text-paper-ink outline-none"
        />
        <button
          type="button"
          onClick={submit}
          className="shrink-0 rounded-lg bg-life px-3 py-2 text-xs font-medium text-paper-surface"
        >
          Add
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No timeline events yet.
        </p>
      ) : (
        <div className="flex flex-col">
          {sorted.map((e, i) => (
            <div key={e.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-life" />
                {i < sorted.length - 1 && <span className="w-px flex-1 bg-paper-border" />}
              </div>
              <div className="flex flex-1 items-start justify-between gap-2 pb-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-paper-muted">
                    {formatTime(e.time)}
                  </p>
                  <p className="text-[14px] text-paper-ink">{e.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(e.id)}
                  aria-label="Delete event"
                  className="shrink-0 text-paper-faint"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
