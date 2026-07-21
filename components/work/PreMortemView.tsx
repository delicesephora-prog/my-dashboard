"use client";

import { useState } from "react";
import {
  PreMortem,
  PreMortemData,
  addPreMortem,
  addRisk,
  archivePreMortem,
  activePreMortems,
  deleteRisk,
  newPreMortem,
  updatePreMortem,
  updateRisk,
} from "@/lib/premortem";
import { dateKey } from "@/lib/date";

export default function PreMortemView({
  preMortem,
  onChange,
  onBack,
}: {
  preMortem: PreMortemData;
  onChange: (updater: (p: PreMortemData) => PreMortemData) => void;
  onBack: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? preMortem.premortems.find((p) => p.id === selectedId) ?? null : null;

  if (selected) {
    return <PreMortemDetail premortem={selected} onChange={onChange} onBack={() => setSelectedId(null)} />;
  }

  return (
    <PreMortemList
      preMortem={preMortem}
      onChange={onChange}
      onOpen={setSelectedId}
      onBack={onBack}
    />
  );
}

function PreMortemList({
  preMortem,
  onChange,
  onOpen,
  onBack,
}: {
  preMortem: PreMortemData;
  onChange: (updater: (p: PreMortemData) => PreMortemData) => void;
  onOpen: (id: string) => void;
  onBack: () => void;
}) {
  const [projectName, setProjectName] = useState("");
  const list = activePreMortems(preMortem);

  function addNew() {
    if (!projectName.trim()) return;
    const p = newPreMortem(projectName.trim(), dateKey(new Date()));
    onChange((data) => addPreMortem(data, p));
    setProjectName("");
    onOpen(p.id);
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
        <h2 className="font-serif text-[1.15rem] text-paper-ink">Pre-Mortem</h2>
        <p className="mt-0.5 text-[0.8rem] text-paper-muted">
          Before it starts, imagine it failed. Name why, then plan around it.
        </p>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <div className="flex gap-2">
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addNew();
            }}
            placeholder="Project or initiative name"
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[14px] text-paper-ink outline-none focus:border-work"
          />
          <button
            type="button"
            onClick={addNew}
            className="shrink-0 rounded-lg bg-work px-4 py-2 text-[13px] font-medium text-paper-surface active:scale-95"
          >
            Start
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="py-3 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No pre-mortems run yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpen(p.id)}
              className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 text-left shadow-paper transition active:scale-[0.98]"
            >
              <p className="text-[14px] font-semibold text-paper-ink">{p.projectName}</p>
              <p className="mt-0.5 text-[11.5px] text-paper-muted">
                {p.date} · {p.risks.length} risk{p.risks.length === 1 ? "" : "s"} identified
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PreMortemDetail({
  premortem,
  onChange,
  onBack,
}: {
  premortem: PreMortem;
  onChange: (updater: (p: PreMortemData) => PreMortemData) => void;
  onBack: () => void;
}) {
  const [newRiskText, setNewRiskText] = useState("");

  function addNewRisk() {
    if (!newRiskText.trim()) return;
    onChange((data) => addRisk(data, premortem.id, newRiskText.trim()));
    setNewRiskText("");
  }

  return (
    <div className="scroll-quiet flex flex-1 flex-col gap-3 overflow-y-auto pb-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 self-start text-[12px] text-paper-muted"
      >
        <span>←</span> Pre-Mortem
      </button>

      <div>
        <h2 className="font-serif text-[1.15rem] text-paper-ink">{premortem.projectName}</h2>
        <p className="mt-0.5 text-[0.8rem] text-paper-muted">{premortem.date}</p>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          If this failed, why? What could go wrong?
        </p>
        {premortem.risks.length > 0 && (
          <div className="mb-2 flex flex-col gap-3">
            {premortem.risks.map((r) => (
              <div key={r.id} className="rounded-lg border border-paper-border bg-paper-surface2 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-[13.5px] text-paper-ink">{r.risk}</p>
                  <button
                    type="button"
                    onClick={() => onChange((data) => deleteRisk(data, premortem.id, r.id))}
                    aria-label="Delete risk"
                    className="shrink-0 text-paper-faint"
                  >
                    ×
                  </button>
                </div>
                <input
                  value={r.mitigation}
                  onChange={(e) =>
                    onChange((data) =>
                      updateRisk(data, premortem.id, r.id, (risk) => ({ ...risk, mitigation: e.target.value }))
                    )
                  }
                  placeholder="How to prevent or catch this early"
                  className="mt-2 w-full rounded-md border border-paper-border bg-paper-surface px-2.5 py-1.5 text-[12.5px] text-paper-ink outline-none focus:border-work"
                />
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={newRiskText}
            onChange={(e) => setNewRiskText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addNewRisk();
            }}
            placeholder="A way this could go wrong"
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
          />
          <button
            type="button"
            onClick={addNewRisk}
            className="shrink-0 rounded-lg bg-work px-3 py-2 text-[13px] font-medium text-paper-surface active:scale-95"
          >
            Add
          </button>
        </div>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Other Notes
        </p>
        <textarea
          value={premortem.notes}
          onChange={(e) =>
            onChange((data) => updatePreMortem(data, premortem.id, (p) => ({ ...p, notes: e.target.value })))
          }
          rows={3}
          className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
        />
      </div>

      <button
        type="button"
        onClick={() => {
          onChange((data) => archivePreMortem(data, premortem.id));
          onBack();
        }}
        className="self-start text-[11px] text-paper-faint"
      >
        Archive
      </button>
    </div>
  );
}
