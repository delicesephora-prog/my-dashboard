"use client";

import { useState } from "react";
import { VENDOR_STATUS_LABELS, Vendor, VendorStatus } from "@/lib/wedding";

const STATUSES: VendorStatus[] = ["researching", "contacted", "booked", "paid"];

const STATUS_COLORS: Record<VendorStatus, string> = {
  researching: "border-paper-border text-paper-muted",
  contacted: "border-gold/50 text-gold",
  booked: "border-sage/50 text-sage",
  paid: "border-life/50 text-life",
};

export default function VendorsTab({
  vendors,
  onAdd,
  onUpdate,
  onDelete,
}: {
  vendors: Vendor[];
  onAdd: () => void;
  onUpdate: (id: string, updater: (v: Vendor) => Vendor) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 rounded-xl bg-life px-3.5 py-2.5 text-xs font-medium text-paper-surface"
        >
          + Add Vendor
        </button>
      </div>

      {vendors.length === 0 ? (
        <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No vendors yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {vendors.map((v) => (
            <VendorRow
              key={v.id}
              vendor={v}
              onUpdate={(u) => onUpdate(v.id, u)}
              onDelete={() => onDelete(v.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VendorRow({
  vendor,
  onUpdate,
  onDelete,
}: {
  vendor: Vendor;
  onUpdate: (updater: (v: Vendor) => Vendor) => void;
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
          <p className="truncate text-[14px] text-paper-ink">{vendor.name || "Unnamed vendor"}</p>
          <p className="truncate text-[11px] text-paper-muted">{vendor.category}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${STATUS_COLORS[vendor.status]}`}
        >
          {VENDOR_STATUS_LABELS[vendor.status]}
        </span>
      </button>

      {expanded && (
        <div className="animate-fade-in space-y-2.5 border-t border-paper-border px-3.5 py-3">
          <Field label="Name" value={vendor.name} onChange={(v) => onUpdate((x) => ({ ...x, name: v }))} />
          <Field
            label="Category"
            value={vendor.category}
            onChange={(v) => onUpdate((x) => ({ ...x, category: v }))}
          />
          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Status
            </p>
            <select
              value={vendor.status}
              onChange={(e) => onUpdate((x) => ({ ...x, status: e.target.value as VendorStatus }))}
              className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {VENDOR_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2.5">
            <Field
              label="Contact"
              value={vendor.contactName}
              onChange={(v) => onUpdate((x) => ({ ...x, contactName: v }))}
            />
            <Field
              label="Phone"
              value={vendor.phone}
              onChange={(v) => onUpdate((x) => ({ ...x, phone: v }))}
            />
          </div>
          <Field label="Email" value={vendor.email} onChange={(v) => onUpdate((x) => ({ ...x, email: v }))} />
          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Notes
            </p>
            <textarea
              value={vendor.notes}
              onChange={(e) => onUpdate((x) => ({ ...x, notes: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 p-2 text-[13px] text-paper-ink outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-paper-faint underline underline-offset-2"
          >
            Delete vendor
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
