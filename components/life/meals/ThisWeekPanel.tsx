"use client";

import {
  MEAL_CATEGORY_COLORS,
  MealCalendarData,
  dayForDate,
  recipeFor,
  setMealNote,
  weekDatesContaining,
} from "@/lib/mealcalendar";
import { todayKey } from "@/lib/date";

function formatWeekdayLabel(dateStr: string): { weekday: string; dayNum: number } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return { weekday: date.toLocaleDateString(undefined, { weekday: "short" }), dayNum: d };
}

export default function ThisWeekPanel({
  data,
  onChange,
  onSelectDinner,
}: {
  data: MealCalendarData;
  onChange: (updater: (m: MealCalendarData) => MealCalendarData) => void;
  onSelectDinner: (date: string) => void;
}) {
  const today = todayKey();
  const weekDates = weekDatesContaining(today);

  return (
    <div className="flex flex-col gap-2">
      {weekDates.map((date) => {
        const day = dayForDate(data, date);
        const recipe = day ? recipeFor(data, day.recipeId) : null;
        const { weekday, dayNum } = formatWeekdayLabel(date);
        const color = recipe ? MEAL_CATEGORY_COLORS[recipe.category] : "#C7B9BC";
        return (
          <div
            key={date}
            className={`rounded-xl2 border bg-paper-surface p-3 shadow-paper ${
              date === today ? "border-gold" : "border-paper-border"
            }`}
          >
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-paper-faint">
              {weekday} {dayNum}
              {date === today && <span className="ml-1.5 text-gold">· today</span>}
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2">
                <span className="w-[62px] shrink-0 text-[10.5px] font-medium uppercase tracking-wide text-paper-muted">
                  Breakfast
                </span>
                <input
                  type="text"
                  value={day?.breakfastNote ?? ""}
                  onChange={(e) => onChange((d) => setMealNote(d, date, "breakfast", e.target.value))}
                  placeholder="-"
                  className="min-w-0 flex-1 rounded-lg border border-transparent bg-paper-surface2 px-2 py-1 text-[12.5px] text-paper-ink outline-none focus:border-gold"
                />
              </label>

              <label className="flex items-center gap-2">
                <span className="w-[62px] shrink-0 text-[10.5px] font-medium uppercase tracking-wide text-paper-muted">
                  Lunch
                </span>
                <input
                  type="text"
                  value={day?.lunchNote ?? ""}
                  onChange={(e) => onChange((d) => setMealNote(d, date, "lunch", e.target.value))}
                  placeholder="-"
                  className="min-w-0 flex-1 rounded-lg border border-transparent bg-paper-surface2 px-2 py-1 text-[12.5px] text-paper-ink outline-none focus:border-gold"
                />
              </label>

              <button
                type="button"
                disabled={!day || !recipe}
                onClick={() => day && onSelectDinner(date)}
                className="flex items-center gap-2 rounded-lg bg-paper-surface2 px-2 py-1 text-left disabled:opacity-50"
              >
                <span className="w-[62px] shrink-0 text-[10.5px] font-medium uppercase tracking-wide text-paper-muted">
                  Dinner
                </span>
                {recipe ? (
                  <>
                    <span className="text-[14px] leading-none">{recipe.emoji}</span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-paper-ink">{recipe.name}</span>
                    <span className="h-[8px] w-[8px] shrink-0 rounded-full" style={{ background: color }} />
                    <span className="shrink-0 text-paper-muted">›</span>
                  </>
                ) : (
                  <span className="text-[12.5px] italic text-paper-muted">Not planned</span>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
