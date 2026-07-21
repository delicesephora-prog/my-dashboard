"use client";

import { DashboardData } from "@/lib/types";
import { computeMyNumbers } from "@/lib/mynumbers";

export default function MyNumbersView({
  data,
  onBack,
}: {
  data: DashboardData;
  onBack: () => void;
}) {
  const n = computeMyNumbers(data);

  return (
    <div className="scroll-quiet flex flex-1 flex-col gap-3 overflow-y-auto pb-6">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to Ops"
        className="flex items-center gap-1.5 self-start text-[12px] text-paper-muted"
      >
        <span>←</span> Ops
      </button>

      <div>
        <h2 className="font-serif text-[1.15rem] text-paper-ink">My Numbers</h2>
        <p className="mt-0.5 text-[0.8rem] text-paper-muted">
          Computed live from your real Waiting On, meeting, and task records - not tracked separately.
        </p>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Waiting On Turnaround
        </p>
        {n.waitingOnResolvedCount === 0 ? (
          <p className="text-[13px] italic text-paper-muted">Nothing resolved yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat value={`${n.avgResolutionDays}`} label="Avg Days" />
              <Stat value={`${n.fastestResolutionDays}`} label="Fastest" />
              <Stat value={`${n.slowestResolutionDays}`} label="Slowest" />
            </div>
            <p className="mt-3 border-t border-paper-border pt-2 text-[11.5px] text-paper-muted">
              {n.waitingOnResolvedCount} item{n.waitingOnResolvedCount === 1 ? "" : "s"} resolved, all time.
            </p>
          </>
        )}
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Meeting Agenda Follow-through
        </p>
        {n.agendaCompletionPct === null ? (
          <p className="text-[13px] italic text-paper-muted">No meetings with an agenda yet.</p>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-serif text-2xl text-paper-ink">{n.agendaCompletionPct}%</span>
              <span className="text-[11.5px] text-paper-muted">
                across {n.meetingsWithAgenda} meeting{n.meetingsWithAgenda === 1 ? "" : "s"}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-paper-surface2">
              <div
                className="h-full rounded-full bg-work transition-all"
                style={{ width: `${n.agendaCompletionPct}%` }}
              />
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Work Task Completion
        </p>
        {n.taskCompletionPct === null ? (
          <p className="text-[13px] italic text-paper-muted">No tasks logged yet.</p>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-serif text-2xl text-paper-ink">{n.taskCompletionPct}%</span>
              <span className="text-[11.5px] text-paper-muted">
                {n.completedTasks} of {n.totalTasks} tasks
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-paper-surface2">
              <div
                className="h-full rounded-full bg-sage transition-all"
                style={{ width: `${n.taskCompletionPct}%` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-serif text-lg text-paper-ink">{value}</div>
      <div className="mt-0.5 text-[0.6rem] uppercase tracking-wide text-paper-muted">{label}</div>
    </div>
  );
}
