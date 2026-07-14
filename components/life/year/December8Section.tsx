"use client";

import { useState } from "react";
import {
  TRANSFORMATION_CATEGORIES,
  TransformationCategoryKey,
  TransformationGoal,
} from "@/lib/types";
import CheckCircle from "../../CheckCircle";

const CATEGORY_COLORS: Record<TransformationCategoryKey, string> = {
  Fitness: "#C1815F",
  Finances: "#C7A46B",
  Faith: "#8FA37E",
  Style: "#9B7B94",
  Career: "#6E5C4B",
};

function daysUntilDecember8(): number {
  const now = new Date();
  const year = now.getFullYear();
  let target = new Date(year, 11, 8);
  target.setHours(0, 0, 0, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (target < today) {
    target = new Date(year + 1, 11, 8);
  }
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export default function December8Section({
  transformations,
  onChange,
}: {
  transformations: Record<TransformationCategoryKey, TransformationGoal[]>;
  onChange: (
    updater: (t: Record<TransformationCategoryKey, TransformationGoal[]>) => Record<
      TransformationCategoryKey,
      TransformationGoal[]
    >
  ) => void;
}) {
  const days = daysUntilDecember8();

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl2 border border-life bg-paper-surface p-5 text-center shadow-paper-lg">
        <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-life">
          December 8
        </p>
        <p className="font-serif text-4xl text-paper-ink">{days}</p>
        <p className="text-[12px] text-paper-muted">day{days === 1 ? "" : "s"} to go</p>
      </div>

      {TRANSFORMATION_CATEGORIES.map((category) => (
        <TransformationCard
          key={category}
          category={category}
          goals={transformations[category]}
          onChange={(updater) =>
            onChange((t) => ({ ...t, [category]: updater(t[category]) }))
          }
        />
      ))}
    </div>
  );
}

function TransformationCard({
  category,
  goals,
  onChange,
}: {
  category: TransformationCategoryKey;
  goals: TransformationGoal[];
  onChange: (updater: (goals: TransformationGoal[]) => TransformationGoal[]) => void;
}) {
  const [text, setText] = useState("");
  const color = CATEGORY_COLORS[category];
  const doneCount = goals.filter((g) => g.done).length;
  const pct = goals.length > 0 ? Math.round((doneCount / goals.length) * 100) : 0;

  function submit() {
    if (!text.trim()) return;
    onChange((gs) => [...gs, { id: crypto.randomUUID(), text: text.trim(), done: false }]);
    setText("");
  }

  return (
    <div className="rounded-xl2 border-l-4 bg-paper-surface p-4 shadow-paper" style={{ borderColor: color }}>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="font-serif text-[1rem] text-paper-ink">{category}</p>
        <span className="text-[11px] text-paper-muted">
          {doneCount}/{goals.length}
        </span>
      </div>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-paper-surface2">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>

      {goals.length > 0 && (
        <div className="mb-2 flex flex-col gap-1.5">
          {goals.map((goal) => (
            <div key={goal.id} className="flex items-center gap-2">
              <CheckCircle
                done={goal.done}
                onToggle={() =>
                  onChange((gs) => gs.map((g) => (g.id === goal.id ? { ...g, done: !g.done } : g)))
                }
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
                onClick={() => onChange((gs) => gs.filter((g) => g.id !== goal.id))}
                className="shrink-0 text-paper-faint"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder={`Add a ${category.toLowerCase()} goal…`}
          className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
        />
        <button
          type="button"
          onClick={submit}
          className="rounded-lg px-2.5 text-sm text-paper-surface"
          style={{ backgroundColor: color }}
        >
          +
        </button>
      </div>
    </div>
  );
}
