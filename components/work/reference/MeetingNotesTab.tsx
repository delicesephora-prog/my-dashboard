"use client";

import { useState } from "react";
import { ActionItem, MeetingNote } from "@/lib/types";
import CheckCircle from "../../CheckCircle";

export default function MeetingNotesTab({
  meetingNotes,
  onAdd,
  onUpdate,
  onDelete,
}: {
  meetingNotes: MeetingNote[];
  onAdd: () => void;
  onUpdate: (id: string, updater: (m: MeetingNote) => MeetingNote) => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...meetingNotes].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full bg-work px-3.5 py-1.5 text-xs font-medium text-paper-surface"
        >
          + Add Meeting
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="py-4 text-center font-serif text-[0.9rem] italic text-paper-muted">
          No meeting notes yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((m) => (
            <MeetingRow
              key={m.id}
              meeting={m}
              onUpdate={(u) => onUpdate(m.id, u)}
              onDelete={() => onDelete(m.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MeetingRow({
  meeting,
  onUpdate,
  onDelete,
}: {
  meeting: MeetingNote;
  onUpdate: (updater: (m: MeetingNote) => MeetingNote) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [newAction, setNewAction] = useState("");
  const openActions = meeting.actionItems.filter((a) => !a.done).length;

  function addAction() {
    if (!newAction.trim()) return;
    const item: ActionItem = { id: crypto.randomUUID(), text: newAction.trim(), done: false };
    onUpdate((m) => ({ ...m, actionItems: [...m.actionItems, item] }));
    setNewAction("");
  }

  return (
    <div className="overflow-hidden rounded-xl border border-paper-border bg-paper-surface shadow-paper">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] text-paper-ink">
            {meeting.meetingName || "Untitled meeting"}
          </p>
          <p className="truncate text-[11px] text-paper-muted">
            {formatShortDate(meeting.date)}
            {openActions > 0 && ` · ${openActions} open action${openActions === 1 ? "" : "s"}`}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="animate-fade-in space-y-2.5 border-t border-paper-border px-3.5 py-3">
          <div className="flex gap-2.5">
            <div className="w-[150px]">
              <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Date
              </p>
              <input
                type="date"
                value={meeting.date}
                onChange={(e) => onUpdate((m) => ({ ...m, date: e.target.value }))}
                className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
              />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
                Meeting Name
              </p>
              <input
                value={meeting.meetingName}
                onChange={(e) => onUpdate((m) => ({ ...m, meetingName: e.target.value }))}
                className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Attendees
            </p>
            <input
              value={meeting.attendees}
              onChange={(e) => onUpdate((m) => ({ ...m, attendees: e.target.value }))}
              placeholder="Names, comma separated…"
              className="w-full rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
            />
          </div>

          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Notes
            </p>
            <textarea
              value={meeting.notes}
              onChange={(e) => onUpdate((m) => ({ ...m, notes: e.target.value }))}
              rows={3}
              className="w-full resize-none rounded-lg border border-paper-border bg-paper-surface2 p-2 text-[13.5px] leading-relaxed text-paper-ink outline-none"
            />
          </div>

          <div>
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-paper-muted">
              Action Items
            </p>
            <div className="flex flex-col gap-1.5">
              {meeting.actionItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <CheckCircle
                    done={item.done}
                    onToggle={() =>
                      onUpdate((m) => ({
                        ...m,
                        actionItems: m.actionItems.map((a) =>
                          a.id === item.id ? { ...a, done: !a.done } : a
                        ),
                      }))
                    }
                    accentClass="bg-work"
                    size="sm"
                    ariaLabel={item.done ? "Mark not done" : "Mark done"}
                  />
                  <span
                    className={`min-w-0 flex-1 truncate text-[13px] ${
                      item.done ? "text-paper-faint line-through" : "text-paper-ink"
                    }`}
                  >
                    {item.text}
                  </span>
                  <button
                    type="button"
                    aria-label="Delete action item"
                    onClick={() =>
                      onUpdate((m) => ({
                        ...m,
                        actionItems: m.actionItems.filter((a) => a.id !== item.id),
                      }))
                    }
                    className="shrink-0 text-paper-faint"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addAction();
                }}
                placeholder="Add an action item…"
                className="flex-1 rounded-lg border border-paper-border bg-paper-surface2 px-2 py-1.5 text-[13px] text-paper-ink outline-none"
              />
              <button
                type="button"
                onClick={addAction}
                className="rounded-lg bg-work px-2.5 text-sm text-paper-surface"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-paper-faint underline underline-offset-2"
          >
            Delete meeting
          </button>
        </div>
      )}
    </div>
  );
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return "No date";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
