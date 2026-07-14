"use client";

import { useEffect, useRef } from "react";
import { YearReflections } from "@/lib/types";

const QUESTIONS: { key: keyof YearReflections; prompt: string }[] = [
  { key: "vision", prompt: "What's my vision for this year?" },
  { key: "nonNegotiables", prompt: "What are my non-negotiables?" },
  { key: "focusingOn", prompt: "What am I focusing on?" },
  { key: "wantToChange", prompt: "What do I want to change?" },
];

export default function ReflectionsSection({
  reflections,
  onChange,
}: {
  reflections: YearReflections;
  onChange: (next: YearReflections) => void;
}) {
  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-5 shadow-paper-lg">
      <div className="flex flex-col gap-5">
        {QUESTIONS.map((q) => (
          <ReflectionField
            key={q.key}
            prompt={q.prompt}
            value={reflections[q.key]}
            onChange={(text) => onChange({ ...reflections, [q.key]: text })}
          />
        ))}
      </div>
    </div>
  );
}

function ReflectionField({
  prompt,
  value,
  onChange,
}: {
  prompt: string;
  value: string;
  onChange: (text: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  return (
    <div>
      <p className="mb-2 font-serif text-[1.05rem] italic text-paper-ink">{prompt}</p>
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write freely…"
        className="w-full resize-none border-b border-paper-border bg-transparent pb-2 text-[14.5px] leading-relaxed text-paper-ink outline-none transition-colors placeholder:text-paper-faint focus:border-life"
      />
    </div>
  );
}
