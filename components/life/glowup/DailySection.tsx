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
  );
}
