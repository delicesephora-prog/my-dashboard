import { dateKey } from "./date";
import { computeStreaks, monthlyTotalsForYear, yearsWithData } from "./milestones";

export type RewardTrigger =
  | { kind: "trackerStreak"; trackerId: string; days: number }
  | { kind: "trackerMonthlyCount"; trackerId: string; count: number }
  | { kind: "debtPaidOff"; debtId: string }
  | { kind: "scholarStreak"; days: number }
  | { kind: "appOpenStreak"; days: number }
  | { kind: "manual" };

export type RewardStatus = "active" | "readyToClaim" | "claimed";

export type Reward = {
  id: string;
  name: string;
  costEstimate: number;
  // "" = a free/low-cost reward with no budget category attached.
  spendingCategoryId: string;
  trigger: RewardTrigger;
  status: RewardStatus;
  earnedAt: string; // "" until the trigger is met
  claimedAt: string; // "" until claimed
  order: number;
};

export type RewardsData = {
  rewards: Reward[];
};

export function emptyRewardsData(): RewardsData {
  return { rewards: [] };
}

export function normalizeRewardsData(partial: Partial<RewardsData> | null | undefined): RewardsData {
  return {
    rewards: (partial?.rewards ?? []).map((r) => ({
      ...r,
      spendingCategoryId: r.spendingCategoryId ?? "",
      status: r.status ?? "active",
      earnedAt: r.earnedAt ?? "",
      claimedAt: r.claimedAt ?? "",
    })),
  };
}

// A few starter ideas offered in the create-reward form - not auto-added to
// her list, just quick-fill suggestions so free/low-cost rewards aren't an
// afterthought next to the paid ones she'll naturally think of first.
export type RewardSuggestion = { name: string; costEstimate: number };

export const REWARD_SUGGESTIONS: RewardSuggestion[] = [
  { name: "A guilt-free lazy afternoon", costEstimate: 0 },
  { name: "Movie night at home", costEstimate: 0 },
  { name: "A hike somewhere new", costEstimate: 0 },
  { name: "A dance class", costEstimate: 25 },
  { name: "A nice dinner out", costEstimate: 60 },
  { name: "A new book", costEstimate: 20 },
];

export function addReward(data: RewardsData, reward: Omit<Reward, "id" | "order" | "status" | "earnedAt" | "claimedAt">): RewardsData {
  const full: Reward = {
    ...reward,
    id: crypto.randomUUID(),
    order: data.rewards.length,
    status: "active",
    earnedAt: "",
    claimedAt: "",
  };
  return { ...data, rewards: [...data.rewards, full] };
}

export function updateReward(data: RewardsData, id: string, updater: (r: Reward) => Reward): RewardsData {
  return { ...data, rewards: data.rewards.map((r) => (r.id === id ? updater(r) : r)) };
}

export function deleteReward(data: RewardsData, id: string): RewardsData {
  return { ...data, rewards: data.rewards.filter((r) => r.id !== id) };
}

// A "manual" reward has no automatic trigger - she decides for herself when
// it's earned and taps this to move it to the Claim It list.
export function markRewardEarned(data: RewardsData, id: string, now: Date): RewardsData {
  return updateReward(data, id, (r) => ({ ...r, status: "readyToClaim", earnedAt: dateKey(now) }));
}

export function claimReward(data: RewardsData, id: string, now: Date): RewardsData {
  return updateReward(data, id, (r) => ({ ...r, status: "claimed", claimedAt: dateKey(now) }));
}

export type RewardTriggerContext = {
  now: Date;
  milestoneEntries: Record<string, Record<string, number>>; // trackerId -> dateKey -> value
  debts: { id: string; currentBalance: number }[];
  scholarStreakCurrent: number;
  appOpenDateKeys: string[];
};

// The longest streak "so far" the app open-history can show is just the
// current-streak math run over "every date the app has ever recorded a
// score" - reuses the exact same consecutive-day logic as a tracker streak.
export function appOpenStreak(dateKeys: string[], now: Date): number {
  const values: Record<string, number> = {};
  for (const k of dateKeys) values[k] = 1;
  return computeStreaks(values, now).current;
}

function triggerMet(trigger: RewardTrigger, ctx: RewardTriggerContext): boolean {
  switch (trigger.kind) {
    case "trackerStreak": {
      const entries = ctx.milestoneEntries[trigger.trackerId] ?? {};
      return computeStreaks(entries, ctx.now).current >= trigger.days;
    }
    case "trackerMonthlyCount": {
      const entries = ctx.milestoneEntries[trigger.trackerId] ?? {};
      const years = yearsWithData(entries, ctx.now.getFullYear());
      return years.some((y) => monthlyTotalsForYear(entries, y).some((total) => total >= trigger.count));
    }
    case "debtPaidOff":
      return ctx.debts.some((d) => d.id === trigger.debtId && d.currentBalance <= 0);
    case "scholarStreak":
      return ctx.scholarStreakCurrent >= trigger.days;
    case "appOpenStreak":
      return appOpenStreak(ctx.appOpenDateKeys, ctx.now) >= trigger.days;
    case "manual":
      return false;
  }
}

export type EvaluateResult = { rewards: Reward[]; newlyReady: Reward[]; changed: boolean };

// Pure - only ever moves "active" rewards forward to "readyToClaim". Once a
// reward has left "active" it's never re-evaluated, so calling this
// repeatedly (e.g. on every data change) is always safe and idempotent.
export function evaluateRewardTriggers(rewards: Reward[], ctx: RewardTriggerContext): EvaluateResult {
  const newlyReady: Reward[] = [];
  const today = dateKey(ctx.now);
  const updated = rewards.map((r) => {
    if (r.status !== "active" || r.trigger.kind === "manual") return r;
    if (triggerMet(r.trigger, ctx)) {
      const next: Reward = { ...r, status: "readyToClaim", earnedAt: today };
      newlyReady.push(next);
      return next;
    }
    return r;
  });
  return { rewards: updated, newlyReady, changed: newlyReady.length > 0 };
}
