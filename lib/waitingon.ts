import { dateKey, daysBetween } from "./date";
import { CadenceDepartment } from "./cadence";
import { remapLegacyDepartment } from "./department";

export type WaitingOnItem = {
  id: string;
  who: string;
  what: string;
  askedDate: string; // YYYY-MM-DD
  followUpDate: string; // "" or YYYY-MM-DD
  resolvedDate: string; // "" while still open
  notes: string;
  // Set when this item was also filed as a weekly Cadence reminder under a
  // department - the two stay linked so resolving/deleting this item cleans
  // up the reminder instead of leaving a stale checklist entry behind.
  department: CadenceDepartment | null;
  linkedCadenceItemId: string | null;
};

export type WaitingOnData = {
  items: WaitingOnItem[];
};

export function emptyWaitingOnData(): WaitingOnData {
  return { items: [] };
}

export function normalizeWaitingOnData(
  partial: Partial<WaitingOnData> | null | undefined
): WaitingOnData {
  return {
    items: Array.isArray(partial?.items)
      ? partial.items.map((i) => ({
          ...i,
          // See remapLegacyDepartment - folds any item filed under a
          // retired department name onto its current home.
          department: i.department ? remapLegacyDepartment(i.department) : null,
          linkedCadenceItemId: i.linkedCadenceItemId ?? null,
        }))
      : [],
  };
}

export function newWaitingOnItem(
  who: string,
  what: string,
  now: Date = new Date(),
  department: CadenceDepartment | null = null
): WaitingOnItem {
  return {
    id: crypto.randomUUID(),
    who,
    what,
    askedDate: dateKey(now),
    followUpDate: "",
    resolvedDate: "",
    notes: "",
    department,
    linkedCadenceItemId: null,
  };
}

export function openItems(data: WaitingOnData): WaitingOnItem[] {
  return data.items
    .filter((i) => !i.resolvedDate)
    .sort((a, b) => a.askedDate.localeCompare(b.askedDate));
}

export function daysOpen(item: WaitingOnItem, now: Date = new Date()): number {
  return Math.max(0, daysBetween(item.askedDate, dateKey(now)));
}

// Only flagged once a follow-up date was actually set and has passed -
// never guesses at a threshold on her behalf.
export function isOverdue(item: WaitingOnItem, now: Date = new Date()): boolean {
  if (item.resolvedDate) return false;
  if (!item.followUpDate) return false;
  return item.followUpDate < dateKey(now);
}

export function overdueItems(data: WaitingOnData, now: Date = new Date()): WaitingOnItem[] {
  return openItems(data).filter((i) => isOverdue(i, now));
}

export function resolveItem(data: WaitingOnData, id: string, now: Date = new Date()): WaitingOnData {
  return {
    ...data,
    items: data.items.map((i) => (i.id === id ? { ...i, resolvedDate: dateKey(now) } : i)),
  };
}

export function reopenItem(data: WaitingOnData, id: string): WaitingOnData {
  return {
    ...data,
    items: data.items.map((i) => (i.id === id ? { ...i, resolvedDate: "" } : i)),
  };
}

export function addItem(data: WaitingOnData, item: WaitingOnItem): WaitingOnData {
  return { ...data, items: [item, ...data.items] };
}

export function updateItem(
  data: WaitingOnData,
  id: string,
  updater: (i: WaitingOnItem) => WaitingOnItem
): WaitingOnData {
  return { ...data, items: data.items.map((i) => (i.id === id ? updater(i) : i)) };
}

export function deleteItem(data: WaitingOnData, id: string): WaitingOnData {
  return { ...data, items: data.items.filter((i) => i.id !== id) };
}
