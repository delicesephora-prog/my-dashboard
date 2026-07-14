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
  const accentBorder = world === "work" ? "border-work" : "border-life";
  const dot = world === "work" ? "bg-work" : "bg-life";

  if (focusTasks.length === 0) {
    return (
      <div className="mb-3 rounded-xl2 border border-dashed border-paper-border px-4 py-2.5 text-center text-sm text-paper-muted">
        Tap the pin on a task below to set up to 3 as today&apos;s focus
      </div>
    );
  }

  return (
    <div className="mb-3">
      <p className="mb-1.5 px-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        Today&apos;s Focus
      </p>
      <div className="flex flex-col gap-1.5">
        {focusTasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onToggleDone(task.id)}
            className={`flex items-center gap-3 rounded-xl2 border-l-4 bg-paper-surface px-4 py-2.5 text-left shadow-paper transition active:scale-[0.99] ${accentBorder}`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                task.done ? `${dot} border-transparent` : "border-paper-faint"
              }`}
            >
              {task.done && (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-paper-surface" fill="none">
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
              className={`font-serif text-[1.02rem] ${
                task.done ? "text-paper-faint line-through" : "text-paper-ink"
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
