import { dateKey } from "./date";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export type PixelDay = {
  date: string;
  day: number;
  score: number | null;
  isFuture: boolean;
};

export type PixelMonth = {
  month: number;
  label: string;
  days: PixelDay[];
};

// One row per month, one cell per day - reads straight off the existing
// lifeScore.history (already recorded once per day the app is opened), so
// no separate tracking is needed for this view.
export function yearPixelsFor(
  history: Record<string, number>,
  year: number,
  now: Date
): PixelMonth[] {
  const todayKey = dateKey(now);
  const months: PixelMonth[] = [];
  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const days: PixelDay[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const key = dateKey(new Date(year, m, d));
      days.push({
        date: key,
        day: d,
        score: history[key] ?? null,
        isFuture: key > todayKey,
      });
    }
    months.push({ month: m, label: MONTH_LABELS[m], days });
  }
  return months;
}
