"use client";

import { useState } from "react";
import { SopEntry } from "@/lib/types";

export default function SopLibraryTab({
  sops,
  onAdd,
  onUpdate,
  onDelete,
}: {
  sops: SopEntry[];
  onAdd: () => void;
  onUpdate: (id: string, updater: (s: SopEntry) => SopEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = sops.filter((s) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.relatedProject.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search procedures…"
          className="flex-1 rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[15px] text-paper-ink outline-none focus:border-work"
        />
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 rounded-xl bg-work px-3.5 py-2.5 text-xs font-medium text-paper-surface"
        >
          + Add
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
          {sops.length === 0 ? "No procedures yet." : "No matches."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((s) => (
            <SopRow key={s.id} sop={s} onUpdate={(u) => onUpdate(s.id, u)} onDelete={() => onDelete(s.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SopRow({
  sop,
  onUpdate,
  onDelete,
}: {
  sop: SopEntry;
  onUpdate: (updater: (s: SopEntry) => SopEntry) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-paper-border bg-paper-surface shadow-paper">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] text-paper-ink">{sop.title || "Untitled procedure"}</p>
          <p className="truncate text-[11px] text-paper-muted">
            {[sop.category, sop.relatedProject].filter(Boolean).join(" · ")}
            {sop.lastUpdated && ` · Updated ${sop.lastUpdated}`}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="animate-fade-in space-y-2.5 border-t border-paper-border px-3.5 py-3">
          <Field label="Title" value={sop.title} onChange={(v) => onUpdate((s) => ({ ...s, title: v }))} />
          <div className="flex gap-2.5">
            <Field
              label="Category"
              value={sop.category}
              onChange={(v) => onUpdate((s) => ({ ...s, category: v }))}
            />
            <Field
              label="Related Project"
              value={sop.relatedProject}
              onChange={(v) => onUpdate((s) => ({ ...s, relatedProject: v }))}
            />
          </div>
          <div className="w-[160px]">
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Last Updated
            </p>
            <input
              type="date"
              value={sop.lastUpdated}
              onChange={(e) => onUpdate((s) => ({ ...s, lastUpdated: e.target.value }))}
              className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
            />
          </div>
          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Body
            </p>
            <textarea
              value={sop.body}
              onChange={(e) => onUpdate((s) => ({ ...s, body: e.target.value }))}
              rows={6}
              placeholder="Write the procedure…"
              className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 p-2 text-[13.5px] leading-relaxed text-paper-ink outline-none placeholder:text-paper-faint"
            />
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-paper-faint underline underline-offset-2"
          >
            Delete procedure
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1">
      <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
        {label}
      </p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
      />
    </div>
  );
}
