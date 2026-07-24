"use client";

import { formatMoney } from "@/lib/finance";
import { MoneyData } from "@/lib/types";
import { BudgetData, monthKey, monthStateFor, spendingStatus, moneyInSummary, moneyOutSummary } from "@/lib/budget";
import { monthlyTrendSeries } from "@/lib/debtplan";
import DonutChart from "@/components/DonutChart";
import TrendLineChart from "@/components/TrendLineChart";

const CATEGORY_COLORS = ["#5B2333", "#A54B3F", "#B08B4F", "#8A9B7C", "#6B7A8F", "#3D1622"];

const WIN_KIND_ICON: Record<string, string> = {
  debtPayment: "💪",
  debtPaidOff: "🎉",
  vaultGrowth: "🌱",
};

export default function ProgressView({ budget, money }: { budget: BudgetData; money: MoneyData }) {
  const now = new Date();
  const key = monthKey(now);
  const state = monthStateFor(budget, key, money);

  const trend = monthlyTrendSeries(budget, money);
  const netNow = trend[trend.length - 1]?.netPosition ?? 0;
  const netPrior = trend.length > 1 ? trend[trend.length - 2].netPosition : netNow;
  const netChange = netNow - netPrior;

  const spendStatus = spendingStatus(budget.config, state).filter((s) => s.spent > 0);
  const moneyIn = moneyInSummary(budget, key);
  const moneyOut = moneyOutSummary(budget.config, state);
  const maxInOut = Math.max(moneyIn.received, moneyOut.paid, 1);

  const wins = [...budget.wins].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-3">
      {/* NET POSITION - the single truest measure */}
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Net Position - Vaults minus Debt
        </p>
        <div className="mt-0.5 flex items-baseline gap-2">
          <p className={`font-serif text-2xl ${netNow >= 0 ? "text-sage" : "text-paper-ink"}`}>{formatMoney(netNow)}</p>
          {Math.abs(netChange) >= 0.01 && (
            <span className={`text-[12px] ${netChange > 0 ? "text-sage" : "text-[#B5574A]"}`}>
              {netChange > 0 ? "▲" : "▼"} {formatMoney(Math.abs(netChange))}
            </span>
          )}
        </div>
        <div className="mt-2">
          <TrendLineChart points={trend.map((t) => ({ label: t.label, value: t.netPosition }))} color="#5B2333" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Total Debt - Trending Down
          </p>
          <p className="mt-0.5 font-serif text-lg text-paper-ink">
            {formatMoney(trend[trend.length - 1]?.debtTotal ?? 0)}
          </p>
          <div className="mt-2">
            <TrendLineChart points={trend.map((t) => ({ label: t.label, value: t.debtTotal }))} color="#A54B3F" heightPx={70} />
          </div>
        </div>

        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Vaults - Trending Up
          </p>
          <p className="mt-0.5 font-serif text-lg text-paper-ink">
            {formatMoney(trend[trend.length - 1]?.vaultTotal ?? 0)}
          </p>
          <div className="mt-2">
            <TrendLineChart points={trend.map((t) => ({ label: t.label, value: t.vaultTotal }))} color="#8A9B7C" heightPx={70} />
          </div>
        </div>
      </div>

      {/* SPENDING BY CATEGORY DONUT */}
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Spending by Category - This Month
        </p>
        {spendStatus.length === 0 ? (
          <p className="py-4 text-center text-[12px] italic text-paper-muted">Nothing logged yet this month.</p>
        ) : (
          <div className="flex items-center gap-4">
            <DonutChart
              segments={spendStatus.map((s, i) => ({ label: s.target.name, value: s.spent, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))}
              size={110}
              strokeWidth={14}
              centerValue={spendStatus.reduce((sum, s) => sum + s.spent, 0)}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {spendStatus.map((s, i) => (
                <div key={s.target.id} className="flex items-center justify-between gap-2 text-[11.5px]">
                  <span className="flex items-center gap-1.5 truncate text-paper-ink">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                    {s.target.name}
                  </span>
                  <span className="shrink-0 text-paper-muted">{formatMoney(s.spent)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MONEY UP/DOWN THIS PERIOD */}
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Money In vs. Out - This Month
        </p>
        <div className="flex items-end gap-4">
          <div className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-20 w-full items-end justify-center">
              <div
                className="w-8 rounded-t-md bg-sage"
                style={{ height: `${Math.max((moneyIn.received / maxInOut) * 100, moneyIn.received > 0 ? 4 : 0)}%` }}
              />
            </div>
            <span className="text-[11px] text-paper-muted">In</span>
            <span className="text-[12px] font-medium text-paper-ink">{formatMoney(moneyIn.received)}</span>
          </div>
          <div className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-20 w-full items-end justify-center">
              <div
                className="w-8 rounded-t-md bg-work"
                style={{ height: `${Math.max((moneyOut.paid / maxInOut) * 100, moneyOut.paid > 0 ? 4 : 0)}%` }}
              />
            </div>
            <span className="text-[11px] text-paper-muted">Out</span>
            <span className="text-[12px] font-medium text-paper-ink">{formatMoney(moneyOut.paid)}</span>
          </div>
          <div className="flex-1 text-right">
            <p className="text-[11px] text-paper-muted">Running balance</p>
            <p className={`font-serif text-lg ${moneyIn.received - moneyOut.paid >= 0 ? "text-sage" : "text-paper-ink"}`}>
              {formatMoney(moneyIn.received - moneyOut.paid)}
            </p>
          </div>
        </div>
      </div>

      {/* WINS LOG */}
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">Wins Log</p>
        {wins.length === 0 ? (
          <p className="py-4 text-center text-[12px] italic text-paper-muted">
            Every debt payment and vault deposit shows up here - proof the plan works.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {wins.slice(0, 30).map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-2 rounded-lg bg-paper-surface2/50 px-2.5 py-1.5">
                <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-paper-ink">
                  <span>{WIN_KIND_ICON[w.kind] ?? "✓"}</span>
                  <span className="truncate">{w.name}</span>
                </span>
                <span className="shrink-0 text-[11px] text-paper-muted">
                  {formatMoney(w.amount)} · {w.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
