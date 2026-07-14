"use client";

import { useEffect, useRef } from "react";

export default function ReflectionCard({
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
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        Reflection
      </p>
      <textarea
        ref={ref}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="A few words about how this week went…"
        className="w-full resize-none overflow-hidden bg-transparent font-serif text-[1rem] leading-relaxed text-paper-ink outline-none placeholder:text-paper-faint placeholder:italic"
      />
    </div>
  );
}
