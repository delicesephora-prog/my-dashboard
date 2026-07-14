"use client";

import { UberHealthRow, PAYMENT_STATUSES } from "@/lib/types";

const STATUS_DOT: Record<string, string> = {
  Pending: "#C7A46B",
  Paid: "#8FA37E",
  Overdue: "#B5574A",
};

export default function UberHealthSection({
  rows,
  onAdd,
  onUpdate,
  onDelete,
}: {
  rows: UberHealthRow[];
  onAdd: () => void;
  onUpdate: (id: string, updater: (r: UberHealthRow) => UberHealthRow) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Uber Health
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full bg-work px-3 py-1 text-xs font-medium text-paper-surface"
        >
          + Add Site
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="py-3 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No sites tracked yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-paper-border bg-paper-surface2 p-3">
              <div className="mb-2.5 flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_DOT[row.paymentStatus] }}
                  aria-hidden
                />
                <input
                  value={row.site}
                  onChange={(e) => onUpdate(row.id, (r) => ({ ...r, site: e.target.value }))}
                  placeholder="Site…"
                  className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-paper-ink outline-none placeholder:text-paper-faint placeholder:font-normal"
                />
              </div>

              <div className="mb-2.5 grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                    Credits
                  </p>
                  <input
                    type="number"
                    min={0}
                    value={row.credits}
                    onChange={(e) =>
                      onUpdate(row.id, (r) => ({ ...r, credits: Number(e.target.value) || 0 }))
                    }
                    className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                    Monthly Invoice
                  </p>
                  <input
                    type="number"
                    min={0}
                    value={row.monthlyInvoice}
                    onChange={(e) =>
                      onUpdate(row.id, (r) => ({ ...r, monthlyInvoice: Number(e.target.value) || 0 }))
                    }
                    className="w-full rounded-lg border border-paper-border bg-paper-surface px-2 py-1.5 text-[13px] text-paper-ink outline-none"
                  />
                </div>
              </div>

              <div className="mb-2.5 flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-[12px] text-paper-ink">
                  <input
                    type="checkbox"
                    checked={row.statementReceived}
                    onChange={(e) =>
                      onUpdate(row.id, (r) => ({ ...r, statementReceived: e.target.checked }))
                    }
                    className="h-3.5 w-3.5 accent-work"
                  />
                  Statement received
                </label>
                <select
                  value={row.paymentStatus}
                  onChange={(e) =>
                    onUpdate(row.id, (r) => ({
                      ...r,
                      paymentStatus: e.target.value as UberHealthRow["paymentStatus"],
                    }))
                  }
                  className="rounded-lg border border-paper-border bg-paper-surface px-2 py-1 text-[12px] text-paper-ink outline-none"
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={row.notes}
                onChange={(e) => onUpdate(row.id, (r) => ({ ...r, notes: e.target.value }))}
                placeholder="Notes…"
                rows={1}
                className="mb-2 w-full resize-none rounded-lg border border-paper-border bg-paper-surface p-2 text-[13px] text-paper-ink outline-none"
              />

              <button
                type="button"
                onClick={() => onDelete(row.id)}
                className="text-[11px] text-paper-faint underline underline-offset-2"
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
