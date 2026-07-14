"use client";

import { WorkTask, WORK_TASK_STATUSES } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/work-style";
import CheckCircle from "../CheckCircle";

export default function TopPriorities({
  tasks,
  onUpdate,
}: {
  tasks: WorkTask[];
  onUpdate: (id: string, updater: (t: WorkTask) => WorkTask) => void;
}) {
  const slots: (WorkTask | null)[] = [tasks[0] ?? null, tasks[1] ?? null, tasks[2] ?? null];

  return (
    <div className="mb-3">
      <p className="mb-1.5 px-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        Top Priorities
      </p>
      <div className="flex flex-col gap-2">
        {slots.map((task, i) =>
          task ? (
            <PriorityCard key={task.id} task={task} onUpdate={(u) => onUpdate(task.id, u)} />
          ) : (
            <div
              key={`empty-${i}`}
              className="rounded-xl2 border border-dashed border-paper-border px-4 py-3 text-center text-xs text-paper-muted"
            >
              Pin a task below as a top priority
            </div>
          )
        )}
      </div>
    </div>
  );
}

function PriorityCard({
  task,
  onUpdate,
}: {
  task: WorkTask;
  onUpdate: (updater: (t: WorkTask) => WorkTask) => void;
}) {
  function toggleCompleted() {
    onUpdate((t) => ({ ...t, status: t.status === "completed" ? "in_progress" : "completed" }));
  }

  return (
    <div className="rounded-xl2 border-l-4 border-work bg-paper-surface p-3.5 shadow-paper">
      <div className="mb-2 flex items-center gap-2.5">
        <CheckCircle
          done={task.status === "completed"}
          onToggle={toggleCompleted}
          accentClass="bg-work"
          ariaLabel={task.status === "completed" ? "Mark not done" : "Mark done"}
        />
        <span
          className={`flex-1 font-serif text-[1.02rem] ${
            task.status === "completed" ? "text-paper-faint line-through" : "text-paper-ink"
          }`}
        >
          {task.title}
        </span>
        <button
          type="button"
          onClick={() => onUpdate((t) => ({ ...t, topPriority: false }))}
          aria-label="Unpin from top priorities"
          className="text-work"
        >
          ★
        </button>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <select
          value={task.status}
          onChange={(e) =>
            onUpdate((t) => ({ ...t, status: e.target.value as WorkTask["status"] }))
          }
          className="rounded-full px-2.5 py-1 text-[11px] font-medium outline-none"
          style={{ backgroundColor: STATUS_COLORS[task.status], color: "#FBF5EA" }}
        >
          {WORK_TASK_STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={task.dueDate}
          onChange={(e) => onUpdate((t) => ({ ...t, dueDate: e.target.value }))}
          className="rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1 text-[12px] text-paper-ink outline-none"
        />
      </div>

      <textarea
        value={task.notes}
        onChange={(e) => onUpdate((t) => ({ ...t, notes: e.target.value }))}
        placeholder="Notes…"
        rows={1}
        className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 p-2 text-[13px] text-paper-ink outline-none"
      />
    </div>
  );
}
