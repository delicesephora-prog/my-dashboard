import { Debt, MoneyData, Vault } from "./types";
import { monthKey, formatMoney, shiftMonthKey, formatMonthLabel } from "./finance";

// ---------------------------------------------------------------------------
// A recurring monthly obligation is either due on one fixed day of the
// month, split evenly (or unevenly) across the two paydays, or has no
// fixed day at all ("varies") - the user pays it whenever within the month.

export type PaymentSchedule =
  | { kind: "dueDay"; day: number }
  | { kind: "paydaySplit"; firstAmount: number; secondAmount: number }
  | { kind: "varies" };

export type BillItem = {
  id: string;
  name: string;
  monthlyAmount: number;
  schedule: PaymentSchedule;
  // Part of the survival number - the bare floor she must cover every
  // period to stay safe. Defaults true (safer to overestimate the floor
  // than under it); she can mark something optional herself.
  essential: boolean;
};

// debtName/vaultName are soft links (matched by name against MoneyData) so
// renaming a vault or debt elsewhere doesn't silently break the connection -
// the user just re-types the new name once if she renames something.
export type DebtPaymentItem = {
  id: string;
  debtName: string;
  monthlyAmount: number;
  schedule: PaymentSchedule;
  isFinalPayment: boolean;
};

export type VaultTransferItem = {
  id: string;
  vaultName: string;
  monthlyAmount: number;
  schedule: PaymentSchedule;
};

export type SpendingTarget = {
  id: string;
  name: string;
  monthlyAmount: number;
  // 1 = every month. 2 = every-other-month (e.g. Hair & Beauty, spent in a
  // real lump every second month rather than evenly). cycleAmount is what
  // actually gets spent in a "spend month" - purely informational, doesn't
  // change monthlyAmount (which stays the smoothed planning figure used in
  // Left to Breathe).
  cycleMonths: number;
  cycleAmount: number | null;
};

export type ExtraIncomeEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  note: string;
};

export type BudgetConfig = {
  perPaycheckIncome: number;
  bills: BillItem[];
  debtPayments: DebtPaymentItem[];
  vaultTransfers: VaultTransferItem[];
  spendingTargets: SpendingTarget[];
};

// Per-item, per-month tracked state. "first"/"second" only mean something
// for paydaySplit items - dueDay/varies items only ever use "first".
export type LineItemMonthState = {
  firstDone: boolean;
  secondDone: boolean;
  firstAmount: number | null; // actual amount if it differed from planned
  secondAmount: number | null;
};

export function emptyLineItemState(): LineItemMonthState {
  return { firstDone: false, secondDone: false, firstAmount: null, secondAmount: null };
}

export function lineItemStateFor(record: Record<string, LineItemMonthState>, id: string): LineItemMonthState {
  return record[id] ?? emptyLineItemState();
}

export type MonthlyBudgetState = {
  paycheckFirstReceived: boolean;
  paycheckSecondReceived: boolean;
  bills: Record<string, LineItemMonthState>;
  debts: Record<string, LineItemMonthState>;
  vaults: Record<string, LineItemMonthState>;
  spendingLogged: Record<string, number>;
  // A snapshot of Building Up's numbers taken the moment this month was
  // first touched, so the trend arrows have something real to compare
  // against instead of needing a full historical ledger.
  startVaultTotal: number;
  startDebtPaidOff: number;
};

function emptyMonthState(startVaultTotal: number, startDebtPaidOff: number): MonthlyBudgetState {
  return {
    paycheckFirstReceived: false,
    paycheckSecondReceived: false,
    bills: {},
    debts: {},
    vaults: {},
    spendingLogged: {},
    startVaultTotal,
    startDebtPaidOff,
  };
}

// Proof the plan works, especially on hard weeks - a discrete, dated log
// of debt reductions/payoffs and vault growth, separate from the derived
// month-boundary snapshots so an in-month payment shows up immediately
// with today's real date, not just at the next month recap.
export type WinKind = "debtPayment" | "debtPaidOff" | "vaultGrowth";

export type WinEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  kind: WinKind;
  name: string; // debt or vault name
  amount: number;
  note: string;
};

export type BudgetData = {
  config: BudgetConfig;
  months: Record<string, MonthlyBudgetState>;
  extraIncome: ExtraIncomeEntry[];
  wins: WinEntry[];
  configSeedVersion: number;
  linkedSeedVersion: number;
};

export function addWin(data: BudgetData, entry: Omit<WinEntry, "id">): BudgetData {
  const win: WinEntry = { ...entry, id: crypto.randomUUID() };
  return { ...data, wins: [win, ...data.wins].slice(0, 500) };
}

export const BUDGET_CONFIG_SEED_VERSION = 1;
export const BUDGET_LINK_SEED_VERSION = 1;

function dueDay(day: number): PaymentSchedule {
  return { kind: "dueDay", day };
}
function paydaySplit(firstAmount: number, secondAmount: number): PaymentSchedule {
  return { kind: "paydaySplit", firstAmount, secondAmount };
}
function varies(): PaymentSchedule {
  return { kind: "varies" };
}

export function seedBudgetConfig(): BudgetConfig {
  return {
    perPaycheckIncome: 2996,
    bills: [
      { id: crypto.randomUUID(), name: "Rent", monthlyAmount: 2000, schedule: dueDay(1), essential: true },
      { id: crypto.randomUUID(), name: "Sou-Sou (Sol)", monthlyAmount: 500, schedule: paydaySplit(250, 250), essential: true },
      { id: crypto.randomUUID(), name: "Electric (PSEG)", monthlyAmount: 220, schedule: dueDay(5), essential: true },
      { id: crypto.randomUUID(), name: "WiFi", monthlyAmount: 91, schedule: dueDay(28), essential: true },
      { id: crypto.randomUUID(), name: "Groceries", monthlyAmount: 600, schedule: paydaySplit(300, 300), essential: true },
      { id: crypto.randomUUID(), name: "Subscriptions", monthlyAmount: 100, schedule: varies(), essential: false },
      { id: crypto.randomUUID(), name: "Gym", monthlyAmount: 50, schedule: varies(), essential: false },
      { id: crypto.randomUUID(), name: "Phone", monthlyAmount: 100, schedule: varies(), essential: true },
    ],
    debtPayments: [
      { id: crypto.randomUUID(), debtName: "Sallie Mae", monthlyAmount: 135.59, schedule: varies(), isFinalPayment: false },
      { id: crypto.randomUUID(), debtName: "Capital One Quicksilver", monthlyAmount: 200, schedule: dueDay(12), isFinalPayment: false },
      { id: crypto.randomUUID(), debtName: "Chase", monthlyAmount: 91, schedule: dueDay(28), isFinalPayment: false },
      { id: crypto.randomUUID(), debtName: "Apple", monthlyAmount: 50, schedule: dueDay(30), isFinalPayment: false },
      { id: crypto.randomUUID(), debtName: "Affirm", monthlyAmount: 250, schedule: varies(), isFinalPayment: false },
      { id: crypto.randomUUID(), debtName: "Zip", monthlyAmount: 100, schedule: varies(), isFinalPayment: false },
      { id: crypto.randomUUID(), debtName: "Best Buy", monthlyAmount: 81.5, schedule: dueDay(14), isFinalPayment: true },
    ],
    vaultTransfers: [
      { id: crypto.randomUUID(), vaultName: "Emergency Fund", monthlyAmount: 350, schedule: paydaySplit(175, 175) },
      { id: crypto.randomUUID(), vaultName: "Jamaica Trip", monthlyAmount: 200, schedule: paydaySplit(100, 100) },
      { id: crypto.randomUUID(), vaultName: "Florida Work Trip", monthlyAmount: 150, schedule: paydaySplit(75, 75) },
      { id: crypto.randomUUID(), vaultName: "Vacation Fund", monthlyAmount: 25, schedule: paydaySplit(12.5, 12.5) },
    ],
    spendingTargets: [
      { id: crypto.randomUUID(), name: "Hair & Beauty", monthlyAmount: 150, cycleMonths: 2, cycleAmount: 275 },
      { id: crypto.randomUUID(), name: "Shopping / Amazon", monthlyAmount: 50, cycleMonths: 1, cycleAmount: null },
      { id: crypto.randomUUID(), name: "Eating Out / Dates", monthlyAmount: 150, cycleMonths: 1, cycleAmount: null },
      { id: crypto.randomUUID(), name: "Medical / Copays", monthlyAmount: 100, cycleMonths: 1, cycleAmount: null },
      { id: crypto.randomUUID(), name: "Household / Misc", monthlyAmount: 150, cycleMonths: 1, cycleAmount: null },
    ],
  };
}

export function emptyBudgetData(): BudgetData {
  return {
    config: seedBudgetConfig(),
    months: {},
    extraIncome: [],
    wins: [],
    configSeedVersion: BUDGET_CONFIG_SEED_VERSION,
    linkedSeedVersion: 0,
  };
}

export function normalizeBudgetData(partial: Partial<BudgetData> | null | undefined): BudgetData {
  const configSeedVersion = partial?.configSeedVersion ?? 0;
  const config =
    configSeedVersion >= BUDGET_CONFIG_SEED_VERSION && partial?.config ? partial.config : seedBudgetConfig();
  return {
    // Backfills `essential` on bills saved before that field existed
    // (defaulting to true - safer to overestimate the survival-number
    // floor than under it), so old data never fails validation.
    config: { ...config, bills: config.bills.map((b) => ({ ...b, essential: b.essential ?? true })) },
    months: partial?.months ?? {},
    extraIncome: partial?.extraIncome ?? [],
    wins: partial?.wins ?? [],
    configSeedVersion: BUDGET_CONFIG_SEED_VERSION,
    linkedSeedVersion: partial?.linkedSeedVersion ?? 0,
  };
}

// Additive, one-time linking: adds the two new vaults and the Best Buy debt
// this feature depends on, but only if they don't already exist by name,
// and only the very first time (gated by linkedSeedVersion) so it never
// re-adds something the user deliberately deleted later.
export function ensureLinkedMoneyEntities(
  money: MoneyData,
  budget: BudgetData
): { money: MoneyData; budget: BudgetData } {
  if (budget.linkedSeedVersion >= BUDGET_LINK_SEED_VERSION) return { money, budget };

  let vaults = money.vaults;
  const hasVault = (name: string) => vaults.some((v) => v.name.trim().toLowerCase() === name.toLowerCase());
  const newVaults: Vault[] = [];
  if (!hasVault("Florida Work Trip")) {
    newVaults.push({ id: crypto.randomUUID(), name: "Florida Work Trip", currentAmount: 0, goalAmount: 0 });
  }
  if (!hasVault("Vacation Fund")) {
    newVaults.push({ id: crypto.randomUUID(), name: "Vacation Fund", currentAmount: 0, goalAmount: 0 });
  }
  if (newVaults.length > 0) vaults = [...vaults, ...newVaults];

  let debts = money.debts;
  if (!debts.some((d) => d.name.trim().toLowerCase() === "best buy")) {
    const bestBuy: Debt = {
      id: crypto.randomUUID(),
      name: "Best Buy",
      currentBalance: 150,
      startingBalance: 150,
      interestRatePct: 0,
      minPayment: 0,
      dueDay: 0,
      status: "current",
      pastDueAmount: 0,
      priority: false,
      notes: "",
    };
    debts = [...debts, bestBuy];
  }

  return {
    money: { ...money, vaults, debts },
    budget: { ...budget, linkedSeedVersion: BUDGET_LINK_SEED_VERSION },
  };
}

export { monthKey, formatMoney, shiftMonthKey, formatMonthLabel };

// The first-of-month Date for a "YYYY-MM" key - used wherever a function
// needs a real Date (e.g. isSpendMonth's cycle math) but only the month
// being viewed matters, not a specific day within it.
export function dateForMonthKey(key: string): Date {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

export function monthStateFor(data: BudgetData, key: string, money: MoneyData): MonthlyBudgetState {
  const existing = data.months[key];
  if (existing) return existing;
  const debtPaidOff = money.debts.reduce((sum, d) => sum + Math.max(0, d.startingBalance - d.currentBalance), 0);
  const vaultTotal = money.vaults.reduce((sum, v) => sum + v.currentAmount, 0);
  return emptyMonthState(vaultTotal, debtPaidOff);
}

export function updateMonthState(
  data: BudgetData,
  key: string,
  money: MoneyData,
  updater: (state: MonthlyBudgetState) => MonthlyBudgetState
): BudgetData {
  const current = monthStateFor(data, key, money);
  return { ...data, months: { ...data.months, [key]: updater(current) } };
}

// The dollar amount for a given slot, according to plan (not what was
// actually paid - see LineItemMonthState for the actual/override amount).
// dueDay/varies items have a single slot ("first") whose planned amount is
// the item's full monthlyAmount; paydaySplit items split it across both.
export function plannedAmount(
  schedule: PaymentSchedule,
  monthlyAmount: number,
  slot: "first" | "second"
): number {
  if (schedule.kind === "paydaySplit") {
    return slot === "first" ? schedule.firstAmount : schedule.secondAmount;
  }
  if (slot === "second") return 0;
  return monthlyAmount;
}

export function slotsFor(schedule: PaymentSchedule): ("first" | "second")[] {
  return schedule.kind === "paydaySplit" ? ["first", "second"] : ["first"];
}

export function actualAmount(
  state: LineItemMonthState | undefined,
  slot: "first" | "second",
  planned: number
): number {
  const override = slot === "first" ? state?.firstAmount : state?.secondAmount;
  return override ?? planned;
}

export function isDone(state: LineItemMonthState | undefined, slot: "first" | "second"): boolean {
  return slot === "first" ? !!state?.firstDone : !!state?.secondDone;
}

// ---------------------------------------------------------------------------
// Command Center totals - always computed from planned config, never from
// what's been marked paid so far, so Left to Breathe recalculates live the
// instant any amount is edited.

export function totalMonthlyBills(config: BudgetConfig): number {
  return config.bills.reduce((sum, b) => sum + b.monthlyAmount, 0);
}
export function totalMonthlyDebts(config: BudgetConfig): number {
  return config.debtPayments.reduce((sum, d) => sum + d.monthlyAmount, 0);
}
export function totalMonthlyVaults(config: BudgetConfig): number {
  return config.vaultTransfers.reduce((sum, v) => sum + v.monthlyAmount, 0);
}
export function totalMonthlySpending(config: BudgetConfig): number {
  return config.spendingTargets.reduce((sum, s) => sum + s.monthlyAmount, 0);
}

export function expectedMonthlyIncome(config: BudgetConfig): number {
  return config.perPaycheckIncome * 2;
}

export function leftToBreathe(config: BudgetConfig): number {
  return (
    expectedMonthlyIncome(config) -
    totalMonthlyBills(config) -
    totalMonthlyDebts(config) -
    totalMonthlyVaults(config) -
    totalMonthlySpending(config)
  );
}

export function extraIncomeForMonth(data: BudgetData, key: string): number {
  return data.extraIncome.filter((e) => e.date.slice(0, 7) === key).reduce((sum, e) => sum + e.amount, 0);
}

export type MoneyInSummary = {
  expected: number;
  received: number;
};

export function moneyInSummary(data: BudgetData, key: string): MoneyInSummary {
  const state = data.months[key];
  const received =
    (state?.paycheckFirstReceived ? data.config.perPaycheckIncome : 0) +
    (state?.paycheckSecondReceived ? data.config.perPaycheckIncome : 0) +
    extraIncomeForMonth(data, key);
  return { expected: expectedMonthlyIncome(data.config), received };
}

export type DueNextItem = {
  id: string;
  name: string;
  amount: number;
  day: number;
  kind: "bill" | "debt" | "vault";
};

// Every dueDay item not yet marked paid this month, soonest first relative
// to today (items already past due this month sort last, still shown so
// nothing silently disappears).
export function dueNextItems(config: BudgetConfig, state: MonthlyBudgetState | undefined, now: Date): DueNextItem[] {
  const today = now.getDate();
  const items: DueNextItem[] = [];

  for (const b of config.bills) {
    if (b.schedule.kind !== "dueDay") continue;
    if (isDone(state?.bills[b.id], "first")) continue;
    items.push({ id: b.id, name: b.name, amount: b.monthlyAmount, day: b.schedule.day, kind: "bill" });
  }
  for (const d of config.debtPayments) {
    if (d.schedule.kind !== "dueDay") continue;
    if (isDone(state?.debts[d.id], "first")) continue;
    items.push({ id: d.id, name: d.debtName, amount: d.monthlyAmount, day: d.schedule.day, kind: "debt" });
  }

  return items.sort((a, b) => {
    const da = a.day >= today ? a.day - today : a.day - today + 31;
    const db = b.day >= today ? b.day - today : b.day - today + 31;
    return da - db;
  });
}

export type MoneyOutSummary = {
  paid: number;
  total: number;
};

// Bills + debt payments + vault transfers, planned vs actually marked paid
// so far this month. Spending targets are tracked separately (see
// spendingStatus) since they're an ongoing running total, not a due-date
// obligation.
export function moneyOutSummary(config: BudgetConfig, state: MonthlyBudgetState | undefined): MoneyOutSummary {
  let paid = 0;

  for (const b of config.bills) {
    for (const slot of slotsFor(b.schedule)) {
      const itemState = state?.bills[b.id];
      if (isDone(itemState, slot)) paid += actualAmount(itemState, slot, plannedAmount(b.schedule, b.monthlyAmount, slot));
    }
  }
  for (const d of config.debtPayments) {
    for (const slot of slotsFor(d.schedule)) {
      const itemState = state?.debts[d.id];
      if (isDone(itemState, slot)) paid += actualAmount(itemState, slot, plannedAmount(d.schedule, d.monthlyAmount, slot));
    }
  }
  for (const v of config.vaultTransfers) {
    for (const slot of slotsFor(v.schedule)) {
      const itemState = state?.vaults[v.id];
      if (isDone(itemState, slot)) paid += actualAmount(itemState, slot, plannedAmount(v.schedule, v.monthlyAmount, slot));
    }
  }

  const total = totalMonthlyBills(config) + totalMonthlyDebts(config) + totalMonthlyVaults(config);
  return { paid, total };
}

export type SpendingCategoryStatus = {
  target: SpendingTarget;
  spent: number;
  pct: number;
  overTarget: boolean;
};

export function spendingStatus(config: BudgetConfig, state: MonthlyBudgetState | undefined): SpendingCategoryStatus[] {
  return config.spendingTargets.map((target) => {
    const spent = state?.spendingLogged[target.id] ?? 0;
    const pct = target.monthlyAmount > 0 ? Math.round((spent / target.monthlyAmount) * 100) : 0;
    return { target, spent, pct, overTarget: pct > 100 };
  });
}

export function isSpendMonth(target: SpendingTarget, now: Date): boolean {
  if (target.cycleMonths <= 1) return true;
  const monthIndex = now.getFullYear() * 12 + now.getMonth();
  return monthIndex % target.cycleMonths === 0;
}

export type BuildingUpSummary = {
  vaultTotal: number;
  debtPaidOff: number;
  vaultTrend: number;
  debtTrend: number;
};

export function buildingUpSummary(money: MoneyData, state: MonthlyBudgetState | undefined): BuildingUpSummary {
  const vaultTotal = money.vaults.reduce((sum, v) => sum + v.currentAmount, 0);
  const debtPaidOff = money.debts.reduce((sum, d) => sum + Math.max(0, d.startingBalance - d.currentBalance), 0);
  return {
    vaultTotal,
    debtPaidOff,
    vaultTrend: vaultTotal - (state?.startVaultTotal ?? vaultTotal),
    debtTrend: debtPaidOff - (state?.startDebtPaidOff ?? debtPaidOff),
  };
}
