"use client";

import { useState } from "react";
import {
  Budget,
  TRANSACTION_CATEGORIES,
  TransactionCategory,
  Transaction,
  budgetProgressForMonth,
  formatMoney,
  monthKey,
} from "@/lib/finance";

export default function BudgetsTab({
  budgets,
  transactions,
  onAdd,
  onUpdate,
  onDelete,
}: {
  budgets: Budget[];
  transactions: Transaction[];
  onAdd: (b: Omit<Budget, "id">) => void;
  onUpdate: (id: string, updater: (b: Budget) => Budget) => void;
  onDelete: (id: string) => void;
}) {
  const [category, setCategory] = useState<TransactionCategory>("Groceries");
  const [limitText, setLimitText] = useState("");
  const now = new Date();
  const key = monthKey(now);
  const progress = budgetProgressForMonth(budgets, transactions, key);

  function submit() {
    const limit = Number(limitText);
    if (!limitText || Number.isNaN(limit) || limit <= 0) return;
    onAdd({ category, monthlyLimit: limit });
    setLimitText("");
  }

  return (
    <div>
      <div className="mb-4 rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <p className="mb-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          New Monthly Budget
        </p>
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TransactionCategory)}
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
          >
            {TRANSACTION_CATEGORIES.filter((c) => c !== "Income").map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Limit"
            value={limitText}
            onChange={(e) => setLimitText(e.target.value)}
            className="w-24 rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
          />
          <button
            type="button"
            onClick={submit}
            className="shrink-0 rounded-lg bg-life px-3 py-1.5 text-xs font-medium text-paper-surface"
          >
            + Add
          </button>
        </div>
      </div>

      {progress.length === 0 ? (
        <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No budgets yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {progress.map(({ budget, spent, pct }) => (
            <div
              key={budget.id}
              className="rounded-xl border border-paper-border bg-paper-surface p-3.5 shadow-paper"
            >
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[13.5px] font-medium text-paper-ink">{budget.category}</p>
                <button
                  type="button"
                  onClick={() => onDelete(budget.id)}
                  className="text-xs text-paper-faint underline underline-offset-2"
                >
                  Delete
                </button>
              </div>
              <div className="mb-1.5 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-surface2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct > 100 ? "bg-[#B5574A]" : "bg-life"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <span className="shrink-0 text-[11px] text-paper-muted">{pct}%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-paper-muted">
                <span>
                  {formatMoney(spent)} of {formatMoney(budget.monthlyLimit)}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={budget.monthlyLimit}
                  onChange={(e) =>
                    onUpdate(budget.id, (b) => ({ ...b, monthlyLimit: Number(e.target.value) || 0 }))
                  }
                  className="w-20 rounded-lg border border-paper-border bg-paper-surface2 px-1.5 py-0.5 text-right text-[11px] text-paper-ink outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
