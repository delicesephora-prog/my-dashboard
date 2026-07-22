"use client";

import { useState } from "react";
import {
  PlannerBlock,
  PlannerData,
  RoutineGhostBlock,
  blocksForDate,
  blocksForWeek,
  hideRoutineGhostForDay,
  minutesToTime,
  routineGhostBlocksForDate,
  timeToMinutes,
  upsertRoutineOverride,
} from "@/lib/planner";
import { RoutineKey, RoutinesConfig } from "@/lib/routines";
import { LifeScoreData } from "@/lib/lifescore";
import { dateKey, formatDayLabel, shiftDateKey, todayKey } from "@/lib/date";
import { formatWeekRange, mondayOf, weekKeyFor } from "@/lib/week";
import DayTimeline from "./DayTimeline";
import WeekTimeline from "./WeekTimeline";
import MonthCalendar from "./MonthCalendar";
import BlockEditorSheet, { BlockEditTarget } from "./BlockEditorSheet";
import YearPixelsView from "../YearPixelsView";

type ViewMode = "day" | "week" | "month" | "pixels";

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "pixels", label: "Year in Pixels" },
];

export default function PlannerView({
  data,
  routinesConfig,
  lifeScore,
  onChange,
  onEditRoutineTemplate,
}: {
  data: PlannerData;
  routinesConfig: RoutinesConfig;
  lifeScore: LifeScoreData;
  onChange: (updater: (p: PlannerData) => PlannerData) => void;
  onEditRoutineTemplate: (routineKey: RoutineKey) => void;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [viewingDateKey, setViewingDateKey] = useState(todayKey());
  const [editing, setEditing] = useState<BlockEditTarget | null>(null);

  const [y, m, d] = viewingDateKey.split("-").map(Number);
  const viewingDate = new Date(y, m - 1, d);
  const isToday = viewingDateKey === todayKey();

  const blocks = blocksForDate(data, viewingDate);
  const ghosts = routineGhostBlocksForDate(routinesConfig, data.routineOverrides, viewingDate);
  const weekDays = blocksForWeek(data, mondayOf(viewingDate));

  function jumpToDay(dateKeyStr: string) {
    setViewingDateKey(dateKeyStr);
    setViewMode("day");
  }

  function shiftMonthAnchor(dateStr: string, deltaMonths: number): string {
    const [ay, am] = dateStr.split("-").map(Number);
    return dateKey(new Date(ay, am - 1 + deltaMonths, 1));
  }

  function shiftView(delta: number) {
    if (viewMode === "week") setViewingDateKey(shiftDateKey(viewingDateKey, delta * 7));
    else if (viewMode === "month") setViewingDateKey(shiftMonthAnchor(viewingDateKey, delta));
    else setViewingDateKey(shiftDateKey(viewingDateKey, delta));
  }

  function saveBlock(block: PlannerBlock) {
    onChange((p) => {
      const exists = p.blocks.some((b) => b.id === block.id);
      return {
        ...p,
        blocks: exists ? p.blocks.map((b) => (b.id === block.id ? block : b)) : [...p.blocks, block],
      };
    });
    setEditing(null);
  }

  function deleteBlock(id: string) {
    onChange((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== id) }));
    setEditing(null);
  }

  function saveGhostOverride(
    ghost: RoutineGhostBlock,
    fields: { title: string; category: PlannerBlock["category"]; notes: string; startTime: string; durationMinutes: number }
  ) {
    onChange((p) =>
      upsertRoutineOverride(p, {
        id: ghost.id,
        dateKeyStr: viewingDateKey,
        hidden: false,
        ...fields,
      })
    );
    setEditing(null);
  }

  function hideGhostForToday(ghost: RoutineGhostBlock) {
    onChange((p) => hideRoutineGhostForDay(p, ghost, viewingDateKey));
    setEditing(null);
  }

  function quickCreateBlock(startMin: number, endMin: number, title: string) {
    const block: PlannerBlock = {
      id: crypto.randomUUID(),
      title,
      category: "Work",
      notes: "",
      startTime: minutesToTime(startMin),
      endTime: minutesToTime(endMin),
      repeatDays: [],
      date: viewingDateKey,
    };
    onChange((p) => ({ ...p, blocks: [...p.blocks, block] }));
  }

  function moveBlock(block: PlannerBlock, newStartMin: number) {
    const durationMin = Math.max(timeToMinutes(block.endTime) - timeToMinutes(block.startTime), 15);
    const updated: PlannerBlock = {
      ...block,
      startTime: minutesToTime(newStartMin),
      endTime: minutesToTime(newStartMin + durationMin),
    };
    onChange((p) => ({ ...p, blocks: p.blocks.map((b) => (b.id === block.id ? updated : b)) }));
  }

  function moveGhost(ghost: RoutineGhostBlock, newStartMin: number) {
    onChange((p) =>
      upsertRoutineOverride(p, {
        id: ghost.id,
        dateKeyStr: viewingDateKey,
        hidden: false,
        title: ghost.title,
        category: ghost.category,
        notes: ghost.notes,
        startTime: minutesToTime(newStartMin),
        durationMinutes: ghost.durationMinutes,
      })
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">Planner</p>
          <p className="font-serif text-[1.05rem] text-paper-ink">
            {viewMode === "day" && (isToday ? "Today" : formatDayLabel(viewingDateKey))}
            {viewMode === "week" && formatWeekRange(weekKeyFor(viewingDate))}
            {viewMode === "month" &&
              viewingDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            {viewMode === "pixels" && "Year in Pixels"}
          </p>
        </div>
        {viewMode !== "pixels" && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => shiftView(-1)}
              className="rounded-full border border-paper-border px-2.5 py-1.5 text-paper-muted"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => shiftView(1)}
              className="rounded-full border border-paper-border px-2.5 py-1.5 text-paper-muted"
            >
              →
            </button>
          </div>
        )}
      </div>

      <div className="mb-3 flex gap-1.5 overflow-x-auto">
        {VIEW_MODES.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setViewMode(v.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              viewMode === v.key
                ? "bg-life text-paper-surface"
                : "border border-paper-border bg-paper-surface text-paper-muted"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {viewMode !== "pixels" && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {viewMode === "day" && !isToday && (
            <button
              type="button"
              onClick={() => setViewingDateKey(todayKey())}
              className="rounded-full border border-paper-border px-3 py-1.5 text-[12.5px] text-paper-muted"
            >
              Today
            </button>
          )}
          {viewMode === "day" && (
            <button
              type="button"
              onClick={() => setViewingDateKey(shiftDateKey(todayKey(), 1))}
              className="rounded-full border border-life px-3 py-1.5 text-[12.5px] font-medium text-life"
            >
              Plan Tomorrow →
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing({ kind: "block", block: null })}
            className="ml-auto rounded-full bg-life px-3.5 py-1.5 text-[12.5px] font-medium text-paper-surface"
          >
            + Add Block
          </button>
        </div>
      )}

      {viewMode === "day" && (
        <DayTimeline
          dateKeyStr={viewingDateKey}
          isToday={isToday}
          blocks={blocks}
          ghosts={ghosts}
          onEditBlock={(block) => setEditing({ kind: "block", block })}
          onEditGhost={(ghost) => setEditing({ kind: "ghost", ghost })}
          onQuickCreate={quickCreateBlock}
          onMoveBlock={moveBlock}
          onMoveGhost={moveGhost}
        />
      )}

      {viewMode === "week" && <WeekTimeline days={weekDays} onEditBlock={(block) => setEditing({ kind: "block", block })} onJumpToDay={jumpToDay} />}

      {viewMode === "month" && (
        <MonthCalendar data={data} year={viewingDate.getFullYear()} month={viewingDate.getMonth()} onJumpToDay={jumpToDay} />
      )}

      {viewMode === "pixels" && <YearPixelsView lifeScore={lifeScore} />}

      {editing && (
        <BlockEditorSheet
          target={editing}
          defaultDate={viewingDateKey}
          onSaveBlock={saveBlock}
          onDeleteBlock={editing.kind === "block" && editing.block ? () => deleteBlock(editing.block!.id) : undefined}
          onSaveGhostOverride={saveGhostOverride}
          onHideGhostForToday={hideGhostForToday}
          onEditTemplate={onEditRoutineTemplate}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
