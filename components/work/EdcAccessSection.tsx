"use client";

import { EdcAccessRow, EDC_STAGES } from "@/lib/types";
import StageStepper from "./StageStepper";

export default function EdcAccessSection({
  rows,
  onAdd,
  onUpdate,
  onDelete,
}: {
  rows: EdcAccessRow[];
  onAdd: () => void;
  onUpdate: (id: string, updater: (r: EdcAccessRow) => EdcAccessRow) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          EDC Access Tracker
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full bg-work px-3 py-1 text-xs font-medium text-paper-surface"
        >
          + Add
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="py-3 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No access requests tracked yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-paper-border bg-paper-surface2 p-3">
              <div className="mb-2.5 flex gap-2">
                <input
                  value={row.user}
                  onChange={(e) => onUpdate(row.id, (r) => ({ ...r, user: e.target.value }))}
                  placeholder="User…"
                  className="flex-1 rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
                />
                <input
                  value={row.site}
                  onChange={(e) => onUpdate(row.id, (r) => ({ ...r, site: e.target.value }))}
                  placeholder="Site…"
                  className="flex-1 rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
                />
              </div>
              <div className="mx-auto max-w-[220px]">
                <StageStepper
                  stages={EDC_STAGES}
                  completed={row.stages}
                  onToggle={(key) =>
                    onUpdate(row.id, (r) => ({
                      ...r,
                      stages: { ...r.stages, [key]: !r.stages[key as keyof typeof r.stages] },
                    }))
                  }
                />
              </div>
              <button
                type="button"
                onClick={() => onDelete(row.id)}
                className="mt-2 text-[11px] text-paper-faint underline underline-offset-2"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
