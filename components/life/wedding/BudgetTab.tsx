"use client";

import { useState } from "react";
import { BudgetItem, budgetTotals } from "@/lib/wedding";

function formatMoney(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function BudgetTab({
  items,
  onAdd,
  onUpdate,
  onDelete,
}: {
  items: BudgetItem[];
  onAdd: (category: string, estimated: number) => void;
  onUpdate: (id: string, updater: (b: BudgetItem) => BudgetItem) => void;
  onDelete: (id: string) => void;
}) {
  const [category, setCategory] = useState("");
  const [estimatedText, setEstimatedText] = useState("");
  const totals = budgetTotals(items);

  function submit() {
    const estimated = Number(estimatedText);
    if (!category.trim() || Number.isNaN(estimated)) return;
    onAdd(category.trim(), estimated);
    setCategory("");
    setEstimatedText("");
  }

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Estimated
          </p>
          <p className="mt-0.5 font-serif text-xl text-paper-ink">{formatMoney(totals.estimated)}</p>
        </div>
        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Actual
          </p>
          <p className="mt-0.5 font-serif text-xl text-paper-ink">{formatMoney(totals.actual)}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (e.g. Venue)"
          className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-2 text-[13px] text-paper-ink outline-none"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Estimated"
          value={estimatedText}
          onChange={(e) => setEstimatedText(e.target.value)}
          className="w-28 rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-2 text-[13px] text-paper-ink outline-none"
        />
        <button
          type="button"
          onClick={submit}
          className="shrink-0 rounded-lg bg-life px-3 py-2 text-xs font-medium text-paper-surface"
        >
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No budget lines yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-paper-border bg-paper-surface p-3.5 shadow-paper"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13.5px] font-medium text-paper-ink">{item.category}</p>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="text-xs text-paper-faint underline underline-offset-2"
                >
                  Delete
                </button>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                    Estimated
                  </p>
                  <input
                    type="number"
                    step="0.01"
                    value={item.estimated}
                    onChange={(e) =>
                      onUpdate(item.id, (b) => ({ ...b, estimated: Number(e.target.value) || 0 }))
                    }
                    className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
                  />
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                    Actual
                  </p>
                  <input
                    type="number"
                    step="0.01"
                    value={item.actual}
                    onChange={(e) =>
                      onUpdate(item.id, (b) => ({ ...b, actual: Number(e.target.value) || 0 }))
                    }
                    className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
