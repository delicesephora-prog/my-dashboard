"use client";

import { useState } from "react";
import { TranslationDoc, TRANSLATION_STAGES } from "@/lib/types";
import StageStepper from "./StageStepper";

function overallStatus(doc: TranslationDoc): string {
  const order = TRANSLATION_STAGES.map((s) => s.key);
  let furthest = -1;
  order.forEach((key, i) => {
    if (doc.stages[key]) furthest = i;
  });
  if (furthest === -1) return "Not Started";
  if (furthest === order.length - 1) return "Complete";
  return TRANSLATION_STAGES[furthest].label;
}

export default function TranslationTrackerSection({
  docs,
  onAdd,
  onUpdate,
  onDelete,
}: {
  docs: TranslationDoc[];
  onAdd: () => void;
  onUpdate: (id: string, updater: (d: TranslationDoc) => TranslationDoc) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Translation Tracker
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full bg-work px-3 py-1 text-xs font-medium text-paper-surface"
        >
          + Add Document
        </button>
      </div>

      {docs.length === 0 ? (
        <p className="py-3 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No documents in translation.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {docs.map((doc) => (
            <DocRow
              key={doc.id}
              doc={doc}
              onUpdate={(u) => onUpdate(doc.id, u)}
              onDelete={() => onDelete(doc.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DocRow({
  doc,
  onUpdate,
  onDelete,
}: {
  doc: TranslationDoc;
  onUpdate: (updater: (d: TranslationDoc) => TranslationDoc) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-paper-border bg-paper-surface2 p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <input
          value={doc.documentName}
          onChange={(e) => onUpdate((d) => ({ ...d, documentName: e.target.value }))}
          placeholder="Document name…"
          className="min-w-0 flex-1 bg-transparent text-[14.5px] font-medium text-paper-ink outline-none placeholder:text-paper-faint placeholder:font-normal"
        />
        <span className="shrink-0 rounded-full bg-work/10 px-2 py-0.5 text-[10px] font-medium text-work">
          {overallStatus(doc)}
        </span>
      </div>

      <div className="mb-3 flex gap-2">
        <input
          value={doc.vendor}
          onChange={(e) => onUpdate((d) => ({ ...d, vendor: e.target.value }))}
          placeholder="Vendor…"
          className="flex-1 rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
        />
        <input
          value={doc.language}
          onChange={(e) => onUpdate((d) => ({ ...d, language: e.target.value }))}
          placeholder="Language…"
          className="w-[110px] rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
        />
      </div>

      <StageStepper
        stages={TRANSLATION_STAGES}
        completed={doc.stages}
        onToggle={(key) =>
          onUpdate((d) => ({
            ...d,
            stages: { ...d.stages, [key]: !d.stages[key as keyof typeof d.stages] },
          }))
        }
      />

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 text-[11px] text-paper-muted underline underline-offset-2"
      >
        {expanded ? "Hide notes" : "Notes"}
      </button>
      {expanded && (
        <div className="mt-2 space-y-2">
          <textarea
            value={doc.notes}
            onChange={(e) => onUpdate((d) => ({ ...d, notes: e.target.value }))}
            rows={2}
            className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface p-2 text-[13px] text-paper-ink outline-none"
          />
          <button
            type="button"
            onClick={onDelete}
            className="text-[11px] text-paper-faint underline underline-offset-2"
          >
            Delete document
          </button>
        </div>
      )}
    </div>
  );
}
