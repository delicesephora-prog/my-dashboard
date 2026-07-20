"use client";

import { useState } from "react";
import {
  RoutineKey,
  RoutinesData,
  ROUTINE_COLORS,
  ROUTINE_ICONS,
  ROUTINE_KEYS,
  ROUTINE_LABELS,
  DAY_TYPE_LABELS,
  completionForDate,
  dayTypeForDate,
  logFor,
  stepsForDate,
  toggleStepDone,
} from "@/lib/routines";
import { dateKey } from "@/lib/date";
import ProgressRing from "../../ProgressRing";
import CheckCircle from "../../CheckCircle";
import GuidedRoutine from "./GuidedRoutine";
import ConsistencyChart from "./ConsistencyChart";

export default function RoutinesView({
  routinesData,
  onChange,
  onManage,
}: {
  routinesData: RoutinesData;
  onChange: (updater: (r: RoutinesData) => RoutinesData) => void;
  onManage: () => void;
}) {
  const [guided, setGuided] = useState<RoutineKey | null>(null);
  const [expanded, setExpanded] = useState<RoutineKey | null>(null);
  const now = new Date();
  const dayType = dayTypeForDate(now);
  const today = dateKey(now);

  function toggleStep(routineKey: RoutineKey, stepId: string) {
    onChange((r) => toggleStepDone(r, routineKey, stepId, now));
  }

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Routines
          </p>
          <p className="font-serif text-[1.05rem] text-paper-ink">
            Today: {DAY_TYPE_LABELS[dayType]}
          </p>
        </div>
        <button
          type="button"
          onClick={onManage}
          className="rounded-full border border-paper-border bg-paper-surface px-3 py-1.5 text-xs font-medium text-paper-muted"
        >
          Manage Routines
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {ROUTINE_KEYS.map((key) => {
          const steps = stepsForDate(routinesData.config, key, now);
          const { done, total, pct } = completionForDate(routinesData.config, routinesData, key, now);
          const log = logFor(routinesData, today);
          const doneIds = log.completedStepIds[key] ?? [];
          const color = ROUTINE_COLORS[key];
          const nextStepId = steps.find((s) => !doneIds.includes(s.id))?.id;

          return (
            <div
              key={key}
              className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper"
            >
              <div className="flex items-center gap-3">
                <ProgressRing pct={pct ?? 0} size={56} strokeWidth={5} color={color} />
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[1.05rem] text-paper-ink">
                    {ROUTINE_ICONS[key]} {ROUTINE_LABELS[key]}
                  </p>
                  <p className="text-xs text-paper-muted">
                    {total > 0 ? `${done} of ${total} steps` : "No steps yet"}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setGuided(key)}
                  className="flex-1 rounded-xl py-2.5 text-center text-[13px] font-medium text-paper-surface transition active:scale-[0.98]"
                  style={{ backgroundColor: color }}
                >
                  Start {ROUTINE_LABELS[key]} Routine
                </button>
                {total > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => (e === key ? null : key))}
                    aria-label={expanded === key ? "Collapse checklist" : "Expand checklist"}
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-paper-border text-paper-muted transition"
                  >
                    {expanded === key ? "︿" : "﹀"}
                  </button>
                )}
              </div>

              {expanded === key && steps.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2 border-t border-paper-border pt-3">
                  {steps.map((step) => (
                    <li
                      key={step.id}
                      className={`flex items-center gap-2.5 rounded-lg px-1.5 py-1 -mx-1.5 ${
                        step.id === nextStepId ? "bg-gold-soft/60" : ""
                      }`}
                    >
                      <CheckCircle
                        done={doneIds.includes(step.id)}
                        onToggle={() => toggleStep(key, step.id)}
                        accentClass="bg-life"
                        size="sm"
                        ariaLabel={doneIds.includes(step.id) ? "Mark not done" : "Mark done"}
                      />
                      <span
                        className={`min-w-0 flex-1 truncate text-[13px] ${
                          doneIds.includes(step.id) ? "text-paper-faint line-through" : "text-paper-ink"
                        }`}
                      >
                        {step.text}
                      </span>
                      {step.targetTime && (
                        <span className="shrink-0 text-[11px] text-paper-muted">{step.targetTime}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        <ConsistencyChart config={routinesData.config} data={routinesData} now={now} />
      </div>

      {guided && (
        <GuidedRoutine
          routineKey={guided}
          steps={stepsForDate(routinesData.config, guided, now)}
          doneIds={logFor(routinesData, today).completedStepIds[guided] ?? []}
          onToggleStep={(stepId) => toggleStep(guided, stepId)}
          onClose={() => setGuided(null)}
        />
      )}
    </div>
  );
}
