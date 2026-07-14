"use client";

import { WorkTask } from "@/lib/types";
import { todayKey } from "@/lib/date";
import { weekKeyFor, isDateInWeek } from "@/lib/week";
import { SnapshotFilter, isOverdue } from "@/lib/work-style";

export default function SnapshotStrip({
  tasks,
  activeFilter,
  onSelectFilter,
}: {
  tasks: WorkTask[];
  activeFilter: SnapshotFilter | null;
  onSelectFilter: (filter: SnapshotFilter) => void;
}) {
  const today = todayKey();
  const weekKey = weekKeyFor(new Date());

  const counts: { key: SnapshotFilter; label: string; count: number }[] = [
    {
      key: "high",
      label: "High Priority",
      count: tasks.filter((t) => t.priority === "high" && t.status !== "completed").length,
    },
    {
      key: "overdue",
      label: "Overdue",
      count: tasks.filter((t) => isOverdue(t.dueDate, today, t.status)).length,
    },
    {
      key: "waiting",
      label: "Waiting On",
      count: tasks.filter((t) => t.status === "waiting").length,
    },
    {
      key: "upcoming",
      label: "Due This Week",
      count: tasks.filter(
        (t) => t.dueDate && isDateInWeek(t.dueDate, weekKey) && t.status !== "completed"
      ).length,
    },
  ];

  return (
    <div className="mb-3">
      <p className="mb-1.5 px-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        Today&apos;s Snapshot
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {counts.map((c) => {
          const active = activeFilter === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onSelectFilter(c.key)}
              className={`rounded-xl border px-1.5 py-2 text-center transition ${
                active
                  ? "border-work bg-work text-paper-surface"
                  : "border-paper-border bg-paper-surface text-paper-ink"
              }`}
            >
              <div className="font-serif text-lg leading-none">{c.count}</div>
              <div
                className={`mt-1 text-[9.5px] leading-tight ${
                  active ? "text-paper-surface/80" : "text-paper-muted"
                }`}
              >
                {c.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
