"use client";

import { PLANNER_CATEGORY_COLORS, PlannerBlock, PlannerDayEntry } from "@/lib/planner";
import { todayKey } from "@/lib/date";

function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${String(m).padStart(2, "0")}${period}`;
}

export default function WeekTimeline({
  days,
  onEditBlock,
  onJumpToDay,
}: {
  days: PlannerDayEntry[];
  onEditBlock: (block: PlannerBlock) => void;
  onJumpToDay: (dateKeyStr: string) => void;
}) {
  const today = todayKey();

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="flex flex-col gap-2.5">
        {days.map((day) => {
          const isToday = day.dateKeyStr === today;
          return (
            <div
              key={day.dateKeyStr}
              className={`rounded-xl2 border bg-paper-surface shadow-paper ${
                isToday ? "border-life/40" : "border-paper-border"
              }`}
            >
              <button
                type="button"
                onClick={() => onJumpToDay(day.dateKeyStr)}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left"
              >
                <p className="text-[13px] font-medium text-paper-ink">
                  {day.date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                  {isToday && <span className="ml-1.5 text-[10px] text-gold">today</span>}
                </p>
                <span className="text-[11px] text-paper-muted">
                  {day.blocks.length > 0 ? `${day.blocks.length} block${day.blocks.length === 1 ? "" : "s"}` : ""}
                </span>
              </button>

              {day.blocks.length > 0 && (
                <ul className="flex flex-col gap-1 border-t border-paper-border px-3.5 py-2">
                  {day.blocks.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => onEditBlock(b)}
                        className="flex w-full items-center gap-2 rounded-lg py-1 text-left active:scale-[0.99]"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: PLANNER_CATEGORY_COLORS[b.category] }}
                        />
                        <span className="shrink-0 text-[11px] text-paper-muted">{formatClock(b.startTime)}</span>
                        <span className="min-w-0 flex-1 truncate text-[13px] text-paper-ink">{b.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
