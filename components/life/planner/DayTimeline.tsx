"use client";

import { useEffect, useRef, useState } from "react";
import {
  PLANNER_CATEGORIES,
  PLANNER_CATEGORY_COLORS,
  PlannerBlock,
  PlannerCategory,
  RoutineGhostBlock,
  layoutByTime,
  timeToMinutes,
} from "@/lib/planner";
import CheckCircle from "../../CheckCircle";

const START_HOUR = 6;
const END_HOUR = 23;
const HOUR_HEIGHT = 56;
const TOTAL_MIN = (END_HOUR - START_HOUR) * 60;
const TOTAL_HEIGHT = (TOTAL_MIN / 60) * HOUR_HEIGHT;
const GHOST_COLOR = "#A9A296";
const NOW_COLOR = "#B5574A";
const SNAP_MIN = 15;
const LONG_PRESS_MS = 450;
const MOVE_THRESHOLD_PX = 6;
const DEFAULT_QUICK_DURATION = 30;

function clampMin(min: number): number {
  return Math.min(Math.max(min - START_HOUR * 60, 0), TOTAL_MIN);
}

function clampAbsoluteMin(min: number): number {
  return Math.min(Math.max(min, START_HOUR * 60), END_HOUR * 60);
}

function snap(min: number): number {
  return Math.round(min / SNAP_MIN) * SNAP_MIN;
}

function topFor(min: number): number {
  return (clampMin(min) / 60) * HOUR_HEIGHT;
}

type TimelineItem = {
  id: string;
  title: string;
  icon: string;
  isGhost: boolean;
  category: PlannerCategory | null;
  startMin: number;
  endMin: number;
  block: PlannerBlock | null;
  ghost: RoutineGhostBlock | null;
  done: boolean;
  canToggleDone: boolean;
};

export default function DayTimeline({
  dateKeyStr,
  isToday,
  blocks,
  ghosts,
  doneBlockIds,
  doneGhostIds,
  onEditBlock,
  onEditGhost,
  onQuickCreate,
  onMoveBlock,
  onMoveGhost,
  onToggleBlockDone,
  onToggleGhostDone,
}: {
  dateKeyStr: string;
  isToday: boolean;
  blocks: PlannerBlock[];
  ghosts: RoutineGhostBlock[];
  doneBlockIds: Set<string>;
  doneGhostIds: Set<string>;
  onEditBlock: (block: PlannerBlock) => void;
  onEditGhost: (ghost: RoutineGhostBlock) => void;
  onQuickCreate: (startMin: number, endMin: number, title: string) => void;
  onMoveBlock: (block: PlannerBlock, newStartMin: number) => void;
  onMoveGhost: (ghost: RoutineGhostBlock, newStartMin: number) => void;
  onToggleBlockDone: (block: PlannerBlock) => void;
  onToggleGhostDone: (ghost: RoutineGhostBlock) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // Empty-space tap/drag-to-create.
  const createOrigin = useRef<{ clientY: number; min: number } | null>(null);
  const [createDragMin, setCreateDragMin] = useState<number | null>(null);
  const [quickCreate, setQuickCreate] = useState<{ startMin: number; endMin: number } | null>(null);
  const [quickTitle, setQuickTitle] = useState("");

  // Long-press-drag-to-move on an existing item.
  const pressOrigin = useRef<{ clientY: number; itemId: string; startMin: number } | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const [moving, setMoving] = useState<{ id: string; deltaMin: number } | null>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const target = isToday ? nowMin : 8 * 60;
    scrollRef.current.scrollTop = Math.max(topFor(target) - 80, 0);
    // Only re-scroll when the viewed day changes, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKeyStr]);

  function minutesFromClientY(clientY: number): number {
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return START_HOUR * 60;
    const relY = clientY - rect.top;
    return clampAbsoluteMin(START_HOUR * 60 + (relY / HOUR_HEIGHT) * 60);
  }

  function resetCreateGesture() {
    createOrigin.current = null;
    setCreateDragMin(null);
  }

  function handleBackgroundPointerDown(e: React.PointerEvent) {
    if (quickCreate || moving) return;
    createOrigin.current = { clientY: e.clientY, min: snap(minutesFromClientY(e.clientY)) };
  }

  function handleBackgroundPointerMove(e: React.PointerEvent) {
    if (!createOrigin.current) return;
    const dy = Math.abs(e.clientY - createOrigin.current.clientY);
    if (dy > MOVE_THRESHOLD_PX) {
      e.preventDefault();
      setCreateDragMin(snap(minutesFromClientY(e.clientY)));
    }
  }

  function handleBackgroundPointerUp() {
    if (!createOrigin.current) return;
    const startMin = createOrigin.current.min;
    const dragMin = createDragMin;
    resetCreateGesture();
    if (dragMin === null) {
      setQuickCreate({ startMin, endMin: startMin + DEFAULT_QUICK_DURATION });
    } else {
      const a = Math.min(startMin, dragMin);
      const b = Math.max(startMin, dragMin);
      setQuickCreate({ startMin: a, endMin: Math.max(b, a + SNAP_MIN) });
    }
    setQuickTitle("");
  }

  function confirmQuickCreate() {
    if (!quickCreate) return;
    const title = quickTitle.trim();
    if (title) onQuickCreate(quickCreate.startMin, quickCreate.endMin, title);
    setQuickCreate(null);
    setQuickTitle("");
  }

  function cancelQuickCreate() {
    setQuickCreate(null);
    setQuickTitle("");
  }

  function handleItemPointerDown(e: React.PointerEvent, item: TimelineItem) {
    e.stopPropagation();
    pressOrigin.current = { clientY: e.clientY, itemId: item.id, startMin: item.startMin };
    didDragRef.current = false;
    const pointerId = e.pointerId;
    const target = e.currentTarget;
    longPressTimer.current = window.setTimeout(() => {
      if (!pressOrigin.current || pressOrigin.current.itemId !== item.id) return;
      setMoving({ id: item.id, deltaMin: 0 });
      target.setPointerCapture?.(pointerId);
    }, LONG_PRESS_MS);
  }

  function handleItemPointerMove(e: React.PointerEvent, item: TimelineItem) {
    if (!pressOrigin.current || pressOrigin.current.itemId !== item.id) return;
    const dy = e.clientY - pressOrigin.current.clientY;
    if (!moving || moving.id !== item.id) {
      if (Math.abs(dy) > MOVE_THRESHOLD_PX && longPressTimer.current) {
        window.clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        pressOrigin.current = null;
      }
      return;
    }
    e.preventDefault();
    didDragRef.current = true;
    setMoving({ id: item.id, deltaMin: snap((dy / HOUR_HEIGHT) * 60) });
  }

  function handleItemPointerUp(item: TimelineItem) {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (moving && moving.id === item.id && pressOrigin.current) {
      const newStartMin = clampAbsoluteMin(pressOrigin.current.startMin + moving.deltaMin);
      if (item.isGhost && item.ghost) onMoveGhost(item.ghost, newStartMin);
      else if (item.block) onMoveBlock(item.block, newStartMin);
    }
    pressOrigin.current = null;
    setMoving(null);
  }

  function handleItemClick(item: TimelineItem) {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (item.isGhost && item.ghost) onEditGhost(item.ghost);
    else if (item.block) onEditBlock(item.block);
  }

  function handleToggleDone(item: TimelineItem) {
    if (item.isGhost && item.ghost) onToggleGhostDone(item.ghost);
    else if (item.block) onToggleBlockDone(item.block);
  }

  const allItems: TimelineItem[] = [
    ...ghosts.map((g) => ({
      id: g.id,
      title: g.title,
      icon: g.icon,
      isGhost: true,
      category: g.category,
      startMin: timeToMinutes(g.startTime),
      endMin: timeToMinutes(g.startTime) + g.durationMinutes,
      block: null,
      ghost: g,
      done: doneGhostIds.has(g.id),
      canToggleDone: isToday,
    })),
    ...blocks.map((b) => ({
      id: b.id,
      title: b.title,
      icon: "",
      isGhost: false,
      category: b.category,
      startMin: timeToMinutes(b.startTime),
      endMin: Math.max(timeToMinutes(b.endTime), timeToMinutes(b.startTime) + 15),
      block: b,
      ghost: null,
      done: doneBlockIds.has(b.id),
      canToggleDone: true,
    })),
  ];

  const openItems = allItems.filter((i) => !i.done);
  const doneItems = allItems.filter((i) => i.done);

  const laid = layoutByTime(openItems);
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const doneByCategory = PLANNER_CATEGORIES.map((cat) => ({
    category: cat,
    items: doneItems.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      ref={scrollRef}
      className="scroll-quiet safe-bottom relative flex-1 overflow-y-auto rounded-xl2 border border-paper-border bg-paper-surface"
    >
      <div
        ref={contentRef}
        className="relative touch-pan-y"
        style={{ height: TOTAL_HEIGHT }}
        onPointerDown={handleBackgroundPointerDown}
        onPointerMove={handleBackgroundPointerMove}
        onPointerUp={handleBackgroundPointerUp}
        onPointerCancel={resetCreateGesture}
      >
        {hours.map((h) => (
          <div
            key={h}
            className="absolute left-9 right-0 border-t border-paper-border/70"
            style={{ top: topFor(h * 60) }}
          >
            <span className="absolute -left-9 -top-2 w-8 text-right text-[10px] text-paper-faint">
              {formatHourLabel(h)}
            </span>
          </div>
        ))}

        {isToday && nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60 && (
          <div
            className="absolute left-9 right-0 z-20 flex items-center gap-1"
            style={{ top: topFor(nowMin) }}
          >
            <span className="h-2 w-2 shrink-0 -translate-x-1 rounded-full" style={{ backgroundColor: NOW_COLOR }} />
            <div className="h-px flex-1" style={{ backgroundColor: NOW_COLOR }} />
          </div>
        )}

        {createDragMin !== null && createOrigin.current && (
          <div
            className="pointer-events-none absolute left-9 right-1 z-10 rounded-lg bg-life/15"
            style={{
              top: topFor(Math.min(createOrigin.current.min, createDragMin)),
              height: Math.max(
                (Math.abs(createDragMin - createOrigin.current.min) / 60) * HOUR_HEIGHT,
                4
              ),
            }}
          />
        )}

        <div className="absolute bottom-0 left-9 right-1 top-0">
          {laid.map((item) => {
            const isMoving = moving?.id === item.id;
            const displayStartMin = isMoving
              ? clampAbsoluteMin(item.startMin + moving!.deltaMin)
              : item.startMin;
            const top = topFor(displayStartMin);
            const height = Math.max(((item.endMin - item.startMin) / 60) * HOUR_HEIGHT, 22);
            const widthPct = 100 / item.columns;
            const leftPct = widthPct * item.column;
            const color = item.category ? PLANNER_CATEGORY_COLORS[item.category] : GHOST_COLOR;

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onPointerDown={(e) => handleItemPointerDown(e, item)}
                onPointerMove={(e) => handleItemPointerMove(e, item)}
                onPointerUp={() => handleItemPointerUp(item)}
                onPointerCancel={() => handleItemPointerUp(item)}
                onClick={() => handleItemClick(item)}
                style={{
                  top,
                  height,
                  left: `calc(${leftPct}% + 2px)`,
                  width: `calc(${widthPct}% - 4px)`,
                  borderColor: color,
                  backgroundColor: `${color}1A`,
                  touchAction: "none",
                  zIndex: isMoving ? 30 : undefined,
                }}
                className={`absolute flex cursor-pointer items-start gap-1 overflow-hidden rounded-lg border px-1.5 py-1 text-left transition-shadow ${
                  item.isGhost && !item.ghost?.overridden ? "border-dashed" : ""
                } ${isMoving ? "scale-[1.03] shadow-paper-lg" : "shadow-paper active:scale-[0.98]"}`}
              >
                {item.canToggleDone && (
                  <span
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 pt-0.5"
                  >
                    <CheckCircle
                      done={false}
                      onToggle={() => handleToggleDone(item)}
                      accentClass="bg-life"
                      size="sm"
                      ariaLabel="Mark done"
                    />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-medium" style={{ color }}>
                    {item.icon ? `${item.icon} ` : ""}
                    {item.title}
                  </p>
                  {height > 34 && (
                    <p className="truncate text-[10px] text-paper-muted">
                      {formatRange(item.startMin, item.endMin)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {quickCreate && (
          <div
            className="absolute z-40 overflow-visible rounded-lg border-2 border-life bg-paper-surface px-2 py-1.5 shadow-paper-lg"
            style={{
              top: topFor(quickCreate.startMin),
              height: Math.max(((quickCreate.endMin - quickCreate.startMin) / 60) * HOUR_HEIGHT, 34),
              left: "calc(2.25rem + 2px)",
              right: 4,
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmQuickCreate();
                if (e.key === "Escape") cancelQuickCreate();
              }}
              placeholder="Quick title…"
              className="w-full bg-transparent text-[12.5px] text-paper-ink outline-none"
            />
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-[10px] text-paper-muted">
                {formatRange(quickCreate.startMin, quickCreate.endMin)}
              </span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={cancelQuickCreate} className="text-[13px] text-paper-faint">
                  ✕
                </button>
                <button
                  type="button"
                  onClick={confirmQuickCreate}
                  className="text-[11.5px] font-medium text-life"
                >
                  ✓ Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {doneByCategory.length > 0 && (
        <div className="border-t border-paper-border p-3">
          <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
            Completed · {doneItems.length}
          </p>
          <div className="flex flex-col gap-2.5">
            {doneByCategory.map(({ category, items }) => (
              <div key={category}>
                <div className="mb-1 flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: PLANNER_CATEGORY_COLORS[category] }}
                  />
                  <p className="text-[11px] font-medium text-paper-muted">
                    {category} ({items.length})
                  </p>
                </div>
                <ul className="flex flex-col gap-1 pl-3.5">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      {item.canToggleDone && (
                        <CheckCircle
                          done
                          onToggle={() => handleToggleDone(item)}
                          accentClass="bg-life"
                          size="sm"
                          ariaLabel="Mark not done"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          item.isGhost && item.ghost ? onEditGhost(item.ghost) : item.block && onEditBlock(item.block)
                        }
                        className="min-w-0 flex-1 truncate text-left text-[12.5px] text-paper-faint line-through"
                      >
                        {item.icon ? `${item.icon} ` : ""}
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatHourLabel(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${period}`;
}

function formatRange(startMin: number, endMin: number): string {
  return `${formatClock(startMin)}–${formatClock(endMin)}`;
}

function formatClock(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${String(m).padStart(2, "0")}${period}`;
}
