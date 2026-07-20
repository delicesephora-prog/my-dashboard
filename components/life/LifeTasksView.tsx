"use client";

import { useState } from "react";
import { TaskItem, WorldData } from "@/lib/types";
import CheckCircle from "../CheckCircle";

function sortTasks(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export default function LifeTasksView({
  world,
  onChange,
}: {
  world: WorldData;
  onChange: (updater: (w: WorldData) => WorldData) => void;
}) {
  const [text, setText] = useState("");
  const sorted = sortTasks(world.tasks);

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const task: TaskItem = {
      id: crypto.randomUUID(),
      text: trimmed,
      done: false,
      focus: false,
      createdAt: new Date().toISOString(),
    };
    onChange((w) => ({ ...w, tasks: [task, ...w.tasks] }));
    setText("");
  }

  function toggleDone(id: string) {
    onChange((w) => ({ ...w, tasks: w.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
  }

  function toggleFocus(id: string) {
    onChange((w) => {
      const pinnedCount = w.tasks.filter((t) => t.focus).length;
      return {
        ...w,
        tasks: w.tasks.map((t) => {
          if (t.id !== id) return t;
          if (!t.focus && pinnedCount >= 3) return t;
          return { ...t, focus: !t.focus };
        }),
      };
    });
  }

  function remove(id: string) {
    onChange((w) => ({ ...w, tasks: w.tasks.filter((t) => t.id !== id) }));
  }

  function setNotes(notes: string) {
    onChange((w) => ({ ...w, notes }));
  }

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="mb-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">Life</p>
        <p className="font-serif text-[1.05rem] text-paper-ink">Tasks</p>
      </div>

      <div className="mb-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Add a task…"
          className="min-w-0 flex-1 rounded-xl2 border border-paper-border bg-paper-surface px-3.5 py-3 text-[15px] text-paper-ink outline-none transition-colors focus:border-work"
        />
        <button
          type="button"
          onClick={submit}
          aria-label="Add task"
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl2 bg-work text-xl font-light text-paper-surface transition active:scale-90"
        >
          +
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="py-6 text-center font-serif text-[0.9rem] italic text-paper-muted">
          Nothing here yet. Add your first task above.
        </p>
      ) : (
        <ul className="mb-3 flex flex-col gap-2">
          {sorted.map((task) => (
            <li
              key={task.id}
              className={`flex animate-pop-in items-center gap-2.5 rounded-xl2 border bg-paper-surface px-3.5 py-3 shadow-paper ${
                task.focus ? "border-l-4 border-l-gold border-paper-border" : "border-paper-border"
              }`}
            >
              <CheckCircle
                done={task.done}
                onToggle={() => toggleDone(task.id)}
                accentClass="bg-work"
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
                onClick={() => toggleFocus(task.id)}
                className={`shrink-0 text-base leading-none ${task.focus ? "text-gold" : "text-paper-faint"}`}
              >
                {task.focus ? "★" : "☆"}
              </button>
              <button
                type="button"
                aria-label="Delete task"
                onClick={() => remove(task.id)}
                className="shrink-0 px-1 text-base leading-none text-paper-faint"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
          Notes
        </p>
        <textarea
          value={world.notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything else…"
          rows={4}
          className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-paper-ink outline-none placeholder:text-paper-faint"
        />
      </div>
    </div>
  );
}
