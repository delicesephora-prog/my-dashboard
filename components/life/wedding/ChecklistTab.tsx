"use client";

import { useState } from "react";
import { ChecklistItem, checklistProgress } from "@/lib/wedding";
import CheckCircle from "../../CheckCircle";

export default function ChecklistTab({
  items,
  onAdd,
  onToggle,
  onDelete,
}: {
  items: ChecklistItem[];
  onAdd: (text: string, dueDate: string | null) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const { done, total } = checklistProgress(items);

  const pending = [...items]
    .filter((i) => !i.done)
    .sort((a, b) => (a.dueDate ?? "9999-99-99").localeCompare(b.dueDate ?? "9999-99-99"));
  const completed = items.filter((i) => i.done);

  function submit() {
    if (!text.trim()) return;
    onAdd(text.trim(), dueDate || null);
    setText("");
    setDueDate("");
  }

  return (
    <div>
      {total > 0 && (
        <p className="mb-3 text-[12px] text-paper-muted">
          {done} of {total} done
        </p>
      )}

      <div className="mb-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add a task…"
          className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2.5 py-2 text-[13px] text-paper-ink outline-none"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg border border-paper-border bg-paper-surface2 px-2 py-2 text-[12px] text-paper-ink outline-none"
        />
        <button
          type="button"
          onClick={submit}
          className="shrink-0 rounded-lg bg-life px-3 py-2 text-xs font-medium text-paper-surface"
        >
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No tasks yet.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {pending.map((item) => (
            <ChecklistRow key={item.id} item={item} onToggle={() => onToggle(item.id)} onDelete={() => onDelete(item.id)} />
          ))}
          {completed.length > 0 && (
            <>
              <p className="mb-1 mt-3 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-faint">
                Done
              </p>
              {completed.map((item) => (
                <ChecklistRow key={item.id} item={item} onToggle={() => onToggle(item.id)} onDelete={() => onDelete(item.id)} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ChecklistRow({
  item,
  onToggle,
  onDelete,
}: {
  item: ChecklistItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <CheckCircle
        done={item.done}
        onToggle={onToggle}
        accentClass="bg-life"
        size="sm"
        ariaLabel={item.done ? "Mark not done" : "Mark done"}
      />
      <span
        className={`min-w-0 flex-1 truncate text-[14px] ${
          item.done ? "text-paper-faint line-through" : "text-paper-ink"
        }`}
      >
        {item.text}
      </span>
      {item.dueDate && (
        <span className="shrink-0 text-[10.5px] text-paper-muted">{item.dueDate}</span>
      )}
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete task"
        className="shrink-0 text-paper-faint"
      >
        ×
      </button>
    </div>
  );
}
