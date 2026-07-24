"use client";

import { MasteryLevel, MASTERY_LABELS, MASTERY_COLORS } from "@/lib/knowledge";

export default function MasteryBadge({
  level,
  score,
  size = "md",
}: {
  level: MasteryLevel;
  score?: number;
  size?: "sm" | "md";
}) {
  const color = MASTERY_COLORS[level];
  const sizeClass = size === "sm" ? "text-[9px] px-1.5 py-0.5" : "text-[10.5px] px-2 py-1";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full font-semibold uppercase tracking-wide ${sizeClass}`}
      style={{ backgroundColor: `${color}22`, color }}
    >
      {MASTERY_LABELS[level]}
      {typeof score === "number" && size !== "sm" && <span className="opacity-70">· {score}</span>}
    </span>
  );
}
