"use client";

import { useState } from "react";
import {
  ApprovalChain,
  Contact,
  MeetingNote,
  Reference as ReferenceData,
  SopEntry,
} from "@/lib/types";
import { todayKey } from "@/lib/date";
import ContactsTab from "./reference/ContactsTab";
import ApprovalChainsTab from "./reference/ApprovalChainsTab";
import SopLibraryTab from "./reference/SopLibraryTab";
import MeetingNotesTab from "./reference/MeetingNotesTab";

type Tab = "contacts" | "chains" | "sops" | "meetings";

const TABS: { key: Tab; label: string }[] = [
  { key: "contacts", label: "Contacts" },
  { key: "chains", label: "Approval Chains" },
  { key: "sops", label: "SOPs" },
  { key: "meetings", label: "Meetings" },
];

export default function Reference({
  reference,
  onChange,
}: {
  reference: ReferenceData;
  onChange: (updater: (r: ReferenceData) => ReferenceData) => void;
}) {
  const [tab, setTab] = useState<Tab>("contacts");

  function addContact() {
    const contact: Contact = {
      id: crypto.randomUUID(),
      name: "",
      position: "",
      department: "",
      email: "",
      phone: "",
      company: "",
      notes: "",
    };
    onChange((r) => ({ ...r, contacts: [contact, ...r.contacts] }));
  }

  function addChain() {
    const chain: ApprovalChain = {
      id: crypto.randomUUID(),
      name: "New Workflow",
      purpose: "",
      steps: "",
      responsiblePerson: "",
      requiredDocuments: "",
      expectedTurnaround: "",
      notes: "",
    };
    onChange((r) => ({ ...r, approvalChains: [...r.approvalChains, chain] }));
  }

  function addSop() {
    const sop: SopEntry = {
      id: crypto.randomUUID(),
      title: "",
      category: "",
      relatedProject: "",
      lastUpdated: todayKey(),
      body: "",
    };
    onChange((r) => ({ ...r, sops: [sop, ...r.sops] }));
  }

  function addMeeting() {
    const meeting: MeetingNote = {
      id: crypto.randomUUID(),
      date: todayKey(),
      meetingName: "",
      attendees: "",
      notes: "",
      actionItems: [],
    };
    onChange((r) => ({ ...r, meetingNotes: [meeting, ...r.meetingNotes] }));
  }

  return (
    <div className="scroll-quiet safe-bottom flex-1 overflow-y-auto">
      <div className="mb-3 flex gap-1.5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              tab === t.key
                ? "bg-work text-paper-surface"
                : "border border-paper-border bg-paper-surface text-paper-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "contacts" && (
        <ContactsTab
          contacts={reference.contacts}
          onAdd={addContact}
          onUpdate={(id, updater) =>
            onChange((r) => ({
              ...r,
              contacts: r.contacts.map((c) => (c.id === id ? updater(c) : c)),
            }))
          }
          onDelete={(id) =>
            onChange((r) => ({ ...r, contacts: r.contacts.filter((c) => c.id !== id) }))
          }
        />
      )}

      {tab === "chains" && (
        <ApprovalChainsTab
          chains={reference.approvalChains}
          onAdd={addChain}
          onUpdate={(id, updater) =>
            onChange((r) => ({
              ...r,
              approvalChains: r.approvalChains.map((c) => (c.id === id ? updater(c) : c)),
            }))
          }
          onDelete={(id) =>
            onChange((r) => ({
              ...r,
              approvalChains: r.approvalChains.filter((c) => c.id !== id),
            }))
          }
        />
      )}

      {tab === "sops" && (
        <SopLibraryTab
          sops={reference.sops}
          onAdd={addSop}
          onUpdate={(id, updater) =>
            onChange((r) => ({ ...r, sops: r.sops.map((s) => (s.id === id ? updater(s) : s)) }))
          }
          onDelete={(id) => onChange((r) => ({ ...r, sops: r.sops.filter((s) => s.id !== id) }))}
        />
      )}

      {tab === "meetings" && (
        <MeetingNotesTab
          meetingNotes={reference.meetingNotes}
          onAdd={addMeeting}
          onUpdate={(id, updater) =>
            onChange((r) => ({
              ...r,
              meetingNotes: r.meetingNotes.map((m) => (m.id === id ? updater(m) : m)),
            }))
          }
          onDelete={(id) =>
            onChange((r) => ({ ...r, meetingNotes: r.meetingNotes.filter((m) => m.id !== id) }))
          }
        />
      )}
    </div>
  );
}
