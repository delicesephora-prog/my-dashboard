import { dateKey } from "./date";
import { weekKeyFor } from "./week";
import { monthKey } from "./finance";
import { quarterKeyFor } from "./quarter";
import { Department, DEPARTMENTS } from "./department";

export type CadenceFrequency = "daily" | "weekly" | "monthly" | "quarterly";

export const CADENCE_FREQUENCIES: CadenceFrequency[] = ["daily", "weekly", "monthly", "quarterly"];

export const CADENCE_FREQUENCY_LABELS: Record<CadenceFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

// Shared with Work's task category list (see lib/department.ts) - a
// Cadence item filed under "Finance" and a Work task under "Finance" are
// the same category, not two lookalike strings.
export type CadenceDepartment = Department;
export const CADENCE_DEPARTMENTS: CadenceDepartment[] = DEPARTMENTS;

export type CadenceItem = {
  id: string;
  text: string;
  frequency: CadenceFrequency;
  department: CadenceDepartment;
  order: number;
  // Set when this item was auto-filed from a Waiting On follow-up, so the
  // checklist can show it's tied to something she's waiting to hear back on.
  linkedWaitingOnId?: string | null;
};

export type CadenceData = {
  items: CadenceItem[];
  // Each keyed by that frequency's period key (YYYY-MM-DD for daily, the
  // Monday date for weekly, YYYY-MM for monthly, YYYY-Qn for quarterly) -
  // every period's entry is kept forever, never deleted, so history stays
  // intact even as the current period moves on.
  dailyLogs: Record<string, string[]>;
  weeklyLogs: Record<string, string[]>;
  monthlyLogs: Record<string, string[]>;
  quarterlyLogs: Record<string, string[]>;
};

function item(
  text: string,
  frequency: CadenceFrequency,
  department: CadenceDepartment,
  order: number
): CadenceItem {
  return { id: crypto.randomUUID(), text, frequency, department, order };
}

function seedItems(): CadenceItem[] {
  return [
    // Daily
    item("EDC data collection upload", "daily", "Clinical Operations", 0),
    item("Check Uber Health tracker for updates", "daily", "Clinical Operations", 1),
    item("Inbox scan — flag urgent", "daily", "Administration", 2),
    item("Check in with Silas — \"anything you need from me today?\"", "daily", "Executive Support", 3),
    item("CS-08 BP review — process new notifications", "daily", "Clinical Operations", 4),
    item("Update Seph/Silas tracker with new items", "daily", "Executive Support", 5),

    // Weekly
    item("Uber Health — reconcile new site trips/billing", "weekly", "Clinical Operations", 0),
    item("BOD calendar — check responses, follow up", "weekly", "Executive Support", 1),
    item("Weekly 1:1 with Silas", "weekly", "Executive Support", 2),
    item("Review open contracts/NDAs for movement", "weekly", "Vendor", 3),
    item("Vendor check-ins as needed — SwagMagic, GoLunaTech, Westin", "weekly", "Vendor", 4),
    item("Inbox cleanup — archive completed threads", "weekly", "Administration", 5),

    // Monthly
    item("Uber Health — consolidated billing, all sites", "monthly", "Clinical Operations", 0),
    item("Review CS-08 BP backlog — enrolled subjects not yet reviewed", "monthly", "Clinical Operations", 1),
    item("Update Accomplishment Record with the month's work", "monthly", "Career", 2),
    item("Review approval chain — new contract types to log", "monthly", "Vendor", 3),
    item("Check BACKBEAT enrollment vs Q3 2026 target", "monthly", "Clinical Operations", 4),

    // Quarterly - empty for now.
  ];
}

export function emptyCadenceData(): CadenceData {
  return { items: seedItems(), dailyLogs: {}, weeklyLogs: {}, monthlyLogs: {}, quarterlyLogs: {} };
}

export function normalizeCadenceData(partial: Partial<CadenceData> | null | undefined): CadenceData {
  const fallback = emptyCadenceData();
  if (!partial) return fallback;
  return {
    items: partial.items ?? fallback.items,
    dailyLogs: partial.dailyLogs ?? {},
    weeklyLogs: partial.weeklyLogs ?? {},
    monthlyLogs: partial.monthlyLogs ?? {},
    quarterlyLogs: partial.quarterlyLogs ?? {},
  };
}

export function periodKeyFor(frequency: CadenceFrequency, now: Date = new Date()): string {
  if (frequency === "daily") return dateKey(now);
  if (frequency === "weekly") return weekKeyFor(now);
  if (frequency === "monthly") return monthKey(now);
  return quarterKeyFor(now);
}

function logsFor(data: CadenceData, frequency: CadenceFrequency): Record<string, string[]> {
  if (frequency === "daily") return data.dailyLogs;
  if (frequency === "weekly") return data.weeklyLogs;
  if (frequency === "monthly") return data.monthlyLogs;
  return data.quarterlyLogs;
}

function withLogs(
  data: CadenceData,
  frequency: CadenceFrequency,
  logs: Record<string, string[]>
): CadenceData {
  if (frequency === "daily") return { ...data, dailyLogs: logs };
  if (frequency === "weekly") return { ...data, weeklyLogs: logs };
  if (frequency === "monthly") return { ...data, monthlyLogs: logs };
  return { ...data, quarterlyLogs: logs };
}

export function itemsFor(
  data: CadenceData,
  frequency: CadenceFrequency,
  department?: CadenceDepartment
): CadenceItem[] {
  return data.items
    .filter((i) => i.frequency === frequency && (!department || i.department === department))
    .sort((a, b) => a.order - b.order);
}

export function completedIdsFor(
  data: CadenceData,
  frequency: CadenceFrequency,
  periodKey: string
): Set<string> {
  return new Set(logsFor(data, frequency)[periodKey] ?? []);
}

export function toggleCadenceItem(
  data: CadenceData,
  frequency: CadenceFrequency,
  itemId: string,
  now: Date = new Date()
): CadenceData {
  const periodKey = periodKeyFor(frequency, now);
  const logs = logsFor(data, frequency);
  const current = logs[periodKey] ?? [];
  const next = current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId];
  return withLogs(data, frequency, { ...logs, [periodKey]: next });
}

export function progressFor(
  data: CadenceData,
  frequency: CadenceFrequency,
  department: CadenceDepartment | null,
  now: Date = new Date()
): { done: number; total: number } {
  const items = department ? itemsFor(data, frequency, department) : itemsFor(data, frequency);
  const doneIds = completedIdsFor(data, frequency, periodKeyFor(frequency, now));
  const done = items.filter((i) => doneIds.has(i.id)).length;
  return { done, total: items.length };
}

export function addCadenceItem(
  data: CadenceData,
  text: string,
  frequency: CadenceFrequency,
  department: CadenceDepartment,
  linkedWaitingOnId: string | null = null
): CadenceData {
  const order = itemsFor(data, frequency, department).length;
  const newItem: CadenceItem = {
    id: crypto.randomUUID(),
    text,
    frequency,
    department,
    order,
    linkedWaitingOnId,
  };
  return { ...data, items: [...data.items, newItem] };
}

export function updateCadenceItem(
  data: CadenceData,
  id: string,
  updater: (i: CadenceItem) => CadenceItem
): CadenceData {
  return { ...data, items: data.items.map((i) => (i.id === id ? updater(i) : i)) };
}

export function deleteCadenceItem(data: CadenceData, id: string): CadenceData {
  return { ...data, items: data.items.filter((i) => i.id !== id) };
}

// Reorders within the same frequency+department group only - that's the
// group actually shown together in the checklist.
export function reorderCadenceItem(data: CadenceData, id: string, direction: -1 | 1): CadenceData {
  const target = data.items.find((i) => i.id === id);
  if (!target) return data;
  const siblings = itemsFor(data, target.frequency, target.department);
  const idx = siblings.findIndex((i) => i.id === id);
  const swapIdx = idx + direction;
  if (swapIdx < 0 || swapIdx >= siblings.length) return data;
  const a = siblings[idx];
  const b = siblings[swapIdx];
  return {
    ...data,
    items: data.items.map((i) => {
      if (i.id === a.id) return { ...i, order: b.order };
      if (i.id === b.id) return { ...i, order: a.order };
      return i;
    }),
  };
}
