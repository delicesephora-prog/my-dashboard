"use client";

import { useState } from "react";
import { GlowUpData, GlowUpDiyItem, logDiy, sortByOrder, suggestedDiyItem } from "@/lib/glowup";

export default function DiySection({
  data,
  onChange,
}: {
  data: GlowUpData;
  onChange: (updater: (g: GlowUpData) => GlowUpData) => void;
}) {
  const [text, setText] = useState("");
  const now = new Date();
  const suggested = suggestedDiyItem(data, now);
  const sorted = sortByOrder(data.diyItems);

  function submit() {
    if (!text.trim()) return;
    onChange((g) => ({
      ...g,
      diyItems: [...g.diyItems, { id: crypto.randomUUID(), text: text.trim(), order: g.diyItems.length }],
    }));
    setText("");
  }

  function logDone(id: string) {
    onChange((g) => logDiy(g, id, now));
  }

  function itemLabel(id: string): string {
    return data.diyItems.find((i) => i.id === id)?.text ?? "Removed item";
  }

  return (
    <div className="flex flex-col gap-3">
      {suggested && (
        <div className="rounded-xl2 border border-glow bg-glow-soft p-4 shadow-paper-lg">
          <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-glow-dark">
            This Week&apos;s Pick
          </p>
          <p className="mb-1 font-serif text-[1.1rem] leading-snug text-paper-ink">{suggested.text}</p>
          <p className="mb-3 text-[11.5px] italic text-paper-muted">One is plenty — no need to do them all.</p>
          <button
            type="button"
            onClick={() => logDone(suggested.id)}
            className="rounded-xl bg-glow px-4 py-2.5 text-sm font-medium text-paper-surface active:scale-[0.98]"
          >
            Done it
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl2 border border-paper-border bg-paper-surface shadow-paper">
        <p className="border-b border-paper-border bg-paper-surface2 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          DIY Bank
        </p>
        <ul className="divide-y divide-paper-border">
          {sorted.map((diyItem: GlowUpDiyItem) => (
            <li key={diyItem.id} className="flex items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1 truncate text-[14px] text-paper-ink">{diyItem.text}</span>
              <button
                type="button"
                onClick={() => logDone(diyItem.id)}
                className="shrink-0 rounded-full border border-glow px-3 py-1.5 text-[11px] font-medium text-glow-dark"
              >
                Done it
              </button>
              <button
                type="button"
                aria-label="Delete item"
                onClick={() =>
                  onChange((g) => ({ ...g, diyItems: g.diyItems.filter((i) => i.id !== diyItem.id) }))
                }
                className="shrink-0 text-lg text-paper-faint"
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
          placeholder="Add a treatment…"
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

      {data.diyLog.length > 0 && (
        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
          <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
            Recently Done
          </p>
          <ul className="flex flex-col gap-1">
            {data.diyLog.slice(0, 8).map((entry, i) => (
              <li key={i} className="text-[12.5px] text-paper-muted">
                <span className="text-paper-ink">{itemLabel(entry.itemId)}</span> · {entry.date}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
