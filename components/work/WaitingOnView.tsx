"use client";

import { useState } from "react";
import { DashboardData } from "@/lib/types";
import { CADENCE_DEPARTMENTS, CadenceDepartment, addCadenceItem, deleteCadenceItem } from "@/lib/cadence";
import {
  WaitingOnData,
  addItem,
  daysOpen,
  deleteItem,
  isOverdue,
  newWaitingOnItem,
  openItems,
  reopenItem,
  resolveItem,
} from "@/lib/waitingon";

export default function WaitingOnView({
  waitingOn,
  onChangeData,
  onBack,
}: {
  waitingOn: WaitingOnData;
  onChangeData: (updater: (d: DashboardData) => DashboardData) => void;
  onBack: () => void;
}) {
  const [who, setWho] = useState("");
  const [what, setWhat] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [department, setDepartment] = useState<CadenceDepartment | "">("");
  const [filter, setFilter] = useState<"all" | "overdue">("all");
  const [showResolved, setShowResolved] = useState(false);

  const now = new Date();
  const open = openItems(waitingOn);
  const overdue = open.filter((i) => isOverdue(i, now));
  const shown = filter === "overdue" ? overdue : open;
  const resolved = waitingOn.items
    .filter((i) => i.resolvedDate)
    .sort((a, b) => b.resolvedDate.localeCompare(a.resolvedDate));

  function addNew() {
    if (!who.trim() || !what.trim()) return;
    const item = newWaitingOnItem(who.trim(), what.trim(), now, department || null);
    item.followUpDate = followUpDate;

    onChangeData((d) => {
      let cadence = d.cadence;
      let linkedCadenceItemId: string | null = null;
      if (department) {
        cadence = addCadenceItem(
          cadence,
          `Follow up: ${item.what} (${item.who})`,
          "weekly",
          department,
          item.id
        );
        linkedCadenceItemId = cadence.items[cadence.items.length - 1].id;
      }
      return {
        ...d,
        waitingOn: addItem(d.waitingOn, { ...item, linkedCadenceItemId }),
        cadence,
      };
    });

    setWho("");
    setWhat("");
    setFollowUpDate("");
    setDepartment("");
  }

  // Resolving or deleting a Waiting On item that seeded a Cadence reminder
  // also removes that reminder - the follow-up is done, so there's nothing
  // left to nag her about on the weekly checklist.
  function resolve(id: string) {
    onChangeData((d) => {
      const target = d.waitingOn.items.find((i) => i.id === id);
      const cadence = target?.linkedCadenceItemId
        ? deleteCadenceItem(d.cadence, target.linkedCadenceItemId)
        : d.cadence;
      return { ...d, waitingOn: resolveItem(d.waitingOn, id, now), cadence };
    });
  }

  function del(id: string) {
    onChangeData((d) => {
      const target = d.waitingOn.items.find((i) => i.id === id);
      const cadence = target?.linkedCadenceItemId
        ? deleteCadenceItem(d.cadence, target.linkedCadenceItemId)
        : d.cadence;
      return { ...d, waitingOn: deleteItem(d.waitingOn, id), cadence };
    });
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
        <h2 className="font-serif text-[1.15rem] text-paper-ink">Waiting On</h2>
        <p className="mt-0.5 text-[0.8rem] text-paper-muted">
          Things you&apos;re waiting to hear back on, oldest first.
        </p>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <input
          value={who}
          onChange={(e) => setWho(e.target.value)}
          placeholder="Who (e.g. Legal — Marcus)"
          className="mb-2 w-full rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[14px] text-paper-ink outline-none focus:border-work"
        />
        <input
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addNew();
          }}
          placeholder="What you're waiting on"
          className="mb-2 w-full rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[14px] text-paper-ink outline-none focus:border-work"
        />
        <div className="mb-2 flex items-center gap-2">
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none"
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value as CadenceDepartment | "")}
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none"
          >
            <option value="">No Cadence reminder</option>
            {CADENCE_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
        {department && (
          <p className="mb-2 text-[10.5px] leading-snug text-paper-faint">
            Also adds a weekly Cadence reminder under {department} — it&apos;s removed automatically
            once you resolve or delete this.
          </p>
        )}
        <button
          type="button"
          onClick={addNew}
          className="w-full rounded-lg bg-work px-4 py-2 text-[13px] font-medium text-paper-surface active:scale-95"
        >
          Add
        </button>
      </div>

      <div className="flex gap-1.5">
        <FilterChip label={`All (${open.length})`} active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterChip
          label={`Overdue (${overdue.length})`}
          active={filter === "overdue"}
          onClick={() => setFilter("overdue")}
        />
      </div>

      {shown.length === 0 ? (
        <p className="py-3 text-center font-serif text-[0.9rem] italic text-paper-muted">
          {filter === "overdue" ? "Nothing overdue." : "Nothing pending — you're caught up."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map((item) => {
            const overdueFlag = isOverdue(item, now);
            const days = daysOpen(item, now);
            return (
              <div
                key={item.id}
                className={`rounded-xl2 border-l-[3px] border border-paper-border bg-paper-surface p-3.5 shadow-paper ${
                  overdueFlag ? "border-l-[#B5574A]" : "border-l-gold"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13.5px] font-semibold text-paper-ink">{item.who}</span>
                  <span
                    className={`shrink-0 text-[10.5px] ${
                      overdueFlag ? "font-semibold text-[#B5574A]" : "text-paper-faint"
                    }`}
                  >
                    {days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"}`}
                    {overdueFlag ? " — overdue" : ""}
                  </span>
                </div>
                <p className="mt-0.5 text-[12.5px] leading-snug text-paper-muted">{item.what}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-paper-faint">
                    Asked {item.askedDate}
                    {item.followUpDate ? ` · follow up ${item.followUpDate}` : ""}
                  </span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => resolve(item.id)} className="text-[11px] font-medium text-sage">
                      Resolved
                    </button>
                    <button type="button" onClick={() => del(item.id)} className="text-[11px] text-paper-faint">
                      Delete
                    </button>
                  </div>
                </div>
                {item.linkedCadenceItemId && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-work-soft px-2 py-0.5 text-[10px] font-medium text-work">
                    🔗 {item.department} · Cadence
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {resolved.length > 0 && (
        <button
          type="button"
          onClick={() => setShowResolved((s) => !s)}
          className="self-start text-[11.5px] text-paper-muted underline decoration-paper-faint underline-offset-2"
        >
          {showResolved ? "Hide" : "Show"} resolved ({resolved.length})
        </button>
      )}
      {showResolved && (
        <div className="flex flex-col gap-2">
          {resolved.map((item) => (
            <div
              key={item.id}
              className="rounded-xl2 border border-paper-border bg-paper-surface2 p-3 opacity-70"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-medium text-paper-muted line-through">{item.who}</span>
                <span className="shrink-0 text-[10px] text-paper-faint">
                  resolved {item.resolvedDate}
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-paper-faint">{item.what}</p>
              <button
                type="button"
                onClick={() => onChangeData((d) => ({ ...d, waitingOn: reopenItem(d.waitingOn, item.id) }))}
                className="mt-1.5 text-[11px] text-work"
              >
                Reopen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[11.5px] font-medium transition ${
        active ? "bg-work text-paper-surface" : "border border-paper-border bg-paper-surface text-paper-muted"
      }`}
    >
      {label}
    </button>
  );
}
