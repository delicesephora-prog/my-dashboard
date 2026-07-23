"use client";

import { useState } from "react";
import {
  PlannerBlock,
  PlannerData,
  RoutineGhostBlock,
  addCategory,
  blocksForDate,
  blocksForWeek,
  deleteCategory,
  hideRoutineGhostForDay,
  minutesToTime,
  reorderCategory,
  routineGhostBlocksForDate,
  sortedCategories,
  timeToMinutes,
  toggleBlockDoneOnDate,
  updateCategory,
  upsertRoutineOverride,
} from "@/lib/planner";
import { ROUTINE_KEYS, RoutineKey, RoutinesData, logFor, toggleStepDone } from "@/lib/routines";
import { LifeScoreData } from "@/lib/lifescore";
import { dateKey, formatDayLabel, shiftDateKey, todayKey } from "@/lib/date";
import { formatWeekRange, mondayOf, weekKeyFor } from "@/lib/week";
import DayTimeline from "./DayTimeline";
import WeekTimeline from "./WeekTimeline";
import MonthCalendar from "./MonthCalendar";
import BlockEditorSheet, { BlockEditTarget } from "./BlockEditorSheet";
import CategoryManagerSheet from "./CategoryManagerSheet";
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
  routinesData,
  lifeScore,
  onChange,
  onChangeRoutines,
  onEditRoutineTemplate,
}: {
  data: PlannerData;
  routinesData: RoutinesData;
  lifeScore: LifeScoreData;
  onChange: (updater: (p: PlannerData) => PlannerData) => void;
  onChangeRoutines: (updater: (r: RoutinesData) => RoutinesData) => void;
  onEditRoutineTemplate: (routineKey: RoutineKey) => void;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [viewingDateKey, setViewingDateKey] = useState(todayKey());
  const [editing, setEditing] = useState<BlockEditTarget | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);

  const [y, m, d] = viewingDateKey.split("-").map(Number);
  const viewingDate = new Date(y, m - 1, d);
  const isToday = viewingDateKey === todayKey();

  const blocks = blocksForDate(data, viewingDate);
  const ghosts = routineGhostBlocksForDate(routinesData.config, data.routineOverrides, viewingDate);
  const weekDays = blocksForWeek(data, mondayOf(viewingDate));

  const doneBlockIds = new Set(data.completedBlockDays[viewingDateKey] ?? []);
  const dayLog = logFor(routinesData, viewingDateKey);
  const doneGhostIds = new Set(
    ROUTINE_KEYS.flatMap((rk) => (dayLog.completedStepIds[rk] ?? []).map((stepId) => `${rk}:${stepId}`))
  );

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
      category: sortedCategories(data.categories)[0]?.id ?? "work",
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

  function toggleBlockDone(block: PlannerBlock) {
    onChange((p) => toggleBlockDoneOnDate(p, block.id, viewingDateKey));
  }

  // Ghost completion is the same state Rituals tracks - checking it off
  // here checks it off there too. Routines only ever allow writing to
  // today's log, so this is a no-op on past/future days.
  function toggleGhostDone(ghost: RoutineGhostBlock) {
    if (!isToday) return;
    onChangeRoutines((r) => toggleStepDone(r, ghost.routineKey, ghost.sourceStepId));
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-backdrop-muted">Planner</p>
          <p className="font-serif text-[1.05rem] text-backdrop-ink">
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
            onClick={() => setManagingCategories(true)}
            aria-label="Manage categories"
            className="ml-auto rounded-full border border-paper-border px-3 py-1.5 text-[12.5px] text-paper-muted"
          >
            ● Categories
          </button>
          <button
            type="button"
            onClick={() => setEditing({ kind: "block", block: null })}
            className="rounded-full bg-life px-3.5 py-1.5 text-[12.5px] font-medium text-paper-surface"
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
          categories={data.categories}
          doneBlockIds={doneBlockIds}
          doneGhostIds={doneGhostIds}
          onEditBlock={(block) => setEditing({ kind: "block", block })}
          onEditGhost={(ghost) => setEditing({ kind: "ghost", ghost })}
          onQuickCreate={quickCreateBlock}
          onMoveBlock={moveBlock}
          onMoveGhost={moveGhost}
          onToggleBlockDone={toggleBlockDone}
          onToggleGhostDone={toggleGhostDone}
        />
      )}

      {viewMode === "week" && (
        <WeekTimeline
          days={weekDays}
          categories={data.categories}
          onEditBlock={(block) => setEditing({ kind: "block", block })}
          onJumpToDay={jumpToDay}
        />
      )}

      {viewMode === "month" && (
        <MonthCalendar data={data} year={viewingDate.getFullYear()} month={viewingDate.getMonth()} onJumpToDay={jumpToDay} />
      )}

      {viewMode === "pixels" && <YearPixelsView lifeScore={lifeScore} />}

      {editing && (
        <BlockEditorSheet
          target={editing}
          defaultDate={viewingDateKey}
          categories={data.categories}
          onSaveBlock={saveBlock}
          onDeleteBlock={editing.kind === "block" && editing.block ? () => deleteBlock(editing.block!.id) : undefined}
          onSaveGhostOverride={saveGhostOverride}
          onHideGhostForToday={hideGhostForToday}
          onEditTemplate={onEditRoutineTemplate}
          onManageCategories={() => setManagingCategories(true)}
          onClose={() => setEditing(null)}
        />
      )}

      {managingCategories && (
        <CategoryManagerSheet
          categories={data.categories}
          onAdd={(label, color) => onChange((p) => addCategory(p, label, color))}
          onUpdate={(id, label, color) =>
            onChange((p) => updateCategory(p, id, (c) => ({ ...c, label, color })))
          }
          onDelete={(id) => onChange((p) => deleteCategory(p, id))}
          onReorder={(id, direction) => onChange((p) => reorderCategory(p, id, direction))}
          onClose={() => setManagingCategories(false)}
        />
      )}
    </div>
  );
}
