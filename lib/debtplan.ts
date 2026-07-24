import { Debt, MoneyData } from "./types";
import { dateKey } from "./date";
import { BudgetConfig, BudgetData, plannedAmount, monthKey, formatMonthLabel } from "./budget";

// ---------------------------------------------------------------------------
// Survival number - the bare floor she must cover each pay period to stay
// safe. Everything above it is choice. Essential bills split the same way
// CommandCenter already splits any bill across the two paychecks; debt
// minimums split evenly unless a due day pins one to a specific half.

export function survivalNumberForSlot(config: BudgetConfig, debts: Debt[], slot: "first" | "second"): number {
  const billsTotal = config.bills
    .filter((b) => b.essential)
    .reduce((sum, b) => sum + plannedAmount(b.schedule, b.monthlyAmount, slot), 0);

  const debtsTotal = debts.reduce((sum, d) => {
    if (d.currentBalance <= 0 || d.minPayment <= 0) return sum;
    if (d.dueDay > 0) {
      const inFirstHalf = d.dueDay <= 15;
      return sum + (slot === "first" ? (inFirstHalf ? d.minPayment : 0) : inFirstHalf ? 0 : d.minPayment);
    }
    return sum + d.minPayment / 2;
  }, 0);

  return billsTotal + debtsTotal;
}

export function survivalNumberMonthly(config: BudgetConfig, debts: Debt[]): number {
  return survivalNumberForSlot(config, debts, "first") + survivalNumberForSlot(config, debts, "second");
}

// ---------------------------------------------------------------------------
// Due-date radar - what's coming before her next paycheck, with past-due
// and restricted accounts always pinned regardless of date.

export type RadarStatus = "pastDue" | "restricted" | "upcoming";

export type RadarItem = {
  name: string;
  amount: number;
  date: string; // YYYY-MM-DD, "" when not tied to a specific date
  kind: "bill" | "debtMin";
  status: RadarStatus;
  pinned: boolean;
};

export function dueDateRadar(config: BudgetConfig, debts: Debt[], now: Date): RadarItem[] {
  const items: RadarItem[] = [];
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  for (const bill of config.bills) {
    if (bill.schedule.kind !== "dueDay") continue;
    const day = Math.min(bill.schedule.day, daysInMonth);
    if (day < currentDay) continue;
    const date = new Date(now.getFullYear(), now.getMonth(), day);
    items.push({ name: bill.name, amount: bill.monthlyAmount, date: dateKey(date), kind: "bill", status: "upcoming", pinned: false });
  }

  for (const debt of debts) {
    if (debt.currentBalance <= 0) continue;
    if (debt.status === "pastDue" || debt.status === "restricted") {
      items.push({
        name: debt.name,
        amount: debt.status === "pastDue" && debt.pastDueAmount > 0 ? debt.pastDueAmount : debt.minPayment,
        date: "",
        kind: "debtMin",
        status: debt.status,
        pinned: true,
      });
      continue;
    }
    if (debt.priority) {
      items.push({ name: debt.name, amount: debt.minPayment, date: "", kind: "debtMin", status: "upcoming", pinned: true });
      continue;
    }
    if (debt.dueDay > 0) {
      const day = Math.min(debt.dueDay, daysInMonth);
      if (day < currentDay) continue;
      const date = new Date(now.getFullYear(), now.getMonth(), day);
      items.push({ name: debt.name, amount: debt.minPayment, date: dateKey(date), kind: "debtMin", status: "upcoming", pinned: false });
    }
  }

  return items.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
}

// ---------------------------------------------------------------------------
// Payoff forecast - a plain amortization projection, not financial advice.
// Returns null when the payment doesn't even cover a month's interest, so
// the balance would never actually go down at that rate.

export type PayoffForecast = {
  monthsToPayoff: number;
  payoffDateLabel: string;
  totalInterestPaid: number;
};

function addMonthsLabel(now: Date, months: number): string {
  const d = new Date(now.getFullYear(), now.getMonth() + months, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export function payoffForecast(
  balance: number,
  interestRatePct: number,
  monthlyPayment: number,
  now: Date = new Date()
): PayoffForecast | null {
  if (balance <= 0) return { monthsToPayoff: 0, payoffDateLabel: "Paid off", totalInterestPaid: 0 };
  if (monthlyPayment <= 0) return null;

  const monthlyRate = interestRatePct / 100 / 12;
  if (monthlyRate === 0) {
    const months = Math.ceil(balance / monthlyPayment);
    return { monthsToPayoff: months, payoffDateLabel: addMonthsLabel(now, months), totalInterestPaid: 0 };
  }

  const interestPortion = balance * monthlyRate;
  if (monthlyPayment <= interestPortion) return null;

  const months = Math.ceil(-Math.log(1 - (balance * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate));
  const totalPaid = months * monthlyPayment;
  return { monthsToPayoff: months, payoffDateLabel: addMonthsLabel(now, months), totalInterestPaid: Math.max(0, totalPaid - balance) };
}

export function interestCostPerMonth(balance: number, interestRatePct: number): number {
  return balance * (interestRatePct / 100 / 12);
}

// ---------------------------------------------------------------------------
// Snowball (smallest balance first) vs avalanche (highest interest first) -
// priority-flagged debts always lead regardless of strategy, since "this
// needs eyes on it" overrides "this is mathematically next."

export type DebtStrategy = "snowball" | "avalanche";

export function orderedDebts(debts: Debt[], strategy: DebtStrategy): Debt[] {
  const active = debts.filter((d) => d.currentBalance > 0);
  const rank = (a: Debt, b: Debt) =>
    strategy === "snowball" ? a.currentBalance - b.currentBalance : b.interestRatePct - a.interestRatePct;
  const priority = active.filter((d) => d.priority).sort(rank);
  const rest = active.filter((d) => !d.priority).sort(rank);
  return [...priority, ...rest];
}

// ---------------------------------------------------------------------------
// Net position / debt / vault trend - reconstructed from the same
// start-of-month snapshots MonthlyBudgetState already keeps (no separate
// tracking mechanism needed), ending with a live "right now" point.

export type TrendPoint = { key: string; label: string; vaultTotal: number; debtTotal: number; netPosition: number };

export function monthlyTrendSeries(budget: BudgetData, money: MoneyData): TrendPoint[] {
  const totalStartingBalance = money.debts.reduce((sum, d) => sum + d.startingBalance, 0);
  const keys = Object.keys(budget.months).sort();

  const points: TrendPoint[] = keys.map((key) => {
    const state = budget.months[key];
    const debtTotal = Math.max(0, totalStartingBalance - state.startDebtPaidOff);
    const vaultTotal = state.startVaultTotal;
    return {
      key,
      label: formatMonthLabel(key).split(" ")[0].slice(0, 3),
      vaultTotal,
      debtTotal,
      netPosition: vaultTotal - debtTotal,
    };
  });

  const liveVaultTotal = money.vaults.reduce((sum, v) => sum + v.currentAmount, 0);
  const liveDebtTotal = money.debts.reduce((sum, d) => sum + d.currentBalance, 0);
  const nowKey = monthKey(new Date());
  const livePoint: TrendPoint = {
    key: nowKey,
    label: "Now",
    vaultTotal: liveVaultTotal,
    debtTotal: liveDebtTotal,
    netPosition: liveVaultTotal - liveDebtTotal,
  };

  if (points.length > 0 && points[points.length - 1].key === nowKey) {
    points[points.length - 1] = livePoint;
    return points;
  }
  return [...points, livePoint];
}

// ---------------------------------------------------------------------------
// Missed-bill recovery - plain data, no alarm-toned copy baked in here; the
// UI composes the calm "here's the catch-up plan" message from this.

export type CatchUpPlan = {
  debtName: string;
  pastDueAmount: number;
  minPayment: number;
  suggestedCatchUpAmount: number;
};

export function missedBillCatchUpPlan(debt: Debt): CatchUpPlan {
  const pastDueAmount = debt.pastDueAmount > 0 ? debt.pastDueAmount : 0;
  return {
    debtName: debt.name,
    pastDueAmount,
    minPayment: debt.minPayment,
    suggestedCatchUpAmount: pastDueAmount > 0 ? pastDueAmount + debt.minPayment : debt.minPayment,
  };
}
