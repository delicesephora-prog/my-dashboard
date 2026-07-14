import { dateKey } from "./date";

// The Monday that starts the week containing d, at local midnight.
export function mondayOf(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

// A stable, sortable key for the week containing d - the Monday's date.
export function weekKeyFor(d: Date): string {
  return dateKey(mondayOf(d));
}

export function shiftWeekKey(weekKey: string, deltaWeeks: number): string {
  const [y, m, d] = weekKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaWeeks * 7);
  return dateKey(date);
}

export function formatWeekRange(weekKey: string): string {
  const [y, m, d] = weekKey.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(
    undefined,
    sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" }
  );
  return `${startLabel} – ${endLabel}`;
}
