import { dateKey } from "./date";

export type ShutdownStep = {
  id: string;
  text: string;
  order: number;
};

export type WorkShutdownData = {
  steps: ShutdownStep[];
  // Keyed by YYYY-MM-DD -> completed step ids.
  days: Record<string, string[]>;
  seedVersion: number;
};

// Bump whenever the seed content below changes and existing saved data
// should be replaced rather than left alone - see the migration in
// normalizeWorkShutdownData.
export const WORK_SHUTDOWN_SEED_VERSION = 1;

function step(text: string): Omit<ShutdownStep, "id" | "order"> {
  return { text };
}

function seedSteps(): ShutdownStep[] {
  return [
    step("Inbox triaged to zero (or flagged for tomorrow)"),
    step("Task statuses updated"),
    step("Any new asks logged in Waiting On"),
    step("Tomorrow's calendar checked"),
    step("Tomorrow's top 3 written down"),
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

export function completionForDate(
  data: WorkShutdownData,
  d: Date
): { done: number; total: number; pct: number | null } {
  const doneIds = new Set(data.days[dateKey(d)] ?? []);
  const done = data.steps.filter((s) => doneIds.has(s.id)).length;
  const total = data.steps.length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : null };
}

// Past days are locked - only today's log can ever be written to.
export function toggleStepDone(
  data: WorkShutdownData,
  stepId: string,
  now: Date = new Date()
): WorkShutdownData {
  const today = dateKey(now);
  const current = data.days[today] ?? [];
  const next = current.includes(stepId)
    ? current.filter((id) => id !== stepId)
    : [...current, stepId];
  return { ...data, days: { ...data.days, [today]: next } };
}
