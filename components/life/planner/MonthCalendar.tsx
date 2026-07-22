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
          const categories = Array.from(new Set(day.blocks.map((b) => b.category))).slice(0, 4);
          return (
            <button
              key={day.dateKeyStr}
              type="button"
              onClick={() => onJumpToDay(day.dateKeyStr)}
              className={`flex aspect-square flex-col items-center justify-start gap-1 rounded-lg border px-0.5 pt-1 text-left ${
                isToday ? "border-life/50 bg-life/5" : "border-paper-border bg-paper-surface"
              } ${!day.inMonth ? "opacity-35" : ""}`}
            >
              <span
                className={`text-[11px] ${isToday ? "font-semibold text-life" : "text-paper-ink"}`}
              >
                {day.date.getDate()}
              </span>
              {categories.length > 0 && (
                <span className="flex flex-wrap items-center justify-center gap-[2px]">
                  {categories.map((c) => (
                    <span
                      key={c}
                      className="h-[4px] w-[4px] rounded-full"
                      style={{ backgroundColor: categoryColor(data.categories, c) }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
