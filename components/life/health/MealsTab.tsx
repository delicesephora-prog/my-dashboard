"use client";

import { useState } from "react";
import {
  MEAL_SLOTS,
  MEAL_SLOT_LABELS,
  MealEntry,
  MealPlanData,
  MealSlot,
  newMeal,
  upcomingMealDates,
} from "@/lib/mealplan";
import { RecipeBankData } from "@/lib/recipes";
import { todayKey } from "@/lib/date";

const PREP_STYLE_LABELS: Record<string, string> = {
  "batch-cook": "🔪 Batch-cook",
  quick: "⚡ Quick",
  assemble: "🍽️ Assemble",
};

export default function MealsTab({
  mealPlan,
  recipes,
  onAdd,
  onUpdate,
  onDelete,
}: {
  mealPlan: MealPlanData;
  recipes: RecipeBankData;
  onAdd: (meal: MealEntry) => void;
  onUpdate: (id: string, updater: (m: MealEntry) => MealEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [bankOpen, setBankOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(todayKey());
  const [draftSlot, setDraftSlot] = useState<MealSlot>("dinner");
  const [draftText, setDraftText] = useState("");

  const dates = upcomingMealDates(mealPlan);

  function submit() {
    const text = draftText.trim();
    if (!text) return;
    onAdd(newMeal(draftDate, draftSlot, text));
    setDraftText("");
  }

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 rounded-xl border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <div className="flex gap-2">
          <input
            type="date"
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
            className="rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[12.5px] text-paper-ink outline-none"
          />
          <select
            value={draftSlot}
            onChange={(e) => setDraftSlot(e.target.value as MealSlot)}
            className="rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[12.5px] text-paper-ink outline-none"
          >
            {MEAL_SLOTS.map((s) => (
              <option key={s} value={s}>
                {MEAL_SLOT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <input
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="What's for it?"
            className="min-w-0 flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
          />
          <button
            type="button"
            onClick={submit}
            className="shrink-0 rounded-lg bg-life px-3.5 py-1.5 text-[12.5px] font-medium text-paper-surface"
          >
            + Add
          </button>
        </div>
      </div>

      {dates.length === 0 ? (
        <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
          Nothing planned yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {dates.map((d) => (
            <div key={d}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-paper-muted">
                {d === todayKey()
                  ? "Today"
                  : new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
              </p>
              <div className="flex flex-col gap-1.5">
                {mealPlanForDate(mealPlan, d).map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col gap-1 rounded-xl border border-paper-border bg-paper-surface px-3 py-2 shadow-paper"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-16 shrink-0 text-[10.5px] font-medium uppercase tracking-wide text-paper-muted">
                        {MEAL_SLOT_LABELS[m.slot]}
                      </span>
                      <input
                        value={m.text}
                        onChange={(e) => onUpdate(m.id, (meal) => ({ ...meal, text: e.target.value }))}
                        className="min-w-0 flex-1 bg-transparent text-[13px] text-paper-ink outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => onDelete(m.id)}
                        className="shrink-0 text-xs text-paper-faint underline underline-offset-2"
                      >
                        Delete
                      </button>
                    </div>
                    {(m.calories > 0 || m.prepStyle || m.ingredients.length > 0) && (
                      <div className="ml-[4.75rem] flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px] text-paper-muted">
                        {m.calories > 0 && <span>~{m.calories} cal</span>}
                        {m.prepStyle && <span>{PREP_STYLE_LABELS[m.prepStyle]}</span>}
                        {m.ingredients.length > 0 && <span>{m.ingredients.length} ingredients</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <button
          type="button"
          onClick={() => setBankOpen((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Recipe Bank ({recipes.recipes.length})
          </span>
          <span className={`text-paper-muted transition-transform ${bankOpen ? "rotate-90" : ""}`}>›</span>
        </button>
        {bankOpen && (
          <div className="mt-3 flex flex-col gap-1.5 animate-fade-in">
            {recipes.recipes.length === 0 ? (
              <p className="py-2 text-center text-[12.5px] italic text-paper-muted">
                Nothing saved yet - Cher adds recipes here as she learns your go-tos.
              </p>
            ) : (
              recipes.recipes.map((r) => (
                <div key={r.id} className="rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-2">
                  <p className="text-[13px] text-paper-ink">{r.name}</p>
                  <p className="mt-0.5 text-[10.5px] text-paper-muted">
                    {r.cuisine} · ~{r.caloriesPerServing} cal/serving
                    {r.prepStyle && ` · ${PREP_STYLE_LABELS[r.prepStyle]}`}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function mealPlanForDate(mealPlan: MealPlanData, dateKeyStr: string): MealEntry[] {
  const SLOT_ORDER: Record<MealSlot, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
  return mealPlan.meals
    .filter((m) => m.date === dateKeyStr)
    .sort((a, b) => SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot]);
}
