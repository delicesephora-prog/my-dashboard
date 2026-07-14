"use client";

import { useState } from "react";
import { WorkTask, WORK_TASK_STATUSES } from "@/lib/types";
import { todayKey } from "@/lib/date";
import { weekKeyFor, isDateInWeek } from "@/lib/week";
import { SnapshotFilter, isOverdue, sortWorkTasks, STATUS_COLORS } from "@/lib/work-style";
import TaskCard from "./TaskCard";

type ViewKind = "list" | "kanban" | "myweek";

const VIEWS: { key: ViewKind; label: string }[] = [
  { key: "list", label: "List" },
  { key: "kanban", label: "By Status" },
  { key: "myweek", label: "My Week" },
];

function matchesFilter(task: WorkTask, filter: SnapshotFilter | null, today: string, weekKey: string): boolean {
  if (!filter) return true;
  if (filter === "high") return task.priority === "high" && task.status !== "completed";
  if (filter === "overdue") return isOverdue(task.dueDate, today, task.status);
  if (filter === "waiting") return task.status === "waiting";
  if (filter === "upcoming") {
    return Boolean(task.dueDate) && isDateInWeek(task.dueDate, weekKey) && task.status !== "completed";
  }
  return true;
}

export default function TaskManager({
  tasks,
  filter,
  onClearFilter,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  topPriorityCount,
}: {
  tasks: WorkTask[];
  filter: SnapshotFilter | null;
  onClearFilter: () => void;
  onAddTask: (title: string) => void;
  onUpdateTask: (id: string, updater: (t: WorkTask) => WorkTask) => void;
  onDeleteTask: (id: string) => void;
  topPriorityCount: number;
}) {
  const [view, setView] = useState<ViewKind>("list");
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const today = todayKey();
  const weekKey = weekKeyFor(new Date());

  const filtered = tasks.filter((t) => matchesFilter(t, filter, today, weekKey));

  function submitAdd() {
    if (!newTitle.trim()) return;
    onAddTask(newTitle);
    setNewTitle("");
  }

  function renderCard(task: WorkTask) {
    return (
      <TaskCard
        key={task.id}
        task={task}
        onUpdate={(updater) => onUpdateTask(task.id, updater)}
        onDelete={() => onDeleteTask(task.id)}
        canPinMore={task.topPriority || topPriorityCount < 3}
      />
    );
  }

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Task Manager
        </p>
        {filter && (
          <button
            type="button"
            onClick={onClearFilter}
            className="rounded-full bg-work/10 px-2.5 py-1 text-[11px] font-medium text-work"
          >
            Filtered · Clear
          </button>
        )}
      </div>

      <div className="mb-3 flex gap-1.5">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setView(v.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              view === v.key
                ? "bg-work text-paper-surface"
                : "border border-paper-border bg-paper-surface2 text-paper-muted"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitAdd();
          }}
          placeholder="Add a task…"
          className="flex-1 rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[15px] text-paper-ink outline-none transition-colors focus:border-work"
        />
        <button
          onClick={submitAdd}
          aria-label="Add task"
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-work text-xl font-light text-paper-surface transition active:scale-90"
        >
          +
        </button>
      </div>

      {view === "list" && (
        <ListView
          tasks={filtered}
          showCompleted={showCompleted}
          onToggleShowCompleted={() => setShowCompleted((v) => !v)}
          renderCard={renderCard}
        />
      )}
      {view === "kanban" && <KanbanView tasks={filtered} renderCard={renderCard} />}
      {view === "myweek" && (
        <MyWeekView tasks={filtered} weekKey={weekKey} renderCard={renderCard} />
      )}
    </div>
  );
}

function ListView({
  tasks,
  showCompleted,
  onToggleShowCompleted,
  renderCard,
}: {
  tasks: WorkTask[];
  showCompleted: boolean;
  onToggleShowCompleted: () => void;
  renderCard: (t: WorkTask) => React.ReactNode;
}) {
  const sorted = sortWorkTasks(tasks);
  const open = sorted.filter((t) => t.status !== "completed");
  const completed = sorted.filter((t) => t.status === "completed");

  if (sorted.length === 0) {
    return (
      <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
        No tasks match here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {open.map(renderCard)}
      {completed.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onToggleShowCompleted}
            className="text-xs text-paper-muted underline underline-offset-2"
          >
            {showCompleted ? "Hide" : "Show"} completed ({completed.length})
          </button>
          {showCompleted && (
            <div className="mt-2 flex flex-col gap-2">{completed.map(renderCard)}</div>
          )}
        </div>
      )}
    </div>
  );
}

function KanbanView({
  tasks,
  renderCard,
}: {
  tasks: WorkTask[];
  renderCard: (t: WorkTask) => React.ReactNode;
}) {
  return (
    <div className="scroll-quiet -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
      {WORK_TASK_STATUSES.map((s) => {
        const columnTasks = sortWorkTasks(tasks.filter((t) => t.status === s.key));
        return (
          <div
            key={s.key}
            className="w-[82%] shrink-0 snap-start rounded-xl border border-paper-border bg-paper-surface2 p-2.5"
          >
            <div className="mb-2 flex items-center gap-1.5 px-0.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[s.key] }}
                aria-hidden
              />
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                {s.label} ({columnTasks.length})
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {columnTasks.length === 0 ? (
                <p className="py-2 text-center text-xs italic text-paper-faint">Empty</p>
              ) : (
                columnTasks.map(renderCard)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MyWeekView({
  tasks,
  weekKey,
  renderCard,
}: {
  tasks: WorkTask[];
  weekKey: string;
  renderCard: (t: WorkTask) => React.ReactNode;
}) {
  const weekTasks = sortWorkTasks(
    tasks.filter((t) => t.dueDate && isDateInWeek(t.dueDate, weekKey))
  );

  if (weekTasks.length === 0) {
    return (
      <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
        Nothing due this week.
      </p>
    );
  }

  return <div className="flex flex-col gap-2">{weekTasks.map(renderCard)}</div>;
}
