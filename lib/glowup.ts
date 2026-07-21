import { dateKey, daysBetween } from "./date";
import { weekKeyFor } from "./week";

export type GlowUpItem = {
  id: string;
  text: string;
  order: number;
};

export type GlowUpMonthlyItem = {
  id: string;
  text: string;
  order: number;
  lastDoneDate: string;
  warnAfterDays?: number;
};

export type GlowUpDiyItem = {
  id: string;
  text: string;
  order: number;
};

export type DiyLogEntry = { date: string; itemId: string };

export type GlowUpData = {
  dailyItems: GlowUpItem[];
  weeklyItems: GlowUpItem[];
  monthlyItems: GlowUpMonthlyItem[];
  diyItems: GlowUpDiyItem[];
  // Keyed by YYYY-MM-DD - only today's key is ever written to.
  dailyLogs: Record<string, string[]>;
  // Keyed by the Monday date of the week.
  weeklyLogs: Record<string, string[]>;
  // Keyed by YYYY-MM.
  monthlyLogs: Record<string, string[]>;
  diyLog: DiyLogEntry[];
  // Free-text note card describing the signature scent layering system.
  scentNote: string;
  contentVersion: number;
};

function item(text: string, order: number): GlowUpItem {
  return { id: crypto.randomUUID(), text, order };
}

function monthlyItem(text: string, order: number, warnAfterDays?: number): GlowUpMonthlyItem {
  return { id: crypto.randomUUID(), text, order, lastDoneDate: "", warnAfterDays };
}

function seedDaily(): GlowUpItem[] {
  return [
    item("AM: Cleanse or rinse", 0),
    item("AM: Moisturizer", 1),
    item("AM: SPF", 2),
    item("PM: Cleanse", 3),
    item("PM: Moisturizer / night treatment", 4),
    item("Lip balm + hand cream by the bed", 5),
    item("Vitamins / supplements", 6),
    item("Water goal", 7),
  ];
}

function seedWeekly(): GlowUpItem[] {
  return [
    item("Everything shower: exfoliate, hair mask or deep condition, shave/groom", 0),
    item("Face mask while hair mask sits", 1),
    item("Nail check: file, cuticle oil, polish touch-up", 2),
    item("Brow tidy between appointments", 3),
    item("Body moisturize head to toe", 4),
    item("Lay out the week: outfits vibe-check against the calendar", 5),
  ];
}

function seedMonthly(): GlowUpMonthlyItem[] {
  return [
    monthlyItem("Brow shaping appointment", 0, 21),
    monthlyItem("Deep hair treatment or trim check", 1),
    monthlyItem("Mani/pedi (salon or thorough at-home)", 2),
    monthlyItem("Closet edit: 15 minutes, one drawer or section", 3),
    monthlyItem("Skincare inventory: what's running low, what's not working", 4),
    monthlyItem("Progress photo - same spot, same light", 5),
  ];
}

function seedDiy(): GlowUpDiyItem[] {
  return [
    item("Rice water or protein hair treatment", 0),
    item("Honey + oat face mask", 1),
    item("Brown sugar + oil body scrub", 2),
    item("Overnight oil hair pre-wash treatment", 3),
    item("Green tea ice cube de-puff morning", 4),
    item("Epsom salt bath + stretch night", 5),
    item("Cuticle oil + hand mask while watching a show", 6),
    item("Scalp massage with oil (5 min, before wash day)", 7),
  ];
}

export const SCENT_NOTE_DEFAULT =
  "Lane: warm cocoa/vanilla/tropical. Layer the same family at every step: wash → lotion → oil → mist → perfume on pulse points + light hair mist. Consistency is the signature.";

export function emptyGlowUpData(): GlowUpData {
  return {
    dailyItems: seedDaily(),
    weeklyItems: seedWeekly(),
    monthlyItems: seedMonthly(),
    diyItems: seedDiy(),
    dailyLogs: {},
    weeklyLogs: {},
    monthlyLogs: {},
    diyLog: [],
    scentNote: SCENT_NOTE_DEFAULT,
    contentVersion: GLOWUP_CONTENT_VERSION,
  };
}

export function normalizeGlowUpData(partial: Partial<GlowUpData> | null | undefined): GlowUpData {
  const fallback = emptyGlowUpData();
  // If the whole field is missing (first time it appears for existing
  // data), seed the real content instead of leaving it blank.
  if (!partial) return fallback;
  return {
    dailyItems: partial.dailyItems ?? fallback.dailyItems,
    weeklyItems: partial.weeklyItems ?? fallback.weeklyItems,
    monthlyItems: partial.monthlyItems ?? fallback.monthlyItems,
    diyItems: partial.diyItems ?? fallback.diyItems,
    dailyLogs: partial.dailyLogs ?? {},
    weeklyLogs: partial.weeklyLogs ?? {},
    monthlyLogs: partial.monthlyLogs ?? {},
    diyLog: partial.diyLog ?? [],
    scentNote: partial.scentNote ?? fallback.scentNote,
    contentVersion: partial.contentVersion ?? 0,
  };
}

// One-time, additive rewrite of the Daily checklist into the real AM/PM
// product routine, and additions to the Sunday Reset weekly list - gated
// by contentVersion so it only ever runs once against existing saved data
// and never fights the user's own later edits.
export const GLOWUP_CONTENT_VERSION = 1;

function seedDailyGlow(): GlowUpItem[] {
  return [
    item("AM: Shower — Native body wash + Dove antibacterial, African net sponge (3–4x/week, not daily)", 0),
    item("AM: ✦ Face cleanser — CeraVe Acne Control Cleanser, in shower (AM + PM — if tight, switch to PM only)", 1),
    item("AM: Pat skin damp, don't rub dry", 2),
    item("AM: Body — CeraVe Moisturizing Lotion on damp skin, whole body", 3),
    item("AM: ✦ Body butter on dry zones (elbows, knees, legs)", 4),
    item("AM: Body — Tree Hut Tropical Glow Firming Oil on glow zones (arms, chest, shoulders), seals", 5),
    item("AM: Body — Vaseline Cocoa Radiant 72hr lotion, extra-dry days only (optional)", 6),
    item("AM: Deodorant", 7),
    item("AM: Face — Naturium Vitamin C + Turmeric Brightening Face Oil", 8),
    item("AM: ✦ Face moisturizer", 9),
    item("AM: Face — Black Girl Sunscreen, LAST step, every day, non-negotiable", 10),
    item("AM: Lips — lip treatment, sit a few minutes, then Aquaphor", 11),
    item("AM: Edges oiled + get dressed", 12),
    item("PM: Cleanse face — CeraVe Acne Control Cleanser (AM + PM — if tight, switch to PM only)", 13),
    item("PM: ✦ Treatment — niacinamide serum (alternate nights to start)", 14),
    item("PM: ✦ Night moisturizer", 15),
    item("PM: Lips — Aquaphor", 16),
    item("PM: ✦ Body butter on feet + elbows", 17),
    item("Vitamins / supplements", 18),
    item("Water goal", 19),
  ];
}

const WEEKLY_GLOW_ADDITIONS: { text: string; afterText: string }[] = [
  { text: "✦ Net sponge full-body exfoliation", afterText: "Everything shower: exfoliate, hair mask or deep condition, shave/groom" },
  { text: "✦ Deep moisture night: body butter + oil, head to toe", afterText: "Face mask while hair mask sits" },
];

export function applyGlowUpContentUpdate(data: GlowUpData): GlowUpData {
  if (data.contentVersion >= GLOWUP_CONTENT_VERSION) return data;

  let weekly = data.weeklyItems;
  for (const addition of WEEKLY_GLOW_ADDITIONS) {
    if (weekly.some((w) => w.text === addition.text)) continue;
    const idx = weekly.findIndex((w) => w.text === addition.afterText);
    const insertAt = idx === -1 ? weekly.length : idx + 1;
    const newItem: GlowUpItem = { id: crypto.randomUUID(), text: addition.text, order: 0 };
    weekly = [...weekly.slice(0, insertAt), newItem, ...weekly.slice(insertAt)].map((w, i) => ({ ...w, order: i }));
  }

  return {
    ...data,
    dailyItems: seedDailyGlow(),
    weeklyItems: weekly,
    contentVersion: GLOWUP_CONTENT_VERSION,
  };
}

export function monthKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export function toggleDaily(data: GlowUpData, itemId: string, now: Date = new Date()): GlowUpData {
  const today = dateKey(now);
  const current = data.dailyLogs[today] ?? [];
  const next = current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId];
  return { ...data, dailyLogs: { ...data.dailyLogs, [today]: next } };
}

export function toggleWeekly(data: GlowUpData, itemId: string, now: Date = new Date()): GlowUpData {
  const weekKey = weekKeyFor(now);
  const current = data.weeklyLogs[weekKey] ?? [];
  const next = current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId];
  return { ...data, weeklyLogs: { ...data.weeklyLogs, [weekKey]: next } };
}

// Toggling a monthly item both flips this month's checkbox (for the ring)
// and, when turning it on, stamps lastDoneDate - the persistent record
// used for the brow-style "it's been N days" warning.
export function toggleMonthly(data: GlowUpData, itemId: string, now: Date = new Date()): GlowUpData {
  const key = monthKey(now);
  const current = data.monthlyLogs[key] ?? [];
  const turningOn = !current.includes(itemId);
  const next = turningOn ? [...current, itemId] : current.filter((id) => id !== itemId);
  return {
    ...data,
    monthlyLogs: { ...data.monthlyLogs, [key]: next },
    monthlyItems: data.monthlyItems.map((m) =>
      m.id === itemId && turningOn ? { ...m, lastDoneDate: dateKey(now) } : m
    ),
  };
}

export function logDiy(data: GlowUpData, itemId: string, now: Date = new Date()): GlowUpData {
  return { ...data, diyLog: [{ date: dateKey(now), itemId }, ...data.diyLog].slice(0, 200) };
}

export function dailyProgress(
  data: GlowUpData,
  now: Date = new Date()
): { done: number; total: number; pct: number } {
  const total = data.dailyItems.length;
  const doneIds = new Set(data.dailyLogs[dateKey(now)] ?? []);
  const done = data.dailyItems.filter((i) => doneIds.has(i.id)).length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export function weeklyProgress(
  data: GlowUpData,
  now: Date = new Date()
): { done: number; total: number; pct: number } {
  const total = data.weeklyItems.length;
  const doneIds = new Set(data.weeklyLogs[weekKeyFor(now)] ?? []);
  const done = data.weeklyItems.filter((i) => doneIds.has(i.id)).length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export function monthlyProgress(
  data: GlowUpData,
  now: Date = new Date()
): { done: number; total: number; pct: number } {
  const total = data.monthlyItems.length;
  const doneIds = new Set(data.monthlyLogs[monthKey(now)] ?? []);
  const done = data.monthlyItems.filter((i) => doneIds.has(i.id)).length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

function isWeeklyComplete(data: GlowUpData, weekKey: string): boolean {
  if (data.weeklyItems.length === 0) return false;
  const doneIds = new Set(data.weeklyLogs[weekKey] ?? []);
  return data.weeklyItems.every((i) => doneIds.has(i.id));
}

// Consecutive fully-completed weeks, counting backward - the still-open
// current week doesn't break the streak while it's in progress.
export function weeklyStreak(data: GlowUpData, now: Date = new Date()): number {
  let cursor = weekKeyFor(now);
  if (!isWeeklyComplete(data, cursor)) {
    const [y, m, d] = cursor.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 7);
    cursor = dateKey(date);
  }
  let streak = 0;
  for (let i = 0; i < 200; i++) {
    if (!isWeeklyComplete(data, cursor)) break;
    streak++;
    const [y, m, d] = cursor.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 7);
    cursor = dateKey(date);
  }
  return streak;
}

export function daysSinceLastDone(item: GlowUpMonthlyItem, now: Date = new Date()): number | null {
  if (!item.lastDoneDate) return null;
  return daysBetween(item.lastDoneDate, dateKey(now));
}

export function isOverdueForWarning(item: GlowUpMonthlyItem, now: Date = new Date()): boolean {
  if (!item.warnAfterDays) return false;
  const days = daysSinceLastDone(item, now);
  return days === null || days >= item.warnAfterDays;
}

// A stable weekly rotation through the DIY bank, tied to the calendar
// week rather than stored state, so it changes automatically.
export function suggestedDiyItem(data: GlowUpData, now: Date = new Date()): GlowUpDiyItem | null {
  if (data.diyItems.length === 0) return null;
  const weeksSinceEpoch = Math.floor(daysBetween("2020-01-06", weekKeyFor(now)) / 7);
  const items = sortByOrder(data.diyItems);
  const index = ((weeksSinceEpoch % items.length) + items.length) % items.length;
  return items[index];
}
