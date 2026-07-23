"use client";

import { useState } from "react";
import { GROCERY_CATEGORIES, GroceryCategory, GroceryData, StapleItem } from "@/lib/lists";

export default function ManageStaples({
  data,
  onChange,
  onBack,
}: {
  data: GroceryData;
  onChange: (updater: (g: GroceryData) => GroceryData) => void;
  onBack: () => void;
}) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<GroceryCategory>("Produce");

  function addStaple() {
    if (!text.trim()) return;
    const staple: StapleItem = { id: crypto.randomUUID(), text: text.trim(), category };
    onChange((g) => ({ ...g, staples: [...g.staples, staple] }));
    setText("");
  }

  function deleteStaple(id: string) {
    onChange((g) => ({ ...g, staples: g.staples.filter((s) => s.id !== id) }));
  }

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-paper-border bg-paper-surface text-paper-muted"
          aria-label="Back to grocery list"
        >
          ‹
        </button>
        <p className="font-serif text-[1.05rem] text-backdrop-ink">Manage Staples</p>
        <div className="w-8" />
      </div>

      <div className="mb-3 rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <div className="mb-2 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addStaple();
            }}
            placeholder="Add a staple item…"
            className="min-w-0 flex-1 rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[14px] text-paper-ink outline-none"
          />
          <button
            type="button"
            onClick={addStaple}
            className="rounded-xl bg-life px-4 text-sm font-medium text-paper-surface"
          >
            + Add
          </button>
        </div>
        <div className="scroll-quiet flex gap-1.5 overflow-x-auto">
          {GROCERY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                category === cat
                  ? "bg-life text-paper-surface"
                  : "border border-paper-border text-paper-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {GROCERY_CATEGORIES.map((cat) => {
        const staplesInCat = data.staples.filter((s) => s.category === cat);
        if (staplesInCat.length === 0) return null;
        return (
          <div key={cat} className="mb-3">
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-faint">
              {cat}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {staplesInCat.map((staple) => (
                <span
                  key={staple.id}
                  className="flex items-center gap-1.5 rounded-full border border-paper-border bg-paper-surface px-3 py-1.5 text-[13px] text-paper-ink"
                >
                  {staple.text}
                  <button
                    type="button"
                    aria-label={`Remove ${staple.text} from staples`}
                    onClick={() => deleteStaple(staple.id)}
                    className="text-paper-faint"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        );
      })}

      {data.staples.length === 0 && (
        <p className="py-6 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No staples yet. Add the things you buy every trip.
        </p>
      )}
    </div>
  );
}
