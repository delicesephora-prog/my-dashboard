import { dateKey, daysBetween } from "./date";

// Stable ids for every tab worth asking "am I still using this" about -
// the five top-level Worlds aren't included since those are structural
// (you can't hide your way out of Front Page/Work/Life/Assistant/Planner).
export const TAB_LABELS: Record<string, string> = {
  "work:dashboard": "Work · Dashboard",
  "work:cadence": "Work · Cadence",
  "work:backbeat": "Work · BackBeat",
  "work:ops": "Work · Ops",
  "work:reference": "Work · Reference",
  "life:tasks": "Life · Tasks",
  "life:week": "Life · This Week",
  "life:rituals": "Life · Rituals",
  "life:money": "Life · Money",
  "life:quarter": "Life · Quarter",
  "life:lists": "Life · Lists",
  "life:rhythm": "Life · Rhythm",
  "life:glowUp": "Life · Glow Up",
  "life:home": "Life · Home Zones",
  "life:books": "Life · Books",
  "life:bucketList": "Life · Bucket List",
  "life:year": "Life · Year",
  "life:dec8": "Life · Dec 8",
  "life:verses": "Life · Verses",
  "life:memos": "Life · Memos",
  "life:health": "Life · Health",
  "life:wedding": "Life · Wedding",
  "life:trips": "Life · Trips",
};

export const TRACKED_TAB_KEYS = Object.keys(TAB_LABELS);

export type TabUsage = { opens: number; lastOpenedAt: string };

export type TabUsageData = {
  usage: Record<string, TabUsage>;
  // Recoverable, never deleted - tabs hidden from nav via System Check or
  // Settings live here; unhiding is always one tap away in Settings.
  hiddenTabs: string[];
};

export function emptyTabUsageData(): TabUsageData {
  return { usage: {}, hiddenTabs: [] };
}

export function normalizeTabUsageData(partial: Partial<TabUsageData> | null | undefined): TabUsageData {
  const fallback = emptyTabUsageData();
  if (!partial) return fallback;
  return {
    usage: partial.usage ?? fallback.usage,
    hiddenTabs: partial.hiddenTabs ?? fallback.hiddenTabs,
  };
}

export function trackTabOpen(data: TabUsageData, key: string, now: Date = new Date()): TabUsageData {
  if (!TRACKED_TAB_KEYS.includes(key)) return data;
  const current = data.usage[key] ?? { opens: 0, lastOpenedAt: "" };
  return {
    ...data,
    usage: { ...data.usage, [key]: { opens: current.opens + 1, lastOpenedAt: now.toISOString() } },
  };
}

export function daysSinceUsed(usage: TabUsage | undefined, now: Date = new Date()): number | null {
  if (!usage || !usage.lastOpenedAt) return null;
  return daysBetween(usage.lastOpenedAt.slice(0, 10), dateKey(now));
}

export function hideTab(data: TabUsageData, key: string): TabUsageData {
  if (data.hiddenTabs.includes(key)) return data;
  return { ...data, hiddenTabs: [...data.hiddenTabs, key] };
}

export function unhideTab(data: TabUsageData, key: string): TabUsageData {
  return { ...data, hiddenTabs: data.hiddenTabs.filter((k) => k !== key) };
}

export function isTabHidden(data: TabUsageData, key: string): boolean {
  return data.hiddenTabs.includes(key);
}

const UNUSED_THRESHOLD_DAYS = 30;

export type TabUsageRow = {
  key: string;
  label: string;
  opens: number;
  lastOpenedAt: string; // "" if never opened
  daysSinceUsed: number | null; // null if never opened
  itemCount: number;
  unused: boolean; // never opened, or not opened in 30+ days
};

// A live snapshot, not a history - "items added" is approximated as
// "items currently there" rather than instrumenting every add button
// across the app, which would be a much larger, more invasive project
// for the same practical signal: an empty, unopened tab is unused either way.
export function buildUsageReport(
  tabUsage: TabUsageData,
  itemCounts: Record<string, number>,
  now: Date = new Date()
): TabUsageRow[] {
  return TRACKED_TAB_KEYS.map((key) => {
    const usage = tabUsage.usage[key];
    const days = daysSinceUsed(usage, now);
    return {
      key,
      label: TAB_LABELS[key],
      opens: usage?.opens ?? 0,
      lastOpenedAt: usage?.lastOpenedAt ?? "",
      daysSinceUsed: days,
      itemCount: itemCounts[key] ?? 0,
      unused: days === null || days >= UNUSED_THRESHOLD_DAYS,
    };
  }).sort((a, b) => {
    // Least-used first - that's exactly what a monthly pruning pass wants
    // to see up top.
    if (a.unused !== b.unused) return a.unused ? -1 : 1;
    return (a.daysSinceUsed ?? 9999) - (b.daysSinceUsed ?? 9999);
  });
}

export type SystemCheckLogEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  notUsing: string;
  annoying: string;
  hiddenTabKeys: string[];
};

export type SystemCheckData = {
  log: SystemCheckLogEntry[];
};

export function emptySystemCheckData(): SystemCheckData {
  return { log: [] };
}

export function normalizeSystemCheckData(partial: Partial<SystemCheckData> | null | undefined): SystemCheckData {
  const fallback = emptySystemCheckData();
  if (!partial) return fallback;
  return { log: partial.log ?? fallback.log };
}

export function addSystemCheckLog(
  data: SystemCheckData,
  notUsing: string,
  annoying: string,
  hiddenTabKeys: string[],
  now: Date = new Date()
): SystemCheckData {
  const entry: SystemCheckLogEntry = {
    id: crypto.randomUUID(),
    date: dateKey(now),
    notUsing,
    annoying,
    hiddenTabKeys,
  };
  return { log: [entry, ...data.log] };
}
