"use client";

import { TaskItem } from "@/lib/types";
import { sortTasks } from "@/lib/sort";
import CheckCircle from "./CheckCircle";

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
      <div className="flex flex-1 items-center justify-center text-center font-serif text-[0.95rem] italic text-paper-muted">
        Nothing here yet. Add your first task above.
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-xl2 border border-paper-border bg-paper-surface shadow-paper">
      <ul className="scroll-quiet h-full divide-y divide-paper-border overflow-y-auto">
        {sorted.map((task) => (
          <li
            key={task.id}
            className="flex animate-pop-in items-center gap-3 px-4 py-3"
          >
            <CheckCircle
              done={task.done}
              onToggle={() => onToggleDone(task.id)}
              accentClass={dot}
              size="sm"
              ariaLabel={task.done ? "Mark not done" : "Mark done"}
            />

            <span
              className={`min-w-0 flex-1 truncate text-[15px] ${
                task.done ? "text-paper-faint line-through" : "text-paper-ink"
              }`}
            >
              {task.text}
            </span>

            <button
              aria-label={task.focus ? "Remove from today's focus" : "Pin to today's focus"}
              onClick={() => onToggleFocus(task.id)}
              className={`shrink-0 px-1 text-lg leading-none ${
                task.focus ? star : "text-paper-faint"
              }`}
            >
              {task.focus ? "★" : "☆"}
            </button>

            <button
              aria-label="Delete task"
              onClick={() => onRemove(task.id)}
              className="shrink-0 px-1 text-base leading-none text-paper-faint"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
