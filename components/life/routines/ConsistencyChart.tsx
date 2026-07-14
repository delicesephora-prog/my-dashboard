"use client";

import { RoutineKey, RoutinesConfig, RoutinesData, ROUTINE_COLORS, ROUTINE_LABELS, ROUTINE_KEYS, last30DaysConsistency } from "@/lib/routines";

export default function ConsistencyChart({
  config,
  data,
  now,
}: {
  config: RoutinesConfig;
  data: RoutinesData;
  now: Date;
}) {
  const days = last30DaysConsistency(config, data, now);

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
        Routine Consistency · Last 30 Days
      </p>
      <div className="flex flex-col gap-3">
        {ROUTINE_KEYS.map((key) => (
          <RoutineRow key={key} routineKey={key} days={days} />
        ))}
      </div>
    </div>
  );
}

function RoutineRow({
  routineKey,
  days,
}: {
  routineKey: RoutineKey;
  days: ReturnType<typeof last30DaysConsistency>;
}) {
  const color = ROUTINE_COLORS[routineKey];

  return (
    <div>
      <p className="mb-1 text-[11px] font-medium text-paper-muted">{ROUTINE_LABELS[routineKey]}</p>
      <div className="flex h-8 items-end gap-[2px]">
        {days.map((d) => {
          const pct = d[routineKey];
          const height = pct === null ? 0 : Math.max(pct, pct > 0 ? 8 : 0);
          return (
            <div
              key={d.dateStr}
              role="img"
              aria-label={`${d.dateStr}: ${pct === null ? "no steps set" : `${pct}%`}`}
              title={`${d.dateStr}: ${pct === null ? "no steps set" : `${pct}%`}`}
              className="flex-1 rounded-t-sm transition-all"
              style={{
                height: `${height}%`,
                backgroundColor: pct === null ? "transparent" : color,
                opacity: pct === null ? 1 : 0.35 + (pct / 100) * 0.65,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
