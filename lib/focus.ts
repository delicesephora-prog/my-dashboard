import { dateKey } from "./date";

export type FocusSession = {
  id: string;
  taskText: string;
  durationMinutes: number;
  startedAt: string; // ISO timestamp
  completedAt: string; // "" until the full duration is reached
};

export type FocusData = {
  sessions: FocusSession[];
};

export function emptyFocusData(): FocusData {
  return { sessions: [] };
}

export function normalizeFocusData(partial: Partial<FocusData> | null | undefined): FocusData {
  return { sessions: Array.isArray(partial?.sessions) ? partial.sessions : [] };
}

export function newFocusSession(taskText: string, durationMinutes: number, now: Date = new Date()): FocusSession {
  return {
    id: crypto.randomUUID(),
    taskText,
    durationMinutes,
    startedAt: now.toISOString(),
    completedAt: "",
  };
}

export function addSession(data: FocusData, session: FocusSession): FocusData {
  return { ...data, sessions: [session, ...data.sessions] };
}

export function completeSession(data: FocusData, id: string, now: Date = new Date()): FocusData {
  return {
    ...data,
    sessions: data.sessions.map((s) => (s.id === id ? { ...s, completedAt: now.toISOString() } : s)),
  };
}

export function completedSessionsToday(data: FocusData, now: Date = new Date()): FocusSession[] {
  const today = dateKey(now);
  return data.sessions.filter((s) => s.completedAt && dateKey(new Date(s.completedAt)) === today);
}

export function totalFocusMinutesToday(data: FocusData, now: Date = new Date()): number {
  return completedSessionsToday(data, now).reduce((sum, s) => sum + s.durationMinutes, 0);
}
