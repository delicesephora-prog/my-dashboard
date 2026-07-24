"use client";

import { useState } from "react";
import { Debt, LifeQuarterly, MoneyData } from "@/lib/types";
import { PaydayChecklistData } from "@/lib/payday";
import { Account, Budget, FinanceData, Transaction } from "@/lib/finance";
import { BudgetData } from "@/lib/budget";
import { PaycheckPlanData } from "@/lib/paycheckplan";
import { CelebrationTier } from "@/lib/celebration";
import { MilestoneData } from "@/lib/milestones";
import { RewardsData } from "@/lib/rewards";
import MoneySection from "./quarter/MoneySection";
import PaydayChecklistSection from "./quarter/PaydayChecklistSection";
import AccountsTab from "./finance/AccountsTab";
import TransactionsTab from "./finance/TransactionsTab";
import BudgetsTab from "./finance/BudgetsTab";
import TrendsTab from "./finance/TrendsTab";
import CommandCenter from "./money/CommandCenter";
import CalendarTab from "./money/CalendarTab";
import RewardsView from "./money/RewardsView";
import PaycheckFlowView from "./money/PaycheckFlowView";
import DebtsView from "./money/DebtsView";
import ProgressView from "./money/ProgressView";

type Tab =
  | "paycheck"
  | "debts"
  | "progress"
  | "command"
  | "overview"
  | "accounts"
  | "transactions"
  | "budgets"
  | "trends"
  | "calendar"
  | "rewards";

const TABS: { key: Tab; label: string }[] = [
  { key: "paycheck", label: "Paycheck Plan" },
  { key: "debts", label: "Debts" },
  { key: "progress", label: "Progress" },
  { key: "command", label: "Command Center" },
  { key: "overview", label: "Vaults & Debts" },
  { key: "accounts", label: "Accounts" },
  { key: "transactions", label: "Transactions" },
  { key: "budgets", label: "Budgets" },
  { key: "trends", label: "Trends" },
  { key: "calendar", label: "Calendar" },
  { key: "rewards", label: "Rewards" },
];

export default function MoneyView({
  lifeQuarterly,
  onChange,
  finance,
  onChangeFinance,
  budget,
  onChangeBudget,
  paycheckPlans,
  onChangePaycheckPlans,
  milestones,
  rewards,
  onChangeRewards,
  scholarStreakCurrent,
  appOpenDateKeys,
  onCelebrate,
}: {
  lifeQuarterly: LifeQuarterly;
  onChange: (updater: (lq: LifeQuarterly) => LifeQuarterly) => void;
  finance: FinanceData;
  onChangeFinance: (updater: (f: FinanceData) => FinanceData) => void;
  budget: BudgetData;
  onChangeBudget: (updater: (b: BudgetData) => BudgetData) => void;
  paycheckPlans: PaycheckPlanData;
  onChangePaycheckPlans: (updater: (p: PaycheckPlanData) => PaycheckPlanData) => void;
  milestones: MilestoneData;
  rewards: RewardsData;
  onChangeRewards: (updater: (r: RewardsData) => RewardsData) => void;
  scholarStreakCurrent: number;
  appOpenDateKeys: string[];
  onCelebrate: (tier: CelebrationTier, message: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("paycheck");

  function updateMoney(updater: (m: MoneyData) => MoneyData) {
    onChange((lq) => ({ ...lq, money: updater(lq.money) }));
  }

  function updateDebts(updater: (d: Debt[]) => Debt[]) {
    updateMoney((m) => ({ ...m, debts: updater(m.debts) }));
  }

  function updatePaydayChecklist(updater: (p: PaydayChecklistData) => PaydayChecklistData) {
    onChange((lq) => ({ ...lq, paydayChecklist: updater(lq.paydayChecklist) }));
  }

  function addAccount() {
    const account: Account = { id: crypto.randomUUID(), name: "", type: "checking", balance: 0 };
    onChangeFinance((f) => ({ ...f, accounts: [account, ...f.accounts] }));
  }

  function addTransaction(t: Omit<Transaction, "id">) {
    const transaction: Transaction = { ...t, id: crypto.randomUUID() };
    onChangeFinance((f) => ({ ...f, transactions: [transaction, ...f.transactions] }));
  }

  function addBudget(b: Omit<Budget, "id">) {
    const budget: Budget = { ...b, id: crypto.randomUUID() };
    onChangeFinance((f) => ({ ...f, budgets: [...f.budgets, budget] }));
  }

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="mb-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-backdrop-muted">
          Money
        </p>
        <p className="font-serif text-[1.05rem] text-backdrop-ink">
          Vaults, Debt Snowball &amp; Finance Tracker
        </p>
      </div>

      <div className="mb-3 flex gap-1.5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              tab === t.key
                ? "bg-life text-paper-surface"
                : "border border-paper-border bg-paper-surface text-paper-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "paycheck" && (
        <PaycheckFlowView
          paycheckPlans={paycheckPlans}
          onChange={onChangePaycheckPlans}
          config={budget.config}
          debts={lifeQuarterly.money.debts}
          onCelebrate={onCelebrate}
        />
      )}

      {tab === "debts" && (
        <DebtsView debts={lifeQuarterly.money.debts} config={budget.config} onChangeDebts={updateDebts} />
      )}

      {tab === "progress" && <ProgressView budget={budget} money={lifeQuarterly.money} />}

      {tab === "command" && (
        <CommandCenter
          budget={budget}
          money={lifeQuarterly.money}
          onChangeBudget={onChangeBudget}
          onChangeMoney={updateMoney}
          onCelebrate={onCelebrate}
        />
      )}

      {tab === "overview" && (
        <div className="flex flex-col gap-3">
          <MoneySection money={lifeQuarterly.money} onChange={updateMoney} />
          <PaydayChecklistSection data={lifeQuarterly.paydayChecklist} onChange={updatePaydayChecklist} />
        </div>
      )}

      {tab === "accounts" && (
        <AccountsTab
          accounts={finance.accounts}
          onAdd={addAccount}
          onUpdate={(id, updater) =>
            onChangeFinance((f) => ({
              ...f,
              accounts: f.accounts.map((a) => (a.id === id ? updater(a) : a)),
            }))
          }
          onDelete={(id) =>
            onChangeFinance((f) => ({ ...f, accounts: f.accounts.filter((a) => a.id !== id) }))
          }
        />
      )}

      {tab === "transactions" && (
        <TransactionsTab
          accounts={finance.accounts}
          transactions={finance.transactions}
          onAdd={addTransaction}
          onDelete={(id) =>
            onChangeFinance((f) => ({
              ...f,
              transactions: f.transactions.filter((t) => t.id !== id),
            }))
          }
        />
      )}

      {tab === "budgets" && (
        <BudgetsTab
          budgets={finance.budgets}
          transactions={finance.transactions}
          onAdd={addBudget}
          onUpdate={(id, updater) =>
            onChangeFinance((f) => ({
              ...f,
              budgets: f.budgets.map((b) => (b.id === id ? updater(b) : b)),
            }))
          }
          onDelete={(id) =>
            onChangeFinance((f) => ({ ...f, budgets: f.budgets.filter((b) => b.id !== id) }))
          }
        />
      )}

      {tab === "trends" && <TrendsTab transactions={finance.transactions} />}

      {tab === "calendar" && <CalendarTab budget={budget} money={lifeQuarterly.money} />}

      {tab === "rewards" && (
        <RewardsView
          rewards={rewards}
          onChangeRewards={onChangeRewards}
          milestones={milestones}
          money={lifeQuarterly.money}
          budget={budget}
          onChangeBudget={onChangeBudget}
          scholarStreakCurrent={scholarStreakCurrent}
          appOpenDateKeys={appOpenDateKeys}
          onCelebrate={onCelebrate}
        />
      )}
    </div>
  );
}
