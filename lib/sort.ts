import { TaskItem } from "./types";

// Focus tasks first, then open tasks, then completed tasks at the bottom -
// keeps the most actionable items glanceable at the top.
export function sortTasks(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.focus !== b.focus) return a.focus ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}
