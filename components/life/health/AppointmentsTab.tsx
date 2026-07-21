"use client";

import { useState } from "react";
import { Appointment, pastAppointments, upcomingAppointments } from "@/lib/health";

export default function AppointmentsTab({
  appointments,
  onAdd,
  onUpdate,
  onDelete,
}: {
  appointments: Appointment[];
  onAdd: () => void;
  onUpdate: (id: string, updater: (a: Appointment) => Appointment) => void;
  onDelete: (id: string) => void;
}) {
  const upcoming = upcomingAppointments(appointments);
  const past = pastAppointments(appointments);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 rounded-xl bg-life px-3.5 py-2.5 text-xs font-medium text-paper-surface"
        >
          + Add Appointment
        </button>
      </div>

      {appointments.length === 0 ? (
        <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No appointments yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <Section
            label="Upcoming"
            items={upcoming}
            onUpdate={onUpdate}
            onDelete={onDelete}
            emptyText="Nothing upcoming."
          />
          <Section
            label="Past"
            items={past}
            onUpdate={onUpdate}
            onDelete={onDelete}
            emptyText="No past appointments."
          />
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
  items: Appointment[];
  onUpdate: (id: string, updater: (a: Appointment) => Appointment) => void;
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
          {items.map((a) => (
            <AppointmentRow
              key={a.id}
              appointment={a}
              onUpdate={(u) => onUpdate(a.id, u)}
              onDelete={() => onDelete(a.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentRow({
  appointment,
  onUpdate,
  onDelete,
}: {
  appointment: Appointment;
  onUpdate: (updater: (a: Appointment) => Appointment) => void;
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
          <p className="truncate text-[14px] text-paper-ink">
            {appointment.provider || "Unnamed appointment"}
          </p>
          <p className="truncate text-[11px] text-paper-muted">
            {[appointment.specialty, appointment.date, appointment.time]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="animate-fade-in space-y-2.5 border-t border-paper-border px-3.5 py-3">
          <Field
            label="Provider"
            value={appointment.provider}
            onChange={(v) => onUpdate((a) => ({ ...a, provider: v }))}
          />
          <div className="flex gap-2.5">
            <Field
              label="Specialty"
              value={appointment.specialty}
              onChange={(v) => onUpdate((a) => ({ ...a, specialty: v }))}
            />
            <Field
              label="Location"
              value={appointment.location}
              onChange={(v) => onUpdate((a) => ({ ...a, location: v }))}
            />
          </div>
          <div className="flex gap-2.5">
            <div className="flex-1">
              <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Date
              </p>
              <input
                type="date"
                value={appointment.date}
                onChange={(e) => onUpdate((a) => ({ ...a, date: e.target.value }))}
                className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
              />
            </div>
            <Field
              label="Time"
              value={appointment.time}
              onChange={(v) => onUpdate((a) => ({ ...a, time: v }))}
            />
          </div>
          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Notes
            </p>
            <textarea
              value={appointment.notes}
              onChange={(e) => onUpdate((a) => ({ ...a, notes: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 p-2 text-[13px] text-paper-ink outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-paper-faint underline underline-offset-2"
          >
            Delete appointment
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
