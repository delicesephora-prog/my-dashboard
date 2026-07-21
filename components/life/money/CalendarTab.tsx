"use client";

import { useState } from "react";
import { MoneyData } from "@/lib/types";
import { formatMoney } from "@/lib/finance";
import {
  BudgetData,
  extraIncomeForMonth,
  formatMonthLabel,
  monthKey,
  moneyInSummary,
  moneyOutSummary,
  spendingStatus,
} from "@/lib/budget";

export default function CalendarTab({ budget, money }: { budget: BudgetData; money: MoneyData }) {
  const now = new Date();
  const currentKey = monthKey(now);

  // Every month with any tracked state, plus the current month even if it
  // hasn't been touched yet - sorted most recent first.
  const keys = Array.from(new Set([...Object.keys(budget.months), currentKey])).sort((a, b) =>
    b.localeCompare(a)
  );

  if (keys.length === 0) {
    return (
      <p className="py-6 text-center font-serif text-[0.9rem] italic text-paper-muted">
        Nothing tracked yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {keys.map((key) => (
        <MonthRecapCard key={key} monthKey={key} budget={budget} money={money} isCurrent={key === currentKey} />
      ))}
    </div>
  );
}

function MonthRecapCard({
  monthKey: key,
  budget,
  money,
  isCurrent,
}: {
  monthKey: string;
  budget: BudgetData;
  money: MoneyData;
  isCurrent: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const state = budget.months[key];
  const config = budget.config;

  const moneyIn = moneyInSummary(budget, key);
  const moneyOut = moneyOutSummary(config, state);
  const extra = extraIncomeForMonth(budget, key);
  const spend = spendingStatus(config, state).filter((s) => s.spent > 0);

  return (
    <div className="overflow-hidden rounded-xl2 border border-paper-border bg-paper-surface shadow-paper">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left"
      >
        <div className="min-w-0">
          <p className="text-[14px] text-paper-ink">
            {formatMonthLabel(key)}
            {isCurrent && <span className="ml-1.5 text-[10px] text-gold">this month</span>}
          </p>
          <p className="text-[11px] text-paper-muted">
            {formatMoney(moneyIn.received)} in · {formatMoney(moneyOut.paid)} out
          </p>
        </div>
        <span className="shrink-0 text-paper-faint">{expanded ? "︿" : "﹀"}</span>
      </button>

      {expanded && (
        <div className="animate-fade-in space-y-3 border-t border-paper-border px-3.5 py-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Money In
              </p>
              <p className="font-serif text-[1.05rem] text-sage">{formatMoney(moneyIn.received)}</p>
              <p className="text-[10.5px] text-paper-muted">of {formatMoney(moneyIn.expected)} expected</p>
              {extra > 0 && <p className="text-[10.5px] text-sage">+{formatMoney(extra)} extra</p>}
            </div>
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Money Out
              </p>
              <p className="font-serif text-[1.05rem] text-paper-ink">{formatMoney(moneyOut.paid)}</p>
              <p className="text-[10.5px] text-paper-muted">of {formatMoney(moneyOut.total)} planned</p>
            </div>
          </div>

          {spend.length > 0 && (
            <div>
              <p className="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Spending
              </p>
              <div className="flex flex-col gap-1">
                {spend.map(({ target, spent, pct, overTarget }) => (
                  <div key={target.id} className="flex items-center justify-between text-[12px]">
                    <span className="text-paper-ink">{target.name}</span>
                    <span className={overTarget ? "text-gold" : "text-paper-muted"}>
                      {formatMoney(spent)} ({pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!state && <p className="text-[12px] italic text-paper-muted">No activity tracked this month.</p>}
        </div>
      )}
    </div>
  );
}
