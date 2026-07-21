"use client";

import { useState } from "react";
import { MoneyData } from "@/lib/types";
import { formatMoney } from "@/lib/finance";
import { CelebrationTier } from "@/lib/celebration";
import {
  BillItem,
  BudgetData,
  DebtPaymentItem,
  VaultTransferItem,
  SpendingTarget,
  actualAmount,
  buildingUpSummary,
  dueNextItems,
  emptyLineItemState,
  expectedMonthlyIncome,
  extraIncomeForMonth,
  isDone,
  isSpendMonth,
  leftToBreathe,
  lineItemStateFor,
  monthKey,
  monthStateFor,
  moneyInSummary,
  moneyOutSummary,
  plannedAmount,
  slotsFor,
  spendingStatus,
  totalMonthlyBills,
  totalMonthlyDebts,
  totalMonthlySpending,
  totalMonthlyVaults,
  updateMonthState,
} from "@/lib/budget";
import BudgetItemRow, { Slot } from "./BudgetItemRow";
import CheckCircle from "../../CheckCircle";

export default function CommandCenter({
  budget,
  money,
  onChangeBudget,
  onChangeMoney,
  onCelebrate,
}: {
  budget: BudgetData;
  money: MoneyData;
  onChangeBudget: (updater: (b: BudgetData) => BudgetData) => void;
  onChangeMoney: (updater: (m: MoneyData) => MoneyData) => void;
  onCelebrate: (tier: CelebrationTier, message: string) => void;
}) {
  const now = new Date();
  const key = monthKey(now);
  const state = monthStateFor(budget, key, money);
  const config = budget.config;

  // -- config editing -------------------------------------------------

  function updateBillConfig(id: string, updater: (b: BillItem) => BillItem) {
    onChangeBudget((b) => ({
      ...b,
      config: { ...b.config, bills: b.config.bills.map((x) => (x.id === id ? updater(x) : x)) },
    }));
  }
  function updateDebtConfig(id: string, updater: (d: DebtPaymentItem) => DebtPaymentItem) {
    onChangeBudget((b) => ({
      ...b,
      config: { ...b.config, debtPayments: b.config.debtPayments.map((x) => (x.id === id ? updater(x) : x)) },
    }));
  }
  function updateVaultConfig(id: string, updater: (v: VaultTransferItem) => VaultTransferItem) {
    onChangeBudget((b) => ({
      ...b,
      config: { ...b.config, vaultTransfers: b.config.vaultTransfers.map((x) => (x.id === id ? updater(x) : x)) },
    }));
  }
  function updateSpendingConfig(id: string, updater: (s: SpendingTarget) => SpendingTarget) {
    onChangeBudget((b) => ({
      ...b,
      config: { ...b.config, spendingTargets: b.config.spendingTargets.map((x) => (x.id === id ? updater(x) : x)) },
    }));
  }

  // -- month state (paid/done) editing --------------------------------

  function updateBillState(id: string, updater: (s: ReturnType<typeof emptyLineItemState>) => ReturnType<typeof emptyLineItemState>) {
    onChangeBudget((b) =>
      updateMonthState(b, key, money, (s) => ({
        ...s,
        bills: { ...s.bills, [id]: updater(lineItemStateFor(s.bills, id)) },
      }))
    );
  }
  function updateDebtState(id: string, updater: (s: ReturnType<typeof emptyLineItemState>) => ReturnType<typeof emptyLineItemState>) {
    onChangeBudget((b) =>
      updateMonthState(b, key, money, (s) => ({
        ...s,
        debts: { ...s.debts, [id]: updater(lineItemStateFor(s.debts, id)) },
      }))
    );
  }
  function updateVaultState(id: string, updater: (s: ReturnType<typeof emptyLineItemState>) => ReturnType<typeof emptyLineItemState>) {
    onChangeBudget((b) =>
      updateMonthState(b, key, money, (s) => ({
        ...s,
        vaults: { ...s.vaults, [id]: updater(lineItemStateFor(s.vaults, id)) },
      }))
    );
  }

  function toggleSlot(
    slot: Slot,
    s: ReturnType<typeof emptyLineItemState>
  ): ReturnType<typeof emptyLineItemState> {
    return {
      ...s,
      firstDone: slot === "first" ? !s.firstDone : s.firstDone,
      secondDone: slot === "second" ? !s.secondDone : s.secondDone,
    };
  }
  function setSlotAmount(
    slot: Slot,
    amount: number,
    s: ReturnType<typeof emptyLineItemState>
  ): ReturnType<typeof emptyLineItemState> {
    return {
      ...s,
      firstAmount: slot === "first" ? amount : s.firstAmount,
      secondAmount: slot === "second" ? amount : s.secondAmount,
    };
  }

  function toggleBillSlot(bill: BillItem, slot: Slot) {
    updateBillState(bill.id, (s) => toggleSlot(slot, s));
  }

  function toggleVaultSlot(item: VaultTransferItem) {
    return (slot: Slot) => {
      const itemState = lineItemStateFor(state.vaults, item.id);
      const wasDone = isDone(itemState, slot);
      const planned = plannedAmount(item.schedule, item.monthlyAmount, slot);
      const amount = actualAmount(itemState, slot, planned);
      const delta = wasDone ? -amount : amount;

      onChangeMoney((m) => ({
        ...m,
        vaults: m.vaults.map((v) =>
          v.name.trim().toLowerCase() === item.vaultName.trim().toLowerCase()
            ? { ...v, currentAmount: Math.max(0, v.currentAmount + delta) }
            : v
        ),
      }));
      updateVaultState(item.id, (s) => toggleSlot(slot, s));
    };
  }

  function toggleDebtSlot(item: DebtPaymentItem) {
    return (slot: Slot) => {
      const itemState = lineItemStateFor(state.debts, item.id);
      const wasDone = isDone(itemState, slot);
      const planned = plannedAmount(item.schedule, item.monthlyAmount, slot);
      const amount = actualAmount(itemState, slot, planned);
      const linkedDebt = money.debts.find(
        (d) => d.name.trim().toLowerCase() === item.debtName.trim().toLowerCase()
      );

      onChangeMoney((m) => ({
        ...m,
        debts: m.debts.map((d) => {
          if (d.name.trim().toLowerCase() !== item.debtName.trim().toLowerCase()) return d;
          return { ...d, currentBalance: Math.max(0, d.currentBalance + (wasDone ? amount : -amount)) };
        }),
      }));
      updateDebtState(item.id, (s) => toggleSlot(slot, s));

      if (!wasDone && item.isFinalPayment && linkedDebt) {
        const newBalance = Math.max(0, linkedDebt.currentBalance - amount);
        if (newBalance <= 0 && linkedDebt.currentBalance > 0) {
          onCelebrate("big", `${item.debtName} is PAID OFF. Debt-free on this one - forever off the list. 🎉`);
        }
      }
    };
  }

  // -- summary numbers --------------------------------------------------

  const moneyIn = moneyInSummary(budget, key);
  const moneyOut = moneyOutSummary(config, state);
  const dueNext = dueNextItems(config, state, now);
  const spendStatus = spendingStatus(config, state);
  const buildingUp = buildingUpSummary(money, state);
  const breathe = leftToBreathe(config);

  const [extraAmount, setExtraAmount] = useState("");
  const [extraNote, setExtraNote] = useState("");

  function addExtraIncome() {
    const amount = Number(extraAmount);
    if (!extraAmount || Number.isNaN(amount) || amount <= 0) return;
    onChangeBudget((b) => ({
      ...b,
      extraIncome: [
        ...b.extraIncome,
        { id: crypto.randomUUID(), date: key + "-01", amount, note: extraNote },
      ],
    }));
    setExtraAmount("");
    setExtraNote("");
  }

  const [paydayTab, setPaydayTab] = useState<Slot>(now.getDate() <= 15 ? "first" : "second");
  const souSou = config.bills.find((b) => b.name.toLowerCase().includes("sou-sou"));

  return (
    <div className="flex flex-col gap-3">
      {/* MONEY IN + LEFT TO BREATHE */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">Money In</p>
          <p className="mt-0.5 font-serif text-xl text-sage">{formatMoney(moneyIn.received)}</p>
          <p className="text-[11px] text-paper-muted">of {formatMoney(moneyIn.expected)} expected</p>
          <div className="mt-2 flex gap-1.5">
            <PaycheckToggle
              label="15th"
              done={state.paycheckFirstReceived}
              onToggle={() =>
                onChangeBudget((b) =>
                  updateMonthState(b, key, money, (s) => ({ ...s, paycheckFirstReceived: !s.paycheckFirstReceived }))
                )
              }
            />
            <PaycheckToggle
              label="30th"
              done={state.paycheckSecondReceived}
              onToggle={() =>
                onChangeBudget((b) =>
                  updateMonthState(b, key, money, (s) => ({ ...s, paycheckSecondReceived: !s.paycheckSecondReceived }))
                )
              }
            />
          </div>
        </div>

        <div
          className={`rounded-xl2 border p-3.5 shadow-paper ${
            breathe < 0 ? "border-[#B5574A]/40 bg-[#B5574A]/5" : "border-sage/40 bg-sage/5"
          }`}
        >
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Left to Breathe
          </p>
          <p className={`mt-0.5 font-serif text-xl ${breathe < 0 ? "text-[#B5574A]" : "text-sage"}`}>
            {formatMoney(breathe)}
          </p>
          <p className="text-[11px] text-paper-muted">after bills, debts, vaults &amp; spending</p>
        </div>
      </div>

      {/* MONEY OUT */}
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">Money Out</p>
          <span className="text-[13px] text-paper-ink">
            {formatMoney(moneyOut.paid)} of {formatMoney(moneyOut.total)}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-surface2">
          <div
            className="h-full rounded-full bg-work transition-all"
            style={{ width: `${moneyOut.total > 0 ? Math.min(100, (moneyOut.paid / moneyOut.total) * 100) : 0}%` }}
          />
        </div>

        {dueNext.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-faint">
              Due Next
            </p>
            <div className="scroll-quiet flex gap-1.5 overflow-x-auto">
              {dueNext.slice(0, 6).map((d) => (
                <div
                  key={d.id}
                  className="shrink-0 rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5"
                >
                  <p className="whitespace-nowrap text-[11px] text-paper-ink">{d.name}</p>
                  <p className="text-[10px] text-paper-muted">
                    {formatMoney(d.amount)} · day {d.day}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3">
          <p className="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-faint">
            Spending vs. Targets
          </p>
          <div className="flex flex-col gap-2">
            {spendStatus.map(({ target, spent, pct, overTarget }) => (
              <div key={target.id}>
                <div className="mb-0.5 flex items-center justify-between text-[11.5px]">
                  <span className="text-paper-ink">
                    {target.name}
                    {target.cycleMonths > 1 && (
                      <span className="ml-1.5 text-[10px] text-gold">
                        {isSpendMonth(target, now) ? "spend month" : "skip month"}
                      </span>
                    )}
                  </span>
                  <span className="text-paper-muted">
                    {formatMoney(spent)} / {formatMoney(target.monthlyAmount)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-paper-surface2">
                  <div
                    className={`h-full rounded-full ${overTarget ? "bg-gold" : "bg-life"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BUILDING UP */}
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <p className="mb-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Building Up
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="font-serif text-lg text-paper-ink">{formatMoney(buildingUp.vaultTotal)}</p>
            <p className="text-[11px] text-paper-muted">
              Saved{" "}
              <TrendArrow value={buildingUp.vaultTrend} />
            </p>
          </div>
          <div>
            <p className="font-serif text-lg text-paper-ink">{formatMoney(buildingUp.debtPaidOff)}</p>
            <p className="text-[11px] text-paper-muted">
              Debt paid off <TrendArrow value={buildingUp.debtTrend} />
            </p>
          </div>
        </div>
      </div>

      {/* THIS PAYDAY */}
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            This Payday
          </p>
          <div className="flex gap-1 rounded-full bg-paper-surface2 p-1">
            <button
              type="button"
              onClick={() => setPaydayTab("first")}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                paydayTab === "first" ? "bg-paper-surface text-paper-ink shadow-paper" : "text-paper-muted"
              }`}
            >
              15th
            </button>
            <button
              type="button"
              onClick={() => setPaydayTab("second")}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                paydayTab === "second" ? "bg-paper-surface text-paper-ink shadow-paper" : "text-paper-muted"
              }`}
            >
              30th
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {souSou && (
            <PaydayLine
              label={souSou.name}
              amount={
                souSou.schedule.kind === "paydaySplit"
                  ? paydayTab === "first"
                    ? souSou.schedule.firstAmount
                    : souSou.schedule.secondAmount
                  : souSou.monthlyAmount
              }
              done={isDone(state.bills[souSou.id], paydayTab)}
              onToggle={() => toggleBillSlot(souSou, paydayTab)}
            />
          )}
          {config.vaultTransfers.map((v) => (
            <PaydayLine
              key={v.id}
              label={v.vaultName}
              amount={plannedAmount(v.schedule, v.monthlyAmount, paydayTab)}
              done={isDone(state.vaults[v.id], paydayTab)}
              onToggle={() => toggleVaultSlot(v)(paydayTab)}
            />
          ))}
          {config.debtPayments
            .filter((d) => {
              if (d.schedule.kind !== "dueDay") return false;
              const linked = money.debts.find(
                (x) => x.name.trim().toLowerCase() === d.debtName.trim().toLowerCase()
              );
              if (linked && linked.currentBalance <= 0) return false;
              const inFirstWindow = d.schedule.day <= 15;
              return paydayTab === "first" ? inFirstWindow : !inFirstWindow;
            })
            .map((d) => (
              <PaydayLine
                key={d.id}
                label={d.debtName}
                amount={d.monthlyAmount}
                done={isDone(state.debts[d.id], "first")}
                onToggle={() => toggleDebtSlot(d)("first")}
              />
            ))}
        </div>
      </div>

      {/* BILLS */}
      <Section title="Fixed Bills" total={totalMonthlyBills(config)}>
        {config.bills.map((b) => (
          <BudgetItemRow
            key={b.id}
            name={b.name}
            monthlyAmount={b.monthlyAmount}
            schedule={b.schedule}
            slots={slotsFor(b.schedule)}
            slotDone={(slot) => isDone(state.bills[b.id], slot)}
            slotAmount={(slot) =>
              actualAmount(state.bills[b.id], slot, plannedAmount(b.schedule, b.monthlyAmount, slot))
            }
            onRename={(v) => updateBillConfig(b.id, (x) => ({ ...x, name: v }))}
            onChangeMonthlyAmount={(v) => updateBillConfig(b.id, (x) => ({ ...x, monthlyAmount: v }))}
            onChangeDueDay={(day) =>
              updateBillConfig(b.id, (x) => (x.schedule.kind === "dueDay" ? { ...x, schedule: { kind: "dueDay", day } } : x))
            }
            onChangeSplitAmount={(slot, v) =>
              updateBillConfig(b.id, (x) =>
                x.schedule.kind === "paydaySplit"
                  ? {
                      ...x,
                      schedule: {
                        kind: "paydaySplit",
                        firstAmount: slot === "first" ? v : x.schedule.firstAmount,
                        secondAmount: slot === "second" ? v : x.schedule.secondAmount,
                      },
                    }
                  : x
              )
            }
            onToggleSlot={(slot) => toggleBillSlot(b, slot)}
            onChangeSlotAmount={(slot, v) => updateBillState(b.id, (s) => setSlotAmount(slot, v, s))}
            onDelete={() => onChangeBudget((bd) => ({ ...bd, config: { ...bd.config, bills: bd.config.bills.filter((x) => x.id !== b.id) } }))}
            accentClass="bg-work"
          />
        ))}
      </Section>

      {/* DEBT PAYMENTS */}
      <Section title="Debt Payments" total={totalMonthlyDebts(config)}>
        {config.debtPayments.map((d) => {
          const linked = money.debts.find((x) => x.name.trim().toLowerCase() === d.debtName.trim().toLowerCase());
          if (linked && linked.currentBalance <= 0) return null;
          return (
            <BudgetItemRow
              key={d.id}
              name={d.debtName}
              monthlyAmount={d.monthlyAmount}
              schedule={d.schedule}
              slots={slotsFor(d.schedule)}
              slotDone={(slot) => isDone(state.debts[d.id], slot)}
              slotAmount={(slot) =>
                actualAmount(state.debts[d.id], slot, plannedAmount(d.schedule, d.monthlyAmount, slot))
              }
              onRename={(v) => updateDebtConfig(d.id, (x) => ({ ...x, debtName: v }))}
              onChangeMonthlyAmount={(v) => updateDebtConfig(d.id, (x) => ({ ...x, monthlyAmount: v }))}
              onChangeDueDay={(day) =>
                updateDebtConfig(d.id, (x) => (x.schedule.kind === "dueDay" ? { ...x, schedule: { kind: "dueDay", day } } : x))
              }
              onChangeSplitAmount={(slot, v) =>
                updateDebtConfig(d.id, (x) =>
                  x.schedule.kind === "paydaySplit"
                    ? {
                        ...x,
                        schedule: {
                          kind: "paydaySplit",
                          firstAmount: slot === "first" ? v : x.schedule.firstAmount,
                          secondAmount: slot === "second" ? v : x.schedule.secondAmount,
                        },
                      }
                    : x
                )
              }
              onToggleSlot={toggleDebtSlot(d)}
              onChangeSlotAmount={(slot, v) => updateDebtState(d.id, (s) => setSlotAmount(slot, v, s))}
              onDelete={() =>
                onChangeBudget((bd) => ({
                  ...bd,
                  config: { ...bd.config, debtPayments: bd.config.debtPayments.filter((x) => x.id !== d.id) },
                }))
              }
              accentClass="bg-work"
              extraBadge={d.isFinalPayment ? <span className="text-sm">🏁</span> : undefined}
            />
          );
        })}
      </Section>

      {/* VAULT TRANSFERS */}
      <Section title="Vault Transfers" total={totalMonthlyVaults(config)}>
        {config.vaultTransfers.map((v) => (
          <BudgetItemRow
            key={v.id}
            name={v.vaultName}
            monthlyAmount={v.monthlyAmount}
            schedule={v.schedule}
            slots={slotsFor(v.schedule)}
            slotDone={(slot) => isDone(state.vaults[v.id], slot)}
            slotAmount={(slot) =>
              actualAmount(state.vaults[v.id], slot, plannedAmount(v.schedule, v.monthlyAmount, slot))
            }
            onRename={(val) => updateVaultConfig(v.id, (x) => ({ ...x, vaultName: val }))}
            onChangeMonthlyAmount={(val) => updateVaultConfig(v.id, (x) => ({ ...x, monthlyAmount: val }))}
            onChangeDueDay={(day) =>
              updateVaultConfig(v.id, (x) => (x.schedule.kind === "dueDay" ? { ...x, schedule: { kind: "dueDay", day } } : x))
            }
            onChangeSplitAmount={(slot, val) =>
              updateVaultConfig(v.id, (x) =>
                x.schedule.kind === "paydaySplit"
                  ? {
                      ...x,
                      schedule: {
                        kind: "paydaySplit",
                        firstAmount: slot === "first" ? val : x.schedule.firstAmount,
                        secondAmount: slot === "second" ? val : x.schedule.secondAmount,
                      },
                    }
                  : x
              )
            }
            onToggleSlot={toggleVaultSlot(v)}
            onChangeSlotAmount={(slot, val) => updateVaultState(v.id, (s) => setSlotAmount(slot, val, s))}
            onDelete={() =>
              onChangeBudget((bd) => ({
                ...bd,
                config: { ...bd.config, vaultTransfers: bd.config.vaultTransfers.filter((x) => x.id !== v.id) },
              }))
            }
            accentClass="bg-life"
          />
        ))}
      </Section>

      {/* PERSONAL SPENDING TARGETS */}
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Personal Spending Targets
          </p>
          <span className="text-[13px] text-paper-ink">{formatMoney(totalMonthlySpending(config))}</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {config.spendingTargets.map((s) => (
            <SpendingTargetRow
              key={s.id}
              target={s}
              spent={state.spendingLogged[s.id] ?? 0}
              now={now}
              onRename={(v) => updateSpendingConfig(s.id, (x) => ({ ...x, name: v }))}
              onChangeAmount={(v) => updateSpendingConfig(s.id, (x) => ({ ...x, monthlyAmount: v }))}
              onChangeCycleAmount={(v) => updateSpendingConfig(s.id, (x) => ({ ...x, cycleAmount: v }))}
              onAddSpend={(v) =>
                onChangeBudget((b) =>
                  updateMonthState(b, key, money, (state) => ({
                    ...state,
                    spendingLogged: { ...state.spendingLogged, [s.id]: (state.spendingLogged[s.id] ?? 0) + v },
                  }))
                )
              }
              onResetSpend={() =>
                onChangeBudget((b) =>
                  updateMonthState(b, key, money, (state) => ({
                    ...state,
                    spendingLogged: { ...state.spendingLogged, [s.id]: 0 },
                  }))
                )
              }
            />
          ))}
        </div>
      </div>

      {/* EXTRA INCOME */}
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <p className="mb-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Extra Income This Month
        </p>
        {extraIncomeForMonth(budget, key) > 0 && (
          <p className="mb-2 text-[13px] text-sage">+{formatMoney(extraIncomeForMonth(budget, key))} so far</p>
        )}
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={extraAmount}
            onChange={(e) => setExtraAmount(e.target.value)}
            className="w-24 rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
          />
          <input
            placeholder="Note (optional)"
            value={extraNote}
            onChange={(e) => setExtraNote(e.target.value)}
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
          />
          <button
            type="button"
            onClick={addExtraIncome}
            className="shrink-0 rounded-lg bg-life px-3 py-1.5 text-xs font-medium text-paper-surface"
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}

function PaycheckToggle({ label, done, onToggle }: { label: string; done: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
        done ? "border-sage/50 bg-sage/10 text-sage" : "border-paper-border text-paper-muted"
      }`}
    >
      {label} {done ? "✓" : ""}
    </button>
  );
}

function TrendArrow({ value }: { value: number }) {
  if (Math.abs(value) < 0.01) return <span className="text-paper-faint">·</span>;
  const up = value > 0;
  return (
    <span className={up ? "text-sage" : "text-[#B5574A]"}>
      {up ? "▲" : "▼"} {formatMoney(Math.abs(value))}
    </span>
  );
}

function PaydayLine({
  label,
  amount,
  done,
  onToggle,
}: {
  label: string;
  amount: number;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <CheckCircle done={done} onToggle={onToggle} accentClass="bg-life" size="sm" ariaLabel={done ? "Mark not done" : "Mark done"} />
      <span className={`min-w-0 flex-1 text-[13.5px] ${done ? "text-paper-faint line-through" : "text-paper-ink"}`}>
        {label}
      </span>
      <span className="shrink-0 text-[13px] text-paper-muted">{formatMoney(amount)}</span>
    </div>
  );
}

function Section({ title, total, children }: { title: string; total: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">{title}</p>
        <span className="text-[13px] text-paper-ink">{formatMoney(total)}</span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function SpendingTargetRow({
  target,
  spent,
  now,
  onRename,
  onChangeAmount,
  onChangeCycleAmount,
  onAddSpend,
  onResetSpend,
}: {
  target: SpendingTarget;
  spent: number;
  now: Date;
  onRename: (v: string) => void;
  onChangeAmount: (v: number) => void;
  onChangeCycleAmount: (v: number) => void;
  onAddSpend: (v: number) => void;
  onResetSpend: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [addText, setAddText] = useState("");
  const pct = target.monthlyAmount > 0 ? Math.round((spent / target.monthlyAmount) * 100) : 0;
  const over = pct > 100;

  return (
    <div className="rounded-xl border border-paper-border bg-paper-surface2/40 p-2.5">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="flex w-full items-center justify-between gap-2 text-left">
        <div className="min-w-0">
          <p className="truncate text-[13px] text-paper-ink">
            {target.name}
            {target.cycleMonths > 1 && (
              <span className="ml-1.5 rounded-full border border-gold/40 px-1.5 py-0.5 text-[9.5px] uppercase text-gold">
                {isSpendMonth(target, now) ? "spend month" : "skip month"}
              </span>
            )}
          </p>
          <p className="text-[11px] text-paper-muted">
            {formatMoney(spent)} of {formatMoney(target.monthlyAmount)}
          </p>
        </div>
        <span className={`shrink-0 text-[11px] font-medium ${over ? "text-gold" : "text-paper-muted"}`}>{pct}%</span>
      </button>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-surface2">
        <div className={`h-full rounded-full ${over ? "bg-gold" : "bg-life"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>

      {expanded && (
        <div className="animate-fade-in mt-2.5 space-y-2 border-t border-paper-border pt-2.5">
          <div>
            <p className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">Name</p>
            <input
              value={target.name}
              onChange={(e) => onRename(e.target.value)}
              className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Monthly Target
              </p>
              <input
                type="number"
                step="0.01"
                value={target.monthlyAmount}
                onChange={(e) => onChangeAmount(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
              />
            </div>
            {target.cycleMonths > 1 && (
              <div className="flex-1">
                <p className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                  Spend-Month Total
                </p>
                <input
                  type="number"
                  step="0.01"
                  value={target.cycleAmount ?? 0}
                  onChange={(e) => onChangeCycleAmount(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              placeholder="Add spend"
              value={addText}
              onChange={(e) => setAddText(e.target.value)}
              className="flex-1 rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const v = Number(addText);
                if (!addText || Number.isNaN(v) || v <= 0) return;
                onAddSpend(v);
                setAddText("");
              }}
              className="shrink-0 rounded-lg bg-life px-3 py-1.5 text-xs font-medium text-paper-surface"
            >
              Add
            </button>
            <button
              type="button"
              onClick={onResetSpend}
              className="shrink-0 rounded-lg border border-paper-border px-2.5 py-1.5 text-xs text-paper-muted"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
