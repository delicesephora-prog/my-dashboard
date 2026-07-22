"use client";

import { useEffect, useRef } from "react";

export default function OneThing({
  value,
  onChange,
  suggestion,
}: {
  value: string;
  onChange: (text: string) => void;
  // Optional pinned-task title to offer as a one-tap fill when empty.
  suggestion?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [value]);

  return (
    <div className="card-velvet rounded-xl2 p-3.5 shadow-paper-lg">
      <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-gold-soft">
        My One Thing Today
      </p>
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What matters most today?"
        className="w-full resize-none overflow-hidden bg-transparent font-serif text-[1.15rem] leading-snug text-paper-surface outline-none placeholder:text-paper-surface/50 placeholder:italic"
      />
      {!value && suggestion && (
        <div className="mt-2.5 border-t border-paper-surface/15 pt-2.5">
          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-paper-surface/60">
            Need a nudge?
          </p>
          <button
            type="button"
            onClick={() => onChange(suggestion)}
            className="rounded-full border border-paper-surface/25 bg-paper-surface/10 px-2.5 py-1 text-[11.5px] text-paper-surface active:scale-95"
          >
            From your top priority: {suggestion}
          </button>
        </div>
      )}
    </div>
  );
}
