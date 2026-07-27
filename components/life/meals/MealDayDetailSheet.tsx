"use client";

import { useState } from "react";
import { MEAL_CATEGORY_COLORS, MEAL_CATEGORY_LABELS, MealDay, MealRecipe } from "@/lib/mealcalendar";
import { CookbookData, recipeById } from "@/lib/cookbook";
import CheckCircle from "@/components/CheckCircle";
import RecipePage from "./RecipePage";

function formatDayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function MealDayDetailSheet({
  day,
  recipe,
  cookbook,
  onToggleCooked,
  onClose,
}: {
  day: MealDay;
  recipe: MealRecipe;
  cookbook: CookbookData;
  onToggleCooked: () => void;
  onClose: () => void;
}) {
  const color = MEAL_CATEGORY_COLORS[recipe.category];
  const [fullRecipeOpen, setFullRecipeOpen] = useState(false);
  const cookbookRecipe = recipe.cookbookId ? recipeById(cookbook, recipe.cookbookId) : undefined;

  if (fullRecipeOpen && cookbookRecipe) {
    return <RecipePage recipe={cookbookRecipe} onClose={() => setFullRecipeOpen(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 animate-fade-in" onClick={onClose}>
      <div
        className="scroll-quiet safe-bottom max-h-[86vh] overflow-y-auto rounded-t-xl3 bg-paper-surface p-5 shadow-paper-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color }}>
            {formatDayLabel(day.date)} · {MEAL_CATEGORY_LABELS[recipe.category]}
          </span>
          <button type="button" onClick={onClose} className="text-sm text-paper-muted">
            Close
          </button>
        </div>
        <h2 className="mb-1 font-serif text-[24px] text-paper-ink">
          {recipe.emoji} {recipe.name}
        </h2>
        <p className="mb-4 text-[12px] text-paper-muted">{recipe.effort}</p>

        {cookbookRecipe && (
          <button
            type="button"
            onClick={() => setFullRecipeOpen(true)}
            className="mb-3 flex w-full items-center justify-between rounded-xl border border-gold/40 bg-gold-soft/50 px-3.5 py-2.5 text-left"
          >
            <span className="text-[13px] font-medium text-paper-ink">📖 View full recipe</span>
            <span className="text-gold">›</span>
          </button>
        )}

        <div className="flex flex-col gap-2.5">
          <div className="rounded-xl border-l-[3px] border-life bg-paper-surface2 p-3.5">
            <p className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-life">
              His plate - the full version
            </p>
            <p className="text-[13.5px] leading-relaxed text-paper-ink">{recipe.hisVersion}</p>
          </div>
          <div className="rounded-xl border-l-[3px] border-sage bg-paper-surface2 p-3.5">
            <p className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-sage">
              Her plate - Dec 8 version
            </p>
            <p className="text-[13.5px] leading-relaxed text-paper-ink">{recipe.hersVersion}</p>
          </div>
          <div className="rounded-xl border-l-[3px] border-gold bg-paper-surface2 p-3.5">
            <p className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-gold">Prep note</p>
            <p className="text-[13.5px] leading-relaxed text-paper-muted">{recipe.prepNote}</p>
          </div>
        </div>

        <div
          className={`mt-4 flex w-full items-center justify-center gap-2.5 rounded-xl2 border px-4 py-3 transition ${
            day.cooked ? "border-sage bg-sage/10" : "border-paper-border bg-paper-surface2"
          }`}
        >
          <CheckCircle
            done={day.cooked}
            onToggle={onToggleCooked}
            accentClass="bg-sage"
            ariaLabel={day.cooked ? "Mark not cooked" : "Mark cooked"}
          />
          <span className="text-[14px] font-medium text-paper-ink">
            {day.cooked ? "Cooked ✓" : "Mark cooked"}
          </span>
        </div>
      </div>
    </div>
  );
}
