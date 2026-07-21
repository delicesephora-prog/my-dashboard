export type FireDrillEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  whatHappened: string;
  howResolved: string;
  lessonLearned: string;
};

export type FireDrillLogData = {
  entries: FireDrillEntry[];
};

export function emptyFireDrillLogData(): FireDrillLogData {
  return { entries: [] };
}

export function normalizeFireDrillLogData(
  partial: Partial<FireDrillLogData> | null | undefined
): FireDrillLogData {
  return { entries: Array.isArray(partial?.entries) ? partial.entries : [] };
}

export function newFireDrillEntry(title: string, date: string): FireDrillEntry {
  return {
    id: crypto.randomUUID(),
    date,
    title,
    whatHappened: "",
    howResolved: "",
    lessonLearned: "",
  };
}

export function sortedEntries(data: FireDrillLogData): FireDrillEntry[] {
  return [...data.entries].sort((a, b) => b.date.localeCompare(a.date));
}

export function entriesThisMonth(data: FireDrillLogData, now: Date = new Date()): FireDrillEntry[] {
  const year = now.getFullYear();
  const month = now.getMonth();
  return data.entries.filter((e) => {
    const [ey, em] = e.date.split("-").map(Number);
    return ey === year && em - 1 === month;
  });
}

export function addEntry(data: FireDrillLogData, entry: FireDrillEntry): FireDrillLogData {
  return { ...data, entries: [entry, ...data.entries] };
}

export function updateEntry(
  data: FireDrillLogData,
  id: string,
  updater: (e: FireDrillEntry) => FireDrillEntry
): FireDrillLogData {
  return { ...data, entries: data.entries.map((e) => (e.id === id ? updater(e) : e)) };
}

export function deleteEntry(data: FireDrillLogData, id: string): FireDrillLogData {
  return { ...data, entries: data.entries.filter((e) => e.id !== id) };
}
