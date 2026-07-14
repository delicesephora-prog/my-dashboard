"use client";

import { useState } from "react";
import { Achievement } from "@/lib/types";
import { todayKey } from "@/lib/date";

export default function AchievementsSection({
  achievements,
  onChange,
}: {
  achievements: Achievement[];
  onChange: (updater: (a: Achievement[]) => Achievement[]) => void;
}) {
  const [text, setText] = useState("");
  const sorted = [...achievements].sort((a, b) => b.date.localeCompare(a.date));

  function submit() {
    if (!text.trim()) return;
    onChange((a) => [{ id: crypto.randomUUID(), date: todayKey(), text: text.trim() }, ...a]);
    setText("");
  }

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        Achievements
      </p>

      <div className="mb-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Record a win…"
          className="flex-1 rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[15px] text-paper-ink outline-none focus:border-life"
        />
        <button
          onClick={submit}
          aria-label="Add achievement"
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-life text-xl font-light text-paper-surface transition active:scale-90"
        >
          +
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="py-2 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No wins logged yet this quarter.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((a) => (
            <div key={a.id} className="flex items-start gap-2.5 rounded-lg bg-paper-surface2 px-3 py-2">
              <span className="mt-0.5 shrink-0 text-[10.5px] font-medium uppercase tracking-wide text-paper-muted">
                {formatShortDate(a.date)}
              </span>
              <span className="min-w-0 flex-1 text-[13.5px] text-paper-ink">{a.text}</span>
              <button
                type="button"
                aria-label="Delete achievement"
                onClick={() => onChange((arr) => arr.filter((x) => x.id !== a.id))}
                className="shrink-0 text-paper-faint"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
