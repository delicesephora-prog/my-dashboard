"use client";

import { useState } from "react";

export default function BrainDump({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open brain dump"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 1.1rem)" }}
        className="fixed right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-paper-ink text-lg text-paper-surface shadow-paper-lg transition active:scale-90"
      >
        ✎
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-paper-surface animate-fade-in">
          <div className="safe-top flex items-center justify-between px-5 pb-3 pt-3">
            <p className="font-serif text-[1.1rem] text-paper-ink">Brain Dump</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-paper-surface2 px-3.5 py-1.5 text-sm font-medium text-paper-muted"
            >
              Done
            </button>
          </div>
          <textarea
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Just type…"
            className="safe-bottom flex-1 resize-none bg-transparent px-5 py-2 text-[16px] leading-relaxed text-paper-ink outline-none placeholder:text-paper-faint"
          />
        </div>
      )}
    </>
  );
}
