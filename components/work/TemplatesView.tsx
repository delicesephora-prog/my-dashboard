"use client";

import { useState } from "react";
import {
  TemplatesData,
  activeTemplates,
  addTemplate,
  archiveTemplate,
  newTemplate,
  updateTemplate,
} from "@/lib/templates";

export default function TemplatesView({
  templates,
  onChange,
  onBack,
}: {
  templates: TemplatesData;
  onChange: (updater: (t: TemplatesData) => TemplatesData) => void;
  onBack: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const list = activeTemplates(templates);

  function addNew() {
    if (!title.trim()) return;
    const t = newTemplate(title.trim(), category.trim());
    onChange((data) => addTemplate(data, t));
    setTitle("");
    setExpandedId(t.id);
  }

  async function copyBody(id: string, body: string) {
    try {
      await navigator.clipboard.writeText(body);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      // Clipboard access can fail (permissions, insecure context) - the
      // template text is still fully visible and selectable either way.
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
        <h2 className="font-serif text-[1.15rem] text-paper-ink">Templates</h2>
        <p className="mt-0.5 text-[0.8rem] text-paper-muted">
          Reusable text - emails, recaps, follow-ups - ready to copy when you need it.
        </p>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Template title"
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[14px] text-paper-ink outline-none focus:border-work"
          />
          <button
            type="button"
            onClick={addNew}
            className="shrink-0 rounded-lg bg-work px-4 py-2 text-[13px] font-medium text-paper-surface active:scale-95"
          >
            Add
          </button>
        </div>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addNew();
          }}
          placeholder="Category (e.g. Vendor Follow-up)"
          className="mt-2 w-full rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
        />
      </div>

      {list.length === 0 ? (
        <p className="py-3 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No templates saved yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((t) => {
            const expanded = expandedId === t.id;
            return (
              <div key={t.id} className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : t.id)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-paper-ink">{t.title}</p>
                    {t.category && <p className="mt-0.5 text-[11px] text-paper-muted">{t.category}</p>}
                  </div>
                  <span className="shrink-0 text-paper-faint">{expanded ? "︿" : "﹀"}</span>
                </button>
                {expanded && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-paper-border pt-3">
                    <textarea
                      value={t.body}
                      onChange={(e) =>
                        onChange((data) => updateTemplate(data, t.id, (x) => ({ ...x, body: e.target.value })))
                      }
                      placeholder="Template text"
                      rows={5}
                      className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
                    />
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => copyBody(t.id, t.body)}
                        disabled={!t.body}
                        className="rounded-lg bg-work px-3 py-1.5 text-[12px] font-medium text-paper-surface active:scale-95 disabled:opacity-40"
                      >
                        {copiedId === t.id ? "Copied" : "Copy"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange((data) => archiveTemplate(data, t.id))}
                        className="text-[11px] text-paper-faint"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
