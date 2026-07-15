"use client";

import { useState } from "react";
import { DumpData, DumpItem } from "@/lib/lists";

export default function QuickDump({
  onChange,
  onClose,
}: {
  onChange: (updater: (d: DumpData) => DumpData) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [justAdded, setJustAdded] = useState(false);

  function add() {
    if (!text.trim()) return;
    const item: DumpItem = {
      id: crypto.randomUUID(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    onChange((d) => ({ ...d, items: [item, ...d.items] }));
    setText("");
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 900);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 animate-fade-in" onClick={onClose}>
      <div
        className="safe-bottom rounded-t-xl3 bg-paper-surface p-5 shadow-paper-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="font-serif text-[1.05rem] text-paper-ink">Quick Dump</p>
          <button type="button" onClick={onClose} className="text-sm font-medium text-paper-muted">
            Done
          </button>
        </div>
        <div className="flex gap-2">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder="Get it out of your head…"
            className="min-w-0 flex-1 rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-3 text-[15px] text-paper-ink outline-none"
          />
          <button
            type="button"
            onClick={add}
            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl bg-work text-2xl font-light text-paper-surface active:scale-95"
          >
            +
          </button>
        </div>
        {justAdded && <p className="mt-2 text-xs italic text-paper-muted">Added. Keep going, or tap Done.</p>}
      </div>
    </div>
  );
}
