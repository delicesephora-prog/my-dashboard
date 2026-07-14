"use client";

import { TaskItem } from "@/lib/types";
import { sortTasks } from "@/lib/sort";

type World = "work" | "life";

export default function TaskList({
  world,
  tasks,
  onToggleDone,
  onToggleFocus,
  onRemove,
}: {
  world: World;
  tasks: TaskItem[];
  onToggleDone: (id: string) => void;
  onToggleFocus: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const sorted = sortTasks(tasks);
  const dot = world === "work" ? "bg-work" : "bg-life";
  const star = world === "work" ? "text-work" : "text-life";

  if (sorted.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-center text-sm text-base-muted">
        Nothing here yet. Add your first task above.
      </div>
    );
  }

  return (
    <ul className="scroll-quiet -mx-1 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-1 pb-2">
      {sorted.map((task) => (
        <li
          key={task.id}
          className="flex animate-pop-in items-center gap-3 rounded-xl border border-base-border bg-base-surface px-3 py-2.5"
        >
          <button
            aria-label={task.done ? "Mark not done" : "Mark done"}
            onClick={() => onToggleDone(task.id)}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition active:animate-check-pulse ${
              task.done ? `${dot} border-transparent` : "border-base-border"
            }`}
          >
            {task.done && (
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          <span
            className={`min-w-0 flex-1 truncate text-[15px] ${
              task.done ? "text-base-muted line-through" : "text-base-ink"
            }`}
          >
            {task.text}
          </span>

          <button
            aria-label={task.focus ? "Remove from today's focus" : "Pin to today's focus"}
            onClick={() => onToggleFocus(task.id)}
            className={`shrink-0 px-1 text-lg ${task.focus ? star : "text-base-border"}`}
          >
            {task.focus ? "★" : "☆"}
          </button>

          <button
            aria-label="Delete task"
            onClick={() => onRemove(task.id)}
            className="shrink-0 px-1 text-base text-base-border"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
