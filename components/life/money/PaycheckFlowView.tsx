"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/finance";
import { todayKey, formatDayLabel } from "@/lib/date";
import { BudgetConfig } from "@/lib/budget";
import { Debt } from "@/lib/types";
import { CelebrationTier } from "@/lib/celebration";
import {
  AllocationKind,
  AllocationLine,
  PaycheckPlan,
  PaycheckPlanData,
  addLine,
  addPaycheckPlan,
  allocatedTotal,
  allocationByKind,
  createPaycheckPlan,
  deletePaycheckPlan,
  newAllocationLine,
  plansSorted,
  removeLine,
  slotForPaycheckDate,
  suggestLinesFromConfig,
  toggleLineDone,
  unallocatedTotal,
  updateLine,
  updatePaycheckPlan,
} from "@/lib/paycheckplan";
import DonutChart from "@/components/DonutChart";
import CheckCircle from "../../CheckCircle";

const KIND_LABELS: Record<AllocationKind, string> = {
  bill: "Bills",
  debt: "Debt Payments",
  vault: "Vault Transfers",
  spending: "Spending",
};

const KIND_COLORS: Record<AllocationKind, string> = {
  bill: "#5B2333", // work/plum
  debt: "#A54B3F", // brick
  vault: "#8A9B7C", // sage
  spending: "#B08B4F", // gold
};

const KIND_ORDER: AllocationKind[] = ["bill", "debt", "vault", "spending"];

function nextPaycheckDate(now: Date): string {
  const day = now.getDate();
  const target = day < 15 ? 15 : day < 30 ? 30 : 15;
  const month = day < 30 ? now.getMonth() : now.getMonth() + 1;
  const daysInTargetMonth = new Date(now.getFullYear(), month + 1, 0).getDate();
  const d = new Date(now.getFullYear(), month, Math.min(target, daysInTargetMonth));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function PaycheckFlowView({
  paycheckPlans,
  onChange,
  config,
  debts,
  onCelebrate,
}: {
  paycheckPlans: PaycheckPlanData;
  onChange: (updater: (p: PaycheckPlanData) => PaycheckPlanData) => void;
  config: BudgetConfig;
  debts: Debt[];
  onCelebrate: (tier: CelebrationTier, message: string) => void;
}) {
  const now = new Date();
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftDate, setDraftDate] = useState(nextPaycheckDate(now));
  const [draftAmount, setDraftAmount] = useState(String(config.perPaycheckIncome));

  const plans = plansSorted(paycheckPlans);
  const activePlan = plans.find((p) => p.id === activePlanId);

  function startNewPlan() {
    const amount = Number(draftAmount) || 0;
    const slot = slotForPaycheckDate(draftDate);
    const suggested = suggestLinesFromConfig(config, debts, slot);
    const plan = createPaycheckPlan(draftDate, amount, suggested, now);
    onChange((data) => addPaycheckPlan(data, plan));
    setActivePlanId(plan.id);
    setCreating(false);
  }

  if (!activePlan) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[12px] text-paper-muted">
          Build an allocation plan for each paycheck before it lands - every dollar gets a job until nothing&apos;s
          left unassigned.
        </p>

        {!creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-full bg-life px-3.5 py-1.5 text-xs font-medium text-paper-surface self-end"
          >
            + New Paycheck Plan
          </button>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="mb-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
                  Paycheck Date
                </p>
                <input
                  type="date"
                  value={draftDate}
                  onChange={(e) => setDraftDate(e.target.value)}
                  className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
                />
              </div>
              <div className="flex-1">
                <p className="mb-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
                  What&apos;s Landing
                </p>
                <input
                  type="number"
                  step="0.01"
                  value={draftAmount}
                  onChange={(e) => setDraftAmount(e.target.value)}
                  placeholder="Actual bank balance also works"
                  className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className="text-xs text-paper-faint">
                Cancel
              </button>
              <button
                type="button"
                onClick={startNewPlan}
                className="rounded-full bg-life px-3.5 py-1.5 text-xs font-medium text-paper-surface"
              >
                Start Allocating
              </button>
            </div>
          </div>
        )}

        {plans.length === 0 ? (
          <p className="py-6 text-center font-serif text-[0.9rem] italic text-paper-muted">
            No paycheck plans yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">History</p>
            {plans.map((plan) => {
              const unallocated = unallocatedTotal(plan);
              const doneCount = plan.lines.filter((l) => l.done).length;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setActivePlanId(plan.id)}
                  className="flex items-center justify-between gap-2 rounded-xl border border-paper-border bg-paper-surface px-3.5 py-2.5 text-left shadow-paper"
                >
                  <div className="min-w-0">
                    <p className="text-[13.5px] text-paper-ink">
                      {formatDayLabel(plan.date)}
                      {plan.date === todayKey(now) && <span className="ml-1.5 text-[10px] text-gold">today</span>}
                    </p>
                    <p className="text-[11px] text-paper-muted">
                      {formatMoney(plan.expectedAmount)} · {doneCount}/{plan.lines.length} paid
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[11px] font-medium ${
                      Math.abs(unallocated) < 0.01 ? "text-sage" : unallocated < 0 ? "text-[#B5574A]" : "text-paper-muted"
                    }`}
                  >
                    {Math.abs(unallocated) < 0.01 ? "$0 left" : `${formatMoney(unallocated)} unassigned`}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <PlanEditor
      plan={activePlan}
      onChange={(updater) => onChange((data) => updatePaycheckPlan(data, activePlan.id, updater))}
      onDelete={() => {
        onChange((data) => deletePaycheckPlan(data, activePlan.id));
        setActivePlanId(null);
      }}
      onBack={() => setActivePlanId(null)}
      onCelebrate={onCelebrate}
    />
  );
}

function PlanEditor({
  plan,
  onChange,
  onDelete,
  onBack,
  onCelebrate,
}: {
  plan: PaycheckPlan;
  onChange: (updater: (p: PaycheckPlan) => PaycheckPlan) => void;
  onDelete: () => void;
  onBack: () => void;
  onCelebrate: (tier: CelebrationTier, message: string) => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const byKind = allocationByKind(plan);
  const unallocated = unallocatedTotal(plan);
  const allocated = allocatedTotal(plan);
  const wasUnassigned = allocated < plan.expectedAmount;

  function addRemainingToSpending() {
    if (unallocated <= 0) return;
    const existing = plan.lines.find((l) => l.kind === "spending");
    if (existing) {
      onChange((p) => updateLine(p, existing.id, (l) => ({ ...l, amount: l.amount + unallocated })));
    } else {
      onChange((p) => addLine(p, newAllocationLine("spending", "Safe to Spend", unallocated)));
    }
    if (wasUnassigned) onCelebrate("medium", "Every dollar has a job now. 🎯");
  }

  const segments = KIND_ORDER.map((k) => ({ label: KIND_LABELS[k], value: byKind[k], color: KIND_COLORS[k] }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="text-[12px] text-paper-muted">
          ‹ All Plans
        </button>
        {confirmingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-paper-muted">Delete this plan?</span>
            <button type="button" onClick={onDelete} className="text-xs font-medium text-paper-ink underline underline-offset-2">
              Yes
            </button>
            <button type="button" onClick={() => setConfirmingDelete(false)} className="text-xs text-paper-faint">
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmingDelete(true)} className="text-[11px] text-paper-faint underline underline-offset-2">
            Delete plan
          </button>
        )}
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
              {formatDayLabel(plan.date)}
            </p>
            <div className="mt-0.5 flex items-center gap-1 font-serif text-lg text-paper-ink">
              <span>$</span>
              <input
                type="number"
                step="0.01"
                value={plan.expectedAmount}
                onChange={(e) => onChange((p) => ({ ...p, expectedAmount: Number(e.target.value) || 0 }))}
                className="w-24 rounded-md border border-transparent bg-transparent outline-none transition-colors focus:border-paper-border focus:bg-paper-surface2"
              />
            </div>
          </div>
          <DonutChart
            segments={segments}
            size={100}
            strokeWidth={12}
            centerLabel={Math.abs(unallocated) < 0.01 ? "$0" : formatMoney(unallocated)}
          />
        </div>

        <div
          className={`rounded-xl border px-3 py-2 text-center text-[13px] ${
            Math.abs(unallocated) < 0.01
              ? "border-sage/40 bg-sage/10 text-sage"
              : unallocated < 0
                ? "border-[#B5574A]/40 bg-[#B5574A]/5 text-[#B5574A]"
                : "border-gold/40 bg-gold/5 text-gold"
          }`}
        >
          {Math.abs(unallocated) < 0.01
            ? "Every dollar has a job ✓"
            : unallocated < 0
              ? `${formatMoney(Math.abs(unallocated))} more than this paycheck covers - trim something or move it to next check.`
              : `${formatMoney(unallocated)} still unassigned`}
        </div>

        {unallocated > 0.01 && (
          <button
            type="button"
            onClick={addRemainingToSpending}
            className="mt-2 w-full rounded-lg border border-paper-border py-1.5 text-[12px] text-paper-muted"
          >
            Assign the rest to Spending
          </button>
        )}
      </div>

      {KIND_ORDER.map((kind) => (
        <AllocationGroup
          key={kind}
          kind={kind}
          lines={plan.lines.filter((l) => l.kind === kind)}
          color={KIND_COLORS[kind]}
          onAddLine={() => onChange((p) => addLine(p, newAllocationLine(kind, kind === "spending" ? "Spending" : "New item", 0)))}
          onUpdateLine={(id, updater) => onChange((p) => updateLine(p, id, updater))}
          onRemoveLine={(id) => onChange((p) => removeLine(p, id))}
          onToggleDone={(id) => onChange((p) => toggleLineDone(p, id))}
        />
      ))}
    </div>
  );
}

function AllocationGroup({
  kind,
  lines,
  color,
  onAddLine,
  onUpdateLine,
  onRemoveLine,
  onToggleDone,
}: {
  kind: AllocationKind;
  lines: AllocationLine[];
  color: string;
  onAddLine: () => void;
  onUpdateLine: (id: string, updater: (l: AllocationLine) => AllocationLine) => void;
  onRemoveLine: (id: string) => void;
  onToggleDone: (id: string) => void;
}) {
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          {KIND_LABELS[kind]}
        </p>
        <span className="text-[13px] text-paper-ink">{formatMoney(total)}</span>
      </div>

      {lines.length === 0 ? (
        <p className="py-1.5 text-[12px] italic text-paper-muted">Nothing assigned yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {lines.map((line) => (
            <div key={line.id} className="flex items-center gap-2">
              <CheckCircle
                done={line.done}
                onToggle={() => onToggleDone(line.id)}
                accentClass="bg-life"
                size="sm"
                ariaLabel={line.done ? "Mark not paid" : "Mark paid"}
              />
              <input
                value={line.refName}
                onChange={(e) => onUpdateLine(line.id, (l) => ({ ...l, refName: e.target.value }))}
                className={`min-w-0 flex-1 bg-transparent text-[13px] outline-none ${line.done ? "text-paper-faint line-through" : "text-paper-ink"}`}
              />
              <input
                type="number"
                step="0.01"
                value={line.amount}
                onChange={(e) => onUpdateLine(line.id, (l) => ({ ...l, amount: Number(e.target.value) || 0 }))}
                className="w-20 shrink-0 rounded-md border border-transparent bg-transparent px-1 text-right text-[13px] text-paper-muted outline-none transition-colors focus:border-paper-border focus:bg-paper-surface2"
              />
              <button
                type="button"
                aria-label="Remove line"
                onClick={() => onRemoveLine(line.id)}
                className="shrink-0 text-paper-faint"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={onAddLine} className="mt-2 text-[11px] text-paper-muted underline underline-offset-2">
        + Add {KIND_LABELS[kind].toLowerCase()}
      </button>
    </div>
  );
}
