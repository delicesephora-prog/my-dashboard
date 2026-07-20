"use client";

import { useState } from "react";
import { WeekTask } from "@/lib/types";
import CheckCircle from "./CheckCircle";

function sortWeekTasks(tasks: WeekTask[]): WeekTask[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export default function WeekChecklist({
  tasks,
  onAdd,
  onToggle,
  onToggleFocus,
  onRemove,
}: {
  tasks: WeekTask[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onToggleFocus: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const sorted = sortWeekTasks(tasks);

  function submit() {
    if (!text.trim()) return;
    onAdd(text);
    setText("");
  }

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        This Week&apos;s Checklist
      </p>

      <div className="mb-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Add something for the week…"
          className="flex-1 rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[15px] text-paper-ink outline-none transition-colors focus:border-life"
        />
        <button
          onClick={submit}
          aria-label="Add task"
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-life text-xl font-light text-paper-surface transition active:scale-90"
        >
          +
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="py-3 text-center font-serif text-[0.9rem] italic text-paper-muted">
          Nothing on the list yet.
        </p>
      ) : (
        <ul className="divide-y divide-paper-border">
          {sorted.map((task) => (
            <li key={task.id} className="flex animate-pop-in items-center gap-3 py-2.5">
              <CheckCircle
                done={task.done}
                onToggle={() => onToggle(task.id)}
                accentClass="bg-life"
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
                type="button"
                aria-label={task.focus ? "Unpin from Today's Focus" : "Pin to Today's Focus"}
                onClick={() => onToggleFocus(task.id)}
                className={`shrink-0 text-base leading-none ${
                  task.focus ? "text-gold" : "text-paper-faint"
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
      )}
    </div>
  );
}
