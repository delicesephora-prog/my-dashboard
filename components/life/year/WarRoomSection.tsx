"use client";

import { useEffect, useState } from "react";
import {
  TRANSFORMATION_CATEGORIES,
  TransformationCategoryKey,
  TransformationGoal,
} from "@/lib/types";
import {
  CategoryWarRoomData,
  PACE_LABELS,
  WarRoomData,
  categoryPace,
  daysUntilDecember8,
  paydaysUntilDecember8,
  recordTodaySnapshot,
  weeksUntilDecember8,
} from "@/lib/warroom";
import { dateKey } from "@/lib/date";
import CheckCircle from "../../CheckCircle";
import LetterToDecemberSephCard from "./LetterToDecemberSephCard";

const PACE_DOT: Record<string, string> = {
  "no-goals": "#C7B9BC",
  "insufficient-data": "#C7B9BC",
  complete: "#8A9B7C",
  "on-pace": "#8A9B7C",
  "off-pace": "#A54B3F",
};

export default function WarRoomSection({
  transformations,
  warRoom,
  paydayAnchorDate,
  onChangeTransformations,
  onChangeWarRoom,
}: {
  transformations: Record<TransformationCategoryKey, TransformationGoal[]>;
  warRoom: WarRoomData;
  paydayAnchorDate: string;
  onChangeTransformations: (
    updater: (t: Record<TransformationCategoryKey, TransformationGoal[]>) => Record<
      TransformationCategoryKey,
      TransformationGoal[]
    >
  ) => void;
  onChangeWarRoom: (updater: (w: WarRoomData) => WarRoomData) => void;
}) {
  const days = daysUntilDecember8();
  const weeks = weeksUntilDecember8();
  const paydays = paydaysUntilDecember8(paydayAnchorDate);

  // Keep today's snapshot fresh for every category as goals change.
  useEffect(() => {
    const now = new Date();
    onChangeWarRoom((w) => {
      let changed = false;
      const categories = { ...w.categories };
      for (const key of TRANSFORMATION_CATEGORIES) {
        const next = recordTodaySnapshot(categories[key], transformations[key], now);
        if (next !== categories[key]) {
          categories[key] = next;
          changed = true;
        }
      }
      return changed ? { ...w, categories } : w;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transformations]);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl2 bg-life p-6 text-center shadow-paper-lg">
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold-soft">
          Days Until December 8
        </p>
        <p className="font-serif text-6xl text-paper-surface">{days}</p>
        <p className="mt-2 text-[13px] italic text-paper-surface/80">Unrecognizable, on schedule.</p>
        <div className="mt-3 flex justify-center gap-4 text-[12px] text-paper-surface/70">
          <span>{weeks} week{weeks === 1 ? "" : "s"}</span>
          {paydays !== null && (
            <span>
              {paydays} payday{paydays === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      {TRANSFORMATION_CATEGORIES.map((category) => (
        <CategoryCard
          key={category}
          category={category}
          goals={transformations[category]}
          categoryData={warRoom.categories[category]}
          onChangeGoals={(updater) =>
            onChangeTransformations((t) => ({ ...t, [category]: updater(t[category]) }))
          }
          onChangeCategoryData={(updater) =>
            onChangeWarRoom((w) => ({
              ...w,
              categories: { ...w.categories, [category]: updater(w.categories[category]) },
            }))
          }
        />
      ))}

      <LetterToDecemberSephCard
        letter={warRoom.letter}
        onChange={(updater) => onChangeWarRoom((w) => ({ ...w, letter: updater(w.letter) }))}
      />
    </div>
  );
}

function CategoryCard({
  category,
  goals,
  categoryData,
  onChangeGoals,
  onChangeCategoryData,
}: {
  category: TransformationCategoryKey;
  goals: TransformationGoal[];
  categoryData: CategoryWarRoomData;
  onChangeGoals: (updater: (goals: TransformationGoal[]) => TransformationGoal[]) => void;
  onChangeCategoryData: (updater: (c: CategoryWarRoomData) => CategoryWarRoomData) => void;
}) {
  const [text, setText] = useState("");
  const doneCount = goals.filter((g) => g.done).length;
  const pct = goals.length > 0 ? Math.round((doneCount / goals.length) * 100) : 0;
  const pace = categoryPace(categoryData, goals);

  function submit() {
    if (!text.trim()) return;
    onChangeGoals((gs) => [...gs, { id: crypto.randomUUID(), text: text.trim(), done: false }]);
    setText("");
  }

  const maxSnapshot = Math.max(1, ...categoryData.snapshots.map((s) => (s.total > 0 ? (s.done / s.total) * 100 : 0)));

  return (
    <div className="rounded-xl2 border-l-4 border-l-life bg-paper-surface p-4 shadow-paper">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="font-serif text-[1rem] text-paper-ink">{category}</p>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PACE_DOT[pace] }} />
          <span className="text-[11px] text-paper-muted">{PACE_LABELS[pace]}</span>
        </div>
      </div>

      <div className="mb-1 flex items-center justify-between text-[11px] text-paper-muted">
        <span>
          {doneCount}/{goals.length} goals
        </span>
      </div>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-paper-surface2">
        <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
      </div>

      {categoryData.snapshots.length > 1 && (
        <div className="mb-3 flex h-6 items-end gap-[1.5px]">
          {categoryData.snapshots.slice(-30).map((s) => {
            const spct = s.total > 0 ? (s.done / s.total) * 100 : 0;
            const height = Math.max((spct / maxSnapshot) * 100, spct > 0 ? 10 : 0);
            return (
              <div
                key={s.date}
                title={`${s.date}: ${Math.round(spct)}%`}
                className="flex-1 rounded-t-sm bg-gold"
                style={{ height: `${height}%`, opacity: 0.6 }}
              />
            );
          })}
        </div>
      )}

      <div className="mb-3">
        <p className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
          This Week&apos;s Move
        </p>
        <input
          value={categoryData.thisWeeksMove}
          onChange={(e) =>
            onChangeCategoryData((c) => ({
              ...c,
              thisWeeksMove: e.target.value,
              thisWeeksMoveSetDate: dateKey(new Date()),
            }))
          }
          placeholder="One action for this week…"
          className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
        />
      </div>

      {goals.length > 0 && (
        <div className="mb-2 flex flex-col gap-1.5">
          {goals.map((goal) => (
            <div key={goal.id} className="flex items-center gap-2">
              <CheckCircle
                done={goal.done}
                onToggle={() =>
                  onChangeGoals((gs) => gs.map((g) => (g.id === goal.id ? { ...g, done: !g.done } : g)))
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
                onClick={() => onChangeGoals((gs) => gs.filter((g) => g.id !== goal.id))}
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
          className="rounded-lg bg-life px-2.5 text-sm text-paper-surface"
        >
          +
        </button>
      </div>
    </div>
  );
}
