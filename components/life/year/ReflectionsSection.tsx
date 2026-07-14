"use client";

import { YearReflections } from "@/lib/types";
import JournalField from "../../JournalField";

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
          <JournalField
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
