"use client";

export type TrendSeriesPoint = { label: string; value: number };

// A compact SVG line+area chart for a value trending over time (debt down,
// vaults up, net position). Handles a negative-capable range with a zero
// baseline, and degrades gracefully with 0-1 points of history.
export default function TrendLineChart({
  points,
  color,
  heightPx = 90,
}: {
  points: TrendSeriesPoint[];
  color: string;
  heightPx?: number;
}) {
  if (points.length === 0) {
    return <p className="py-4 text-center text-[12px] italic text-paper-muted">Not enough history yet.</p>;
  }

  const width = 300;
  const height = 100;
  const values = points.map((p) => p.value);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = points.length > 1 ? width / (points.length - 1) : 0;

  const coords = points.map((p, i) => ({
    x: points.length > 1 ? i * stepX : width / 2,
    y: height - ((p.value - min) / range) * height,
  }));
  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height} L ${coords[0].x.toFixed(1)} ${height} Z`;
  const zeroY = height - ((0 - min) / range) * height;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: heightPx }} preserveAspectRatio="none">
        <path d={areaPath} fill={color} fillOpacity={0.12} stroke="none" />
        {min < 0 && max > 0 && (
          <line x1={0} x2={width} y1={zeroY} y2={zeroY} stroke="#C9BFA8" strokeDasharray="3 3" strokeWidth={1} />
        )}
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={2.5} fill={color}>
            <title>{`${points[i].label}: ${points[i].value}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[9px] uppercase tracking-wide text-paper-faint">
        {points.map((p, i) => (
          <span key={i}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}
