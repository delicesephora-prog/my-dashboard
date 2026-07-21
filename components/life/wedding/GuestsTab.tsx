"use client";

import { useState } from "react";
import { Guest, RsvpStatus, guestCounts } from "@/lib/wedding";

const RSVP_LABELS: Record<RsvpStatus, string> = { pending: "Pending", yes: "Yes", no: "No" };
const RSVP_COLORS: Record<RsvpStatus, string> = {
  pending: "border-paper-border text-paper-muted",
  yes: "border-sage/50 text-sage",
  no: "border-[#B5574A]/50 text-[#B5574A]",
};

export default function GuestsTab({
  guests,
  onAdd,
  onUpdate,
  onDelete,
}: {
  guests: Guest[];
  onAdd: () => void;
  onUpdate: (id: string, updater: (g: Guest) => Guest) => void;
  onDelete: (id: string) => void;
}) {
  const counts = guestCounts(guests);

  return (
    <div>
      <div className="mb-3 grid grid-cols-4 gap-2">
        <Stat value={counts.attending} label="Attending" />
        <Stat value={counts.yes} label="Yes" />
        <Stat value={counts.no} label="No" />
        <Stat value={counts.pending} label="Pending" />
      </div>

      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 rounded-xl bg-life px-3.5 py-2.5 text-xs font-medium text-paper-surface"
        >
          + Add Guest
        </button>
      </div>

      {guests.length === 0 ? (
        <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No guests yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {guests.map((g) => (
            <GuestRow key={g.id} guest={g} onUpdate={(u) => onUpdate(g.id, u)} onDelete={() => onDelete(g.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-paper-border bg-paper-surface p-2.5 text-center shadow-paper">
      <div className="font-serif text-lg text-paper-ink">{value}</div>
      <div className="mt-0.5 text-[0.58rem] uppercase tracking-wide text-paper-muted">{label}</div>
    </div>
  );
}

function GuestRow({
  guest,
  onUpdate,
  onDelete,
}: {
  guest: Guest;
  onUpdate: (updater: (g: Guest) => Guest) => void;
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
          <p className="truncate text-[14px] text-paper-ink">{guest.name || "Unnamed guest"}</p>
          <p className="truncate text-[11px] text-paper-muted">
            {[guest.group, guest.plusOne ? "+1" : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${RSVP_COLORS[guest.rsvp]}`}
        >
          {RSVP_LABELS[guest.rsvp]}
        </span>
      </button>

      {expanded && (
        <div className="animate-fade-in space-y-2.5 border-t border-paper-border px-3.5 py-3">
          <Field label="Name" value={guest.name} onChange={(v) => onUpdate((g) => ({ ...g, name: v }))} />
          <Field label="Group" value={guest.group} onChange={(v) => onUpdate((g) => ({ ...g, group: v }))} />
          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              RSVP
            </p>
            <div className="flex gap-1.5">
              {(Object.keys(RSVP_LABELS) as RsvpStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onUpdate((g) => ({ ...g, rsvp: s }))}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-[12px] font-medium transition ${
                    guest.rsvp === s
                      ? "border-life bg-life text-paper-surface"
                      : "border-paper-border text-paper-muted"
                  }`}
                >
                  {RSVP_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-paper-ink">
            <input
              type="checkbox"
              checked={guest.plusOne}
              onChange={(e) => onUpdate((g) => ({ ...g, plusOne: e.target.checked }))}
              className="h-4 w-4 accent-life"
            />
            Bringing a plus-one
          </label>
          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Notes
            </p>
            <textarea
              value={guest.notes}
              onChange={(e) => onUpdate((g) => ({ ...g, notes: e.target.value }))}
              rows={2}
              placeholder="Meal choice, allergies, seating notes…"
              className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 p-2 text-[13px] text-paper-ink outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-paper-faint underline underline-offset-2"
          >
            Delete guest
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
    <div>
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
