"use client";

import { useState } from "react";
import { CookbookRecipe } from "@/lib/cookbook";

function StatChip({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-center">
      <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-paper-faint">{label}</p>
      <p className="mt-0.5 text-[12.5px] font-medium text-paper-ink">{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-paper-border pt-4 first:border-t-0 first:pt-0">
      <p className="mb-2 font-serif text-[15px] text-life">{title}</p>
      {children}
    </div>
  );
}

export default function RecipePage({
  recipe,
  onClose,
}: {
  recipe: CookbookRecipe;
  onClose: () => void;
}) {
  const [ingredientsOpen, setIngredientsOpen] = useState(true);

  const hasIngredients = recipe.ingredients.some((g) => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/30 animate-fade-in print:static print:bg-white" onClick={onClose}>
      <div
        className="scroll-quiet safe-bottom mt-6 flex-1 overflow-y-auto rounded-t-xl3 bg-paper-surface p-0 shadow-paper-lg print:mt-0 print:overflow-visible print:rounded-none print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero */}
        <div className="relative flex h-40 w-full items-end justify-center overflow-hidden rounded-t-xl3 bg-gradient-to-br from-gold-soft via-paper-surface2 to-life/10 print:hidden">
          <span className="mb-3 text-[42px] leading-none opacity-70">🍽️</span>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-paper-surface/90 px-3 py-1.5 text-[12px] font-medium text-paper-ink shadow-paper"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="absolute left-3 top-3 rounded-full bg-paper-surface/90 px-3 py-1.5 text-[12px] font-medium text-paper-ink shadow-paper"
          >
            🖨️ Print
          </button>
        </div>

        <div className="mx-auto flex max-w-2xl flex-col gap-5 px-5 pb-10 pt-5 print:px-0">
          {/* Title block */}
          <div>
            {recipe.cuisine && (
              <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gold">
                {recipe.cuisine}
              </p>
            )}
            <h1 className="font-serif text-[26px] leading-tight text-paper-ink">{recipe.name}</h1>
            {recipe.pronunciation && (
              <p className="mt-1 text-[13px] italic text-paper-muted">{recipe.pronunciation}</p>
            )}
            {recipe.description && (
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-paper-muted">{recipe.description}</p>
            )}
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            <StatChip label="Prep" value={recipe.prepTime} />
            <StatChip label="Cook" value={recipe.cookTime} />
            <StatChip label="Total" value={recipe.totalTime} />
            <StatChip label="Servings" value={recipe.servings} />
            <StatChip label="Difficulty" value={recipe.difficulty} />
            <StatChip label="Protein" value={recipe.protein} />
            <StatChip label="Calories" value={recipe.calories} />
            <StatChip label="Spice" value={recipe.spiceLevel} />
            <StatChip label="Meal Prep" value={recipe.mealPrepFriendly} />
            <StatChip label="Freezer" value={recipe.freezerFriendly} />
          </div>

          {recipe.culturalBackground && (
            <div className="rounded-xl border-l-[3px] border-gold bg-gold-soft/40 p-3.5">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-gold">Cultural background</p>
              <p className="text-[13px] leading-relaxed text-paper-ink">{recipe.culturalBackground}</p>
            </div>
          )}

          {recipe.equipment.length > 0 && (
            <Section title="Equipment">
              <ul className="flex flex-col gap-1">
                {recipe.equipment.map((e, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[13px] text-paper-ink">
                    <span className="text-gold">·</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {hasIngredients && (
            <Section title="Ingredients">
              <div className="rounded-xl border border-paper-border bg-paper-surface2">
                <button
                  type="button"
                  onClick={() => setIngredientsOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-3.5 py-2.5 print:hidden"
                >
                  <span className="text-[12px] font-medium text-paper-muted">
                    {ingredientsOpen ? "Hide" : "Show"} ingredients
                  </span>
                  <span className={`text-paper-muted transition-transform ${ingredientsOpen ? "rotate-90" : ""}`}>
                    ›
                  </span>
                </button>
                {(ingredientsOpen || true) && (
                  <div className={`flex flex-col gap-3 px-3.5 pb-3.5 ${ingredientsOpen ? "" : "hidden print:flex"}`}>
                    {recipe.ingredients.map((group, gi) => (
                      <div key={gi}>
                        {group.label && (
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-life">
                            {group.label}
                          </p>
                        )}
                        <ul className="flex flex-col gap-1">
                          {group.items.map((item, ii) => (
                            <li key={ii} className="flex items-start gap-1.5 text-[13px] text-paper-ink">
                              <span className="text-gold">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {recipe.ingredientNotes && (
                <p className="mt-2 text-[12.5px] italic leading-relaxed text-paper-muted">{recipe.ingredientNotes}</p>
              )}
            </Section>
          )}

          {recipe.directions.length > 0 && (
            <Section title="Directions">
              <ol className="flex flex-col gap-2.5">
                {recipe.directions.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-paper-ink">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-life/15 text-[10.5px] font-semibold text-life">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {recipe.storage && (
            <Section title="Storage">
              <p className="text-[13px] leading-relaxed text-paper-muted">{recipe.storage}</p>
            </Section>
          )}

          {recipe.freezerInstructions && (
            <Section title="Freezer instructions">
              <p className="text-[13px] leading-relaxed text-paper-muted">{recipe.freezerInstructions}</p>
            </Section>
          )}

          {recipe.mealPrepTips && (
            <Section title="Meal prep tips">
              <p className="text-[13px] leading-relaxed text-paper-muted">{recipe.mealPrepTips}</p>
            </Section>
          )}

          {recipe.leftoverIdeas.length > 0 && (
            <Section title="Leftover ideas">
              <ul className="flex flex-col gap-1">
                {recipe.leftoverIdeas.map((idea, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[13px] text-paper-ink">
                    <span className="text-gold">·</span>
                    <span>{idea}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {recipe.nutrition && (
            <Section title="Nutrition (approx.)">
              <p className="text-[13px] leading-relaxed text-paper-muted">{recipe.nutrition}</p>
            </Section>
          )}

          {recipe.shoppingList.length > 0 && (
            <Section title="Shopping list">
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                {recipe.shoppingList.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[13px] text-paper-ink">
                    <span className="text-gold">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {recipe.suggestedPairings.length > 0 && (
            <Section title="Suggested pairings">
              <ul className="flex flex-col gap-1">
                {recipe.suggestedPairings.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[13px] text-paper-ink">
                    <span className="text-gold">·</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {recipe.chefTips.length > 0 && (
            <Section title="Chef tips">
              <ul className="flex flex-col gap-1.5">
                {recipe.chefTips.map((tip, i) => (
                  <li key={i} className="rounded-lg border-l-[3px] border-gold bg-paper-surface2 px-2.5 py-2 text-[12.5px] leading-relaxed text-paper-ink">
                    {tip}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 print:hidden">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-paper-border bg-paper-surface2 px-2.5 py-1 text-[10.5px] font-medium text-paper-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
