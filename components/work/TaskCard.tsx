"use client";

import { useState } from "react";
import { WorkTask, WORK_TASK_CATEGORIES, WORK_TASK_PRIORITIES, WORK_TASK_STATUSES } from "@/lib/types";
import { todayKey } from "@/lib/date";
import {
  PRIORITY_COLORS,
  STATUS_COLORS,
  advanceTaskOnCheck,
  isOverdue,
  isStalled,
  logTaskProgress,
  snoozeStall,
} from "@/lib/work-style";
import CheckCircle from "../CheckCircle";

const QUICK_PCTS = [25, 50, 75] as const;

function formatLogDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TaskCard({
  task,
  onUpdate,
  onDelete,
  canPinMore,
}: {
  task: WorkTask;
  onUpdate: (updater: (t: WorkTask) => WorkTask) => void;
  onDelete: () => void;
  canPinMore: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const today = todayKey();
  const overdue = isOverdue(task.dueDate, today, task.status);
  const stalled = isStalled(task);

  function handleCheck() {
    onUpdate((t) => advanceTaskOnCheck(t));
  }

  const showProgressBar = task.progressPct > 0 && task.status !== "completed";

  return (
    <div className="overflow-hidden rounded-xl border border-paper-border bg-paper-surface shadow-paper">
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <CheckCircle
          done={task.status === "completed"}
          onToggle={handleCheck}
          accentClass="bg-work"
          size="sm"
          ariaLabel={
            task.status === "completed"
              ? "Mark not done"
              : task.progressPct >= 100
                ? "Confirm completed"
                : "Mark progress"
          }
        />

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span
            className={`min-w-0 flex-1 truncate text-[14.5px] ${
              task.status === "completed" ? "text-paper-faint line-through" : "text-paper-ink"
            }`}
          >
            {task.title}
          </span>
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
            aria-hidden
          />
          {stalled && (
            <span
              className="shrink-0 rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-medium text-gold"
              title="Hasn't been worked on in a few days"
            >
              been a minute
            </span>
          )}
          {task.dueDate && (
            <span
              className={`shrink-0 text-[11px] ${overdue ? "font-medium text-[#B5574A]" : "text-paper-muted"}`}
            >
              {formatShortDate(task.dueDate)}
            </span>
          )}
        </button>
      </div>

      {showProgressBar && (
        <div className="px-3.5 pb-2.5 pl-[42px]">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-surface2">
            <div
              className="h-full rounded-full bg-work transition-all"
              style={{ width: `${task.progressPct}%` }}
            />
          </div>
          <p className="mt-1 text-[10.5px] text-paper-muted">
            {task.progressPct >= 100 ? "At 100% — tap the checkbox to confirm complete" : `${task.progressPct}% worked on`}
          </p>
        </div>
      )}

      {expanded && (
        <div className="animate-fade-in space-y-3 border-t border-paper-border px-3.5 py-3">
          <div>
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Status
            </p>
            <div className="flex flex-wrap gap-1.5">
              {WORK_TASK_STATUSES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onUpdate((t) => ({ ...t, status: s.key }))}
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium transition"
                  style={
                    task.status === s.key
                      ? { backgroundColor: STATUS_COLORS[s.key], color: "#FBF5EA" }
                      : { border: "1px solid #E7DFCF", color: "#948A79" }
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Priority
            </p>
            <div className="flex gap-1.5">
              {WORK_TASK_PRIORITIES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => onUpdate((t) => ({ ...t, priority: p.key }))}
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium transition"
                  style={
                    task.priority === p.key
                      ? { backgroundColor: PRIORITY_COLORS[p.key], color: "#FBF5EA" }
                      : { border: "1px solid #E7DFCF", color: "#948A79" }
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Progress
            </p>
            <div className="flex items-center gap-1.5">
              {QUICK_PCTS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onUpdate((t) => logTaskProgress(t, pct))}
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium transition"
                  style={
                    task.progressPct === pct
                      ? { backgroundColor: STATUS_COLORS.started, color: "#FBF5EA" }
                      : { border: "1px solid #E7DFCF", color: "#948A79" }
                  }
                >
                  {pct}%
                </button>
              ))}
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={task.progressPct}
                onChange={(e) => onUpdate((t) => logTaskProgress(t, Number(e.target.value)))}
                className="ml-1 h-1.5 flex-1 accent-work"
                aria-label="Progress percentage"
              />
              <span className="w-9 shrink-0 text-right text-[11px] text-paper-muted">{task.progressPct}%</span>
            </div>
            {task.progressLog.length > 0 && (
              <ul className="mt-2 flex flex-col gap-0.5">
                {task.progressLog.slice(0, 6).map((entry) => (
                  <li key={entry.date} className="flex items-center justify-between text-[11px] text-paper-muted">
                    <span>{formatLogDate(entry.date)}</span>
                    <span>{entry.pct}%</span>
                  </li>
                ))}
              </ul>
            )}
            {stalled && (
              <button
                type="button"
                onClick={() => onUpdate((t) => snoozeStall(t))}
                className="mt-2 text-[11px] text-gold underline underline-offset-2"
              >
                Snooze this nudge for a week
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Category
              </p>
              <select
                value={task.category}
                onChange={(e) =>
                  onUpdate((t) => ({ ...t, category: e.target.value as WorkTask["category"] }))
                }
                className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
              >
                {WORK_TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-[130px]">
              <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Due Date
              </p>
              <input
                type="date"
                value={task.dueDate}
                onChange={(e) => onUpdate((t) => ({ ...t, dueDate: e.target.value }))}
                className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Notes
            </p>
            <textarea
              value={task.notes}
              onChange={(e) => onUpdate((t) => ({ ...t, notes: e.target.value }))}
              placeholder="Add a note…"
              rows={2}
              className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 p-2 text-[13px] text-paper-ink outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => onUpdate((t) => ({ ...t, topPriority: !t.topPriority }))}
              disabled={!task.topPriority && !canPinMore}
              className="flex items-center gap-1.5 text-xs text-paper-muted disabled:opacity-40"
            >
              <span className={task.topPriority ? "text-work" : "text-paper-faint"}>
                {task.topPriority ? "★" : "☆"}
              </span>
              {task.topPriority ? "Top priority" : "Pin as top priority"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-paper-faint underline underline-offset-2"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
