"use client";

import { useState } from "react";
import {
  PaydayChecklistData,
  PaydayStep,
  completedStepIdsFor,
  currentPeriodKey,
  formatPayDate,
  isPeriodComplete,
  nextPeriodKey,
  paydayStreak,
  recentPeriods,
  toggleStepDone,
} from "@/lib/payday";
import CheckCircle from "../../CheckCircle";

const HISTORY_COUNT = 8;

function AmountInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (n: number | null) => void;
}) {
  return (
    <input
      type="number"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      placeholder="$"
      className="w-16 rounded-md border border-transparent bg-transparent px-1 text-right text-[13px] text-paper-muted outline-none transition-colors focus:border-paper-border focus:bg-paper-surface2"
    />
  );
}

export default function PaydayChecklistSection({
  data,
  onChange,
}: {
  data: PaydayChecklistData;
  onChange: (updater: (d: PaydayChecklistData) => PaydayChecklistData) => void;
}) {
  const [editingAnchor, setEditingAnchor] = useState(false);
  const now = new Date();
  const periodKey = currentPeriodKey(data.anchorDate, now);
  const streak = paydayStreak(data, data.anchorDate, now);

  function updateSteps(next: PaydayStep[]) {
    onChange((d) => ({ ...d, steps: next }));
  }

  function addStep() {
    const step: PaydayStep = {
      id: crypto.randomUUID(),
      text: "New step",
      amount: null,
      order: data.steps.length,
    };
    updateSteps([...data.steps, step]);
  }

  function updateStep(id: string, updater: (s: PaydayStep) => PaydayStep) {
    updateSteps(data.steps.map((s) => (s.id === id ? updater(s) : s)));
  }

  function deleteStep(id: string) {
    updateSteps(data.steps.filter((s) => s.id !== id));
  }

  function moveStep(id: string, direction: -1 | 1) {
    const steps = [...data.steps].sort((a, b) => a.order - b.order);
    const idx = steps.findIndex((s) => s.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= steps.length) return;
    [steps[idx], steps[swapIdx]] = [steps[swapIdx], steps[idx]];
    updateSteps(steps.map((s, i) => ({ ...s, order: i })));
  }

  function toggleStep(stepId: string) {
    if (!periodKey) return;
    onChange((d) => toggleStepDone(d, periodKey, stepId));
  }

  const sortedSteps = [...data.steps].sort((a, b) => a.order - b.order);
  const doneIds = periodKey ? completedStepIdsFor(data, periodKey) : [];
  const history = recentPeriods(data.anchorDate, HISTORY_COUNT, now);

  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Payday Checklist
        </p>
        {streak > 0 && (
          <span className="text-xs font-medium text-work">
            🔥 {streak} clean payday{streak === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {!data.anchorDate || editingAnchor ? (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={data.anchorDate}
            onChange={(e) => onChange((d) => ({ ...d, anchorDate: e.target.value }))}
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
          />
          <button
            type="button"
            onClick={() => setEditingAnchor(false)}
            disabled={!data.anchorDate}
            className="rounded-full bg-life px-3 py-1.5 text-xs font-medium text-paper-surface disabled:opacity-40"
          >
            Save
          </button>
        </div>
      ) : (
        <div className="mb-3 flex items-center justify-between text-xs text-paper-muted">
          <span>
            This payday: <span className="text-paper-ink">{formatPayDate(periodKey)}</span> · Next:{" "}
            {formatPayDate(nextPeriodKey(data.anchorDate, now))}
          </span>
          <button type="button" onClick={() => setEditingAnchor(true)} className="underline underline-offset-2">
            Change date
          </button>
        </div>
      )}

      {data.anchorDate && !editingAnchor && (
        <>
          {sortedSteps.length === 0 ? (
            <p className="py-3 text-center text-xs italic text-paper-muted">
              No steps yet. Add your transfers, debt payment, and anything else you do every payday.
            </p>
          ) : (
            <ul className="mb-3 flex flex-col gap-2">
              {sortedSteps.map((step, i) => (
                <li key={step.id} className="flex items-center gap-2">
                  <CheckCircle
                    done={doneIds.includes(step.id)}
                    onToggle={() => toggleStep(step.id)}
                    accentClass="bg-life"
                    size="sm"
                    ariaLabel={doneIds.includes(step.id) ? "Mark not done" : "Mark done"}
                  />
                  <input
                    value={step.text}
                    onChange={(e) => updateStep(step.id, (s) => ({ ...s, text: e.target.value }))}
                    className="min-w-0 flex-1 bg-transparent text-[14px] text-paper-ink outline-none"
                  />
                  <AmountInput
                    value={step.amount}
                    onChange={(n) => updateStep(step.id, (s) => ({ ...s, amount: n }))}
                  />
                  <div className="flex shrink-0 items-center gap-1">
                    {i > 0 && (
                      <button
                        type="button"
                        aria-label="Move up"
                        onClick={() => moveStep(step.id, -1)}
                        className="text-paper-faint"
                      >
                        ↑
                      </button>
                    )}
                    {i < sortedSteps.length - 1 && (
                      <button
                        type="button"
                        aria-label="Move down"
                        onClick={() => moveStep(step.id, 1)}
                        className="text-paper-faint"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Delete step"
                      onClick={() => deleteStep(step.id)}
                      className="pl-0.5 text-paper-faint"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={addStep}
            className="mb-3 w-full rounded-xl border border-dashed border-paper-border py-2 text-center text-xs font-medium text-paper-muted"
          >
            + Add Step
          </button>

          {history.length > 0 && (
            <div className="border-t border-paper-border pt-3">
              <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-paper-muted">
                History
              </p>
              <div className="flex justify-between gap-1">
                {history.map((key) => {
                  const complete = isPeriodComplete(data, key);
                  const isCurrent = key === periodKey;
                  return (
                    <div key={key} className="flex flex-1 flex-col items-center gap-1">
                      <span
                        className="h-4 w-4 rounded-full"
                        style={{
                          backgroundColor: complete ? "#8FA37E" : "transparent",
                          border: isCurrent ? "2px solid #4B5A24" : "1px solid #E7DFCF",
                        }}
                        title={`${formatPayDate(key)}: ${complete ? "complete" : "incomplete"}`}
                      />
                      <span className="text-[9px] text-paper-faint">{formatPayDate(key)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
