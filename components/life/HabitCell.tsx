"use client";

import { useRef } from "react";
import { burstConfettiFrom } from "@/lib/confetti";
import { playPopSound } from "@/lib/pop-sound";

export default function HabitCell({
  done,
  color,
  isToday,
  onToggle,
  ariaLabel,
}: {
  done: boolean;
  color: string;
  isToday?: boolean;
  onToggle: () => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  function handleClick() {
    if (!done && ref.current) {
      burstConfettiFrom(ref.current);
      playPopSound();
    }
    onToggle();
  }

  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      onClick={handleClick}
      className={`flex h-6 w-6 items-center justify-center rounded-md border transition active:scale-90 ${
        done ? "ring-2 ring-gold/50 ring-offset-2 ring-offset-paper-bg" : ""
      } ${isToday ? "outline outline-2 outline-offset-1 outline-gold" : ""}`}
      style={{
        backgroundColor: done ? color : "transparent",
        borderColor: done ? "transparent" : "#E8DFD0",
      }}
    >
      {done && (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-paper-surface" fill="none">
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
