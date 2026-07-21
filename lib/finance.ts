export type AccountType = "checking" | "savings" | "credit" | "cash" | "other";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit Card",
  cash: "Cash",
  other: "Other",
};

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
};

export const TRANSACTION_CATEGORIES = [
  "Income",
  "Housing",
  "Utilities",
  "Groceries",
  "Dining",
  "Transport",
  "Subscriptions",
  "Health",
  "Shopping",
  "Entertainment",
  "Debt Payment",
  "Savings Transfer",
  "Other",
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export type Transaction = {
  id: string;
  accountId: string;
  date: string; // YYYY-MM-DD
  amount: number; // positive = money in, negative = money out
  category: TransactionCategory;
  description: string;
};

export type Budget = {
  id: string;
  category: TransactionCategory;
  monthlyLimit: number;
};

export type FinanceData = {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
};

export function emptyFinanceData(): FinanceData {
  return { accounts: [], transactions: [], budgets: [] };
}

export function normalizeFinanceData(partial: Partial<FinanceData> | null | undefined): FinanceData {
  return {
    accounts: partial?.accounts ?? [],
    transactions: partial?.transactions ?? [],
    budgets: partial?.budgets ?? [],
  };
}

export function totalBalance(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + a.balance, 0);
}

export function formatMoney(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonthKey(key: string, deltaMonths: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + deltaMonths, 1);
  return monthKey(d);
}

export function formatMonthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function transactionsForMonth(transactions: Transaction[], key: string): Transaction[] {
  return transactions.filter((t) => t.date.slice(0, 7) === key);
}

export function incomeForMonth(transactions: Transaction[], key: string): number {
  return transactionsForMonth(transactions, key)
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function expenseForMonth(transactions: Transaction[], key: string): number {
  return Math.abs(
    transactionsForMonth(transactions, key)
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );
}

// Absolute spend per category for the month, expenses only (amount < 0),
// sorted highest spend first. Categories with no spending are omitted.
export function spendingByCategory(
  transactions: Transaction[],
  key: string
): { category: TransactionCategory; amount: number }[] {
  const totals = new Map<TransactionCategory, number>();
  for (const t of transactionsForMonth(transactions, key)) {
    if (t.amount >= 0) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + Math.abs(t.amount));
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export type BudgetProgress = {
  budget: Budget;
  spent: number;
  pct: number; // 0-100+, can exceed 100 when over budget
};

export function budgetProgressForMonth(
  budgets: Budget[],
  transactions: Transaction[],
  key: string
): BudgetProgress[] {
  const spendByCategory = new Map(
    spendingByCategory(transactions, key).map((s) => [s.category, s.amount])
  );
  return budgets.map((budget) => {
    const spent = spendByCategory.get(budget.category) ?? 0;
    const pct = budget.monthlyLimit > 0 ? Math.round((spent / budget.monthlyLimit) * 100) : 0;
    return { budget, spent, pct };
  });
}

export type MonthTrend = {
  key: string;
  label: string;
  income: number;
  expense: number;
};

// Last `months` calendar months (oldest first), ending with the month `now` falls in.
export function recentMonthsTrend(
  transactions: Transaction[],
  now: Date,
  months = 6
): MonthTrend[] {
  const currentKey = monthKey(now);
  const result: MonthTrend[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const key = shiftMonthKey(currentKey, -i);
    result.push({
      key,
      label: formatMonthLabel(key).split(" ")[0].slice(0, 3),
      income: incomeForMonth(transactions, key),
      expense: expenseForMonth(transactions, key),
    });
  }
  return result;
}
