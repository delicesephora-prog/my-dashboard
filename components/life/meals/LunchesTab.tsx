"use client";

import { LunchIdea } from "@/lib/mealcalendar";

export default function LunchesTab({ lunches }: { lunches: LunchIdea[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="px-0.5 pb-1 text-[13px] leading-relaxed text-paper-muted">
        Lunch is deliberately boring: it rides on dinner leftovers + a rotation of zero-cook plates.
        Nothing here needs a recipe.
      </p>
      {lunches.map((l) => (
        <div
          key={l.id}
          className="flex gap-3 rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper"
        >
          <span className="text-[26px] leading-none">{l.emoji}</span>
          <div>
            <p className="font-serif text-[15px] text-paper-ink">{l.title}</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-paper-muted">{l.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
