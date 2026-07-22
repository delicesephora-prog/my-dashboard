import { dateKey } from "./date";
import { RoutineKey, ROUTINE_ICONS, ROUTINE_KEYS, RoutinesConfig, dayTypeForDate, stepsFor } from "./routines";

// A category is a user-managed id + label + color, not a fixed set - so
// Sephora can add her own (Date Night, Girls' Night, ...) and recolor any
// of them. `category` fields elsewhere just store the id; a deleted or
// unrecognized id falls back to FALLBACK_CATEGORY_COLOR/"Other" rather
// than breaking anything that referenced it.
export type PlannerCategory = string;

export type PlannerCategoryDef = {
  id: string;
  label: string;
  color: string;
  order: number;
};

export const FALLBACK_CATEGORY_COLOR = "#A9A296";

// A curated set of preset swatches to pick from when coloring a category -
// distinct hues in the app's warm-paper palette, shown as a grid of
// circles in the category editor.
export const PLANNER_COLOR_PALETTE: string[] = [
  "#4B5A24",
  "#8FA37E",
  "#5C8A72",
  "#3F6B7A",
  "#4E8FA3",
  "#6E7B8B",
  "#6B6E9B",
  "#7A6BA5",
  "#BA6E8F",
  "#C77DA0",
  "#B5574A",
  "#D98E4A",
  "#C7A46B",
  "#9C8B6F",
  "#8A5A44",
  "#A9A296",
];

function defaultCategories(): PlannerCategoryDef[] {
  return [
    { id: "work", label: "Work", color: "#4B5A24", order: 0 },
    { id: "life", label: "Life", color: "#C7A46B", order: 1 },
    { id: "faith", label: "Faith", color: "#6B6E9B", order: 2 },
    { id: "fitness", label: "Fitness", color: "#8FA37E", order: 3 },
    { id: "admin", label: "Admin", color: "#9C8B6F", order: 4 },
    { id: "date-night", label: "Date Night", color: "#B5574A", order: 5 },
    { id: "girls-night", label: "Girls' Night", color: "#C77DA0", order: 6 },
    { id: "appointments", label: "Appointments", color: "#4E8FA3", order: 7 },
  ];
}

export function sortedCategories(categories: PlannerCategoryDef[]): PlannerCategoryDef[] {
  return [...categories].sort((a, b) => a.order - b.order);
}

export function categoryById(
  categories: PlannerCategoryDef[],
  id: string | null
): PlannerCategoryDef | null {
  if (!id) return null;
  return categories.find((c) => c.id === id) ?? null;
}

export function categoryColor(categories: PlannerCategoryDef[], id: string | null): string {
  return categoryById(categories, id)?.color ?? FALLBACK_CATEGORY_COLOR;
}

export function categoryLabel(categories: PlannerCategoryDef[], id: string | null): string {
  return categoryById(categories, id)?.label ?? "Other";
}

export function addCategory(data: PlannerData, label: string, color: string): PlannerData {
  const order = data.categories.length;
  const newCategory: PlannerCategoryDef = { id: crypto.randomUUID(), label, color, order };
  return { ...data, categories: [...data.categories, newCategory] };
}

export function updateCategory(
  data: PlannerData,
  id: string,
  updater: (c: PlannerCategoryDef) => PlannerCategoryDef
): PlannerData {
  return { ...data, categories: data.categories.map((c) => (c.id === id ? updater(c) : c)) };
}

// Refuses to delete the last remaining category - every block needs
// somewhere to land. Blocks/overrides pointing at the deleted id are left
// as-is; categoryColor/categoryLabel already fall back gracefully for an
// id that no longer resolves.
export function deleteCategory(data: PlannerData, id: string): PlannerData {
  if (data.categories.length <= 1) return data;
  return { ...data, categories: data.categories.filter((c) => c.id !== id) };
}

export function reorderCategory(data: PlannerData, id: string, direction: -1 | 1): PlannerData {
  const sorted = sortedCategories(data.categories);
  const idx = sorted.findIndex((c) => c.id === id);
  const swapIdx = idx + direction;
  if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return data;
  const a = sorted[idx];
  const b = sorted[swapIdx];
  return {
    ...data,
    categories: data.categories.map((c) => {
      if (c.id === a.id) return { ...c, order: b.order };
      if (c.id === b.id) return { ...c, order: a.order };
      return c;
    }),
  };
}

export type PlannerDayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const PLANNER_DAYS: PlannerDayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const PLANNER_DAY_SHORT_LABELS: Record<PlannerDayKey, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export function plannerDayKeyForDate(d: Date): PlannerDayKey {
  const jsDay = d.getDay();
  return PLANNER_DAYS[jsDay === 0 ? 6 : jsDay - 1];
}

export type PlannerBlock = {
  id: string;
  title: string;
  category: PlannerCategory;
  notes: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  // Empty = a one-off block tied to `date`. Non-empty = repeats weekly on
  // these weekdays indefinitely, and `date` is unused.
  repeatDays: PlannerDayKey[];
  date: string;
};

// A per-day customization of a single routine-derived ghost block - never
// touches the routine template itself. `id` matches the ghost's id
// (`${routineKey}:${stepId}`) and `dateKeyStr` pins it to one specific day.
// When `hidden` is true the ghost is skipped entirely for that day (a
// "delete for today" that leaves the template and every other day alone).
export type RoutineBlockOverride = {
  id: string;
  dateKeyStr: string;
  hidden: boolean;
  title: string;
  category: PlannerCategory;
  notes: string;
  startTime: string;
  durationMinutes: number;
};

export type PlannerData = {
  blocks: PlannerBlock[];
  routineOverrides: RoutineBlockOverride[];
  categories: PlannerCategoryDef[];
  // Real (non-routine) blocks marked done on a given day - keyed by
  // dateKeyStr, listing block ids. A repeating block's completion is
  // naturally per-occurrence this way, the same as a one-off block's.
  // Routine-derived ghost blocks use Routines' own completion log instead
  // (see RoutinesData.days) so checking one off here and in Rituals is the
  // same action, not two parallel states.
  completedBlockDays: Record<string, string[]>;
};

export function emptyPlannerData(): PlannerData {
  return { blocks: [], routineOverrides: [], categories: defaultCategories(), completedBlockDays: {} };
}

// The category picker used to be a fixed "Work"/"Life"/"Faith"/"Fitness"/
// "Admin" enum - blocks saved before categories became user-managed still
// carry those literal labels as their category value. Map them onto the
// matching default category's id so existing blocks keep their color
// instead of silently falling back to gray.
const LEGACY_CATEGORY_ID_MAP: Record<string, string> = {
  Work: "work",
  Life: "life",
  Faith: "faith",
  Fitness: "fitness",
  Admin: "admin",
};

function migrateCategoryId(id: string | undefined): string {
  if (!id) return "work";
  return LEGACY_CATEGORY_ID_MAP[id] ?? id;
}

export function normalizePlannerData(partial: Partial<PlannerData> | null | undefined): PlannerData {
  return {
    blocks: (partial?.blocks ?? []).map((b) => ({
      id: b.id,
      title: b.title,
      category: migrateCategoryId(b.category),
      notes: b.notes ?? "",
      startTime: b.startTime,
      endTime: b.endTime,
      repeatDays: b.repeatDays ?? [],
      date: b.date ?? "",
    })),
    routineOverrides: (partial?.routineOverrides ?? []).map((o) => ({
      id: o.id,
      dateKeyStr: o.dateKeyStr,
      hidden: o.hidden ?? false,
      title: o.title ?? "",
      category: migrateCategoryId(o.category ?? "Life"),
      notes: o.notes ?? "",
      startTime: o.startTime ?? "",
      durationMinutes: o.durationMinutes ?? 15,
    })),
    categories:
      partial?.categories && partial.categories.length > 0
        ? partial.categories.map((c, i) => ({
            id: c.id,
            label: c.label ?? "Untitled",
            color: c.color ?? FALLBACK_CATEGORY_COLOR,
            order: c.order ?? i,
          }))
        : defaultCategories(),
    completedBlockDays: partial?.completedBlockDays ?? {},
  };
}

export function isBlockDoneOnDate(data: PlannerData, blockId: string, dateKeyStr: string): boolean {
  return (data.completedBlockDays[dateKeyStr] ?? []).includes(blockId);
}

export function toggleBlockDoneOnDate(data: PlannerData, blockId: string, dateKeyStr: string): PlannerData {
  const current = data.completedBlockDays[dateKeyStr] ?? [];
  const next = current.includes(blockId)
    ? current.filter((id) => id !== blockId)
    : [...current, blockId];
  return { ...data, completedBlockDays: { ...data.completedBlockDays, [dateKeyStr]: next } };
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(min)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Blocks that apply on the given date - one-off blocks whose date matches,
// plus repeating blocks whose repeatDays includes the date's weekday -
// sorted by start time.
export function blocksForDate(data: PlannerData, d: Date): PlannerBlock[] {
  const key = dateKey(d);
  const dayKey = plannerDayKeyForDate(d);
  return [...data.blocks]
    .filter((b) => (b.repeatDays.length > 0 ? b.repeatDays.includes(dayKey) : b.date === key))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

// Default category used for a routine-derived ghost block until the user
// customizes it for a given day - routines are mostly personal-care / life
// oriented, so "Life" is the least-surprising starting point.
const GHOST_DEFAULT_CATEGORY: PlannerCategory = "life";

export type RoutineGhostBlock = {
  id: string; // `${routineKey}:${stepId}` - stable across days, matches RoutineBlockOverride.id
  title: string;
  icon: string;
  category: PlannerCategory;
  notes: string;
  routineKey: RoutineKey;
  sourceStepId: string;
  startTime: string;
  durationMinutes: number;
  // True when this day has a per-day override applied (edited, not hidden).
  overridden: boolean;
};

// Blocks derived from today's Routine steps (for the current day type)
// that have a target time set - a live preview of the routine on the
// timeline. Not stored as real Planner blocks by default, but any field
// can be customized for just this one day via a RoutineBlockOverride
// (looked up by ghost id + date) without ever touching the routine
// template itself - that's still edited in the Routines guided flow /
// Manage Routines screen.
export function routineGhostBlocksForDate(
  config: RoutinesConfig,
  overrides: RoutineBlockOverride[],
  d: Date
): RoutineGhostBlock[] {
  const dayType = dayTypeForDate(d);
  const todayKeyStr = dateKey(d);
  const ghosts: RoutineGhostBlock[] = [];
  for (const routineKey of ROUTINE_KEYS) {
    for (const step of stepsFor(config, routineKey, dayType)) {
      if (!step.targetTime) continue;
      const id = `${routineKey}:${step.id}`;
      const dayOverrides = overrides.filter((o) => o.id === id && o.dateKeyStr === todayKeyStr);
      if (dayOverrides.some((o) => o.hidden)) continue;
      const override = dayOverrides.find((o) => !o.hidden);
      ghosts.push({
        id,
        title: override?.title || step.text,
        icon: ROUTINE_ICONS[routineKey],
        category: override?.category ?? GHOST_DEFAULT_CATEGORY,
        notes: override?.notes ?? "",
        routineKey,
        sourceStepId: step.id,
        startTime: override?.startTime || step.targetTime,
        durationMinutes: override?.durationMinutes ?? (step.durationMinutes ?? 15),
        overridden: Boolean(override),
      });
    }
  }
  return ghosts.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

export function findRoutineOverride(
  overrides: RoutineBlockOverride[],
  id: string,
  dateKeyStr: string
): RoutineBlockOverride | undefined {
  return overrides.find((o) => o.id === id && o.dateKeyStr === dateKeyStr);
}

// Creates or replaces the override for this ghost's id+day - used both to
// save an edit and to write a "hidden" record for a same-day delete.
export function upsertRoutineOverride(data: PlannerData, override: RoutineBlockOverride): PlannerData {
  const exists = data.routineOverrides.some(
    (o) => o.id === override.id && o.dateKeyStr === override.dateKeyStr
  );
  return {
    ...data,
    routineOverrides: exists
      ? data.routineOverrides.map((o) =>
          o.id === override.id && o.dateKeyStr === override.dateKeyStr ? override : o
        )
      : [...data.routineOverrides, override],
  };
}

export function hideRoutineGhostForDay(
  data: PlannerData,
  ghost: RoutineGhostBlock,
  dateKeyStr: string
): PlannerData {
  return upsertRoutineOverride(data, {
    id: ghost.id,
    dateKeyStr,
    hidden: true,
    title: ghost.title,
    category: ghost.category,
    notes: ghost.notes,
    startTime: ghost.startTime,
    durationMinutes: ghost.durationMinutes,
  });
}

// Greedy lane assignment so overlapping timeline items sit side by side
// instead of on top of each other, sorted by start time.
export function layoutByTime<T extends { startMin: number; endMin: number }>(
  items: T[]
): (T & { column: number; columns: number })[] {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin);
  const columnEnds: number[] = [];
  const laid: (T & { column: number; columns: number })[] = [];

  for (const item of sorted) {
    let col = columnEnds.findIndex((end) => end <= item.startMin);
    if (col === -1) {
      col = columnEnds.length;
      columnEnds.push(item.endMin);
    } else {
      columnEnds[col] = item.endMin;
    }
    laid.push({ ...item, column: col, columns: 1 });
  }

  const maxCol = laid.reduce((m, b) => Math.max(m, b.column + 1), 1);
  return laid.map((b) => ({ ...b, columns: maxCol }));
}

export type PlannerDayEntry = {
  date: Date;
  dateKeyStr: string;
  blocks: PlannerBlock[];
};

// The 7 days (Monday-first) of the week containing `weekMonday`, each with
// its own blocks - `weekMonday` should already be a Monday (see mondayOf
// in lib/week.ts) but this doesn't require it, it just walks 7 days from
// whatever date is passed.
export function blocksForWeek(data: PlannerData, weekMonday: Date): PlannerDayEntry[] {
  const days: PlannerDayEntry[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekMonday.getFullYear(), weekMonday.getMonth(), weekMonday.getDate() + i);
    days.push({ date, dateKeyStr: dateKey(date), blocks: blocksForDate(data, date) });
  }
  return days;
}

// A Monday-first calendar grid for the given month - includes the leading
// and trailing days from adjacent months needed to fill complete weeks,
// each with its own blocks and a flag for whether it's actually in `month`.
export function blocksForMonthGrid(
  data: PlannerData,
  year: number,
  month: number // 0-11
): (PlannerDayEntry & { inMonth: boolean })[] {
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay(); // 0 = Sunday
  const leadingDays = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const gridStart = new Date(year, month, 1 - leadingDays);

  const days: (PlannerDayEntry & { inMonth: boolean })[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    if (i >= 35 && date.getMonth() !== month) break; // stop after 5 full weeks unless month needs a 6th
    days.push({ date, dateKeyStr: dateKey(date), blocks: blocksForDate(data, date), inMonth: date.getMonth() === month });
  }
  return days;
}
