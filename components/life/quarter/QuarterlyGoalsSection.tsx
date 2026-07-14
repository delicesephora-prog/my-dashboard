"use client";

import { useState } from "react";
import { GOAL_CATEGORIES, GoalCategory, QuarterGoal } from "@/lib/types";
import CheckCircle from "../../CheckCircle";

export default function QuarterlyGoalsSection({
  goals,
  onChange,
  title = "Quarterly Goals",
}: {
  goals: QuarterGoal[];
  onChange: (updater: (goals: QuarterGoal[]) => QuarterGoal[]) => void;
  title?: string;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        {title}
      </p>
      <div className="flex flex-col gap-3">
        {GOAL_CATEGORIES.map((category) => (
          <CategorySection
            key={category}
            category={category}
            goals={goals.filter((g) => g.category === category)}
            isCollapsed={Boolean(collapsed[category])}
            onToggleCollapsed={() =>
              setCollapsed((c) => ({ ...c, [category]: !c[category] }))
            }
            onAdd={(text) =>
              onChange((gs) => [
                ...gs,
                { id: crypto.randomUUID(), category, text, done: false },
              ])
            }
            onToggle={(id) =>
              onChange((gs) => gs.map((g) => (g.id === id ? { ...g, done: !g.done } : g)))
            }
            onDelete={(id) => onChange((gs) => gs.filter((g) => g.id !== id))}
          />
        ))}
      </div>
    </div>
  );
}

function CategorySection({
  category,
  goals,
  isCollapsed,
  onToggleCollapsed,
  onAdd,
  onToggle,
  onDelete,
}: {
  category: GoalCategory;
  goals: QuarterGoal[];
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const doneCount = goals.filter((g) => g.done).length;

  function submit() {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
  }

  return (
    <div className="rounded-xl border border-paper-border bg-paper-surface2">
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="flex w-full items-center justify-between px-3 py-2.5"
      >
        <span className="text-[13.5px] font-medium text-paper-ink">{category}</span>
        <span className="flex items-center gap-2 text-[11px] text-paper-muted">
          {goals.length > 0 && (
            <span>
              {doneCount}/{goals.length}
            </span>
          )}
          <span className={`transition-transform ${isCollapsed ? "" : "rotate-90"}`}>›</span>
        </span>
      </button>

      {!isCollapsed && (
        <div className="animate-fade-in space-y-1.5 border-t border-paper-border px-3 py-2.5">
          {goals.map((goal) => (
            <div key={goal.id} className="flex items-center gap-2">
              <CheckCircle
                done={goal.done}
                onToggle={() => onToggle(goal.id)}
                accentClass="bg-life"
                size="sm"
                ariaLabel={goal.done ? "Mark not done" : "Mark done"}
              />
              <span
                className={`min-w-0 flex-1 text-[13.5px] ${
                  goal.done ? "text-paper-faint line-through" : "text-paper-ink"
                }`}
              >
                {goal.text}
              </span>
              <button
                type="button"
                aria-label="Delete goal"
                onClick={() => onDelete(goal.id)}
                className="shrink-0 text-paper-faint"
              >
                ×
              </button>
            </div>
          ))}
          <div className="flex gap-1.5 pt-1">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder={`Add a ${category.toLowerCase()} goal…`}
              className="flex-1 rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
            />
            <button
              type="button"
              onClick={submit}
              className="rounded-lg bg-life px-2.5 text-sm text-paper-surface"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
