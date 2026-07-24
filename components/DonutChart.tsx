"use client";

import AnimatedNumber from "./AnimatedNumber";

export type DonutSegment = { label: string; value: number; color: string };

// Generalizes ProgressRing to N colored segments around one ring - each
// segment's arc starts exactly where the previous one ends, via the
// standard stroke-dasharray/dashoffset stacking technique.
export default function DonutChart({
  segments,
  size = 140,
  strokeWidth = 16,
  trackColor = "#E7DFCF",
  centerLabel,
  centerValue,
  centerSuffix = "",
  textClass = "text-paper-ink",
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  centerLabel?: string;
  centerValue?: number;
  centerSuffix?: string;
  textClass?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);

  let cumulative = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((seg) => {
      const fraction = total > 0 ? seg.value / total : 0;
      const dash = circumference * fraction;
      const offset = circumference * (1 - cumulative);
      cumulative += fraction;
      return { ...seg, dash, offset };
    });

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={a.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${a.dash} ${Math.max(0, circumference - a.dash)}`}
            strokeDashoffset={a.offset}
            strokeLinecap={arcs.length === 1 ? "round" : "butt"}
            style={{ transition: "stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease" }}
          >
            <title>{`${a.label}: ${a.value}`}</title>
          </circle>
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {centerLabel !== undefined ? (
          <span className={`font-serif text-sm ${textClass}`}>{centerLabel}</span>
        ) : (
          <AnimatedNumber value={centerValue ?? total} suffix={centerSuffix} className={`font-serif text-lg ${textClass}`} />
        )}
      </div>
    </div>
  );
}
