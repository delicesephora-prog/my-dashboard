"use client";

import { GlowUpData, dailyProgress, toggleDaily } from "@/lib/glowup";
import { dateKey } from "@/lib/date";
import GlowUpChecklist from "./GlowUpChecklist";

export default function DailySection({
  data,
  onChange,
}: {
  data: GlowUpData;
  onChange: (updater: (g: GlowUpData) => GlowUpData) => void;
}) {
  const now = new Date();
  const { done, total, pct } = dailyProgress(data, now);
  const doneIds = new Set(data.dailyLogs[dateKey(now)] ?? []);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
          The Scent
        </p>
        <textarea
          value={data.scentNote}
          onChange={(e) => onChange((g) => ({ ...g, scentNote: e.target.value }))}
          rows={4}
          className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 p-2.5 text-[13px] leading-snug text-paper-ink outline-none"
        />
      </div>

      <GlowUpChecklist
        title="Daily Maintenance"
        subtitle={`${done} of ${total} today`}
        items={data.dailyItems}
        doneIds={doneIds}
        pct={pct}
        onToggle={(id) => onChange((g) => toggleDaily(g, id, now))}
        onAdd={(text) =>
          onChange((g) => ({
            ...g,
            dailyItems: [...g.dailyItems, { id: crypto.randomUUID(), text, order: g.dailyItems.length }],
          }))
        }
        onDelete={(id) => onChange((g) => ({ ...g, dailyItems: g.dailyItems.filter((i) => i.id !== id) }))}
      />
    </div>
  );
}
