"use client";

import { useState } from "react";
import {
  PrincipalsData,
  activePrincipals,
  addPrincipal,
  archivePrincipal,
  newPrincipal,
  updatePrincipal,
} from "@/lib/principals";

export default function PrincipalsView({
  principals,
  onChange,
  onBack,
}: {
  principals: PrincipalsData;
  onChange: (updater: (p: PrincipalsData) => PrincipalsData) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [org, setOrg] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const list = activePrincipals(principals);

  function addNew() {
    if (!name.trim()) return;
    onChange((p) => addPrincipal(p, newPrincipal(name.trim(), role.trim(), org.trim())));
    setName("");
    setRole("");
    setOrg("");
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
        <h2 className="font-serif text-[1.15rem] text-paper-ink">Principals</h2>
        <p className="mt-0.5 text-[0.8rem] text-paper-muted">
          The key people you work with, and how to work with them well.
        </p>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="mb-2 w-full rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[14px] text-paper-ink outline-none focus:border-work"
        />
        <div className="mb-2 flex gap-2">
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role"
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
          />
          <input
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addNew();
            }}
            placeholder="Org"
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
          />
        </div>
        <button
          type="button"
          onClick={addNew}
          className="w-full rounded-lg bg-work py-2 text-[13px] font-medium text-paper-surface active:scale-95"
        >
          Add
        </button>
      </div>

      {list.length === 0 ? (
        <p className="py-3 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No principals saved yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((p) => {
            const expanded = expandedId === p.id;
            return (
              <div key={p.id} className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : p.id)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-paper-ink">{p.name}</p>
                    <p className="mt-0.5 truncate text-[11px] text-paper-muted">
                      {[p.role, p.org].filter(Boolean).join(" · ") || "No role or org set"}
                    </p>
                  </div>
                  <span className="shrink-0 text-paper-faint">{expanded ? "︿" : "﹀"}</span>
                </button>
                {expanded && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-paper-border pt-3">
                    <input
                      value={p.contactInfo}
                      onChange={(e) =>
                        onChange((data) => updatePrincipal(data, p.id, (x) => ({ ...x, contactInfo: e.target.value })))
                      }
                      placeholder="Contact info (email, phone...)"
                      className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
                    />
                    <textarea
                      value={p.notes}
                      onChange={(e) =>
                        onChange((data) => updatePrincipal(data, p.id, (x) => ({ ...x, notes: e.target.value })))
                      }
                      placeholder="How to work with them - background, preferences, context"
                      rows={3}
                      className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
                    />
                    <button
                      type="button"
                      onClick={() => onChange((data) => archivePrincipal(data, p.id))}
                      className="self-start text-[11px] text-paper-faint"
                    >
                      Archive
                    </button>
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
