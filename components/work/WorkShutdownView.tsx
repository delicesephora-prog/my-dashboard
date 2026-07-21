"use client";

import { useState } from "react";
import {
  WorkShutdownData,
  completionForDate,
  stepDone,
  stepProgress,
  toggleStepDone,
} from "@/lib/workshutdown";
import { dateKey } from "@/lib/date";
import { opsTipForDate, careerLessonForDate } from "@/lib/opswisdom";
import { CelebrationTier } from "@/lib/celebration";
import CheckCircle from "../CheckCircle";

export default function WorkShutdownView({
  workShutdown,
  onChange,
  onBack,
  onCelebrate,
}: {
  workShutdown: WorkShutdownData;
  onChange: (updater: (w: WorkShutdownData) => WorkShutdownData) => void;
  onBack: () => void;
  onCelebrate: (tier: CelebrationTier, message: string) => void;
}) {
  const now = new Date();
  const today = dateKey(now);
  const doneIds = new Set(workShutdown.days[today] ?? []);
  const { done, total } = completionForDate(workShutdown, now);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const tip = opsTipForDate(now);
  const lesson = careerLessonForDate(now);

  function toggleLeaf(id: string, currentlyDone: boolean) {
    onChange((w) => toggleStepDone(w, id, now));
    if (!currentlyDone && total > 0 && done + 1 === total) {
      onCelebrate("medium", "Work Shutdown complete. Well done.");
    }
  }

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
          <ul className="flex flex-col gap-1">
            {[...workShutdown.steps]
              .sort((a, b) => a.order - b.order)
              .map((step) => {
                const hasSubs = step.subSteps.length > 0;
                if (!hasSubs) {
                  const isDone = doneIds.has(step.id);
                  return (
                    <li key={step.id} className="flex items-center gap-2.5 py-1.5">
                      <CheckCircle
                        done={isDone}
                        onToggle={() => toggleLeaf(step.id, isDone)}
                        accentClass="bg-work"
                        size="sm"
                        ariaLabel={isDone ? "Mark not done" : "Mark done"}
                      />
                      <span
                        className={`min-w-0 flex-1 text-[14px] ${
                          isDone ? "text-paper-faint line-through" : "text-paper-ink"
                        }`}
                      >
                        {step.text}
                      </span>
                    </li>
                  );
                }

                const isDone = stepDone(step, doneIds);
                const progress = stepProgress(step, doneIds);
                const expanded = expandedId === step.id;
                return (
                  <li key={step.id} className="py-1">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : step.id)}
                      className="flex w-full items-center gap-2.5 py-0.5 text-left"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                          isDone
                            ? "border-transparent bg-work text-paper-surface"
                            : "border-paper-faint text-paper-muted"
                        }`}
                      >
                        {isDone ? "✓" : progress.done}
                      </span>
                      <span
                        className={`min-w-0 flex-1 text-[14px] ${
                          isDone ? "text-paper-faint line-through" : "text-paper-ink"
                        }`}
                      >
                        {step.text}
                      </span>
                      <span className="shrink-0 text-[10.5px] text-paper-muted">
                        {progress.done}/{progress.total}
                      </span>
                      <span className="shrink-0 text-paper-faint">{expanded ? "︿" : "﹀"}</span>
                    </button>
                    {expanded && (
                      <ul className="ml-[30px] mt-1 flex flex-col gap-1.5 border-l border-paper-border pl-3">
                        {[...step.subSteps]
                          .sort((a, b) => a.order - b.order)
                          .map((sub) => {
                            const subDone = doneIds.has(sub.id);
                            return (
                              <li key={sub.id} className="flex items-center gap-2.5">
                                <CheckCircle
                                  done={subDone}
                                  onToggle={() => toggleLeaf(sub.id, subDone)}
                                  accentClass="bg-work"
                                  size="sm"
                                  ariaLabel={subDone ? "Mark not done" : "Mark done"}
                                />
                                <span
                                  className={`min-w-0 flex-1 text-[13px] ${
                                    subDone ? "text-paper-faint line-through" : "text-paper-muted"
                                  }`}
                                >
                                  {sub.text}
                                </span>
                              </li>
                            );
                          })}
                      </ul>
                    )}
                  </li>
                );
              })}
          </ul>
        )}
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-gold">
          ✦ Ops Tip of the Day
        </p>
        <p className="text-[13.5px] leading-relaxed text-paper-ink">{tip.tip}</p>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <p className="mb-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-gold">
          ✦ Lesson for Tomorrow
        </p>
        <p className="text-[13.5px] leading-relaxed text-paper-ink">{lesson.lesson}</p>
      </div>

      {total > 0 && done === total && (
        <p className="text-center font-serif text-[0.95rem] italic text-sage">
          Shut down for the day. Well done.
        </p>
      )}
    </div>
  );
}
