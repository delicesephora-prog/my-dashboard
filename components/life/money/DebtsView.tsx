"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/finance";
import { Debt, DebtStatus } from "@/lib/types";
import { BudgetConfig } from "@/lib/budget";
import {
  DebtStrategy,
  dueDateRadar,
  interestCostPerMonth,
  missedBillCatchUpPlan,
  orderedDebts,
  payoffForecast,
  survivalNumberForSlot,
} from "@/lib/debtplan";

const STATUS_LABELS: Record<DebtStatus, string> = {
  current: "Current",
  pastDue: "Past Due",
  restricted: "Restricted",
  closed: "Closed",
};

const STATUS_COLORS: Record<DebtStatus, string> = {
  current: "#8A9B7C",
  pastDue: "#B5574A",
  restricted: "#B08B4F",
  closed: "#6B7A8F",
};

export default function DebtsView({
  debts,
  config,
  onChangeDebts,
}: {
  debts: Debt[];
  config: BudgetConfig;
  onChangeDebts: (updater: (d: Debt[]) => Debt[]) => void;
}) {
  const now = new Date();
  const [strategy, setStrategy] = useState<DebtStrategy>("snowball");
  const [extraPayment, setExtraPayment] = useState(0);

  const slot = now.getDate() <= 15 ? "first" : "second";
  const survival = survivalNumberForSlot(config, debts, slot);
  const radar = dueDateRadar(config, debts, now);
  const ordered = orderedDebts(debts, strategy);
  const pastDueOrRestricted = debts.filter((d) => (d.status === "pastDue" || d.status === "restricted") && d.currentBalance > 0);

  function updateDebt(id: string, updater: (d: Debt) => Debt) {
    onChangeDebts((ds) => ds.map((d) => (d.id === id ? updater(d) : d)));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* SURVIVAL NUMBER */}
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Survival Number - This Paycheck
        </p>
        <p className="mt-0.5 font-serif text-2xl text-paper-ink">{formatMoney(survival)}</p>
        <p className="text-[11.5px] text-paper-muted">
          The bare minimum to stay safe - essential bills plus debt minimums due this half of the month. Everything
          above it is choice.
        </p>
      </div>

      {/* GENTLE MISSED-BILL RECOVERY */}
      {pastDueOrRestricted.length > 0 && (
        <div className="flex flex-col gap-2">
          {pastDueOrRestricted.map((d) => {
            const plan = missedBillCatchUpPlan(d);
            return (
              <div
                key={d.id}
                className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper"
                style={{ borderLeft: "3px solid #B5574A" }}
              >
                <p className="text-[13px] font-medium text-paper-ink">{d.name}</p>
                <p className="mt-0.5 text-[12px] text-paper-muted">
                  {d.status === "pastDue" && plan.pastDueAmount > 0
                    ? `${formatMoney(plan.pastDueAmount)} past due. No panic - this happens on single income. `
                    : "Restricted - this needs attention, but there's no rush to panic. "}
                  Catch it up with {formatMoney(plan.suggestedCatchUpAmount)} on your next paycheck, then the regular
                  minimum keeps it steady from there.
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* DUE-DATE RADAR */}
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Due-Date Radar
        </p>
        {radar.length === 0 ? (
          <p className="py-2 text-center text-[12px] italic text-paper-muted">Nothing due before your next paycheck.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {radar.map((item, i) => (
              <div
                key={i}
                className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 ${
                  item.pinned ? "bg-[#B5574A]/8" : "bg-paper-surface2/50"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-paper-ink">{item.name}</p>
                  <p className="text-[10.5px] text-paper-muted">
                    {item.status === "pastDue" ? "Past due" : item.status === "restricted" ? "Restricted" : item.date ? `Due ${item.date.slice(5)}` : "Due soon"}
                  </p>
                </div>
                <span className="shrink-0 text-[12.5px] text-paper-ink">{formatMoney(item.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SNOWBALL / AVALANCHE + PAYOFF FORECAST */}
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">Which Debt Next</p>
          <div className="flex gap-1 rounded-full bg-paper-surface2 p-1">
            <button
              type="button"
              onClick={() => setStrategy("snowball")}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                strategy === "snowball" ? "bg-paper-surface text-paper-ink shadow-paper" : "text-paper-muted"
              }`}
            >
              Snowball
            </button>
            <button
              type="button"
              onClick={() => setStrategy("avalanche")}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                strategy === "avalanche" ? "bg-paper-surface text-paper-ink shadow-paper" : "text-paper-muted"
              }`}
            >
              Avalanche
            </button>
          </div>
        </div>
        <p className="mb-3 text-[11px] text-paper-muted">
          {strategy === "snowball"
            ? "Smallest balance first - fastest wins, for momentum."
            : "Highest interest first - saves the most money over time."}
        </p>

        <div className="mb-3 flex items-center gap-2">
          <span className="text-[11.5px] text-paper-muted">Forecast with extra:</span>
          {[0, 25, 50, 100].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setExtraPayment(amt)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                extraPayment === amt ? "bg-life text-paper-surface" : "border border-paper-border text-paper-muted"
              }`}
            >
              +${amt}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {ordered.map((debt, i) => (
            <DebtRow key={debt.id} debt={debt} rank={i + 1} extraPayment={extraPayment} now={now} onUpdate={(updater) => updateDebt(debt.id, updater)} />
          ))}
          {ordered.length === 0 && <p className="py-2 text-center text-[12px] italic text-paper-muted">No active debts - nicely done.</p>}
        </div>
      </div>
    </div>
  );
}

function DebtRow({
  debt,
  rank,
  extraPayment,
  now,
  onUpdate,
}: {
  debt: Debt;
  rank: number;
  extraPayment: number;
  now: Date;
  onUpdate: (updater: (d: Debt) => Debt) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const monthlyInterest = interestCostPerMonth(debt.currentBalance, debt.interestRatePct);
  const basePayment = debt.minPayment;
  const forecastBase = payoffForecast(debt.currentBalance, debt.interestRatePct, basePayment, now);
  const forecastBoosted = extraPayment > 0 ? payoffForecast(debt.currentBalance, debt.interestRatePct, basePayment + extraPayment, now) : null;

  return (
    <div className="rounded-xl border border-paper-border bg-paper-surface2/40 p-3">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="flex w-full items-center gap-2.5 text-left">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper-surface2 text-[11px] font-medium text-paper-muted">
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[13.5px] text-paper-ink">{debt.name}</p>
            {debt.priority && <span className="text-[10px]">📌</span>}
            <span
              className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide"
              style={{ backgroundColor: `${STATUS_COLORS[debt.status]}22`, color: STATUS_COLORS[debt.status] }}
            >
              {STATUS_LABELS[debt.status]}
            </span>
          </div>
          <p className="text-[11px] text-paper-muted">
            {formatMoney(debt.currentBalance)}
            {debt.interestRatePct > 0 && ` · ${debt.interestRatePct}% APR · ${formatMoney(monthlyInterest)}/mo interest`}
          </p>
        </div>
      </button>

      <div className="mt-2 flex items-center gap-3 pl-8 text-[11.5px]">
        {forecastBase ? (
          <span className="text-paper-muted">
            Debt-free: <b className="text-paper-ink">{forecastBase.payoffDateLabel}</b> ({forecastBase.monthsToPayoff} mo)
          </span>
        ) : debt.minPayment > 0 ? (
          <span className="text-[#B5574A]">Minimum doesn&apos;t cover the interest at this rate.</span>
        ) : (
          <span className="text-paper-faint">Set a minimum payment to see a forecast.</span>
        )}
        {forecastBoosted && (
          <span className="text-sage">
            +${extraPayment}: <b>{forecastBoosted.payoffDateLabel}</b> ({forecastBoosted.monthsToPayoff} mo)
          </span>
        )}
      </div>

      {expanded && (
        <div className="animate-fade-in mt-3 space-y-2.5 border-t border-paper-border pt-3">
          <Field label="Name">
            <input
              value={debt.name}
              onChange={(e) => onUpdate((d) => ({ ...d, name: e.target.value }))}
              className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
            />
          </Field>
          <div className="flex gap-2">
            <Field label="Current Balance">
              <NumberInput value={debt.currentBalance} onChange={(v) => onUpdate((d) => ({ ...d, currentBalance: v }))} />
            </Field>
            <Field label="Min Payment">
              <NumberInput value={debt.minPayment} onChange={(v) => onUpdate((d) => ({ ...d, minPayment: v }))} />
            </Field>
          </div>
          <div className="flex gap-2">
            <Field label="Interest Rate %">
              <NumberInput value={debt.interestRatePct} onChange={(v) => onUpdate((d) => ({ ...d, interestRatePct: v }))} step="0.1" />
            </Field>
            <Field label="Due Day">
              <NumberInput value={debt.dueDay} onChange={(v) => onUpdate((d) => ({ ...d, dueDay: Math.round(v) }))} />
            </Field>
          </div>
          <Field label="Status">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(STATUS_LABELS) as DebtStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onUpdate((d) => ({ ...d, status: s, pastDueAmount: s === "pastDue" ? d.pastDueAmount : 0 }))}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                    debt.status === s ? "bg-life text-paper-surface" : "border border-paper-border text-paper-muted"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </Field>
          {debt.status === "pastDue" && (
            <Field label="Past Due Amount">
              <NumberInput value={debt.pastDueAmount} onChange={(v) => onUpdate((d) => ({ ...d, pastDueAmount: v }))} />
            </Field>
          )}
          <label className="flex items-center gap-2 text-[12.5px] text-paper-ink">
            <input
              type="checkbox"
              checked={debt.priority}
              onChange={(e) => onUpdate((d) => ({ ...d, priority: e.target.checked }))}
              className="h-4 w-4 accent-life"
            />
            Flag as priority (shows at the top no matter the ordering)
          </label>
          <Field label="Notes">
            <input
              value={debt.notes}
              onChange={(e) => onUpdate((d) => ({ ...d, notes: e.target.value }))}
              className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
            />
          </Field>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1">
      <p className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">{label}</p>
      {children}
    </div>
  );
}

function NumberInput({ value, onChange, step = "0.01" }: { value: number; onChange: (v: number) => void; step?: string }) {
  return (
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
    />
  );
}
