"use client";

import { useState } from "react";
import { Contact } from "@/lib/types";

export default function ContactsTab({
  contacts,
  onAdd,
  onUpdate,
  onDelete,
}: {
  contacts: Contact[];
  onAdd: () => void;
  onUpdate: (id: string, updater: (c: Contact) => Contact) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = contacts.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.position.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts…"
          className="flex-1 rounded-xl border border-paper-border bg-paper-surface2 px-3.5 py-2.5 text-[15px] text-paper-ink outline-none focus:border-work"
        />
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 rounded-xl bg-work px-3.5 py-2.5 text-xs font-medium text-paper-surface"
        >
          + Add
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
          {contacts.length === 0 ? "No contacts yet." : "No matches."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((c) => (
            <ContactRow
              key={c.id}
              contact={c}
              onUpdate={(u) => onUpdate(c.id, u)}
              onDelete={() => onDelete(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ContactRow({
  contact,
  onUpdate,
  onDelete,
}: {
  contact: Contact;
  onUpdate: (updater: (c: Contact) => Contact) => void;
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
          <p className="truncate text-[14px] text-paper-ink">{contact.name || "Unnamed contact"}</p>
          <p className="truncate text-[11px] text-paper-muted">
            {[contact.position, contact.company].filter(Boolean).join(" · ")}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="animate-fade-in space-y-2.5 border-t border-paper-border px-3.5 py-3">
          <Field label="Name" value={contact.name} onChange={(v) => onUpdate((c) => ({ ...c, name: v }))} />
          <div className="flex gap-2.5">
            <Field
              label="Position"
              value={contact.position}
              onChange={(v) => onUpdate((c) => ({ ...c, position: v }))}
            />
            <Field
              label="Department"
              value={contact.department}
              onChange={(v) => onUpdate((c) => ({ ...c, department: v }))}
            />
          </div>
          <Field label="Company" value={contact.company} onChange={(v) => onUpdate((c) => ({ ...c, company: v }))} />
          <div className="flex gap-2.5">
            <Field label="Email" value={contact.email} onChange={(v) => onUpdate((c) => ({ ...c, email: v }))} />
            <Field label="Phone" value={contact.phone} onChange={(v) => onUpdate((c) => ({ ...c, phone: v }))} />
          </div>
          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Notes
            </p>
            <textarea
              value={contact.notes}
              onChange={(e) => onUpdate((c) => ({ ...c, notes: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 p-2 text-[13px] text-paper-ink outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-paper-faint underline underline-offset-2"
          >
            Delete contact
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
