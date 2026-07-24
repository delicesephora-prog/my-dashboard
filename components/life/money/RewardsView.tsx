"use client";

import { useState } from "react";
import { MoneyData, Debt } from "@/lib/types";
import { formatMoney } from "@/lib/finance";
import { BudgetData, SpendingTarget, monthKey, monthStateFor, updateMonthState } from "@/lib/budget";
import { CelebrationTier } from "@/lib/celebration";
import { MilestoneData, computeStreaks, monthlyTotalsForYear, yearsWithData } from "@/lib/milestones";
import {
  RewardsData,
  Reward,
  RewardTrigger,
  RewardSuggestion,
  REWARD_SUGGESTIONS,
  addReward,
  updateReward,
  deleteReward,
  claimReward,
  markRewardEarned,
  appOpenStreak,
} from "@/lib/rewards";

export default function RewardsView({
  rewards,
  onChangeRewards,
  milestones,
  money,
  budget,
  onChangeBudget,
  scholarStreakCurrent,
  appOpenDateKeys,
  onCelebrate,
}: {
  rewards: RewardsData;
  onChangeRewards: (updater: (r: RewardsData) => RewardsData) => void;
  milestones: MilestoneData;
  money: MoneyData;
  budget: BudgetData;
  onChangeBudget: (updater: (b: BudgetData) => BudgetData) => void;
  scholarStreakCurrent: number;
  appOpenDateKeys: string[];
  onCelebrate: (tier: CelebrationTier, message: string) => void;
}) {
  const now = new Date();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [claimWarning, setClaimWarning] = useState<{ reward: Reward; target: SpendingTarget; remaining: number } | null>(
    null
  );

  const readyToClaim = rewards.rewards.filter((r) => r.status === "readyToClaim").sort((a, b) => a.order - b.order);
  const active = rewards.rewards.filter((r) => r.status === "active").sort((a, b) => a.order - b.order);
  const claimed = rewards.rewards
    .filter((r) => r.status === "claimed")
    .sort((a, b) => b.claimedAt.localeCompare(a.claimedAt));

  function claimAmountFor(reward: Reward, target: SpendingTarget | undefined) {
    if (!target) return { spent: 0, remaining: Infinity };
    const key = monthKey(now);
    const state = monthStateFor(budget, key, money);
    const spent = state.spendingLogged[target.id] ?? 0;
    return { spent, remaining: target.monthlyAmount - spent };
  }

  function doClaim(reward: Reward, target: SpendingTarget | undefined) {
    onChangeRewards((r) => claimReward(r, reward.id, now));
    if (target) {
      const key = monthKey(now);
      onChangeBudget((b) =>
        updateMonthState(b, key, money, (s) => ({
          ...s,
          spendingLogged: { ...s.spendingLogged, [target.id]: (s.spendingLogged[target.id] ?? 0) + reward.costEstimate },
        }))
      );
    }
    onCelebrate("big", `🎁 ${reward.name} - claimed! Enjoy it.`);
    setClaimWarning(null);
  }

  function handleClaimTap(reward: Reward) {
    const target = budget.config.spendingTargets.find((t) => t.id === reward.spendingCategoryId);
    if (!target) {
      doClaim(reward, undefined);
      return;
    }
    const { remaining } = claimAmountFor(reward, target);
    if (reward.costEstimate > remaining) {
      setClaimWarning({ reward, target, remaining });
    } else {
      doClaim(reward, target);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-paper-muted">
        Prizes you set for yourself, unlocked by the progress you actually make.
      </p>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="rounded-full bg-life px-3 py-1.5 text-xs font-medium text-paper-surface"
        >
          {creating ? "Cancel" : "+ Add Reward"}
        </button>
      </div>

      {creating && (
        <RewardForm
          milestones={milestones}
          debts={money.debts}
          spendingTargets={budget.config.spendingTargets}
          onSave={(draft) => {
            onChangeRewards((r) => addReward(r, draft));
            setCreating(false);
          }}
          onCancel={() => setCreating(false)}
        />
      )}

      {claimWarning && (
        <div className="rounded-xl2 border border-gold/50 bg-paper-surface2 p-4 shadow-paper">
          <p className="text-[13px] text-paper-ink">
            Claiming <b>{claimWarning.reward.name}</b> ({formatMoney(claimWarning.reward.costEstimate)}) would put you over
            your <b>{claimWarning.target.name}</b> budget this month
            {claimWarning.remaining >= 0
              ? ` - only ${formatMoney(claimWarning.remaining)} left.`
              : ` - already ${formatMoney(-claimWarning.remaining)} over.`}
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setClaimWarning(null)}
              className="rounded-full border border-paper-border px-3 py-1.5 text-[12px] text-paper-muted"
            >
              Wait for next month
            </button>
            <button
              type="button"
              onClick={() => doClaim(claimWarning.reward, claimWarning.target)}
              className="rounded-full bg-life px-3 py-1.5 text-[12px] font-medium text-paper-surface"
            >
              Claim anyway
            </button>
          </div>
        </div>
      )}

      {readyToClaim.length > 0 && (
        <RewardGroup title="Claim It" hint="Earned and waiting - make it happen.">
          {readyToClaim.map((reward) => (
            <RewardRow
              key={reward.id}
              reward={reward}
              milestones={milestones}
              debts={money.debts}
              spendingTargets={budget.config.spendingTargets}
              editing={editingId === reward.id}
              onToggleEdit={() => setEditingId((id) => (id === reward.id ? null : reward.id))}
              onUpdate={(updater) => onChangeRewards((r) => updateReward(r, reward.id, updater))}
              onDelete={() => onChangeRewards((r) => deleteReward(r, reward.id))}
              scholarStreakCurrent={scholarStreakCurrent}
              appOpenDateKeys={appOpenDateKeys}
              now={now}
              action={
                <button
                  type="button"
                  onClick={() => handleClaimTap(reward)}
                  className="rounded-full bg-gold px-3 py-1.5 text-[12px] font-medium text-paper-ink"
                >
                  Claim
                </button>
              }
            />
          ))}
        </RewardGroup>
      )}

      <RewardGroup title="Working Toward" hint={active.length === 0 ? "" : "Keep going - you'll see these move to Claim It."}>
        {active.length === 0 ? (
          <p className="py-3 text-center font-serif text-[0.9rem] italic text-paper-muted">
            No rewards in progress yet - add one above.
          </p>
        ) : (
          active.map((reward) => (
            <RewardRow
              key={reward.id}
              reward={reward}
              milestones={milestones}
              debts={money.debts}
              spendingTargets={budget.config.spendingTargets}
              editing={editingId === reward.id}
              onToggleEdit={() => setEditingId((id) => (id === reward.id ? null : reward.id))}
              onUpdate={(updater) => onChangeRewards((r) => updateReward(r, reward.id, updater))}
              onDelete={() => onChangeRewards((r) => deleteReward(r, reward.id))}
              scholarStreakCurrent={scholarStreakCurrent}
              appOpenDateKeys={appOpenDateKeys}
              now={now}
              action={
                reward.trigger.kind === "manual" ? (
                  <button
                    type="button"
                    onClick={() => onChangeRewards((r) => markRewardEarned(r, reward.id, now))}
                    className="rounded-full border border-paper-border px-3 py-1.5 text-[12px] text-paper-muted"
                  >
                    Mark as earned
                  </button>
                ) : undefined
              }
            />
          ))
        )}
      </RewardGroup>

      {claimed.length > 0 && (
        <RewardGroup title="History" hint="Proof you earned it.">
          {claimed.map((reward) => (
            <div key={reward.id} className="flex items-center justify-between gap-2 rounded-xl border border-paper-border bg-paper-surface2 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] text-paper-ink">{reward.name}</p>
                <p className="text-[11px] text-paper-muted">Claimed {reward.claimedAt}</p>
              </div>
              {reward.costEstimate > 0 && (
                <span className="shrink-0 text-[12px] text-paper-muted">{formatMoney(reward.costEstimate)}</span>
              )}
            </div>
          ))}
        </RewardGroup>
      )}
    </div>
  );
}

function RewardGroup({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">{title}</p>
      {hint && <p className="mb-2.5 mt-0.5 text-[11.5px] text-paper-faint">{hint}</p>}
      <div className={`flex flex-col gap-2 ${hint ? "" : "mt-2.5"}`}>{children}</div>
    </div>
  );
}

function triggerProgress(
  trigger: RewardTrigger,
  ctx: {
    milestones: MilestoneData;
    debts: Debt[];
    scholarStreakCurrent: number;
    appOpenDateKeys: string[];
    now: Date;
  }
): string {
  switch (trigger.kind) {
    case "trackerStreak": {
      const tracker = ctx.milestones.trackers.find((t) => t.id === trigger.trackerId);
      const entries = ctx.milestones.entries[trigger.trackerId] ?? {};
      const { current } = computeStreaks(entries, ctx.now);
      return `${tracker?.name ?? "Tracker"}: ${current} / ${trigger.days} day streak`;
    }
    case "trackerMonthlyCount": {
      const tracker = ctx.milestones.trackers.find((t) => t.id === trigger.trackerId);
      const entries = ctx.milestones.entries[trigger.trackerId] ?? {};
      const years = yearsWithData(entries, ctx.now.getFullYear());
      const best = Math.max(0, ...years.flatMap((y) => monthlyTotalsForYear(entries, y)));
      return `${tracker?.name ?? "Tracker"}: best month so far ${best} / ${trigger.count}`;
    }
    case "debtPaidOff": {
      const debt = ctx.debts.find((d) => d.id === trigger.debtId);
      if (!debt) return "Debt no longer exists";
      return `${debt.name}: ${formatMoney(debt.currentBalance)} left`;
    }
    case "scholarStreak":
      return `Scholar streak: ${ctx.scholarStreakCurrent} / ${trigger.days} days`;
    case "appOpenStreak":
      return `App-open streak: ${appOpenStreak(ctx.appOpenDateKeys, ctx.now)} / ${trigger.days} days`;
    case "manual":
      return "You decide when this one's earned";
  }
}

function RewardRow({
  reward,
  milestones,
  debts,
  spendingTargets,
  editing,
  onToggleEdit,
  onUpdate,
  onDelete,
  scholarStreakCurrent,
  appOpenDateKeys,
  now,
  action,
}: {
  reward: Reward;
  milestones: MilestoneData;
  debts: Debt[];
  spendingTargets: SpendingTarget[];
  editing: boolean;
  onToggleEdit: () => void;
  onUpdate: (updater: (r: Reward) => Reward) => void;
  onDelete: () => void;
  scholarStreakCurrent: number;
  appOpenDateKeys: string[];
  now: Date;
  action?: React.ReactNode;
}) {
  const category = spendingTargets.find((t) => t.id === reward.spendingCategoryId);

  return (
    <div className="rounded-xl border border-paper-border bg-paper-surface2 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] text-paper-ink">{reward.name}</p>
          <p className="mt-0.5 text-[11px] text-paper-muted">
            {reward.costEstimate > 0 ? `${formatMoney(reward.costEstimate)} · ` : "Free · "}
            {category ? category.name : "No budget category"}
          </p>
          <p className="mt-1 text-[11.5px] text-paper-muted">
            {triggerProgress(reward.trigger, { milestones, debts, scholarStreakCurrent, appOpenDateKeys, now })}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {action}
          <button type="button" onClick={onToggleEdit} className="text-[11px] text-paper-faint underline underline-offset-2">
            {editing ? "Close" : "Edit"}
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-3 border-t border-paper-border pt-3">
          <RewardForm
            milestones={milestones}
            debts={debts}
            spendingTargets={spendingTargets}
            initial={reward}
            onSave={(draft) => {
              onUpdate((r) => ({ ...r, ...draft }));
              onToggleEdit();
            }}
            onCancel={onToggleEdit}
            onDelete={onDelete}
          />
        </div>
      )}
    </div>
  );
}

type RewardDraft = Omit<Reward, "id" | "order" | "status" | "earnedAt" | "claimedAt">;

function RewardForm({
  milestones,
  debts,
  spendingTargets,
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  milestones: MilestoneData;
  debts: Debt[];
  spendingTargets: SpendingTarget[];
  initial?: Reward;
  onSave: (draft: RewardDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [cost, setCost] = useState(initial?.costEstimate ?? 0);
  const [categoryId, setCategoryId] = useState(initial?.spendingCategoryId ?? "");
  const [triggerKind, setTriggerKind] = useState<RewardTrigger["kind"]>(initial?.trigger.kind ?? "manual");
  const [trackerId, setTrackerId] = useState(
    initial?.trigger.kind === "trackerStreak" || initial?.trigger.kind === "trackerMonthlyCount"
      ? initial.trigger.trackerId
      : milestones.trackers[0]?.id ?? ""
  );
  const [days, setDays] = useState(
    initial?.trigger.kind === "trackerStreak"
      ? initial.trigger.days
      : initial?.trigger.kind === "scholarStreak" || initial?.trigger.kind === "appOpenStreak"
        ? initial.trigger.days
        : 7
  );
  const [count, setCount] = useState(initial?.trigger.kind === "trackerMonthlyCount" ? initial.trigger.count : 12);
  const [debtId, setDebtId] = useState(
    initial?.trigger.kind === "debtPaidOff" ? initial.trigger.debtId : debts[0]?.id ?? ""
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function applySuggestion(s: RewardSuggestion) {
    setName(s.name);
    setCost(s.costEstimate);
    if (s.costEstimate === 0) setCategoryId("");
  }

  function buildTrigger(): RewardTrigger {
    switch (triggerKind) {
      case "trackerStreak":
        return { kind: "trackerStreak", trackerId, days };
      case "trackerMonthlyCount":
        return { kind: "trackerMonthlyCount", trackerId, count };
      case "debtPaidOff":
        return { kind: "debtPaidOff", debtId };
      case "scholarStreak":
        return { kind: "scholarStreak", days };
      case "appOpenStreak":
        return { kind: "appOpenStreak", days };
      case "manual":
        return { kind: "manual" };
    }
  }

  const needsTracker = triggerKind === "trackerStreak" || triggerKind === "trackerMonthlyCount";
  const trackerMissing = needsTracker && milestones.trackers.length === 0;
  const debtMissing = triggerKind === "debtPaidOff" && debts.length === 0;
  const canSave = name.trim().length > 0 && !trackerMissing && !debtMissing;

  return (
    <div className="flex flex-col gap-3">
      {!initial && (
        <div>
          <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
            Ideas to start with
          </p>
          <div className="flex flex-wrap gap-1.5">
            {REWARD_SUGGESTIONS.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => applySuggestion(s)}
                className="rounded-full border border-paper-border bg-paper-surface px-2.5 py-1 text-[11px] text-paper-muted"
              >
                {s.name}
                {s.costEstimate === 0 ? "" : ` · ${formatMoney(s.costEstimate)}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Reward name"
        className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[14px] text-paper-ink outline-none placeholder:text-paper-faint"
      />

      <div className="flex gap-2">
        <div className="flex-1">
          <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">Cost Estimate</p>
          <input
            type="number"
            min={0}
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
            className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[14px] text-paper-ink outline-none"
          />
        </div>
        <div className="flex-1">
          <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">Budget Category</p>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
          >
            <option value="">Free / no category</option>
            {spendingTargets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
          Earned when...
        </p>
        <select
          value={triggerKind}
          onChange={(e) => setTriggerKind(e.target.value as RewardTrigger["kind"])}
          className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
        >
          <option value="manual">I&apos;ll mark it myself</option>
          <option value="trackerStreak">A tracker hits a streak</option>
          <option value="trackerMonthlyCount">A tracker hits a count in one month</option>
          <option value="debtPaidOff">A debt hits $0</option>
          <option value="scholarStreak">Scholar streak reaches...</option>
          <option value="appOpenStreak">Consecutive days using the app</option>
        </select>

        {needsTracker && (
          <div className="mt-2 flex gap-2">
            <select
              value={trackerId}
              onChange={(e) => setTrackerId(e.target.value)}
              className="flex-1 rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
            >
              {milestones.trackers.length === 0 && <option value="">No trackers yet</option>}
              {milestones.trackers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.name}
                </option>
              ))}
            </select>
            {triggerKind === "trackerStreak" ? (
              <input
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                aria-label="Days"
                className="w-20 rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
              />
            ) : (
              <input
                type="number"
                min={1}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                aria-label="Count"
                className="w-20 rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
              />
            )}
          </div>
        )}
        {trackerMissing && <p className="mt-1 text-[11px] text-paper-muted">Add a Milestones tracker first (Life &gt; Year).</p>}

        {triggerKind === "debtPaidOff" && (
          <div className="mt-2">
            <select
              value={debtId}
              onChange={(e) => setDebtId(e.target.value)}
              className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
            >
              {debts.length === 0 && <option value="">No debts on the board</option>}
              {debts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {(triggerKind === "scholarStreak" || triggerKind === "appOpenStreak") && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              aria-label="Days"
              className="w-20 rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
            />
            <span className="text-[12px] text-paper-muted">days</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        {onDelete ? (
          confirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-paper-muted">Delete for good?</span>
              <button type="button" onClick={onDelete} className="text-xs font-medium text-paper-ink underline underline-offset-2">
                Yes, delete
              </button>
              <button type="button" onClick={() => setConfirmingDelete(false)} className="text-xs text-paper-faint">
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmingDelete(true)} className="text-xs text-paper-faint underline underline-offset-2">
              Delete reward
            </button>
          )
        ) : (
          <button type="button" onClick={onCancel} className="text-xs text-paper-faint">
            Cancel
          </button>
        )}
        <button
          type="button"
          disabled={!canSave}
          onClick={() => onSave({ name: name.trim(), costEstimate: cost, spendingCategoryId: categoryId, trigger: buildTrigger() })}
          className="rounded-full bg-life px-3.5 py-1.5 text-xs font-medium text-paper-surface disabled:opacity-40"
        >
          {initial ? "Save Changes" : "Create Reward"}
        </button>
      </div>
    </div>
  );
}
