"use client";

import { GlowUpData, weeklyProgress, weeklyStreak, toggleWeekly } from "@/lib/glowup";
import { weekKeyFor } from "@/lib/week";
import GlowUpChecklist from "./GlowUpChecklist";

export default function WeeklySection({
  data,
  onChange,
}: {
  data: GlowUpData;
  onChange: (updater: (g: GlowUpData) => GlowUpData) => void;
}) {
  const now = new Date();
  const { done, total, pct } = weeklyProgress(data, now);
  const doneIds = new Set(data.weeklyLogs[weekKeyFor(now)] ?? []);
  const streak = weeklyStreak(data, now);

  return (
    <GlowUpChecklist
      title="The Sunday Reset"
      subtitle={`${done} of ${total} this week`}
      items={data.weeklyItems}
      doneIds={doneIds}
      pct={pct}
      extraHeader={
        streak > 0 ? (
          <p className="mt-2 text-xs font-medium text-glow-dark">
            🔥 {streak} week{streak === 1 ? "" : "s"} in a row
          </p>
        ) : undefined
      }
      onToggle={(id) => onChange((g) => toggleWeekly(g, id, now))}
      onAdd={(text) =>
        onChange((g) => ({
          ...g,
          weeklyItems: [...g.weeklyItems, { id: crypto.randomUUID(), text, order: g.weeklyItems.length }],
        }))
      }
      onDelete={(id) =>
        onChange((g) => ({ ...g, weeklyItems: g.weeklyItems.filter((i) => i.id !== id) }))
      }
    />
  );
}
