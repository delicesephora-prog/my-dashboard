"use client";

import { WorkShutdownData, completionForDate, toggleStepDone } from "@/lib/workshutdown";
import { dateKey } from "@/lib/date";
import CheckCircle from "../CheckCircle";

export default function WorkShutdownView({
  workShutdown,
  onChange,
  onBack,
}: {
  workShutdown: WorkShutdownData;
  onChange: (updater: (w: WorkShutdownData) => WorkShutdownData) => void;
  onBack: () => void;
}) {
  const now = new Date();
  const today = dateKey(now);
  const doneIds = new Set(workShutdown.days[today] ?? []);
  const { done, total } = completionForDate(workShutdown, now);

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
        <h2 className="font-serif text-[1.15rem] text-paper-ink">Work Shutdown</h2>
        <p className="mt-0.5 text-[0.8rem] text-paper-muted">
          Close out the work day on purpose, before it just trails off.
        </p>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Today
          </p>
          <span className="text-[11px] text-paper-muted">
            {done}/{total}
          </span>
        </div>
        {total === 0 ? (
          <p className="text-[13px] italic text-paper-muted">No shutdown steps set up yet.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {[...workShutdown.steps]
              .sort((a, b) => a.order - b.order)
              .map((step) => {
                const stepDone = doneIds.has(step.id);
                return (
                  <li key={step.id} className="flex items-center gap-2.5">
                    <CheckCircle
                      done={stepDone}
                      onToggle={() => onChange((w) => toggleStepDone(w, step.id, now))}
                      accentClass="bg-work"
                      size="sm"
                      ariaLabel={stepDone ? "Mark not done" : "Mark done"}
                    />
                    <span
                      className={`min-w-0 flex-1 text-[14px] ${
                        stepDone ? "text-paper-faint line-through" : "text-paper-ink"
                      }`}
                    >
                      {step.text}
                    </span>
                  </li>
                );
              })}
          </ul>
        )}
      </div>

      {total > 0 && done === total && (
        <p className="text-center font-serif text-[0.95rem] italic text-sage">
          Shut down for the day. Well done.
        </p>
      )}
    </div>
  );
}
