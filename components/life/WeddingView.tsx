"use client";

import { useState } from "react";
import {
  BudgetItem,
  ChecklistItem,
  Guest,
  TimelineEvent,
  Vendor,
  WeddingData,
  daysUntilWedding,
} from "@/lib/wedding";
import ChecklistTab from "./wedding/ChecklistTab";
import VendorsTab from "./wedding/VendorsTab";
import GuestsTab from "./wedding/GuestsTab";
import BudgetTab from "./wedding/BudgetTab";
import TimelineTab from "./wedding/TimelineTab";

type Tab = "checklist" | "vendors" | "guests" | "budget" | "timeline";

const TABS: { key: Tab; label: string }[] = [
  { key: "checklist", label: "Checklist" },
  { key: "vendors", label: "Vendors" },
  { key: "guests", label: "Guests" },
  { key: "budget", label: "Budget" },
  { key: "timeline", label: "Timeline" },
];

export default function WeddingView({
  wedding,
  onChange,
}: {
  wedding: WeddingData;
  onChange: (updater: (w: WeddingData) => WeddingData) => void;
}) {
  const [tab, setTab] = useState<Tab>("checklist");
  const now = new Date();
  const days = daysUntilWedding(wedding, now);

  function addChecklistItem(text: string, dueDate: string | null) {
    const item: ChecklistItem = { id: crypto.randomUUID(), text, dueDate, done: false };
    onChange((w) => ({ ...w, checklist: [...w.checklist, item] }));
  }

  function addVendor() {
    const vendor: Vendor = {
      id: crypto.randomUUID(),
      name: "",
      category: "",
      contactName: "",
      phone: "",
      email: "",
      status: "researching",
      notes: "",
    };
    onChange((w) => ({ ...w, vendors: [vendor, ...w.vendors] }));
  }

  function addGuest() {
    const guest: Guest = {
      id: crypto.randomUUID(),
      name: "",
      group: "",
      rsvp: "pending",
      plusOne: false,
      notes: "",
    };
    onChange((w) => ({ ...w, guests: [guest, ...w.guests] }));
  }

  function addBudgetItem(category: string, estimated: number) {
    const item: BudgetItem = { id: crypto.randomUUID(), category, estimated, actual: 0 };
    onChange((w) => ({ ...w, budget: [...w.budget, item] }));
  }

  function addTimelineEvent(time: string, text: string) {
    const event: TimelineEvent = { id: crypto.randomUUID(), time, text };
    onChange((w) => ({ ...w, timeline: [...w.timeline, event] }));
  }

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="mb-3 flex items-center justify-between gap-3 rounded-xl2 border border-paper-border bg-paper-surface p-4 shadow-paper">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
            Wedding
          </p>
          <input
            type="date"
            value={wedding.weddingDate ?? ""}
            onChange={(e) => onChange((w) => ({ ...w, weddingDate: e.target.value || null }))}
            className="mt-1 rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1 text-[13px] text-paper-ink outline-none"
          />
        </div>
        {days !== null && (
          <div className="flex shrink-0 flex-col items-center">
            <span className="font-serif text-2xl text-work">{days}</span>
            <span className="text-[9.5px] uppercase tracking-wide text-paper-faint">
              {days === 1 ? "day to go" : "days to go"}
            </span>
          </div>
        )}
      </div>

      <div className="mb-3 flex gap-1.5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              tab === t.key
                ? "bg-life text-paper-surface"
                : "border border-paper-border bg-paper-surface text-paper-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "checklist" && (
        <ChecklistTab
          items={wedding.checklist}
          onAdd={addChecklistItem}
          onToggle={(id) =>
            onChange((w) => ({
              ...w,
              checklist: w.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)),
            }))
          }
          onDelete={(id) =>
            onChange((w) => ({ ...w, checklist: w.checklist.filter((c) => c.id !== id) }))
          }
        />
      )}

      {tab === "vendors" && (
        <VendorsTab
          vendors={wedding.vendors}
          onAdd={addVendor}
          onUpdate={(id, updater) =>
            onChange((w) => ({
              ...w,
              vendors: w.vendors.map((v) => (v.id === id ? updater(v) : v)),
            }))
          }
          onDelete={(id) =>
            onChange((w) => ({ ...w, vendors: w.vendors.filter((v) => v.id !== id) }))
          }
        />
      )}

      {tab === "guests" && (
        <GuestsTab
          guests={wedding.guests}
          onAdd={addGuest}
          onUpdate={(id, updater) =>
            onChange((w) => ({
              ...w,
              guests: w.guests.map((g) => (g.id === id ? updater(g) : g)),
            }))
          }
          onDelete={(id) => onChange((w) => ({ ...w, guests: w.guests.filter((g) => g.id !== id) }))}
        />
      )}

      {tab === "budget" && (
        <BudgetTab
          items={wedding.budget}
          onAdd={addBudgetItem}
          onUpdate={(id, updater) =>
            onChange((w) => ({
              ...w,
              budget: w.budget.map((b) => (b.id === id ? updater(b) : b)),
            }))
          }
          onDelete={(id) => onChange((w) => ({ ...w, budget: w.budget.filter((b) => b.id !== id) }))}
        />
      )}

      {tab === "timeline" && (
        <TimelineTab
          events={wedding.timeline}
          onAdd={addTimelineEvent}
          onDelete={(id) =>
            onChange((w) => ({ ...w, timeline: w.timeline.filter((e) => e.id !== id) }))
          }
        />
      )}
    </div>
  );
}
