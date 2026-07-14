"use client";

import { TaskItem } from "@/lib/types";

type World = "work" | "life";

export default function FocusStrip({
  world,
  tasks,
  onToggleDone,
}: {
  world: World;
  tasks: TaskItem[];
  onToggleDone: (id: string) => void;
}) {
  const focusTasks = tasks.filter((t) => t.focus);
  const accent = world === "work" ? "border-work" : "border-life";
  const dot = world === "work" ? "bg-work" : "bg-life";

  if (focusTasks.length === 0) {
    return (
      <div className="mb-4 rounded-xl2 border border-dashed border-base-border px-4 py-3 text-center text-sm text-base-muted">
        Tap the ☆ on a task below to pin up to 3 as today&apos;s focus
      </div>
    );
  }

  return (
    <div className="mb-4">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-base-muted">
        Today&apos;s focus
      </p>
      <div className="flex flex-col gap-2">
        {focusTasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onToggleDone(task.id)}
            className={`flex items-center gap-3 rounded-xl2 border-2 bg-base-surface px-4 py-3.5 text-left shadow-sm transition active:scale-[0.98] ${accent}`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
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
            </span>
            <span
              className={`text-[15px] font-medium ${
                task.done ? "text-base-muted line-through" : "text-base-ink"
              }`}
            >
              {task.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
