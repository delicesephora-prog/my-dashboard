"use client";

import {
  LABEL_COLORS,
  LIFE_SCORE_CATEGORIES,
  LIFE_SCORE_CATEGORY_LABELS,
  LifeScoreBreakdown,
  ScoreHistoryDay,
} from "@/lib/lifescore";

function TrendLine({ history }: { history: ScoreHistoryDay[] }) {
  const width = 320;
  const height = 90;
  const known = history.filter((h) => h.score !== null);
  if (known.length === 0) {
    return (
      <p className="py-6 text-center text-xs italic text-paper-muted">
        No history yet - check back after a few days.
      </p>
    );
  }

  const points = history.map((h, i) => ({
    x: (i / (history.length - 1)) * width,
    y: h.score === null ? null : height - (h.score / 100) * height,
  }));

  const segments: string[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    if (points[i].y !== null && points[i + 1].y !== null) {
      segments.push(`M ${points[i].x} ${points[i].y} L ${points[i + 1].x} ${points[i + 1].y}`);
    }
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 90 }}>
      <line x1={0} y1={height} x2={width} y2={height} stroke="#E7DFCF" strokeWidth={1} />
      {segments.map((d, i) => (
        <path key={i} d={d} stroke="#4B5A24" strokeWidth={2} fill="none" strokeLinecap="round" />
      ))}
      {points.map(
        (p, i) =>
          p.y !== null && <circle key={i} cx={p.x} cy={p.y} r={2} fill="#4B5A24" />
      )}
    </svg>
  );
}

export default function LifeScoreSheet({
  breakdown,
  history,
  onClose,
}: {
  breakdown: LifeScoreBreakdown;
  history: ScoreHistoryDay[];
  onClose: () => void;
}) {
  const color = LABEL_COLORS[breakdown.label] ?? "#4B5A24";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper-surface animate-fade-in">
      <div className="safe-top flex items-center justify-between px-5 pb-2 pt-3">
        <p className="font-serif text-[1.1rem] text-paper-ink">Life Score</p>
        <button type="button" onClick={onClose} aria-label="Close" className="text-paper-muted">
          ✕
        </button>
      </div>

      <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto px-5 pb-6">
        <div
          className="mb-4 rounded-xl2 border p-5 text-center shadow-paper-lg"
          style={{ borderColor: color, backgroundColor: "#FFFCF6" }}
        >
          <p className="font-serif text-5xl text-paper-ink">{breakdown.score}</p>
          <p className="mt-1 font-serif text-xl" style={{ color }}>
            {breakdown.label}
          </p>
        </div>

        <div className="mb-4 rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
          <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Last 30 Days
          </p>
          <TrendLine history={history} />
        </div>

        <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
          <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Today&apos;s Breakdown
          </p>
          <div className="flex flex-col gap-3">
            {LIFE_SCORE_CATEGORIES.map((key) => {
              const c = breakdown.categories[key];
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className={`text-[13px] ${c.included ? "text-paper-ink" : "text-paper-faint"}`}>
                      {LIFE_SCORE_CATEGORY_LABELS[key]}
                    </span>
                    <span className="text-[11px] text-paper-muted">
                      {c.included ? `${c.score}% · weight ${c.weight}` : "not counted today"}
                    </span>
                  </div>
                  {c.included && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-surface2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${c.score}%`, backgroundColor: "#4B5A24" }}
                      />
                    </div>
                  )}
                  <p className="mt-1 text-[11px] italic text-paper-muted">{c.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
