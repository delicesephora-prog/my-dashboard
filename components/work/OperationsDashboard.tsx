"use client";

import { useState } from "react";
import { WorkOps, WorkTask } from "@/lib/types";
import { SnapshotFilter } from "@/lib/work-style";
import TopPriorities from "./TopPriorities";
import SnapshotStrip from "./SnapshotStrip";
import TaskManager from "./TaskManager";

export default function OperationsDashboard({
  workOps,
  onChange,
}: {
  workOps: WorkOps;
  onChange: (updater: (wo: WorkOps) => WorkOps) => void;
}) {
  const [filter, setFilter] = useState<SnapshotFilter | null>(null);

  function addTask(title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;
    const task: WorkTask = {
      id: crypto.randomUUID(),
      title: trimmed,
      status: "not_started",
      priority: "medium",
      category: "Administration",
      dueDate: "",
      notes: "",
      topPriority: false,
      createdAt: new Date().toISOString(),
      progressPct: 0,
      progressLog: [],
    };
    onChange((wo) => ({ ...wo, tasks: [task, ...wo.tasks] }));
  }

  function updateTask(id: string, updater: (t: WorkTask) => WorkTask) {
    onChange((wo) => ({
      ...wo,
      tasks: wo.tasks.map((t) => {
        if (t.id !== id) return t;
        const next = updater(t);
        // Cap top-priority pins at 3.
        if (next.topPriority && !t.topPriority) {
          const pinnedCount = wo.tasks.filter((x) => x.topPriority).length;
          if (pinnedCount >= 3) return t;
        }
        return next;
      }),
    }));
  }

  function deleteTask(id: string) {
    onChange((wo) => ({ ...wo, tasks: wo.tasks.filter((t) => t.id !== id) }));
  }

  const topPriorityTasks = workOps.tasks.filter((t) => t.topPriority);

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <TopPriorities tasks={topPriorityTasks} onUpdate={updateTask} />

      <SnapshotStrip
        tasks={workOps.tasks}
        activeFilter={filter}
        onSelectFilter={(f) => setFilter((cur) => (cur === f ? null : f))}
      />

      <TaskManager
        tasks={workOps.tasks}
        filter={filter}
        onClearFilter={() => setFilter(null)}
        onAddTask={addTask}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
        topPriorityCount={topPriorityTasks.length}
      />
    </div>
  );
}
