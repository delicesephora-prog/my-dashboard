"use client";

import { useState } from "react";
import {
  BUCKET_CATEGORIES,
  BUCKET_CATEGORY_COLORS,
  BucketCategory,
  BucketItem,
  BucketListData,
} from "@/lib/types";
import { todayKey } from "@/lib/date";
import CheckCircle from "../CheckCircle";

export default function BucketListView({
  bucketList,
  onChange,
}: {
  bucketList: BucketListData;
  onChange: (updater: (b: BucketListData) => BucketListData) => void;
}) {
  const [filter, setFilter] = useState<BucketCategory | null>(null);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<BucketCategory>("Travel");

  const items = bucketList.items;
  const doneCount = items.filter((i) => i.done).length;
  const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;
  const filtered = filter ? items.filter((i) => i.category === filter) : items;
  const sorted = [...filtered].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return 0;
  });

  function addItem() {
    if (!text.trim()) return;
    const item: BucketItem = {
      id: crypto.randomUUID(),
      text: text.trim(),
      category,
      done: false,
      completedDate: "",
    };
    onChange((b) => ({ ...b, items: [item, ...b.items] }));
    setText("");
  }

  function toggleDone(id: string) {
    onChange((b) => ({
      ...b,
      items: b.items.map((i) =>
        i.id === id
          ? { ...i, done: !i.done, completedDate: !i.done ? todayKey() : "" }
          : i
      ),
    }));
  }

  function deleteItem(id: string) {
    onChange((b) => ({ ...b, items: b.items.filter((i) => i.id !== id) }));
  }

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="flex flex-col gap-3">
        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
          <div className="mb-1.5 flex items-center justify-between text-[12px] text-paper-muted">
            <span>Bucket List Progress</span>
            <span className="font-medium text-paper-ink">
              {doneCount} of {items.length} ({pct}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-paper-surface2">
            <div className="h-full rounded-full bg-life transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
          <div className="mb-3 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addItem();
              }}
              placeholder="Add something to the list…"
              className="flex-1 rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[15px] text-paper-ink outline-none focus:border-life"
            />
            <button
              onClick={addItem}
              aria-label="Add item"
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-life text-xl font-light text-paper-surface transition active:scale-90"
            >
              +
            </button>
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as BucketCategory)}
            className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
          >
            {BUCKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="scroll-quiet -mx-5 flex gap-1.5 overflow-x-auto px-5">
          <button
            type="button"
            onClick={() => setFilter(null)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === null
                ? "bg-paper-ink text-paper-surface"
                : "border border-paper-border bg-paper-surface text-paper-muted"
            }`}
          >
            All
          </button>
          {BUCKET_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter((f) => (f === c ? null : c))}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                filter === c ? "border-transparent text-paper-surface" : "border-paper-border bg-paper-surface text-paper-muted"
              }`}
              style={filter === c ? { backgroundColor: BUCKET_CATEGORY_COLORS[c] } : undefined}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: filter === c ? "#FBF5EA" : BUCKET_CATEGORY_COLORS[c] }}
                aria-hidden
              />
              {c}
            </button>
          ))}
        </div>

        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
          {sorted.length === 0 ? (
            <p className="py-3 text-center font-serif text-[0.9rem] italic text-paper-muted">
              Nothing here yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {sorted.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5">
                  <CheckCircle
                    done={item.done}
                    onToggle={() => toggleDone(item.id)}
                    accentClass="bg-life"
                    size="sm"
                    ariaLabel={item.done ? "Mark not done" : "Mark done"}
                  />
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: BUCKET_CATEGORY_COLORS[item.category] }}
                    aria-hidden
                  />
                  <span
                    className={`min-w-0 flex-1 text-[14px] ${
                      item.done ? "text-paper-faint line-through" : "text-paper-ink"
                    }`}
                  >
                    {item.text}
                  </span>
                  {item.done && item.completedDate && (
                    <span className="shrink-0 text-[10.5px] text-paper-muted">
                      {formatShortDate(item.completedDate)}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label="Delete item"
                    onClick={() => deleteItem(item.id)}
                    className="shrink-0 text-paper-faint"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
