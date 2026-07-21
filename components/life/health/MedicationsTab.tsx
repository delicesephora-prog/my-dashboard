"use client";

import { useState } from "react";
import { Medication } from "@/lib/health";

export default function MedicationsTab({
  medications,
  onAdd,
  onUpdate,
  onDelete,
}: {
  medications: Medication[];
  onAdd: () => void;
  onUpdate: (id: string, updater: (m: Medication) => Medication) => void;
  onDelete: (id: string) => void;
}) {
  const active = medications.filter((m) => m.active);
  const inactive = medications.filter((m) => !m.active);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 rounded-xl bg-life px-3.5 py-2.5 text-xs font-medium text-paper-surface"
        >
          + Add Medication
        </button>
      </div>

      {medications.length === 0 ? (
        <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No medications yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <Section label="Active" items={active} onUpdate={onUpdate} onDelete={onDelete} emptyText="None active." />
          {inactive.length > 0 && (
            <Section label="Inactive" items={inactive} onUpdate={onUpdate} onDelete={onDelete} emptyText="" />
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  label,
  items,
  onUpdate,
  onDelete,
  emptyText,
}: {
  label: string;
  items: Medication[];
  onUpdate: (id: string, updater: (m: Medication) => Medication) => void;
  onDelete: (id: string) => void;
  emptyText: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-faint">
        {label}
      </p>
      {items.length === 0 ? (
        <p className="text-[12.5px] italic text-paper-muted">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((m) => (
            <MedicationRow
              key={m.id}
              medication={m}
              onUpdate={(u) => onUpdate(m.id, u)}
              onDelete={() => onDelete(m.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MedicationRow({
  medication,
  onUpdate,
  onDelete,
}: {
  medication: Medication;
  onUpdate: (updater: (m: Medication) => Medication) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-paper-surface shadow-paper ${
        medication.active ? "border-paper-border" : "border-paper-border opacity-60"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] text-paper-ink">{medication.name || "Unnamed medication"}</p>
          <p className="truncate text-[11px] text-paper-muted">
            {[medication.dosage, medication.frequency].filter(Boolean).join(" · ")}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="animate-fade-in space-y-2.5 border-t border-paper-border px-3.5 py-3">
          <Field label="Name" value={medication.name} onChange={(v) => onUpdate((m) => ({ ...m, name: v }))} />
          <div className="flex gap-2.5">
            <Field
              label="Dosage"
              value={medication.dosage}
              onChange={(v) => onUpdate((m) => ({ ...m, dosage: v }))}
            />
            <Field
              label="Frequency"
              value={medication.frequency}
              onChange={(v) => onUpdate((m) => ({ ...m, frequency: v }))}
            />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-paper-ink">
            <input
              type="checkbox"
              checked={medication.active}
              onChange={(e) => onUpdate((m) => ({ ...m, active: e.target.checked }))}
              className="h-4 w-4 accent-life"
            />
            Currently taking
          </label>
          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Notes
            </p>
            <textarea
              value={medication.notes}
              onChange={(e) => onUpdate((m) => ({ ...m, notes: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 p-2 text-[13px] text-paper-ink outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-paper-faint underline underline-offset-2"
          >
            Delete medication
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
