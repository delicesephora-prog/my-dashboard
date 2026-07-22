"use client";

import { useState } from "react";
import { MemosData, memoFor, setMemo } from "@/lib/memos";
import { weekKeyFor, shiftWeekKey, formatWeekRange } from "@/lib/week";

export default function MemosView({
  data,
  onChange,
}: {
  data: MemosData;
  onChange: (updater: (m: MemosData) => MemosData) => void;
}) {
  const currentWeekKey = weekKeyFor(new Date());
  const [weekKey, setWeekKey] = useState(currentWeekKey);
  const isCurrentWeek = weekKey === currentWeekKey;
  const memo = memoFor(data, weekKey);

  return (
    <div className="scroll-quiet flex flex-1 flex-col gap-3 overflow-y-auto pb-6">
      <div>
        <h2 className="font-serif text-[1.15rem] text-backdrop-ink">Weekly Memos</h2>
        <p className="mt-0.5 text-[0.8rem] text-backdrop-muted">
          A running note to yourself, one per week.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl2 border border-paper-border bg-paper-surface px-3 py-2 shadow-paper">
        <button
          type="button"
          onClick={() => setWeekKey((w) => shiftWeekKey(w, -1))}
          aria-label="Previous week"
          className="px-2 text-paper-muted"
        >
          ‹
        </button>
        <span className="text-[13px] font-medium text-paper-ink">
          {formatWeekRange(weekKey)}
          {isCurrentWeek && <span className="ml-1.5 text-[10px] text-gold">this week</span>}
        </span>
        <button
          type="button"
          onClick={() => setWeekKey((w) => shiftWeekKey(w, 1))}
          aria-label="Next week"
          className="px-2 text-paper-muted"
        >
          ›
        </button>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <textarea
          value={memo}
          onChange={(e) => onChange((m) => setMemo(m, weekKey, e.target.value))}
          placeholder="Whatever's worth remembering about this week - decisions, moods, things to revisit later."
          rows={12}
          className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13.5px] leading-relaxed text-paper-ink outline-none focus:border-life"
        />
      </div>
    </div>
  );
}
