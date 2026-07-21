"use client";

import { DashboardData } from "@/lib/types";
import { openItems, overdueItems } from "@/lib/waitingon";
import { activeVendors } from "@/lib/vendors";
import { completionForDate } from "@/lib/workshutdown";
import { isDateInWeek } from "@/lib/week";
import { weekKeyFor } from "@/lib/week";

export type OpsTool = "waitingOn" | "workShutdown" | "vendors";

type Tile = {
  tool: OpsTool | null;
  icon: string;
  title: string;
  wave: 1 | 2 | 3;
};

const TILES: Tile[] = [
  { tool: "waitingOn", icon: "🕓", title: "Waiting On", wave: 1 },
  { tool: "workShutdown", icon: "🌙", title: "Work Shutdown", wave: 1 },
  { tool: "vendors", icon: "🤝", title: "Vendors", wave: 1 },
  { tool: null, icon: "📋", title: "Meeting Ops", wave: 2 },
  { tool: null, icon: "👤", title: "Principals", wave: 2 },
  { tool: null, icon: "❓", title: "Question Bank", wave: 2 },
  { tool: null, icon: "📑", title: "Templates", wave: 2 },
  { tool: null, icon: "⏱️", title: "My Numbers", wave: 3 },
  { tool: null, icon: "🎯", title: "Pre-Mortem", wave: 3 },
  { tool: null, icon: "🔥", title: "Fire Drill Log", wave: 3 },
  { tool: null, icon: "🧾", title: "Friday Ledger", wave: 3 },
  { tool: null, icon: "📅", title: "Events", wave: 3 },
];

const WAVE_TAG_CLASS: Record<1 | 2 | 3, string> = {
  1: "bg-sage-soft text-[#4E5F44]",
  2: "bg-gold-soft text-[#7A5D2E]",
  3: "bg-work-soft text-work",
};

export default function OpsHub({
  data,
  onOpenTool,
}: {
  data: DashboardData;
  onOpenTool: (tool: OpsTool) => void;
}) {
  const now = new Date();
  const open = openItems(data.waitingOn);
  const overdue = overdueItems(data.waitingOn, now);
  const weekKey = weekKeyFor(now);
  const deadlinesThisWeek = data.workOps.tasks.filter(
    (t) => t.status !== "completed" && t.dueDate && isDateInWeek(t.dueDate, weekKey)
  ).length;
  const shutdown = completionForDate(data.workShutdown, now);
  const vendorCount = activeVendors(data.vendors).length;

  function statFor(tile: Tile): { text: string; className: string } {
    if (tile.tool === "waitingOn") {
      return open.length === 0
        ? { text: "nothing pending", className: "text-paper-muted" }
        : { text: `${open.length} pending`, className: "text-work font-semibold" };
    }
    if (tile.tool === "workShutdown") {
      return shutdown.total === 0
        ? { text: "not set up", className: "text-paper-muted" }
        : { text: `${shutdown.done}/${shutdown.total} today`, className: "text-paper-muted" };
    }
    if (tile.tool === "vendors") {
      return vendorCount === 0
        ? { text: "none saved yet", className: "text-paper-muted" }
        : { text: `${vendorCount} saved`, className: "text-paper-muted" };
    }
    return { text: "coming soon", className: "text-paper-faint" };
  }

  return (
    <div className="scroll-quiet flex flex-1 flex-col gap-4 overflow-y-auto pb-6">
      <div className="rounded-xl2 bg-work p-4 pb-3.5 shadow-paper-lg">
        <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#E6B98A]">
          This Week Radar
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="font-serif text-2xl leading-none text-paper-surface">{open.length}</div>
            <div className="mt-1 text-[9.5px] uppercase tracking-wide text-work-soft">Waiting On</div>
          </div>
          <div className="text-center">
            <div className="font-serif text-2xl leading-none text-paper-surface">{deadlinesThisWeek}</div>
            <div className="mt-1 text-[9.5px] uppercase tracking-wide text-work-soft">
              Deadlines This Week
            </div>
          </div>
        </div>
        {overdue.length > 0 && (
          <div className="mt-3 flex items-start gap-1.5 border-t border-paper-surface/15 pt-3 text-[12px] italic text-[#F1DCC9]">
            <span className="shrink-0">🔺</span>
            <span>
              {overdue.length} overdue — {overdue[0].who}: {overdue[0].what}
              {overdue.length > 1 ? ` (+${overdue.length - 1} more)` : ""}
            </span>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Ops Tools
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TILES.map((tile) => {
            const stat = statFor(tile);
            const enabled = tile.tool !== null;
            return (
              <button
                key={tile.title}
                type="button"
                disabled={!enabled}
                onClick={() => tile.tool && onOpenTool(tile.tool)}
                className={`rounded-xl2 border border-paper-border bg-paper-surface p-3 text-left shadow-paper transition ${
                  enabled ? "active:scale-[0.97]" : "opacity-60"
                }`}
              >
                <span className="mb-1.5 block text-[17px]">{tile.icon}</span>
                <div className="text-[13px] font-semibold text-paper-ink">{tile.title}</div>
                <div className={`mt-0.5 text-[11px] ${stat.className}`}>{stat.text}</div>
                <span
                  className={`mt-1.5 inline-block rounded px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide ${WAVE_TAG_CLASS[tile.wave]}`}
                >
                  {tile.wave === 1 ? "Wave 1" : tile.wave === 2 ? "Wave 2 — soon" : "Wave 3 — soon"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
