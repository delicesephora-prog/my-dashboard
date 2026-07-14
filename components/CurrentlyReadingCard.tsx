"use client";

import { CurrentlyReading } from "@/lib/types";

export default function CurrentlyReadingCard({
  value,
  onChange,
}: {
  value: CurrentlyReading;
  onChange: (next: CurrentlyReading) => void;
}) {
  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        Currently Reading
      </p>
      <input
        value={value.title}
        onChange={(e) => onChange({ ...value, title: e.target.value })}
        placeholder="Book title…"
        className="mb-1 w-full bg-transparent font-serif text-[1.1rem] italic text-paper-ink outline-none placeholder:text-paper-faint placeholder:not-italic"
      />
      <input
        value={value.author}
        onChange={(e) => onChange({ ...value, author: e.target.value })}
        placeholder="Author…"
        className="w-full bg-transparent text-sm text-paper-muted outline-none placeholder:text-paper-faint"
      />
    </div>
  );
}
