"use client";

import AnimatedNumber from "./AnimatedNumber";

export default function ProgressRing({
  pct,
  size = 64,
  strokeWidth = 6,
  color,
  trackColor = "#E7DFCF",
  label,
  value,
  suffix,
  textClass = "text-paper-ink",
}: {
  pct: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  // Full override - skips the count-up animation. Use for a blank/custom
  // center (e.g. Focus Mode's own countdown text).
  label?: string;
  // A number to animate in the center instead of the ring's own pct - use
  // for values that aren't the percentage itself (e.g. a raw score).
  value?: number;
  suffix?: string;
  // Every caller renders this ring inside a card except Front Page's
  // bare-on-backdrop ring stats, which pass text-backdrop-ink instead.
  textClass?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label !== undefined ? (
          <span className={`font-serif text-sm ${textClass}`}>{label}</span>
        ) : (
          <AnimatedNumber
            value={value ?? clamped}
            suffix={value !== undefined ? suffix ?? "" : "%"}
            className={`font-serif text-sm ${textClass}`}
          />
        )}
      </div>
    </div>
  );
}
