"use client";

import { useRef } from "react";
import { burstConfettiFrom } from "@/lib/confetti";
import { playCheckTick } from "@/lib/sound";

export default function CheckCircle({
  done,
  onToggle,
  accentClass,
  size = "md",
  ariaLabel,
}: {
  done: boolean;
  onToggle: () => void;
  accentClass: string;
  size?: "sm" | "md";
  ariaLabel: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  function handleClick() {
    // Only celebrate the transition into "done" - unchecking is silent.
    if (!done && ref.current) {
      burstConfettiFrom(ref.current);
      playCheckTick();
    }
    onToggle();
  }

  const dims = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const iconDims = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      onClick={handleClick}
      className={`flex shrink-0 items-center justify-center rounded-full border transition active:animate-check-pulse ${dims} ${
        done
          ? `${accentClass} border-transparent ring-2 ring-gold/50 ring-offset-2 ring-offset-paper-bg`
          : "border-paper-faint"
      }`}
    >
      {done && (
        <svg viewBox="0 0 24 24" className={`${iconDims} text-paper-surface`} fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
