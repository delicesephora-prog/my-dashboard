"use client";

import { TaskItem } from "@/lib/types";
import CheckCircle from "./CheckCircle";

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
          <div
            key={task.id}
            className={`flex items-center gap-3 rounded-xl2 border-l-4 bg-paper-surface px-4 py-2.5 shadow-paper transition ${accentBorder}`}
          >
            <CheckCircle
              done={task.done}
              onToggle={() => onToggleDone(task.id)}
              accentClass={dot}
              ariaLabel={task.done ? "Mark not done" : "Mark done"}
            />
            <button
              type="button"
              onClick={() => onToggleDone(task.id)}
              className={`flex-1 text-left font-serif text-[1.02rem] active:opacity-70 ${
                task.done ? "text-paper-faint line-through" : "text-paper-ink"
              }`}
            >
              {task.text}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
