"use client";

import { useState } from "react";
import { GlowUpItem, sortByOrder } from "@/lib/glowup";
import CheckCircle from "../../CheckCircle";
import ProgressRing from "../../ProgressRing";

export default function GlowUpChecklist({
  title,
  subtitle,
  items,
  doneIds,
  pct,
  extraHeader,
  onToggle,
  onAdd,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  items: GlowUpItem[];
  doneIds: Set<string>;
  pct: number;
  extraHeader?: React.ReactNode;
  onToggle: (id: string) => void;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const sorted = sortByOrder(items);

  function submit() {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <div className="flex items-center gap-3">
          <ProgressRing pct={pct} size={56} strokeWidth={5} color="#B97C87" />
          <div className="min-w-0 flex-1">
            <p className="font-serif text-[1.05rem] text-paper-ink">{title}</p>
            {subtitle && <p className="text-xs text-paper-muted">{subtitle}</p>}
          </div>
        </div>
        {extraHeader}
      </div>

      <div className="overflow-hidden rounded-xl2 border border-paper-border bg-paper-surface shadow-paper">
        <ul className="divide-y divide-paper-border">
          {sorted.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <CheckCircle
                done={doneIds.has(item.id)}
                onToggle={() => onToggle(item.id)}
                accentClass="bg-glow"
                size="md"
                ariaLabel={doneIds.has(item.id) ? "Mark not done" : "Mark done"}
              />
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className="min-w-0 flex-1 text-left active:opacity-70"
              >
                <span
                  className={`block text-[14.5px] leading-snug ${
                    doneIds.has(item.id) ? "text-paper-faint line-through" : "text-paper-ink"
                  }`}
                >
                  {item.text}
                </span>
              </button>
              <button
                type="button"
                aria-label="Delete item"
                onClick={() => onDelete(item.id)}
                className="shrink-0 px-1 text-lg text-paper-faint"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Add an item…"
          className="min-w-0 flex-1 rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[14px] text-paper-ink outline-none"
        />
        <button
          type="button"
          onClick={submit}
          className="rounded-xl bg-glow px-4 text-sm font-medium text-paper-surface"
        >
          + Add
        </button>
      </div>
    </div>
  );
}
