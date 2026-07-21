import { dateKey } from "./date";

export type ChecklistItem = {
  id: string;
  text: string;
  dueDate: string | null; // YYYY-MM-DD
  done: boolean;
};

export type VendorStatus = "researching" | "contacted" | "booked" | "paid";

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  researching: "Researching",
  contacted: "Contacted",
  booked: "Booked",
  paid: "Paid in Full",
};

export type Vendor = {
  id: string;
  name: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  status: VendorStatus;
  notes: string;
};

export type RsvpStatus = "pending" | "yes" | "no";

export type Guest = {
  id: string;
  name: string;
  group: string;
  rsvp: RsvpStatus;
  plusOne: boolean;
  notes: string;
};

export type BudgetItem = {
  id: string;
  category: string;
  estimated: number;
  actual: number;
};

export type TimelineEvent = {
  id: string;
  time: string;
  text: string;
};

export type WeddingData = {
  weddingDate: string | null; // YYYY-MM-DD
  checklist: ChecklistItem[];
  vendors: Vendor[];
  guests: Guest[];
  budget: BudgetItem[];
  timeline: TimelineEvent[];
};

export function emptyWeddingData(): WeddingData {
  return { weddingDate: null, checklist: [], vendors: [], guests: [], budget: [], timeline: [] };
}

export function normalizeWeddingData(partial: Partial<WeddingData> | null | undefined): WeddingData {
  return {
    weddingDate: partial?.weddingDate ?? null,
    checklist: partial?.checklist ?? [],
    vendors: partial?.vendors ?? [],
    guests: partial?.guests ?? [],
    budget: partial?.budget ?? [],
    timeline: partial?.timeline ?? [],
  };
}

// Null once the date has passed or isn't set - a countdown to a date
// that's already gone isn't useful.
export function daysUntilWedding(data: WeddingData, now: Date = new Date()): number | null {
  if (!data.weddingDate) return null;
  const today = dateKey(now);
  if (data.weddingDate < today) return null;
  const [y, m, d] = data.weddingDate.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - from.getTime()) / 86400000);
}

export function checklistProgress(checklist: ChecklistItem[]): { done: number; total: number } {
  return { done: checklist.filter((c) => c.done).length, total: checklist.length };
}

export type GuestCounts = {
  total: number;
  yes: number;
  no: number;
  pending: number;
  attending: number; // yes count + plus-ones among yes
};

export function guestCounts(guests: Guest[]): GuestCounts {
  const yes = guests.filter((g) => g.rsvp === "yes");
  const no = guests.filter((g) => g.rsvp === "no").length;
  const pending = guests.filter((g) => g.rsvp === "pending").length;
  const attending = yes.length + yes.filter((g) => g.plusOne).length;
  return { total: guests.length, yes: yes.length, no, pending, attending };
}

export type BudgetTotals = {
  estimated: number;
  actual: number;
};

export function budgetTotals(budget: BudgetItem[]): BudgetTotals {
  return {
    estimated: budget.reduce((sum, b) => sum + b.estimated, 0),
    actual: budget.reduce((sum, b) => sum + b.actual, 0),
  };
}
