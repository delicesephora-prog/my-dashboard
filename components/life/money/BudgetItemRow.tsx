"use client";

import { useState } from "react";
import { PaymentSchedule } from "@/lib/budget";
import { formatMoney } from "@/lib/finance";
import CheckCircle from "../../CheckCircle";

function ordinal(n: number): string {
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 === 1 && rem100 !== 11) return `${n}st`;
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`;
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`;
  return `${n}th`;
}

export type Slot = "first" | "second";

export default function BudgetItemRow({
  name,
  monthlyAmount,
  schedule,
  slots,
  slotDone,
  slotAmount,
  onRename,
  onChangeMonthlyAmount,
  onChangeDueDay,
  onChangeSplitAmount,
  onToggleSlot,
  onChangeSlotAmount,
  onDelete,
  accentClass,
  extraBadge,
}: {
  name: string;
  monthlyAmount: number;
  schedule: PaymentSchedule;
  slots: Slot[];
  slotDone: (slot: Slot) => boolean;
  slotAmount: (slot: Slot) => number;
  onRename: (v: string) => void;
  onChangeMonthlyAmount: (v: number) => void;
  onChangeDueDay: (day: number) => void;
  onChangeSplitAmount: (slot: Slot, v: number) => void;
  onToggleSlot: (slot: Slot) => void;
  onChangeSlotAmount: (slot: Slot, v: number) => void;
  onDelete: () => void;
  accentClass: string;
  extraBadge?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const allDone = slots.every((s) => slotDone(s));

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-paper-surface shadow-paper transition ${
        allDone ? "border-sage/40" : "border-paper-border"
      }`}
    >
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <div className="flex shrink-0 items-center gap-1.5">
          {slots.map((slot) => (
            <CheckCircle
              key={slot}
              done={slotDone(slot)}
              onToggle={() => onToggleSlot(slot)}
              accentClass={accentClass}
              size="sm"
              ariaLabel={
                slots.length > 1
                  ? `${slotDone(slot) ? "Undo" : "Mark paid"} ${slot === "first" ? "15th" : "30th"}`
                  : slotDone(slot)
                    ? "Mark unpaid"
                    : "Mark paid"
              }
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
        >
          <div className="min-w-0">
            <p className={`truncate text-[14px] ${allDone ? "text-paper-faint line-through" : "text-paper-ink"}`}>
              {name}
            </p>
            <p className="truncate text-[11px] text-paper-muted">
              {schedule.kind === "dueDay" && `Due ${ordinal(schedule.day)}`}
              {schedule.kind === "paydaySplit" &&
                `${formatMoney(schedule.firstAmount)} / ${formatMoney(schedule.secondAmount)} split`}
              {schedule.kind === "varies" && "Varies"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {extraBadge}
            <span className="text-[14px] text-paper-ink">{formatMoney(monthlyAmount)}</span>
          </div>
        </button>
      </div>

      {expanded && (
        <div className="animate-fade-in space-y-2.5 border-t border-paper-border px-3.5 py-3">
          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Name
            </p>
            <input
              value={name}
              onChange={(e) => onRename(e.target.value)}
              className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
            />
          </div>

          <div className="flex gap-2.5">
            <div className="flex-1">
              <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Monthly Amount
              </p>
              <input
                type="number"
                step="0.01"
                value={monthlyAmount}
                onChange={(e) => onChangeMonthlyAmount(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
              />
            </div>
            {schedule.kind === "dueDay" && (
              <div className="flex-1">
                <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                  Due Day
                </p>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={schedule.day}
                  onChange={(e) => onChangeDueDay(Number(e.target.value) || 1)}
                  className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
                />
              </div>
            )}
          </div>

          {schedule.kind === "paydaySplit" && (
            <div className="flex gap-2.5">
              <div className="flex-1">
                <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                  15th Half
                </p>
                <input
                  type="number"
                  step="0.01"
                  value={schedule.firstAmount}
                  onChange={(e) => onChangeSplitAmount("first", Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
                />
              </div>
              <div className="flex-1">
                <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                  30th Half
                </p>
                <input
                  type="number"
                  step="0.01"
                  value={schedule.secondAmount}
                  onChange={(e) => onChangeSplitAmount("second", Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2.5">
            {slots.map((slot) => (
              <div key={slot} className="flex-1">
                <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                  {slots.length > 1 ? `Paid ${slot === "first" ? "15th" : "30th"}` : "Actual Paid"}
                </p>
                <input
                  type="number"
                  step="0.01"
                  value={slotAmount(slot)}
                  onChange={(e) => onChangeSlotAmount(slot, Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-paper-faint underline underline-offset-2"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
