"use client";

import { useState } from "react";
import {
  EventsData,
  addEvent,
  archiveEvent,
  newEvent,
  pastEvents,
  updateEvent,
  upcomingEvents,
} from "@/lib/events";
import { dateKey } from "@/lib/date";

export default function EventsView({
  events,
  onChange,
  onBack,
}: {
  events: EventsData;
  onChange: (updater: (e: EventsData) => EventsData) => void;
  onBack: () => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(dateKey(new Date()));
  const [time, setTime] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  const now = new Date();
  const upcoming = upcomingEvents(events, now);
  const past = pastEvents(events, now);

  function addNew() {
    if (!title.trim() || !date) return;
    onChange((data) => addEvent(data, newEvent(title.trim(), date, time)));
    setTitle("");
    setTime("");
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
        <h2 className="font-serif text-[1.15rem] text-paper-ink">Events</h2>
        <p className="mt-0.5 text-[0.8rem] text-paper-muted">
          Anything on the calendar that isn&apos;t a regular meeting.
        </p>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          className="mb-2 w-full rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[14px] text-paper-ink outline-none focus:border-work"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none"
          />
          <button
            type="button"
            onClick={addNew}
            className="shrink-0 rounded-lg bg-work px-4 py-2 text-[13px] font-medium text-paper-surface active:scale-95"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Upcoming
        </p>
        {upcoming.length === 0 ? (
          <p className="py-2 text-center font-serif text-[0.9rem] italic text-paper-muted">Nothing on the books.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.map((e) => (
              <EventRow
                key={e.id}
                title={e.title}
                date={e.date}
                time={e.time}
                notes={e.notes}
                expanded={expandedId === e.id}
                onToggle={() => setExpandedId(expandedId === e.id ? null : e.id)}
                onNotesChange={(v) => onChange((data) => updateEvent(data, e.id, (x) => ({ ...x, notes: v })))}
                onArchive={() => onChange((data) => archiveEvent(data, e.id))}
              />
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowPast((s) => !s)}
            className="self-start text-[11.5px] text-paper-muted underline decoration-paper-faint underline-offset-2"
          >
            {showPast ? "Hide" : "Show"} past ({past.length})
          </button>
          {showPast && (
            <div className="flex flex-col gap-2">
              {past.map((e) => (
                <EventRow
                  key={e.id}
                  title={e.title}
                  date={e.date}
                  time={e.time}
                  notes={e.notes}
                  expanded={expandedId === e.id}
                  onToggle={() => setExpandedId(expandedId === e.id ? null : e.id)}
                  onNotesChange={(v) => onChange((data) => updateEvent(data, e.id, (x) => ({ ...x, notes: v })))}
                  onArchive={() => onChange((data) => archiveEvent(data, e.id))}
                  muted
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EventRow({
  title,
  date,
  time,
  notes,
  expanded,
  onToggle,
  onNotesChange,
  onArchive,
  muted = false,
}: {
  title: string;
  date: string;
  time: string;
  notes: string;
  expanded: boolean;
  onToggle: () => void;
  onNotesChange: (v: string) => void;
  onArchive: () => void;
  muted?: boolean;
}) {
  return (
    <div className={`rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper ${muted ? "opacity-70" : ""}`}>
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-2 text-left">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-paper-ink">{title}</p>
          <p className="mt-0.5 text-[11.5px] text-paper-muted">
            {date}
            {time ? ` · ${time}` : ""}
          </p>
        </div>
        <span className="shrink-0 text-paper-faint">{expanded ? "︿" : "﹀"}</span>
      </button>
      {expanded && (
        <div className="mt-3 flex flex-col gap-2 border-t border-paper-border pt-3">
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Notes"
            rows={2}
            className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
          />
          <button type="button" onClick={onArchive} className="self-start text-[11px] text-paper-faint">
            Archive
          </button>
        </div>
      )}
    </div>
  );
}
