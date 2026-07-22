"use client";

import { useState } from "react";
import { DashboardData } from "@/lib/types";
import { FridayLedgerData, computeWeekLedger, reflectionFor, setReflection } from "@/lib/fridayledger";
import { weekKeyFor, shiftWeekKey, formatWeekRange } from "@/lib/week";

export default function FridayLedgerView({
  data,
  onChange,
  onBack,
}: {
  data: DashboardData;
  onChange: (updater: (f: FridayLedgerData) => FridayLedgerData) => void;
  onBack: () => void;
}) {
  const currentWeekKey = weekKeyFor(new Date());
  const [weekKey, setWeekKey] = useState(currentWeekKey);

  const summary = computeWeekLedger(data, weekKey);
  const reflection = reflectionFor(data.fridayLedger, weekKey);
  const isCurrentWeek = weekKey === currentWeekKey;

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
        <h2 className="font-serif text-[1.15rem] text-backdrop-ink">Friday Ledger</h2>
        <p className="mt-0.5 text-[0.8rem] text-backdrop-muted">A real week, summarized from what actually happened.</p>
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

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <div className="grid grid-cols-2 gap-3">
          <Stat value={summary.meetingsHeld} label="Meetings Held" />
          <Stat value={summary.waitingOnResolved} label="Waiting On Resolved" />
          <Stat value={summary.deadlinesHit} label="Deadlines Hit" />
          <Stat value={summary.fireDrills} label="Fires Logged" />
        </div>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Reflection
        </p>
        <textarea
          value={reflection}
          onChange={(e) => onChange((f) => setReflection(f, weekKey, e.target.value))}
          placeholder="How did the week actually go? What would you change?"
          rows={4}
          className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
        />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="font-serif text-2xl text-paper-ink">{value}</div>
      <div className="mt-0.5 text-[0.62rem] uppercase tracking-wide text-paper-muted">{label}</div>
    </div>
  );
}
