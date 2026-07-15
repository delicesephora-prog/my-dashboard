"use client";

import { useState } from "react";
import {
  RHYTHM_DAYS,
  RHYTHM_DAY_LABELS,
  RHYTHM_DAY_TYPE_LABELS,
  RhythmAnchor,
  RhythmData,
  RhythmDayKey,
} from "@/lib/rhythm";

export default function RhythmView({
  rhythmData,
  onChange,
}: {
  rhythmData: RhythmData;
  onChange: (updater: (r: RhythmData) => RhythmData) => void;
}) {
  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="mb-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Rhythm
        </p>
        <p className="font-serif text-[1.05rem] text-paper-ink">Your ideal week</p>
        <p className="mt-1 text-[12px] text-paper-muted">
          Not an hourly schedule - just the anchors that hold each day together.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {RHYTHM_DAYS.map((dayKey) => (
          <DayCard
            key={dayKey}
            dayKey={dayKey}
            anchors={rhythmData.days[dayKey]}
            onChange={(updater) =>
              onChange((r) => ({ ...r, days: { ...r.days, [dayKey]: updater(r.days[dayKey]) } }))
            }
          />
        ))}
      </div>
    </div>
  );
}

function DayCard({
  dayKey,
  anchors,
  onChange,
}: {
  dayKey: RhythmDayKey;
  anchors: RhythmAnchor[];
  onChange: (updater: (a: RhythmAnchor[]) => RhythmAnchor[]) => void;
}) {
  const [text, setText] = useState("");
  const sorted = [...anchors].sort((a, b) => a.order - b.order);

  function addAnchor() {
    if (!text.trim()) return;
    const newAnchor: RhythmAnchor = { id: crypto.randomUUID(), text: text.trim(), order: anchors.length };
    onChange((a) => [...a, newAnchor]);
    setText("");
  }

  function updateText(id: string, newText: string) {
    onChange((a) => a.map((x) => (x.id === id ? { ...x, text: newText } : x)));
  }

  function deleteAnchor(id: string) {
    onChange((a) => a.filter((x) => x.id !== id));
  }

  function moveAnchor(id: string, direction: -1 | 1) {
    const idx = sorted.findIndex((x) => x.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    onChange(() => reordered.map((a, i) => ({ ...a, order: i })));
  }

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-serif text-[1rem] text-paper-ink">{RHYTHM_DAY_LABELS[dayKey]}</p>
        <span className="rounded-full border border-paper-border px-2 py-0.5 text-[10px] text-paper-muted">
          {RHYTHM_DAY_TYPE_LABELS[dayKey]}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className="mb-2 text-[13px] italic text-paper-muted">No anchors set for this day yet.</p>
      ) : (
        <ul className="mb-2 flex flex-col gap-1.5">
          {sorted.map((a, i) => (
            <li key={a.id} className="flex items-center gap-2">
              <input
                value={a.text}
                onChange={(e) => updateText(a.id, e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-2 text-[13.5px] text-paper-ink outline-none"
              />
              {a.conditional === "payday" && (
                <span className="shrink-0 text-[10px] text-paper-muted" title="Only shows on actual paydays">
                  💰
                </span>
              )}
              <div className="flex shrink-0 items-center gap-1">
                {i > 0 && (
                  <button type="button" onClick={() => moveAnchor(a.id, -1)} className="text-paper-faint">
                    ↑
                  </button>
                )}
                {i < sorted.length - 1 && (
                  <button type="button" onClick={() => moveAnchor(a.id, 1)} className="text-paper-faint">
                    ↓
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Delete anchor"
                  onClick={() => deleteAnchor(a.id)}
                  className="pl-0.5 text-paper-faint"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addAnchor();
          }}
          placeholder="Add an anchor…"
          className="min-w-0 flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-2 text-[13px] text-paper-ink outline-none"
        />
        <button
          type="button"
          onClick={addAnchor}
          className="rounded-lg bg-life px-3 text-sm text-paper-surface"
        >
          +
        </button>
      </div>
    </div>
  );
}
