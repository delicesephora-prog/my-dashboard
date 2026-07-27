"use client";

import { useMemo, useState } from "react";
import { CookbookData, CookbookRecipe } from "@/lib/cookbook";
import { RecipeBankData } from "@/lib/recipes";
import RecipePage from "./RecipePage";

export default function RecipesTab({
  cookbook,
  recipeBank,
}: {
  cookbook: CookbookData;
  recipeBank: RecipeBankData;
}) {
  const [query, setQuery] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState<string>("all");
  const [openRecipe, setOpenRecipe] = useState<CookbookRecipe | null>(null);
  const [bankOpen, setBankOpen] = useState(false);

  const cuisines = useMemo(() => {
    const set = new Set<string>();
    for (const r of cookbook.recipes) if (r.cuisine) set.add(r.cuisine);
    return Array.from(set).sort();
  }, [cookbook.recipes]);

  const list = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return cookbook.recipes
      .filter((r) => cuisineFilter === "all" || r.cuisine === cuisineFilter)
      .filter((r) => {
        if (!needle) return true;
        return (
          r.name.toLowerCase().includes(needle) ||
          r.cuisine.toLowerCase().includes(needle) ||
          r.tags.some((t) => t.toLowerCase().includes(needle)) ||
          r.protein.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [cookbook.recipes, query, cuisineFilter]);

  return (
    <div>
      <p className="mb-3 text-[12px] text-paper-muted">
        The full cookbook, searchable - but the fastest way to a recipe is still tapping the meal on your calendar.
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search recipes, cuisine, protein..."
        className="mb-2.5 w-full rounded-xl border border-paper-border bg-paper-surface px-3.5 py-2.5 text-[13.5px] text-paper-ink outline-none focus:border-gold"
      />

      {cuisines.length > 0 && (
        <div className="mb-3 flex gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setCuisineFilter("all")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
              cuisineFilter === "all" ? "bg-life text-paper-surface" : "border border-paper-border bg-paper-surface text-paper-muted"
            }`}
          >
            All ({cookbook.recipes.length})
          </button>
          {cuisines.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCuisineFilter(c)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                cuisineFilter === c ? "bg-life text-paper-surface" : "border border-paper-border bg-paper-surface text-paper-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <p className="py-8 text-center font-serif text-[0.95rem] italic text-paper-muted">
          No recipes match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setOpenRecipe(r)}
              className="flex w-full items-center gap-3 rounded-xl2 border border-paper-border bg-paper-surface px-3.5 py-3 text-left shadow-paper"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-[14.5px] text-paper-ink">{r.name}</p>
                <p className="truncate text-[11px] text-paper-muted">
                  {[r.cuisine, r.totalTime || r.cookTime].filter(Boolean).join(" · ")}
                </p>
              </div>
              {r.tags.includes("haitian") || r.cuisine.toLowerCase().includes("haitian") ? (
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: "#A6643B" }} />
              ) : null}
              <span className="shrink-0 text-paper-muted">›</span>
            </button>
          ))}
        </div>
      )}

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

      {openRecipe && <RecipePage recipe={openRecipe} onClose={() => setOpenRecipe(null)} />}
    </div>
  );
}
