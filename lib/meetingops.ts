import { dateKey } from "./date";

export type MeetingAgendaItem = {
  id: string;
  text: string;
  done: boolean;
};

export type Meeting = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // "" or "HH:MM" 24h
  attendees: string; // free text
  agenda: MeetingAgendaItem[];
  notes: string;
  actionItems: string;
  archived: boolean;
};

export type MeetingOpsData = {
  meetings: Meeting[];
};

export function emptyMeetingOpsData(): MeetingOpsData {
  return { meetings: [] };
}

export function normalizeMeetingOpsData(
  partial: Partial<MeetingOpsData> | null | undefined
): MeetingOpsData {
  return { meetings: Array.isArray(partial?.meetings) ? partial.meetings : [] };
}

export function newMeeting(title: string, date: string, time: string): Meeting {
  return {
    id: crypto.randomUUID(),
    title,
    date,
    time,
    attendees: "",
    agenda: [],
    notes: "",
    actionItems: "",
    archived: false,
  };
}

// Sortable "YYYY-MM-DD HH:MM" key - lexicographic order matches chronological
// order directly, with untimed meetings sorting first within their date.
function dateTimeKey(m: Meeting): string {
  return `${m.date} ${m.time || "00:00"}`;
}

export function upcomingMeetings(data: MeetingOpsData, now: Date = new Date()): Meeting[] {
  const today = dateKey(now);
  return data.meetings
    .filter((m) => !m.archived && m.date >= today)
    .sort((a, b) => dateTimeKey(a).localeCompare(dateTimeKey(b)));
}

export function pastMeetings(data: MeetingOpsData, now: Date = new Date()): Meeting[] {
  const today = dateKey(now);
  return data.meetings
    .filter((m) => !m.archived && m.date < today)
    .sort((a, b) => dateTimeKey(b).localeCompare(dateTimeKey(a)));
}

export function nextMeeting(data: MeetingOpsData, now: Date = new Date()): Meeting | null {
  return upcomingMeetings(data, now)[0] ?? null;
}

export function addMeeting(data: MeetingOpsData, meeting: Meeting): MeetingOpsData {
  return { ...data, meetings: [meeting, ...data.meetings] };
}

export function updateMeeting(
  data: MeetingOpsData,
  id: string,
  updater: (m: Meeting) => Meeting
): MeetingOpsData {
  return { ...data, meetings: data.meetings.map((m) => (m.id === id ? updater(m) : m)) };
}

export function archiveMeeting(data: MeetingOpsData, id: string): MeetingOpsData {
  return updateMeeting(data, id, (m) => ({ ...m, archived: true }));
}

export function addAgendaItem(data: MeetingOpsData, meetingId: string, text: string): MeetingOpsData {
  return updateMeeting(data, meetingId, (m) => ({
    ...m,
    agenda: [...m.agenda, { id: crypto.randomUUID(), text, done: false }],
  }));
}

export function toggleAgendaItem(
  data: MeetingOpsData,
  meetingId: string,
  itemId: string
): MeetingOpsData {
  return updateMeeting(data, meetingId, (m) => ({
    ...m,
    agenda: m.agenda.map((a) => (a.id === itemId ? { ...a, done: !a.done } : a)),
  }));
}

export function deleteAgendaItem(
  data: MeetingOpsData,
  meetingId: string,
  itemId: string
): MeetingOpsData {
  return updateMeeting(data, meetingId, (m) => ({
    ...m,
    agenda: m.agenda.filter((a) => a.id !== itemId),
  }));
}
