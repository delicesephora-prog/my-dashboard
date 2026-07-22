"use client";

import { useState } from "react";
import {
  AssistantData,
  MEMORY_FACT_CATEGORIES,
  MEMORY_FACT_CATEGORY_LABELS,
  MemoryFact,
  MemoryFactCategory,
  addMemoryFact,
  deleteMemoryFact,
  updateMemoryFact,
} from "@/lib/assistant";

export default function MemoryScreen({
  assistant,
  onChange,
  onClose,
}: {
  assistant: AssistantData;
  onChange: (updater: (a: AssistantData) => AssistantData) => void;
  onClose: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftCategory, setDraftCategory] = useState<MemoryFactCategory>("note");

  function submitAdd() {
    const text = draftText.trim();
    if (!text) return;
    onChange((a) => addMemoryFact(a, text, draftCategory));
    setDraftText("");
    setAdding(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper-surface animate-fade-in">
      <div className="safe-top flex items-center justify-between px-5 pb-2 pt-3">
        <p className="font-serif text-[1.1rem] text-paper-ink">What She Knows</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-paper-surface2 px-3.5 py-1.5 text-sm font-medium text-paper-muted"
        >
          Done
        </button>
      </div>

      <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto px-5 pb-4">
        <div className="flex flex-col gap-3">
          <p className="text-[13px] leading-relaxed text-paper-muted">
            What she&apos;s picked up about you as you talk - preferences, people, patterns. Edit or remove
            anything, or tell her to &quot;forget&quot; something directly in chat.
          </p>

          {assistant.memory.facts.length === 0 ? (
            <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
              Nothing yet - she&apos;ll fill this in as you talk.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {assistant.memory.facts.map((f) => (
                <FactRow
                  key={f.id}
                  fact={f}
                  onSave={(text, category) =>
                    onChange((a) => updateMemoryFact(a, f.id, (x) => ({ ...x, text, category, updatedAt: new Date().toISOString() })))
                  }
                  onDelete={() => onChange((a) => deleteMemoryFact(a, f.id))}
                />
              ))}
            </ul>
          )}

          {adding ? (
            <div className="flex flex-col gap-2 rounded-xl2 border border-paper-border bg-paper-surface2 p-3">
              <input
                autoFocus
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitAdd()}
                placeholder="Something to remember…"
                className="rounded-lg border border-paper-border bg-paper-surface px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
              />
              <select
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value as MemoryFactCategory)}
                className="rounded-lg border border-paper-border bg-paper-surface px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
              >
                {MEMORY_FACT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {MEMORY_FACT_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setAdding(false)} className="text-[12px] text-paper-muted">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitAdd}
                  className="rounded-full bg-life px-3 py-1 text-[12px] font-medium text-paper-surface"
                >
                  Add
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="rounded-xl border border-life py-2.5 text-[13px] font-medium text-life"
            >
              + Add Something Yourself
            </button>
          )}

          {assistant.memory.summaries.length > 0 && (
            <div className="mt-2 border-t border-paper-border pt-3">
              <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
                Recent Conversations
              </p>
              <ul className="flex flex-col gap-2">
                {assistant.memory.summaries.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-xl border border-paper-border bg-paper-surface p-3 text-[12.5px] leading-relaxed text-paper-ink shadow-paper"
                  >
                    {s.summary}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FactRow({
  fact,
  onSave,
  onDelete,
}: {
  fact: MemoryFact;
  onSave: (text: string, category: MemoryFactCategory) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(fact.text);
  const [category, setCategory] = useState(fact.category);

  function save() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSave(trimmed, category);
    setEditing(false);
  }

  return (
    <li className="rounded-xl2 border border-paper-border bg-paper-surface p-3 shadow-paper">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 rounded-full bg-life-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-life">
          {MEMORY_FACT_CATEGORY_LABELS[fact.category]}
        </span>
        <button
          type="button"
          onClick={() => {
            setText(fact.text);
            setCategory(fact.category);
            setEditing((v) => !v);
          }}
          className="min-w-0 flex-1 text-left text-[13.5px] leading-snug text-paper-ink"
        >
          {fact.text}
        </button>
      </div>

      {editing && (
        <div className="mt-2.5 flex flex-col gap-2 border-t border-paper-border pt-2.5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MemoryFactCategory)}
            className="rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-1.5 text-[13px] text-paper-ink outline-none"
          >
            {MEMORY_FACT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {MEMORY_FACT_CATEGORY_LABELS[c]}
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
              <button type="button" onClick={save} className="rounded-full bg-life px-3 py-1 text-[12px] font-medium text-paper-surface">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
