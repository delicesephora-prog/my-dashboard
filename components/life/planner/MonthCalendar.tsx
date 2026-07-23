"use client";

import { PlannerData, blocksForMonthGrid, categoryColor } from "@/lib/planner";
import { todayKey } from "@/lib/date";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MonthCalendar({
  data,
  year,
  month,
  onJumpToDay,
}: {
  data: PlannerData;
  year: number;
  month: number; // 0-11
  onJumpToDay: (dateKeyStr: string) => void;
}) {
  const today = todayKey();
  const days = blocksForMonthGrid(data, year, month);

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="mb-1.5 grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((w) => (
          <p key={w} className="text-center text-[10px] font-medium uppercase tracking-wide text-paper-muted">
            {w}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isToday = day.dateKeyStr === today;
          const visible = day.blocks.slice(0, 3);
          const hiddenCount = day.blocks.length - visible.length;
          return (
            <button
              key={day.dateKeyStr}
              type="button"
              onClick={() => onJumpToDay(day.dateKeyStr)}
              className={`flex min-h-[72px] flex-col items-stretch gap-0.5 rounded-lg border px-1 pb-1 pt-1 text-left ${
                isToday ? "border-life/50 bg-life/5" : "border-paper-border bg-paper-surface"
              } ${!day.inMonth ? "opacity-35" : ""}`}
            >
              <span
                className={`text-[11px] ${isToday ? "font-semibold text-life" : "text-paper-ink"}`}
              >
                {day.date.getDate()}
              </span>
              {visible.length > 0 && (
                <span className="flex flex-col gap-[1px]">
                  {visible.map((b) => (
                    <span
                      key={b.id}
                      className={`truncate rounded-[3px] px-[3px] py-[1px] text-[8.5px] leading-tight ${
                        isToday ? "text-backdrop-ink" : "text-paper-ink"
                      }`}
                      style={{ backgroundColor: `${categoryColor(data.categories, b.category)}33` }}
                    >
                      {b.title}
                    </span>
                  ))}
                  {hiddenCount > 0 && (
                    <span className="px-[3px] text-[8px] leading-tight text-paper-muted">
                      +{hiddenCount} more
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
