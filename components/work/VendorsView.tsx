"use client";

import { useState } from "react";
import { WORK_TASK_CATEGORIES, WorkTaskCategory } from "@/lib/types";
import { VendorsData, activeVendors, addVendor, archiveVendor, newVendor, updateVendor } from "@/lib/vendors";

export default function VendorsView({
  vendors,
  onChange,
  onBack,
}: {
  vendors: VendorsData;
  onChange: (updater: (v: VendorsData) => VendorsData) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<WorkTaskCategory>("Vendor Management");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const list = activeVendors(vendors);

  function addNew() {
    if (!name.trim()) return;
    onChange((v) => addVendor(v, newVendor(name.trim(), category)));
    setName("");
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
        <h2 className="font-serif text-[1.15rem] text-backdrop-ink">Vendors</h2>
        <p className="mt-0.5 text-[0.8rem] text-backdrop-muted">Contacts you work with, saved by category.</p>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <div className="mb-2 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addNew();
            }}
            placeholder="Vendor or company name"
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
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as WorkTaskCategory)}
          className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
        >
          {WORK_TASK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <p className="py-3 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No vendors saved yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((v) => {
            const expanded = expandedId === v.id;
            return (
              <div key={v.id} className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : v.id)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-paper-ink">{v.name}</p>
                    <p className="mt-0.5 text-[11px] text-paper-muted">{v.category}</p>
                  </div>
                  <span className="shrink-0 text-paper-faint">{expanded ? "︿" : "﹀"}</span>
                </button>
                {expanded && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-paper-border pt-3">
                    <input
                      value={v.contactName}
                      onChange={(e) =>
                        onChange((data) => updateVendor(data, v.id, (x) => ({ ...x, contactName: e.target.value })))
                      }
                      placeholder="Contact name"
                      className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
                    />
                    <input
                      value={v.email}
                      onChange={(e) =>
                        onChange((data) => updateVendor(data, v.id, (x) => ({ ...x, email: e.target.value })))
                      }
                      placeholder="Email"
                      className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
                    />
                    <input
                      value={v.phone}
                      onChange={(e) =>
                        onChange((data) => updateVendor(data, v.id, (x) => ({ ...x, phone: e.target.value })))
                      }
                      placeholder="Phone"
                      className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
                    />
                    <textarea
                      value={v.notes}
                      onChange={(e) =>
                        onChange((data) => updateVendor(data, v.id, (x) => ({ ...x, notes: e.target.value })))
                      }
                      placeholder="Notes"
                      rows={2}
                      className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
                    />
                    <button
                      type="button"
                      onClick={() => onChange((data) => archiveVendor(data, v.id))}
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
