"use client";

import { HealthNote } from "@/lib/health";

export default function NotesTab({
  notes,
  onAdd,
  onUpdate,
  onDelete,
}: {
  notes: HealthNote[];
  onAdd: () => void;
  onUpdate: (id: string, updater: (n: HealthNote) => HealthNote) => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...notes].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 rounded-xl bg-life px-3.5 py-2.5 text-xs font-medium text-paper-surface"
        >
          + Add Note
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No notes yet. A place for symptoms, questions for the doctor, anything worth remembering.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border border-paper-border bg-paper-surface p-3.5 shadow-paper"
            >
              <div className="mb-1.5 flex items-center justify-between">
                <input
                  type="date"
                  value={n.date}
                  onChange={(e) => onUpdate(n.id, (note) => ({ ...note, date: e.target.value }))}
                  className="rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1 text-[12px] text-paper-ink outline-none"
                />
                <button
                  type="button"
                  onClick={() => onDelete(n.id)}
                  className="text-xs text-paper-faint underline underline-offset-2"
                >
                  Delete
                </button>
              </div>
              <textarea
                value={n.text}
                onChange={(e) => onUpdate(n.id, (note) => ({ ...note, text: e.target.value }))}
                placeholder="What's going on..."
                rows={3}
                className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 p-2 text-[13px] leading-relaxed text-paper-ink outline-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
