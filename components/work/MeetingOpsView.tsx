"use client";

import { useState } from "react";
import {
  Meeting,
  MeetingOpsData,
  addAgendaItem,
  addMeeting,
  archiveMeeting,
  deleteAgendaItem,
  newMeeting,
  pastMeetings,
  toggleAgendaItem,
  updateMeeting,
  upcomingMeetings,
} from "@/lib/meetingops";
import { dateKey } from "@/lib/date";
import CheckCircle from "../CheckCircle";

export default function MeetingOpsView({
  meetingOps,
  onChange,
  onBack,
}: {
  meetingOps: MeetingOpsData;
  onChange: (updater: (m: MeetingOpsData) => MeetingOpsData) => void;
  onBack: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const now = new Date();

  const selected = selectedId ? meetingOps.meetings.find((m) => m.id === selectedId) ?? null : null;

  if (selected) {
    return (
      <MeetingDetail
        meeting={selected}
        onChange={onChange}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <MeetingList
      meetingOps={meetingOps}
      now={now}
      onChange={onChange}
      onOpen={setSelectedId}
      onBack={onBack}
    />
  );
}

function MeetingList({
  meetingOps,
  now,
  onChange,
  onOpen,
  onBack,
}: {
  meetingOps: MeetingOpsData;
  now: Date;
  onChange: (updater: (m: MeetingOpsData) => MeetingOpsData) => void;
  onOpen: (id: string) => void;
  onBack: () => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(dateKey(now));
  const [time, setTime] = useState("");
  const [showPast, setShowPast] = useState(false);

  const upcoming = upcomingMeetings(meetingOps, now);
  const past = pastMeetings(meetingOps, now);

  function addNew() {
    if (!title.trim() || !date) return;
    const m = newMeeting(title.trim(), date, time);
    onChange((data) => addMeeting(data, m));
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
        <h2 className="font-serif text-[1.15rem] text-backdrop-ink">Meeting Ops</h2>
        <p className="mt-0.5 text-[0.8rem] text-backdrop-muted">Agendas, notes, and action items in one place.</p>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Meeting title"
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
          <p className="py-2 text-center font-serif text-[0.9rem] italic text-paper-muted">
            Nothing scheduled.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.map((m) => (
              <MeetingRow key={m.id} meeting={m} onClick={() => onOpen(m.id)} />
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
              {past.map((m) => (
                <MeetingRow key={m.id} meeting={m} onClick={() => onOpen(m.id)} muted />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MeetingRow({
  meeting,
  onClick,
  muted = false,
}: {
  meeting: Meeting;
  onClick: () => void;
  muted?: boolean;
}) {
  const doneCount = meeting.agenda.filter((a) => a.done).length;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl2 border border-paper-border bg-paper-surface p-3.5 text-left shadow-paper transition active:scale-[0.98] ${
        muted ? "opacity-70" : ""
      }`}
    >
      <p className="text-[14px] font-semibold text-paper-ink">{meeting.title}</p>
      <p className="mt-0.5 text-[11.5px] text-paper-muted">
        {meeting.date}
        {meeting.time ? ` · ${meeting.time}` : ""}
        {meeting.agenda.length > 0 ? ` · ${doneCount}/${meeting.agenda.length} agenda` : ""}
      </p>
    </button>
  );
}

function MeetingDetail({
  meeting,
  onChange,
  onBack,
}: {
  meeting: Meeting;
  onChange: (updater: (m: MeetingOpsData) => MeetingOpsData) => void;
  onBack: () => void;
}) {
  const [newAgendaText, setNewAgendaText] = useState("");

  function addAgenda() {
    if (!newAgendaText.trim()) return;
    onChange((data) => addAgendaItem(data, meeting.id, newAgendaText.trim()));
    setNewAgendaText("");
  }

  return (
    <div className="scroll-quiet flex flex-1 flex-col gap-3 overflow-y-auto pb-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 self-start text-[12px] text-paper-muted"
      >
        <span>←</span> Meeting Ops
      </button>

      <div>
        <h2 className="font-serif text-[1.15rem] text-backdrop-ink">{meeting.title}</h2>
        <p className="mt-0.5 text-[0.8rem] text-backdrop-muted">
          {meeting.date}
          {meeting.time ? ` · ${meeting.time}` : ""}
        </p>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Attendees
        </p>
        <input
          value={meeting.attendees}
          onChange={(e) =>
            onChange((data) => updateMeeting(data, meeting.id, (m) => ({ ...m, attendees: e.target.value })))
          }
          placeholder="Who's in the room"
          className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
        />
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Agenda
        </p>
        {meeting.agenda.length > 0 && (
          <ul className="mb-2 flex flex-col gap-2">
            {meeting.agenda.map((item) => (
              <li key={item.id} className="flex items-center gap-2.5">
                <CheckCircle
                  done={item.done}
                  onToggle={() => onChange((data) => toggleAgendaItem(data, meeting.id, item.id))}
                  accentClass="bg-work"
                  size="sm"
                  ariaLabel={item.done ? "Mark not done" : "Mark done"}
                />
                <span
                  className={`min-w-0 flex-1 text-[14px] ${
                    item.done ? "text-paper-faint line-through" : "text-paper-ink"
                  }`}
                >
                  {item.text}
                </span>
                <button
                  type="button"
                  onClick={() => onChange((data) => deleteAgendaItem(data, meeting.id, item.id))}
                  aria-label="Delete agenda item"
                  className="shrink-0 text-paper-faint"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            value={newAgendaText}
            onChange={(e) => setNewAgendaText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addAgenda();
            }}
            placeholder="Add agenda item"
            className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
          />
          <button
            type="button"
            onClick={addAgenda}
            className="shrink-0 rounded-lg bg-work px-3 py-2 text-[13px] font-medium text-paper-surface active:scale-95"
          >
            Add
          </button>
        </div>
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Notes
        </p>
        <textarea
          value={meeting.notes}
          onChange={(e) =>
            onChange((data) => updateMeeting(data, meeting.id, (m) => ({ ...m, notes: e.target.value })))
          }
          placeholder="What happened"
          rows={4}
          className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
        />
      </div>

      <div className="rounded-xl2 border border-paper-border bg-paper-surface p-3.5 shadow-paper">
        <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper-muted">
          Action Items
        </p>
        <textarea
          value={meeting.actionItems}
          onChange={(e) =>
            onChange((data) => updateMeeting(data, meeting.id, (m) => ({ ...m, actionItems: e.target.value })))
          }
          placeholder="Who owns what, by when"
          rows={3}
          className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 px-3 py-2 text-[13px] text-paper-ink outline-none focus:border-work"
        />
      </div>

      <button
        type="button"
        onClick={() => {
          onChange((data) => archiveMeeting(data, meeting.id));
          onBack();
        }}
        className="self-start text-[11px] text-paper-faint"
      >
        Archive meeting
      </button>
    </div>
  );
}
