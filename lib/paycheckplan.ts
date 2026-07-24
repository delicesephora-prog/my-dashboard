import { dateKey } from "./date";
import { BudgetConfig, plannedAmount } from "./budget";
import { Debt } from "./types";

export type AllocationKind = "bill" | "debt" | "vault" | "spending";

export type AllocationLine = {
  id: string;
  kind: AllocationKind;
  refName: string; // bill/debt/vault name, or a freeform label for "spending"
  amount: number;
  done: boolean; // checked off as actually paid/transferred
};

export type PaycheckPlan = {
  id: string;
  date: string; // YYYY-MM-DD - the paycheck date
  expectedAmount: number; // what's landing, or the real bank balance she entered
  lines: AllocationLine[];
  createdAt: string;
};

export type PaycheckPlanData = {
  plans: PaycheckPlan[];
};

export function emptyPaycheckPlanData(): PaycheckPlanData {
  return { plans: [] };
}

export function normalizePaycheckPlanData(partial: Partial<PaycheckPlanData> | null | undefined): PaycheckPlanData {
  if (!partial) return emptyPaycheckPlanData();
  return {
    plans: (partial.plans ?? []).map((p) => ({
      ...p,
      lines: (p.lines ?? []).map((l) => ({ ...l, done: l.done ?? false })),
    })),
  };
}

export function newAllocationLine(kind: AllocationKind, refName: string, amount: number): AllocationLine {
  return { id: crypto.randomUUID(), kind, refName, amount, done: false };
}

export function createPaycheckPlan(
  date: string,
  expectedAmount: number,
  lines: AllocationLine[] = [],
  now: Date = new Date()
): PaycheckPlan {
  return { id: crypto.randomUUID(), date, expectedAmount, lines, createdAt: now.toISOString() };
}

export function addPaycheckPlan(data: PaycheckPlanData, plan: PaycheckPlan): PaycheckPlanData {
  return { ...data, plans: [...data.plans, plan] };
}

export function updatePaycheckPlan(
  data: PaycheckPlanData,
  id: string,
  updater: (p: PaycheckPlan) => PaycheckPlan
): PaycheckPlanData {
  return { ...data, plans: data.plans.map((p) => (p.id === id ? updater(p) : p)) };
}

export function deletePaycheckPlan(data: PaycheckPlanData, id: string): PaycheckPlanData {
  return { ...data, plans: data.plans.filter((p) => p.id !== id) };
}

export function addLine(plan: PaycheckPlan, line: AllocationLine): PaycheckPlan {
  return { ...plan, lines: [...plan.lines, line] };
}

export function updateLine(plan: PaycheckPlan, lineId: string, updater: (l: AllocationLine) => AllocationLine): PaycheckPlan {
  return { ...plan, lines: plan.lines.map((l) => (l.id === lineId ? updater(l) : l)) };
}

export function removeLine(plan: PaycheckPlan, lineId: string): PaycheckPlan {
  return { ...plan, lines: plan.lines.filter((l) => l.id !== lineId) };
}

export function toggleLineDone(plan: PaycheckPlan, lineId: string): PaycheckPlan {
  return updateLine(plan, lineId, (l) => ({ ...l, done: !l.done }));
}

// ---------------------------------------------------------------------------
// Zero-based math - the core ritual: every dollar gets a job until this
// reaches exactly $0.

export function allocatedTotal(plan: PaycheckPlan): number {
  return plan.lines.reduce((sum, l) => sum + l.amount, 0);
}

export function unallocatedTotal(plan: PaycheckPlan): number {
  return plan.expectedAmount - allocatedTotal(plan);
}

export type AllocationByKind = Record<AllocationKind, number>;

export function allocationByKind(plan: PaycheckPlan): AllocationByKind {
  const totals: AllocationByKind = { bill: 0, debt: 0, vault: 0, spending: 0 };
  for (const l of plan.lines) totals[l.kind] += l.amount;
  return totals;
}

// The safe-to-spend number falls straight out of the zero-based plan: it's
// whatever ended up assigned to "spending" once bills, debt minimums, and
// vault transfers are set aside - no separate calculation needed.
export function safeToSpend(plan: PaycheckPlan): number {
  return allocationByKind(plan).spending;
}

// ---------------------------------------------------------------------------
// History / browsing

export function plansSorted(data: PaycheckPlanData): PaycheckPlan[] {
  return [...data.plans].sort((a, b) => b.date.localeCompare(a.date));
}

export function mostRecentPlan(data: PaycheckPlanData, now: Date = new Date()): PaycheckPlan | undefined {
  const today = dateKey(now);
  const sorted = plansSorted(data);
  return sorted.find((p) => p.date <= today) ?? sorted[0];
}

export function nextUpcomingPlan(data: PaycheckPlanData, now: Date = new Date()): PaycheckPlan | undefined {
  const today = dateKey(now);
  return [...data.plans].filter((p) => p.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
}

// ---------------------------------------------------------------------------
// Guided suggestions - auto-populates from what's already set up in the
// Command Center (recurring bills/debt minimums/vault transfers) so the
// guided flow starts from a real draft instead of a blank page. Every line
// stays fully editable/removable afterward.

export function slotForPaycheckDate(dateStr: string): "first" | "second" {
  const day = Number(dateStr.split("-")[2] ?? "1");
  return day <= 15 ? "first" : "second";
}

export function suggestLinesFromConfig(config: BudgetConfig, debts: Debt[], slot: "first" | "second"): AllocationLine[] {
  const lines: AllocationLine[] = [];

  for (const bill of config.bills) {
    const amt = plannedAmount(bill.schedule, bill.monthlyAmount, slot);
    if (amt > 0) lines.push(newAllocationLine("bill", bill.name, amt));
  }

  for (const debt of debts) {
    if (debt.currentBalance <= 0 || debt.minPayment <= 0) continue;
    if (debt.dueDay > 0) {
      const inFirstHalf = debt.dueDay <= 15;
      if ((slot === "first") === inFirstHalf) lines.push(newAllocationLine("debt", debt.name, debt.minPayment));
    } else {
      lines.push(newAllocationLine("debt", debt.name, debt.minPayment / 2));
    }
  }

  for (const vault of config.vaultTransfers) {
    const amt = plannedAmount(vault.schedule, vault.monthlyAmount, slot);
    if (amt > 0) lines.push(newAllocationLine("vault", vault.vaultName, amt));
  }

  return lines;
}
