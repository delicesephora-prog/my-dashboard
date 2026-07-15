"use client";

import { LABEL_COLORS } from "@/lib/lifescore";
import ProgressRing from "./ProgressRing";

export default function LifeScoreRing({
  score,
  label,
  onTap,
}: {
  score: number;
  label: string;
  onTap: () => void;
}) {
  const color = LABEL_COLORS[label] ?? "#4B5A24";

  return (
    <button
      type="button"
      onClick={onTap}
      className="flex w-full items-center gap-3 rounded-xl2 border border-paper-border bg-paper-surface p-4 text-left shadow-paper transition active:scale-[0.99]"
    >
      <ProgressRing pct={score} size={64} strokeWidth={6} color={color} label={String(score)} />
      <div className="min-w-0 flex-1">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Life Score
        </p>
        <p className="font-serif text-[1.3rem]" style={{ color }}>
          {label}
        </p>
        <p className="text-[11px] text-paper-muted">Tap to see the breakdown</p>
      </div>
    </button>
  );
}
