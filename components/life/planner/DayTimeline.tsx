"use client";

import { useEffect, useRef } from "react";
import {
  PLANNER_CATEGORY_COLORS,
  PlannerBlock,
  PlannerCategory,
  RoutineGhostBlock,
  layoutByTime,
  timeToMinutes,
} from "@/lib/planner";

const START_HOUR = 6;
const END_HOUR = 23;
const HOUR_HEIGHT = 56;
const TOTAL_MIN = (END_HOUR - START_HOUR) * 60;
const TOTAL_HEIGHT = (TOTAL_MIN / 60) * HOUR_HEIGHT;
const GHOST_COLOR = "#A9A296";
const NOW_COLOR = "#B5574A";

function clampMin(min: number): number {
  return Math.min(Math.max(min - START_HOUR * 60, 0), TOTAL_MIN);
}

function topFor(min: number): number {
  return (clampMin(min) / 60) * HOUR_HEIGHT;
}

type TimelineItem = {
  id: string;
  title: string;
  isGhost: boolean;
  category: PlannerCategory | null;
  startMin: number;
  endMin: number;
  block: PlannerBlock | null;
};

export default function DayTimeline({
  dateKeyStr,
  isToday,
  blocks,
  ghosts,
  onEditBlock,
}: {
  dateKeyStr: string;
  isToday: boolean;
  blocks: PlannerBlock[];
  ghosts: RoutineGhostBlock[];
  onEditBlock: (block: PlannerBlock) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  useEffect(() => {
    if (!scrollRef.current) return;
    const target = isToday ? nowMin : 8 * 60;
    scrollRef.current.scrollTop = Math.max(topFor(target) - 80, 0);
    // Only re-scroll when the viewed day changes, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKeyStr]);

  const items: TimelineItem[] = [
    ...ghosts.map((g) => ({
      id: g.id,
      title: g.title,
      isGhost: true,
      category: null,
      startMin: timeToMinutes(g.startTime),
      endMin: timeToMinutes(g.startTime) + g.durationMinutes,
      block: null,
    })),
    ...blocks.map((b) => ({
      id: b.id,
      title: b.title,
      isGhost: false,
      category: b.category,
      startMin: timeToMinutes(b.startTime),
      endMin: Math.max(timeToMinutes(b.endTime), timeToMinutes(b.startTime) + 15),
      block: b,
    })),
  ];

  const laid = layoutByTime(items);
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  return (
    <div
      ref={scrollRef}
      className="scroll-quiet safe-bottom relative flex-1 overflow-y-auto rounded-xl2 border border-paper-border bg-paper-surface"
    >
      <div className="relative" style={{ height: TOTAL_HEIGHT }}>
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

        <div className="absolute bottom-0 left-9 right-1 top-0">
          {laid.map((item) => {
            const top = topFor(item.startMin);
            const height = Math.max(((item.endMin - item.startMin) / 60) * HOUR_HEIGHT, 22);
            const widthPct = 100 / item.columns;
            const leftPct = widthPct * item.column;
            const color = item.category ? PLANNER_CATEGORY_COLORS[item.category] : GHOST_COLOR;

            return (
              <button
                key={item.id}
                type="button"
                disabled={item.isGhost}
                onClick={() => item.block && onEditBlock(item.block)}
                className={`absolute overflow-hidden rounded-lg border px-1.5 py-1 text-left ${
                  item.isGhost ? "border-dashed opacity-70" : "shadow-paper active:scale-[0.98]"
                }`}
                style={{
                  top,
                  height,
                  left: `calc(${leftPct}% + 2px)`,
                  width: `calc(${widthPct}% - 4px)`,
                  borderColor: color,
                  backgroundColor: `${color}1A`,
                }}
              >
                <p className="truncate text-[11.5px] font-medium" style={{ color }}>
                  {item.title}
                </p>
                {height > 34 && (
                  <p className="truncate text-[10px] text-paper-muted">
                    {formatRange(item.startMin, item.endMin)}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
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
