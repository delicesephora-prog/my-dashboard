"use client";

import { useState } from "react";
import { ApprovalChain } from "@/lib/types";

export default function ApprovalChainsTab({
  chains,
  onAdd,
  onUpdate,
  onDelete,
}: {
  chains: ApprovalChain[];
  onAdd: () => void;
  onUpdate: (id: string, updater: (c: ApprovalChain) => ApprovalChain) => void;
  onDelete: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = chains.find((c) => c.id === selectedId) ?? null;

  if (selected) {
    return (
      <ChainDetail
        chain={selected}
        onBack={() => setSelectedId(null)}
        onUpdate={(u) => onUpdate(selected.id, u)}
        onDelete={() => {
          onDelete(selected.id);
          setSelectedId(null);
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full bg-work px-3.5 py-1.5 text-xs font-medium text-paper-surface"
        >
          + Add Chain
        </button>
      </div>

      {chains.length === 0 ? (
        <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No approval chains yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {chains.map((chain) => (
            <button
              key={chain.id}
              type="button"
              onClick={() => setSelectedId(chain.id)}
              className="flex items-center justify-between rounded-xl border border-paper-border bg-paper-surface px-3.5 py-3 text-left shadow-paper"
            >
              <span className="text-[14.5px] text-paper-ink">{chain.name || "Untitled chain"}</span>
              <span className="text-paper-faint">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChainDetail({
  chain,
  onBack,
  onUpdate,
  onDelete,
}: {
  chain: ApprovalChain;
  onBack: () => void;
  onUpdate: (updater: (c: ApprovalChain) => ApprovalChain) => void;
  onDelete: () => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to approval chains"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-paper-border bg-paper-surface text-paper-muted"
        >
          ‹
        </button>
        <input
          value={chain.name}
          onChange={(e) => onUpdate((c) => ({ ...c, name: e.target.value }))}
          className="min-w-0 flex-1 bg-transparent font-serif text-[1.1rem] text-backdrop-ink outline-none"
        />
      </div>

      <div className="flex flex-col gap-3">
        <TextField
          label="Purpose"
          value={chain.purpose}
          onChange={(v) => onUpdate((c) => ({ ...c, purpose: v }))}
          rows={2}
          placeholder="What this workflow is for…"
        />
        <TextField
          label="Step-by-Step Sequence"
          value={chain.steps}
          onChange={(v) => onUpdate((c) => ({ ...c, steps: v }))}
          rows={5}
          placeholder={"1. First step…\n2. Next step…"}
        />
        <TextField
          label="Responsible Person"
          value={chain.responsiblePerson}
          onChange={(v) => onUpdate((c) => ({ ...c, responsiblePerson: v }))}
          rows={1}
        />
        <TextField
          label="Required Documents"
          value={chain.requiredDocuments}
          onChange={(v) => onUpdate((c) => ({ ...c, requiredDocuments: v }))}
          rows={2}
        />
        <TextField
          label="Expected Turnaround"
          value={chain.expectedTurnaround}
          onChange={(v) => onUpdate((c) => ({ ...c, expectedTurnaround: v }))}
          rows={1}
          placeholder="e.g. 3-5 business days"
        />
        <TextField
          label="Notes"
          value={chain.notes}
          onChange={(v) => onUpdate((c) => ({ ...c, notes: v }))}
          rows={2}
        />
        <button
          type="button"
          onClick={onDelete}
          className="self-start text-xs text-paper-faint underline underline-offset-2"
        >
          Delete this chain
        </button>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
  placeholder?: string;
}) {
  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
      <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
        {label}
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 p-2 text-[13.5px] leading-relaxed text-paper-ink outline-none placeholder:text-paper-faint"
      />
    </div>
  );
}
