"use client";

import { useState } from "react";
import {
  CADENCE_DEPARTMENTS,
  CADENCE_FREQUENCIES,
  CADENCE_FREQUENCY_LABELS,
  CadenceData,
  CadenceDepartment,
  CadenceFrequency,
  CadenceItem,
  addCadenceItem,
  completedIdsFor,
  deleteCadenceItem,
  itemsFor,
  periodKeyFor,
  progressFor,
  reorderCadenceItem,
  toggleCadenceItem,
  updateCadenceItem,
} from "@/lib/cadence";
import CheckCircle from "../CheckCircle";

const FREQUENCY_ICONS: Record<CadenceFrequency, string> = {
  daily: "☀️",
  weekly: "🗓️",
  monthly: "📆",
  quarterly: "🧭",
};

export default function CadenceView({
  data,
  onChange,
  onStartSystemCheck,
}: {
  data: CadenceData;
  onChange: (updater: (c: CadenceData) => CadenceData) => void;
  onStartSystemCheck: () => void;
}) {
  const [frequency, setFrequency] = useState<CadenceFrequency | null>(null);
  const [department, setDepartment] = useState<CadenceDepartment | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  if (!frequency) {
    return (
      <div className="scroll-quiet flex flex-1 flex-col gap-3 overflow-y-auto pb-6">
        <div>
          <h2 className="font-serif text-[1.15rem] text-paper-ink">Cadence</h2>
          <p className="mt-0.5 text-[0.8rem] text-paper-muted">Your recurring work, by rhythm.</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {CADENCE_FREQUENCIES.map((freq) => {
            const { done, total } = progressFor(data, freq, null);
            return (
              <button
                key={freq}
                type="button"
                onClick={() => setFrequency(freq)}
                className="rounded-xl2 border border-paper-border bg-paper-surface p-4 text-left shadow-paper transition active:scale-[0.97]"
              >
                <span className="mb-1.5 block text-[22px]">{FREQUENCY_ICONS[freq]}</span>
                <div className="text-[14.5px] font-semibold uppercase tracking-wide text-paper-ink">
                  {CADENCE_FREQUENCY_LABELS[freq]}
                </div>
                <div className={`mt-1 text-[12px] ${total > 0 && done === total ? "font-semibold text-sage" : "text-paper-muted"}`}>
                  {total === 0 ? "nothing yet" : `${done}/${total} done`}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="scroll-quiet flex flex-1 flex-col gap-3 overflow-y-auto pb-6">
        <button
          type="button"
          onClick={() => setFrequency(null)}
          className="flex items-center gap-1.5 self-start text-[12px] text-paper-muted"
        >
          <span>←</span> Cadence
        </button>
        <div>
          <h2 className="font-serif text-[1.15rem] text-paper-ink">{CADENCE_FREQUENCY_LABELS[frequency]}</h2>
          <p className="mt-0.5 text-[0.8rem] text-paper-muted">Pick a department to see its tasks.</p>
        </div>
        <div className="flex flex-col gap-2">
          {CADENCE_DEPARTMENTS.map((dept) => {
            const { done, total } = progressFor(data, frequency, dept);
            return (
              <button
                key={dept}
                type="button"
                onClick={() => setDepartment(dept)}
                className="flex items-center justify-between rounded-xl2 border border-paper-border bg-paper-surface px-4 py-3 text-left shadow-paper transition active:scale-[0.98]"
              >
                <span className="text-[14px] text-paper-ink">{dept}</span>
                <span className={`text-[12px] ${total > 0 && done === total ? "font-semibold text-sage" : "text-paper-muted"}`}>
                  {total === 0 ? "no items" : `${done}/${total}`}
                </span>
              </button>
            );
          })}
        </div>
        {frequency === "monthly" && (
          <button
            type="button"
            onClick={onStartSystemCheck}
            className="mt-1 rounded-xl2 border border-work bg-paper-surface px-4 py-3 text-left shadow-paper transition active:scale-[0.98]"
          >
            <span className="text-[14px] font-medium text-work">Run System Check</span>
            <p className="mt-0.5 text-[12px] text-paper-muted">
              See what&apos;s getting used, hide what isn&apos;t, log what&apos;s annoying you.
            </p>
          </button>
        )}
      </div>
    );
  }

  const items = itemsFor(data, frequency, department);
  const completedIds = completedIdsFor(data, frequency, periodKeyFor(frequency));

  function addItem() {
    const text = draft.trim();
    if (!text || !department) return;
    onChange((c) => addCadenceItem(c, text, frequency!, department));
    setDraft("");
    setAdding(false);
  }

  return (
    <div className="scroll-quiet flex flex-1 flex-col gap-3 overflow-y-auto pb-6">
      <button
        type="button"
        onClick={() => setDepartment(null)}
        className="flex items-center gap-1.5 self-start text-[12px] text-paper-muted"
      >
        <span>←</span> {CADENCE_FREQUENCY_LABELS[frequency]}
      </button>
      <div>
        <h2 className="font-serif text-[1.15rem] text-paper-ink">{department}</h2>
        <p className="mt-0.5 text-[0.8rem] text-paper-muted">{CADENCE_FREQUENCY_LABELS[frequency]} recurring tasks</p>
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] italic text-paper-muted">Nothing here yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item, idx) => (
            <CadenceItemRow
              key={item.id}
              item={item}
              done={completedIds.has(item.id)}
              onToggle={() => onChange((c) => toggleCadenceItem(c, frequency, item.id))}
              onSave={(text, dept) =>
                onChange((c) => updateCadenceItem(c, item.id, (i) => ({ ...i, text, department: dept })))
              }
              onDelete={() => onChange((c) => deleteCadenceItem(c, item.id))}
              onMoveUp={idx > 0 ? () => onChange((c) => reorderCadenceItem(c, item.id, -1)) : undefined}
              onMoveDown={idx < items.length - 1 ? () => onChange((c) => reorderCadenceItem(c, item.id, 1)) : undefined}
            />
          ))}
        </ul>
      )}

      {adding ? (
        <div className="flex items-center gap-2 rounded-xl2 border border-paper-border bg-paper-surface p-3 shadow-paper">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="New recurring task…"
            className="min-w-0 flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
          />
          <button type="button" onClick={addItem} className="rounded-full bg-work px-3 py-1.5 text-[12px] font-medium text-paper-surface">
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setDraft("");
            }}
            className="text-[12px] text-paper-muted"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-full border border-work px-3.5 py-1.5 text-[12.5px] font-medium text-work"
        >
          + Add Item
        </button>
      )}
    </div>
  );
}

function CadenceItemRow({
  item,
  done,
  onToggle,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  item: CadenceItem;
  done: boolean;
  onToggle: () => void;
  onSave: (text: string, department: CadenceDepartment) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const [dept, setDept] = useState<CadenceDepartment>(item.department);

  function save() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSave(trimmed, dept);
    setEditing(false);
  }

  return (
    <li className="rounded-xl2 border border-paper-border bg-paper-surface px-3 py-2.5 shadow-paper">
      <div className="flex items-center gap-2.5">
        <CheckCircle
          done={done}
          onToggle={onToggle}
          accentClass="bg-work"
          size="sm"
          ariaLabel={done ? "Mark not done" : "Mark done"}
        />
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className={`flex min-w-0 flex-1 items-center gap-1.5 text-left text-[13.5px] ${
            done ? "text-paper-faint line-through" : "text-paper-ink"
          }`}
        >
          <span className="min-w-0 flex-1 truncate">{item.text}</span>
          {item.linkedWaitingOnId && (
            <span className="shrink-0 text-[10px] text-paper-faint" title="Linked to a Waiting On item">
              🔗
            </span>
          )}
        </button>
        <div className="flex shrink-0 items-center gap-0.5 text-paper-faint">
          {onMoveUp && (
            <button type="button" aria-label="Move up" onClick={onMoveUp} className="px-1 text-[13px]">
              ↑
            </button>
          )}
          {onMoveDown && (
            <button type="button" aria-label="Move down" onClick={onMoveDown} className="px-1 text-[13px]">
              ↓
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-2.5 flex flex-col gap-2 border-t border-paper-border pt-2.5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
          />
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value as CadenceDepartment)}
            className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
          >
            {CADENCE_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between">
            <button type="button" onClick={onDelete} className="text-[12px] text-paper-faint underline underline-offset-2">
              Delete
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setEditing(false)} className="text-[12px] text-paper-muted">
                Cancel
              </button>
              <button type="button" onClick={save} className="rounded-full bg-work px-3 py-1 text-[12px] font-medium text-paper-surface">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
