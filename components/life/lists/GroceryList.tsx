"use client";

import { useState } from "react";
import {
  GROCERY_CATEGORIES,
  GroceryCategory,
  GroceryData,
  GroceryItem,
  sortGroceryItems,
} from "@/lib/lists";
import { dateKey } from "@/lib/date";
import CheckCircle from "../../CheckCircle";

export default function GroceryList({
  data,
  onChange,
  onManageStaples,
}: {
  data: GroceryData;
  onChange: (updater: (g: GroceryData) => GroceryData) => void;
  onManageStaples: () => void;
}) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<GroceryCategory>("Produce");

  const doneCount = data.items.filter((i) => i.done).length;

  function addItem(itemText: string, itemCategory: GroceryCategory) {
    if (!itemText.trim()) return;
    const item: GroceryItem = {
      id: crypto.randomUUID(),
      text: itemText.trim(),
      category: itemCategory,
      done: false,
      createdAt: new Date().toISOString(),
    };
    onChange((g) => ({ ...g, items: [...g.items, item] }));
  }

  function addFromStaple(stapleId: string) {
    const staple = data.staples.find((s) => s.id === stapleId);
    if (!staple) return;
    addItem(staple.text, staple.category);
  }

  function toggle(id: string) {
    onChange((g) => ({
      ...g,
      items: g.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    }));
  }

  function remove(id: string) {
    onChange((g) => ({ ...g, items: g.items.filter((i) => i.id !== id) }));
  }

  function clearChecked() {
    onChange((g) => ({ ...g, items: g.items.filter((i) => !i.done) }));
  }

  function submit() {
    addItem(text, category);
    setText("");
  }

  return (
    <div className="flex flex-col gap-3">
      {data.staples.length > 0 && (
        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
              Staples
            </p>
            <button
              type="button"
              onClick={onManageStaples}
              className="text-[11px] text-paper-muted underline underline-offset-2"
            >
              Manage
            </button>
          </div>
          <div className="scroll-quiet flex gap-1.5 overflow-x-auto pb-1">
            {data.staples.map((staple) => (
              <button
                key={staple.id}
                type="button"
                onClick={() => addFromStaple(staple.id)}
                className="shrink-0 rounded-full border border-paper-border bg-paper-surface2 px-3.5 py-2 text-[13px] font-medium text-paper-ink active:scale-95"
              >
                + {staple.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {data.staples.length === 0 && (
        <button
          type="button"
          onClick={onManageStaples}
          className="rounded-xl2 border border-dashed border-paper-border bg-paper-surface p-3.5 text-center text-[13px] text-paper-muted shadow-paper"
        >
          + Set up your Staples bank
        </button>
      )}

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <div className="mb-2 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="Add an item…"
            className="min-w-0 flex-1 rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-3 text-[15px] text-paper-ink outline-none"
          />
          <button
            type="button"
            onClick={submit}
            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl bg-life text-2xl font-light text-paper-surface active:scale-95"
          >
            +
          </button>
        </div>
        <div className="scroll-quiet flex gap-1.5 overflow-x-auto">
          {GROCERY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                category === cat
                  ? "bg-life text-paper-surface"
                  : "border border-paper-border text-paper-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {data.items.length === 0 ? (
        <p className="py-6 text-center font-serif text-[0.95rem] italic text-paper-muted">
          Your list is empty. Add something above.
        </p>
      ) : (
        <>
          {doneCount > 0 && (
            <button
              type="button"
              onClick={clearChecked}
              className="self-end text-xs text-paper-muted underline underline-offset-2"
            >
              Clear {doneCount} checked item{doneCount === 1 ? "" : "s"}
            </button>
          )}
          {GROCERY_CATEGORIES.map((cat) => {
            const itemsInCat = sortGroceryItems(data.items.filter((i) => i.category === cat));
            if (itemsInCat.length === 0) return null;
            return (
              <div
                key={cat}
                className="overflow-hidden rounded-xl2 border border-paper-border bg-paper-surface shadow-paper"
              >
                <p className="border-b border-paper-border bg-paper-surface2 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
                  {cat}
                </p>
                <ul className="divide-y divide-paper-border">
                  {itemsInCat.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                      <CheckCircle
                        done={item.done}
                        onToggle={() => toggle(item.id)}
                        accentClass="bg-life"
                        size="md"
                        ariaLabel={item.done ? "Mark not bought" : "Mark bought"}
                      />
                      <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        className="min-w-0 flex-1 text-left active:opacity-70"
                      >
                        <span
                          className={`block truncate text-[16px] ${
                            item.done ? "text-paper-faint line-through" : "text-paper-ink"
                          }`}
                        >
                          {item.text}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label="Delete item"
                        onClick={() => remove(item.id)}
                        className="shrink-0 px-2 text-lg text-paper-faint"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
