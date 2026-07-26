"use client";

import { useState } from "react";
import { MealCalendarData, monthDataFor, monthKeyForDate } from "@/lib/mealcalendar";
import { RecipeBankData } from "@/lib/recipes";
import { CelebrationTier } from "@/lib/celebration";
import MealCalendarTab from "./MealCalendarTab";
import PrepWeekendsTab from "./PrepWeekendsTab";
import GroceryTab from "./GroceryTab";
import LunchesTab from "./LunchesTab";
import RecipesTab from "./RecipesTab";

type Tab = "calendar" | "prep" | "grocery" | "lunches" | "recipes";

const TABS: { key: Tab; label: string }[] = [
  { key: "calendar", label: "📅 Calendar" },
  { key: "prep", label: "🍳 Prep Weekends" },
  { key: "grocery", label: "🛒 Grocery" },
  { key: "lunches", label: "☀️ Lunches" },
  { key: "recipes", label: "📖 Recipes" },
];

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function MealsView({
  mealCalendar,
  onChange,
  recipeBank,
  onCelebrate,
}: {
  mealCalendar: MealCalendarData;
  onChange: (updater: (m: MealCalendarData) => MealCalendarData) => void;
  recipeBank: RecipeBankData;
  onCelebrate: (tier: CelebrationTier, message: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("calendar");

  const availableMonths = Object.keys(mealCalendar.months).sort();
  const currentRealMonth = monthKeyForDate(new Date());
  const [month, setMonth] = useState<string>(
    availableMonths.includes(currentRealMonth) ? currentRealMonth : availableMonths[0] ?? currentRealMonth
  );
  const monthIndex = availableMonths.indexOf(month);
  const monthData = monthDataFor(mealCalendar, month);

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="mb-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-backdrop-muted">Meals</p>
        <p className="font-serif text-[1.05rem] text-backdrop-ink">One cook, two plates</p>
      </div>

      {availableMonths.length > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-paper-border bg-paper-surface px-3 py-2 shadow-paper">
          <button
            type="button"
            disabled={monthIndex <= 0}
            onClick={() => setMonth(availableMonths[monthIndex - 1])}
            className="px-2 text-paper-muted disabled:opacity-30"
            aria-label="Previous month"
          >
            ‹
          </button>
          <p className="font-serif text-[14px] text-paper-ink">{formatMonthLabel(month)}</p>
          <button
            type="button"
            disabled={monthIndex >= availableMonths.length - 1}
            onClick={() => setMonth(availableMonths[monthIndex + 1])}
            className="px-2 text-paper-muted disabled:opacity-30"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      )}

      <div className="mb-3 flex gap-1.5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              tab === t.key
                ? "bg-life text-paper-surface"
                : "border border-paper-border bg-paper-surface text-paper-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "calendar" && (
        <MealCalendarTab
          data={mealCalendar}
          month={month}
          monthData={monthData}
          onChange={onChange}
          onCelebrate={onCelebrate}
        />
      )}

      {tab === "prep" && <PrepWeekendsTab month={month} monthData={monthData} onChange={onChange} />}

      {tab === "grocery" && <GroceryTab month={month} monthData={monthData} onChange={onChange} />}

      {tab === "lunches" && <LunchesTab lunches={mealCalendar.lunches} />}

      {tab === "recipes" && <RecipesTab recipes={mealCalendar.recipes} recipeBank={recipeBank} />}
    </div>
  );
}
