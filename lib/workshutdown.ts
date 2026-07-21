import { dateKey } from "./date";

export type ShutdownSubStep = {
  id: string;
  text: string;
  order: number;
};

export type ShutdownStep = {
  id: string;
  text: string;
  order: number;
  // A step with sub-steps can't be checked directly - it's done once every
  // sub-step is done. A step with none is a plain leaf, checked on its own.
  subSteps: ShutdownSubStep[];
};

export type WorkShutdownData = {
  steps: ShutdownStep[];
  // Keyed by YYYY-MM-DD -> completed ids (leaf steps and sub-steps share
  // the same flat set, since crypto.randomUUID() ids are globally unique).
  days: Record<string, string[]>;
  seedVersion: number;
};

// Bump whenever the seed content below changes and existing saved data
// should be replaced rather than left alone - see the migration in
// normalizeWorkShutdownData.
export const WORK_SHUTDOWN_SEED_VERSION = 2;

function step(text: string, subSteps: string[] = []): Omit<ShutdownStep, "id" | "order"> {
  return {
    text,
    subSteps: subSteps.map((s, i) => ({ id: crypto.randomUUID(), text: s, order: i })),
  };
}

function seedSteps(): ShutdownStep[] {
  return [
    step("Inbox triaged to zero (or flagged for tomorrow)", [
      "Reply to anything urgent",
      "Flag or label follow-ups for tomorrow",
      "Archive or delete what's done",
    ]),
    step("Task statuses updated", [
      "Mark finished tasks complete",
      "Update notes on anything in progress",
      "Re-flag anything that's now urgent",
    ]),
    step("Any new asks logged in Waiting On", [
      "Log who and what for each new ask",
      "Set a follow-up date if there is one",
    ]),
    step("Tomorrow's calendar checked", [
      "Note the first meeting time",
      "Flag anything that needs prep tonight",
    ]),
    step("Tomorrow's top 3 written down", [
      "Pick the One Thing for tomorrow",
      "Pick two supporting priorities",
    ]),
    step("Laptop closed"),
  ].map((s, i) => ({ ...s, id: crypto.randomUUID(), order: i }));
}

export function emptyWorkShutdownData(): WorkShutdownData {
  return { steps: seedSteps(), days: {}, seedVersion: WORK_SHUTDOWN_SEED_VERSION };
}

export function normalizeWorkShutdownData(
  partial: Partial<WorkShutdownData> | null | undefined
): WorkShutdownData {
  if ((partial?.seedVersion ?? 0) < WORK_SHUTDOWN_SEED_VERSION) {
    return emptyWorkShutdownData();
  }
  return {
    steps: Array.isArray(partial?.steps) ? partial.steps : seedSteps(),
    days: partial?.days ?? {},
    seedVersion: partial?.seedVersion ?? WORK_SHUTDOWN_SEED_VERSION,
  };
}

// Every actually-checkable item: a leaf step (no sub-steps) counts as
// itself; a step with sub-steps contributes its sub-steps instead of
// itself, so progress always reflects real, individually-checkable work.
function leafIds(step: ShutdownStep): string[] {
  return step.subSteps.length > 0 ? step.subSteps.map((s) => s.id) : [step.id];
}

export function stepDone(step: ShutdownStep, doneIds: Set<string>): boolean {
  return leafIds(step).every((id) => doneIds.has(id));
}

export function stepProgress(step: ShutdownStep, doneIds: Set<string>): { done: number; total: number } {
  const ids = leafIds(step);
  return { done: ids.filter((id) => doneIds.has(id)).length, total: ids.length };
}

export function completionForDate(
  data: WorkShutdownData,
  d: Date
): { done: number; total: number; pct: number | null } {
  const doneIds = new Set(data.days[dateKey(d)] ?? []);
  let done = 0;
  let total = 0;
  for (const s of data.steps) {
    const p = stepProgress(s, doneIds);
    done += p.done;
    total += p.total;
  }
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : null };
}

// Past days are locked - only today's log can ever be written to. Toggles
// any leaf id: a plain step's own id, or one of its sub-step ids.
export function toggleStepDone(
  data: WorkShutdownData,
  leafId: string,
  now: Date = new Date()
): WorkShutdownData {
  const today = dateKey(now);
  const current = data.days[today] ?? [];
  const next = current.includes(leafId)
    ? current.filter((id) => id !== leafId)
    : [...current, leafId];
  return { ...data, days: { ...data.days, [today]: next } };
}
