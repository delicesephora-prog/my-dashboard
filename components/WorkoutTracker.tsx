"use client";

export default function WorkoutTracker({
  workouts,
  goal,
  onLog,
  onUndo,
  onSetGoal,
}: {
  workouts: string[];
  goal: number;
  onLog: () => void;
  onUndo: () => void;
  onSetGoal: (goal: number) => void;
}) {
  const count = workouts.length;
  const pct = Math.min(100, Math.round((count / Math.max(goal, 1)) * 100));

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Workouts This Week
        </p>
        <div className="flex items-center gap-1.5 text-xs text-paper-muted">
          <span>Goal</span>
          <button
            type="button"
            aria-label="Decrease weekly goal"
            onClick={() => onSetGoal(Math.max(1, goal - 1))}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-paper-border text-paper-muted active:scale-90"
          >
            −
          </button>
          <span className="w-4 text-center font-medium text-paper-ink">{goal}</span>
          <button
            type="button"
            aria-label="Increase weekly goal"
            onClick={() => onSetGoal(Math.min(30, goal + 1))}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-paper-border text-paper-muted active:scale-90"
          >
            +
          </button>
        </div>
      </div>

      <div className="mb-1 flex items-baseline gap-1.5">
        <span className="font-serif text-2xl text-paper-ink">{count}</span>
        <span className="text-sm text-paper-muted">of {goal} sessions</span>
      </div>

      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-paper-surface2">
        <div
          className="h-full rounded-full bg-life transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onLog}
          className="flex-1 rounded-xl bg-life py-2.5 text-sm font-medium text-paper-surface transition active:scale-[0.98]"
        >
          + Log a Session
        </button>
        {count > 0 && (
          <button
            type="button"
            onClick={onUndo}
            className="shrink-0 text-xs text-paper-muted underline underline-offset-2"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
}
