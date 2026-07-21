"use client";

import {
  Transaction,
  expenseForMonth,
  formatMoney,
  incomeForMonth,
  monthKey,
  recentMonthsTrend,
  spendingByCategory,
} from "@/lib/finance";

export default function TrendsTab({ transactions }: { transactions: Transaction[] }) {
  const now = new Date();
  const key = monthKey(now);
  const income = incomeForMonth(transactions, key);
  const expense = expenseForMonth(transactions, key);
  const byCategory = spendingByCategory(transactions, key);
  const trend = recentMonthsTrend(transactions, now, 6);
  const trendMax = Math.max(1, ...trend.flatMap((m) => [m.income, m.expense]));
  const categoryMax = Math.max(1, ...byCategory.map((c) => c.amount));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Income This Month
          </p>
          <p className="mt-0.5 font-serif text-xl text-sage">{formatMoney(income)}</p>
        </div>
        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Spent This Month
          </p>
          <p className="mt-0.5 font-serif text-xl text-paper-ink">{formatMoney(expense)}</p>
        </div>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Spending by Category · This Month
        </p>
        {byCategory.length === 0 ? (
          <p className="text-[12.5px] italic text-paper-muted">No expenses logged this month.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {byCategory.map((c) => (
              <div key={c.category}>
                <div className="mb-0.5 flex items-center justify-between text-[12px]">
                  <span className="text-paper-ink">{c.category}</span>
                  <span className="text-paper-muted">{formatMoney(c.amount)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-paper-surface2">
                  <div
                    className="h-full rounded-full bg-life"
                    style={{ width: `${(c.amount / categoryMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Income vs. Spending · Last 6 Months
        </p>
        <div className="flex items-end justify-between gap-2">
          {trend.map((m) => (
            <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-24 items-end gap-[3px]">
                <div
                  role="img"
                  aria-label={`${m.label} income: ${formatMoney(m.income)}`}
                  title={`${m.label} income: ${formatMoney(m.income)}`}
                  className="w-2.5 rounded-t-sm bg-sage"
                  style={{ height: `${Math.max((m.income / trendMax) * 100, m.income > 0 ? 4 : 0)}%` }}
                />
                <div
                  role="img"
                  aria-label={`${m.label} spending: ${formatMoney(m.expense)}`}
                  title={`${m.label} spending: ${formatMoney(m.expense)}`}
                  className="w-2.5 rounded-t-sm bg-work"
                  style={{ height: `${Math.max((m.expense / trendMax) * 100, m.expense > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className="text-[9.5px] uppercase tracking-wide text-paper-muted">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 text-[10.5px] text-paper-muted">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-sage" /> Income
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-work" /> Spending
          </span>
        </div>
      </div>
    </div>
  );
}
