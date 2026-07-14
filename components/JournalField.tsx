"use client";

import { useEffect, useRef } from "react";

export default function JournalField({
  prompt,
  value,
  onChange,
  placeholder = "Write freely…",
  rows = 1,
  maxHeight = 200,
}: {
  prompt: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  rows?: number;
  maxHeight?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value, maxHeight]);

  return (
    <div>
      <p className="mb-2 font-serif text-[1.05rem] italic text-paper-ink">{prompt}</p>
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none border-b border-paper-border bg-transparent pb-2 text-[14.5px] leading-relaxed text-paper-ink outline-none transition-colors placeholder:text-paper-faint focus:border-life"
      />
    </div>
  );
}
