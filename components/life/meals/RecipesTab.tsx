"use client";

import { useState } from "react";
import { MEAL_CATEGORY_COLORS, MEAL_CATEGORY_LABELS, MealCategory, MealRecipe } from "@/lib/mealcalendar";
import { RecipeBankData } from "@/lib/recipes";

export default function RecipesTab({
  recipes,
  recipeBank,
}: {
  recipes: Record<string, MealRecipe>;
  recipeBank: RecipeBankData;
}) {
  const [filter, setFilter] = useState<MealCategory | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [bankOpen, setBankOpen] = useState(false);

  const list = Object.values(recipes)
    .filter((r) => filter === "all" || r.category === filter)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <div className="mb-3 flex gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
            filter === "all" ? "bg-life text-paper-surface" : "border border-paper-border bg-paper-surface text-paper-muted"
          }`}
        >
          All ({Object.keys(recipes).length})
        </button>
        {(Object.keys(MEAL_CATEGORY_LABELS) as MealCategory[]).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
              filter === cat ? "border-transparent text-white" : "border-paper-border bg-paper-surface text-paper-muted"
            }`}
            style={filter === cat ? { background: MEAL_CATEGORY_COLORS[cat] } : undefined}
          >
            {MEAL_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {list.map((r) => {
          const open = openId === r.id;
          const color = MEAL_CATEGORY_COLORS[r.category];
          return (
            <div key={r.id} className="rounded-xl2 border border-paper-border bg-paper-surface shadow-paper">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : r.id)}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
              >
                <span className="text-[24px] leading-none">{r.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-[14.5px] text-paper-ink">{r.name}</p>
                  <p className="text-[11px] text-paper-muted">{r.effort}</p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                  style={{ background: color }}
                >
                  {MEAL_CATEGORY_LABELS[r.category]}
                </span>
                <span className={`shrink-0 text-paper-muted transition-transform ${open ? "rotate-90" : ""}`}>
                  ›
                </span>
              </button>
              {open && (
                <div className="flex flex-col gap-2 border-t border-paper-border px-3.5 py-3 animate-fade-in">
                  <div className="rounded-lg border-l-[3px] border-life bg-paper-surface2 p-2.5">
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-life">His plate</p>
                    <p className="text-[12.5px] leading-relaxed text-paper-ink">{r.hisVersion}</p>
                  </div>
                  <div className="rounded-lg border-l-[3px] border-sage bg-paper-surface2 p-2.5">
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-sage">Her plate</p>
                    <p className="text-[12.5px] leading-relaxed text-paper-ink">{r.hersVersion}</p>
                  </div>
                  <div className="rounded-lg border-l-[3px] border-gold bg-paper-surface2 p-2.5">
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">Prep note</p>
                    <p className="text-[12.5px] leading-relaxed text-paper-muted">{r.prepNote}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <button type="button" onClick={() => setBankOpen((v) => !v)} className="flex w-full items-center justify-between">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Your saved recipes ({recipeBank.recipes.length})
          </span>
          <span className={`text-paper-muted transition-transform ${bankOpen ? "rotate-90" : ""}`}>›</span>
        </button>
        {bankOpen && (
          <div className="mt-3 flex flex-col gap-1.5 animate-fade-in">
            {recipeBank.recipes.length === 0 ? (
              <p className="py-2 text-center text-[12.5px] italic text-paper-muted">
                Nothing saved yet - Cher adds recipes here as she learns your go-tos.
              </p>
            ) : (
              recipeBank.recipes.map((r) => (
                <div key={r.id} className="rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-2">
                  <p className="text-[13px] text-paper-ink">{r.name}</p>
                  <p className="mt-0.5 text-[10.5px] text-paper-muted">
                    {r.cuisine} · ~{r.caloriesPerServing} cal/serving
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
