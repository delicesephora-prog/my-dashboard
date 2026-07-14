"use client";

import { useEffect, useRef } from "react";

export default function OneThing({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [value]);

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
      <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        My One Thing Today
      </p>
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What matters most today?"
        className="w-full resize-none overflow-hidden bg-transparent font-serif text-[1.15rem] leading-snug text-paper-ink outline-none placeholder:text-paper-faint placeholder:italic"
      />
    </div>
  );
}
