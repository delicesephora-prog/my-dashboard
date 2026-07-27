"use client";

import { useState } from "react";
import {
  MEAL_CATEGORY_COLORS,
  MEAL_CATEGORY_LABELS,
  MealCalendarData,
  MealCalendarMonth,
  MealCategory,
  cookStreak,
  dayForDate,
  monthCookedCount,
  recipeFor,
  toggleDayCooked,
} from "@/lib/mealcalendar";
import { todayKey } from "@/lib/date";
import { CelebrationTier } from "@/lib/celebration";
import { cookNightLine } from "@/lib/cher";
import { CookbookData } from "@/lib/cookbook";
import MealDayDetailSheet from "./MealDayDetailSheet";
import ThisWeekPanel from "./ThisWeekPanel";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
type CalendarSubView = "month" | "week";

export default function MealCalendarTab({
  data,
  month,
  monthData,
  cookbook,
  onChange,
  onCelebrate,
  onCherToast,
}: {
  data: MealCalendarData;
  month: string;
  monthData: MealCalendarMonth;
  cookbook: CookbookData;
  onChange: (updater: (m: MealCalendarData) => MealCalendarData) => void;
  onCelebrate: (tier: CelebrationTier, message: string) => void;
  onCherToast: (contextKey: string, message: string) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [subView, setSubView] = useState<CalendarSubView>("month");
  const today = todayKey();

  const streak = cookStreak(monthData, today);
  const cookedCount = monthCookedCount(monthData);

  // Looked up across all months (not just the currently displayed one) so
  // "This Week" can open a day-detail sheet even when the week spans a
  // month boundary or she's viewing a different month than today's.
  const selectedDay = selectedDate ? dayForDate(data, selectedDate) : null;
  const selectedRecipe = selectedDay ? recipeFor(data, selectedDay.recipeId) : null;

  if (monthData.days.length === 0 && subView === "month") {
    return (
      <p className="py-8 text-center font-serif text-[0.95rem] italic text-paper-muted">
        No plan seeded for this month yet.
      </p>
    );
  }

  const [y, m] = month.split("-").map(Number);
  const leadingBlanks = new Date(y, m - 1, 1).getDay();

  function handleToggleCooked() {
    if (!selectedDay) return;
    const wasCooked = selectedDay.cooked;
    onChange((d) => toggleDayCooked(d, selectedDay.date.slice(0, 7), selectedDay.date));
    if (!wasCooked) {
      const newCount = cookedCount + 1;
      if (newCount % 5 === 0) {
        onCelebrate("medium", `${newCount} dinners cooked this month - the system is working.`);
      }
      if (!selectedDay.isLeftover && selectedRecipe) {
        const newStreak = streak + 1;
        const isHaitian = selectedRecipe.category === "haitian";
        onCherToast("cook-night-logged", cookNightLine(newStreak, isHaitian, selectedRecipe.name).text);
      }
    }
  }

  return (
    <div>
      <div className="mb-3 flex gap-1.5">
        <button
          type="button"
          onClick={() => setSubView("month")}
          className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
            subView === "month" ? "bg-life text-paper-surface" : "border border-paper-border bg-paper-surface text-paper-muted"
          }`}
        >
          📅 Month
        </button>
        <button
          type="button"
          onClick={() => setSubView("week")}
          className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
            subView === "week" ? "bg-life text-paper-surface" : "border border-paper-border bg-paper-surface text-paper-muted"
          }`}
        >
          🗓️ This Week
        </button>
      </div>

      {subView === "week" && (
        <ThisWeekPanel data={data} onChange={onChange} onSelectDinner={(date) => setSelectedDate(date)} />
      )}

      {subView === "month" && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-paper-border bg-paper-surface px-3 py-2.5 shadow-paper">
            <span className="text-[13px] text-paper-ink">
              <b className="font-serif text-[15px]">{cookedCount}</b> / {monthData.days.length} cooked this month
            </span>
            {streak > 0 && (
              <span className="ml-auto rounded-full bg-gold-soft px-2.5 py-1 text-[11.5px] font-medium text-paper-ink">
                🔥 {streak}-day streak
              </span>
            )}
          </div>

          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-0.5">
            {(Object.keys(MEAL_CATEGORY_LABELS) as MealCategory[]).map((cat) => (
              <span key={cat} className="flex items-center gap-1.5 text-[10.5px] text-paper-muted">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: MEAL_CATEGORY_COLORS[cat] }}
                />
                {MEAL_CATEGORY_LABELS[cat]}
              </span>
            ))}
            <span className="text-[10.5px] text-paper-faint">💰 payday · 🛒 haul · ✦ prep day · dim = leftovers</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAY_LETTERS.map((w, i) => (
              <div key={i} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-paper-faint">
                {w}
              </div>
            ))}
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`b${i}`} />
            ))}
            {monthData.days.map((day) => {
              const recipe = recipeFor(data, day.recipeId);
              const dayNum = Number(day.date.split("-")[2]);
              const color = recipe ? MEAL_CATEGORY_COLORS[recipe.category] : "#C7B9BC";
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`relative flex min-h-[68px] flex-col items-center gap-1 rounded-xl border px-1 py-1.5 transition hover:-translate-y-0.5 ${
                    day.date === today ? "border-gold" : "border-paper-border"
                  } ${day.isLeftover ? "bg-paper-surface2/60 opacity-70" : "bg-paper-surface"}`}
                >
                  <span className={`text-[9.5px] font-bold ${day.isPayday ? "text-gold" : "text-paper-faint"}`}>
                    {dayNum}
                    {day.isPayday && " 💰"}
                    {day.haulNumber && " 🛒"}
                  </span>
                  <span className="text-[19px] leading-none">{recipe?.emoji ?? "🍽️"}</span>
                  <span className="h-[3px] w-4 rounded-full" style={{ background: color }} />
                  {day.isPrep && (
                    <span className="absolute right-1 top-1 text-[8px]" style={{ color }}>
                      ✦
                    </span>
                  )}
                  {day.cooked && (
                    <span className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sage text-[9px] text-paper-surface">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-4 rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-1.5 font-serif text-[15px] text-life">Her plate rules - same food, tuned</p>
        <p className="mb-2.5 text-[12.5px] leading-relaxed text-paper-muted">
          🥩 Protein: palm-size or more, never cut · 🥬 Veg: half the plate · 🍚 Carb: one fist · 🥣 Creamy
          things: Greek yogurt swap or sauce-on-side · ✨ Two fun plates a week stay untouched.
        </p>
        <div className="border-t border-paper-border pt-2.5 text-[12.5px] leading-relaxed text-paper-muted">
          <p className="mb-2">
            <b className="text-paper-ink">The method:</b> one cook, two plates. Whatever&rsquo;s simmering for
            him is the same pot she&rsquo;s eating from - nothing separate to cook, nothing separate to clean.
            The only thing that changes at the very end is how it&rsquo;s portioned onto each plate, so dinner
            stays one meal, not two.
          </p>
          <p className="mb-2">
            <b className="text-paper-ink">Her portions, in real terms:</b> protein is never the thing that
            shrinks - a full palm or more, every time, since that&rsquo;s what actually keeps her full. Veg
            fills half the plate, generously, straight from whatever&rsquo;s already in the pan or pot. Carb
            (rice, diri kole, potatoes) is capped at one closed fist - not a diet trick, just enough to round
            the plate out without crowding the protein and veg doing the real work. Anything creamy or
            sauce-heavy either swaps to Greek yogurt or rides on the side so it&rsquo;s a choice, not a default.
          </p>
          <p>
            <b className="text-paper-ink">Flexing further for weight loss:</b> on nights that need to run
            lighter, the fist of carb becomes a half-fist (or gets swapped for extra veg entirely) before
            protein or veg ever gets touched - that ordering is the whole trick. A splash more lime, hot
            sauce, or fresh herbs covers what a heavier sauce used to do. And the two fun plates a week (date
            night, a real treat) stay completely untouched - they&rsquo;re part of the plan, not a slip from it,
            so there&rsquo;s never a reason to feel guilty reaching for one.
          </p>
        </div>
      </div>

      {selectedDay && selectedRecipe && (
        <MealDayDetailSheet
          day={selectedDay}
          recipe={selectedRecipe}
          cookbook={cookbook}
          onToggleCooked={handleToggleCooked}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
