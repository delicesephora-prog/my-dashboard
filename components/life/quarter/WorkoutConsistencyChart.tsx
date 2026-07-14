"use client";

import { LifeWeekly } from "@/lib/types";
import { weekKeyFor, shiftWeekKey, formatWeekRange } from "@/lib/week";

const WEEKS_SHOWN = 13;

export default function WorkoutConsistencyChart({ lifeWeekly }: { lifeWeekly: LifeWeekly }) {
  const currentWeekKey = weekKeyFor(new Date());
  const weekKeys = Array.from({ length: WEEKS_SHOWN }, (_, i) =>
    shiftWeekKey(currentWeekKey, -(WEEKS_SHOWN - 1 - i))
  );
  const counts = weekKeys.map((key) => lifeWeekly.weeks[key]?.workouts.length ?? 0);
  const goal = lifeWeekly.workoutGoal;
  const max = Math.max(goal, ...counts, 1);
  const goalLinePct = (goal / max) * 100;

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Workout Consistency
        </p>
        <p className="text-[11px] text-paper-muted">Last {WEEKS_SHOWN} weeks · goal {goal}/wk</p>
      </div>

      <div className="relative h-24 border-b border-paper-border">
        <div
          className="absolute left-0 right-0 border-t border-dashed border-life/50"
          style={{ bottom: `${goalLinePct}%` }}
          aria-hidden
        />
        <div className="flex h-full items-end gap-[3px]">
          {counts.map((count, i) => {
            const isCurrent = weekKeys[i] === currentWeekKey;
            const pct = Math.max((count / max) * 100, count > 0 ? 6 : 0);
            return (
              <div
                key={weekKeys[i]}
                role="img"
                aria-label={`${formatWeekRange(weekKeys[i])}: ${count} session${count === 1 ? "" : "s"}`}
                title={`${formatWeekRange(weekKeys[i])}: ${count}`}
                className="flex-1 rounded-t-sm transition-all"
                style={{
                  height: `${pct}%`,
                  backgroundColor: isCurrent ? "#4B5A24" : "rgba(75, 90, 36, 0.4)",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
