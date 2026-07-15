"use client";

import { useState } from "react";
import { PlannerBlock, PlannerData, blocksForDate, routineGhostBlocksForDate } from "@/lib/planner";
import { RoutinesConfig } from "@/lib/routines";
import { formatDayLabel, shiftDateKey, todayKey } from "@/lib/date";
import DayTimeline from "./DayTimeline";
import BlockEditorSheet from "./BlockEditorSheet";

export default function PlannerView({
  data,
  routinesConfig,
  onChange,
}: {
  data: PlannerData;
  routinesConfig: RoutinesConfig;
  onChange: (updater: (p: PlannerData) => PlannerData) => void;
}) {
  const [viewingDateKey, setViewingDateKey] = useState(todayKey());
  const [editing, setEditing] = useState<{ block: PlannerBlock | null } | null>(null);

  const [y, m, d] = viewingDateKey.split("-").map(Number);
  const viewingDate = new Date(y, m - 1, d);
  const isToday = viewingDateKey === todayKey();

  const blocks = blocksForDate(data, viewingDate);
  const ghosts = routineGhostBlocksForDate(routinesConfig, viewingDate);

  function saveBlock(block: PlannerBlock) {
    onChange((p) => {
      const exists = p.blocks.some((b) => b.id === block.id);
      return {
        blocks: exists ? p.blocks.map((b) => (b.id === block.id ? block : b)) : [...p.blocks, block],
      };
    });
    setEditing(null);
  }

  function deleteBlock(id: string) {
    onChange((p) => ({ blocks: p.blocks.filter((b) => b.id !== id) }));
    setEditing(null);
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">Planner</p>
          <p className="font-serif text-[1.05rem] text-paper-ink">
            {isToday ? "Today" : formatDayLabel(viewingDateKey)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Previous day"
            onClick={() => setViewingDateKey(shiftDateKey(viewingDateKey, -1))}
            className="rounded-full border border-paper-border px-2.5 py-1.5 text-paper-muted"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next day"
            onClick={() => setViewingDateKey(shiftDateKey(viewingDateKey, 1))}
            className="rounded-full border border-paper-border px-2.5 py-1.5 text-paper-muted"
          >
            →
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {!isToday && (
          <button
            type="button"
            onClick={() => setViewingDateKey(todayKey())}
            className="rounded-full border border-paper-border px-3 py-1.5 text-[12.5px] text-paper-muted"
          >
            Today
          </button>
        )}
        <button
          type="button"
          onClick={() => setViewingDateKey(shiftDateKey(todayKey(), 1))}
          className="rounded-full border border-life px-3 py-1.5 text-[12.5px] font-medium text-life"
        >
          Plan Tomorrow →
        </button>
        <button
          type="button"
          onClick={() => setEditing({ block: null })}
          className="ml-auto rounded-full bg-life px-3.5 py-1.5 text-[12.5px] font-medium text-paper-surface"
        >
          + Add Block
        </button>
      </div>

      <DayTimeline
        dateKeyStr={viewingDateKey}
        isToday={isToday}
        blocks={blocks}
        ghosts={ghosts}
        onEditBlock={(block) => setEditing({ block })}
      />

      {editing && (
        <BlockEditorSheet
          block={editing.block}
          defaultDate={viewingDateKey}
          onSave={saveBlock}
          onDelete={editing.block ? () => deleteBlock(editing.block!.id) : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
