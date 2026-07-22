import { WorkTask, WorkTaskPriority, WorkTaskStatus } from "./types";
import { todayKey } from "./date";

export const STATUS_COLORS: Record<WorkTaskStatus, string> = {
  not_started: "#A9A296",
  started: "#6B6E9B",
  urgent: "#B5574A",
  in_progress: "#6E5C4B",
  waiting: "#C7A46B",
  completed: "#8FA37E",
};

export const STATUS_LABELS: Record<WorkTaskStatus, string> = {
  not_started: "Not Started",
  started: "Started",
  urgent: "Urgent",
  in_progress: "In Progress",
  waiting: "Waiting",
  completed: "Completed",
};

export const PRIORITY_COLORS: Record<WorkTaskPriority, string> = {
  high: "#B5574A",
  medium: "#C7A46B",
  low: "#8FA37E",
};

export function isOverdue(dueDate: string, todayKey: string, status: WorkTaskStatus): boolean {
  return Boolean(dueDate) && dueDate < todayKey && status !== "completed";
}

export type SnapshotFilter = "high" | "overdue" | "waiting" | "upcoming";

// Upserts today's entry in the progress log rather than duplicating it -
// checking in twice in one day just corrects that day's number.
export function logTaskProgress(task: WorkTask, pct: number, now: Date = new Date()): WorkTask {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const key = todayKey(now);
  const rest = task.progressLog.filter((e) => e.date !== key);
  return { ...task, progressPct: clamped, progressLog: [{ date: key, pct: clamped }, ...rest] };
}

// The card's main checkbox: below 100% it just advances progress by 25%
// (logged as today's check-in) instead of closing the task out. Once
// already at 100%, the next tap is the confirm step that actually marks it
// completed. Unchecking a completed task reverts it to in progress.
export function advanceTaskOnCheck(task: WorkTask, now: Date = new Date()): WorkTask {
  if (task.status === "completed") {
    return { ...task, status: "in_progress" };
  }
  if (task.progressPct >= 100) {
    return { ...task, status: "completed", progressPct: 100 };
  }
  return logTaskProgress(task, task.progressPct + 25, now);
}

const PRIORITY_RANK: Record<WorkTaskPriority, number> = { high: 0, medium: 1, low: 2 };

export function sortWorkTasks(tasks: WorkTask[]): WorkTask[] {
  return [...tasks].sort((a, b) => {
    const aDone = a.status === "completed";
    const bDone = b.status === "completed";
    if (aDone !== bDone) return aDone ? 1 : -1;
    const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (byPriority !== 0) return byPriority;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}
