"use client";

import { useState } from "react";
import {
  Account,
  Transaction,
  TRANSACTION_CATEGORIES,
  TransactionCategory,
  formatMoney,
} from "@/lib/finance";
import { todayKey } from "@/lib/date";

export default function TransactionsTab({
  accounts,
  transactions,
  onAdd,
  onDelete,
}: {
  accounts: Account[];
  transactions: Transaction[];
  onAdd: (t: Omit<Transaction, "id">) => void;
  onDelete: (id: string) => void;
}) {
  const [date, setDate] = useState(todayKey());
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [category, setCategory] = useState<TransactionCategory>("Other");
  const [description, setDescription] = useState("");
  const [amountText, setAmountText] = useState("");
  const [kind, setKind] = useState<"expense" | "income">("expense");

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  function accountName(id: string): string {
    return accounts.find((a) => a.id === id)?.name || "Unknown account";
  }

  function submit() {
    const amount = Number(amountText);
    if (!accountId || !amountText || Number.isNaN(amount) || amount <= 0) return;
    onAdd({
      accountId,
      date,
      amount: kind === "expense" ? -amount : amount,
      category,
      description,
    });
    setDescription("");
    setAmountText("");
  }

  return (
    <div>
      {accounts.length === 0 ? (
        <p className="mb-3 text-[12.5px] italic text-paper-muted">
          Add an account first, then you can log transactions against it.
        </p>
      ) : (
        <div className="mb-4 rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
          <div className="mb-2.5 flex gap-1 rounded-full bg-paper-surface2 p-1">
            <button
              type="button"
              onClick={() => setKind("expense")}
              className={`flex-1 rounded-full py-1.5 text-[12px] font-medium transition ${
                kind === "expense" ? "bg-paper-surface text-paper-ink shadow-paper" : "text-paper-muted"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setKind("income")}
              className={`flex-1 rounded-full py-1.5 text-[12px] font-medium transition ${
                kind === "income" ? "bg-paper-surface text-paper-ink shadow-paper" : "text-paper-muted"
              }`}
            >
              Income
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                className="w-28 rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
              >
                {TRANSACTION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
            />
            <button
              type="button"
              onClick={submit}
              className="rounded-xl bg-life py-2 text-[13px] font-medium text-paper-surface"
            >
              Add Transaction
            </button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No transactions yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2.5 rounded-xl border border-paper-border bg-paper-surface px-3.5 py-2.5 shadow-paper"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] text-paper-ink">
                  {t.description || t.category}
                </p>
                <p className="truncate text-[11px] text-paper-muted">
                  {t.date} · {accountName(t.accountId)} · {t.category}
                </p>
              </div>
              <span
                className={`shrink-0 text-[13.5px] font-medium ${
                  t.amount < 0 ? "text-paper-ink" : "text-sage"
                }`}
              >
                {t.amount < 0 ? "-" : "+"}
                {formatMoney(Math.abs(t.amount))}
              </span>
              <button
                type="button"
                onClick={() => onDelete(t.id)}
                aria-label="Delete transaction"
                className="shrink-0 text-paper-faint"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
