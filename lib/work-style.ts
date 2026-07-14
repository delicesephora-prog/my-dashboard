import { WorkTask, WorkTaskPriority, WorkTaskStatus } from "./types";

export const STATUS_COLORS: Record<WorkTaskStatus, string> = {
  urgent: "#B5574A",
  in_progress: "#6E5C4B",
  waiting: "#C7A46B",
  completed: "#8FA37E",
};

export const STATUS_LABELS: Record<WorkTaskStatus, string> = {
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
