export type TaskItem = {
  id: string;
  text: string;
  done: boolean;
  focus: boolean;
  createdAt: string;
};

export type WorldData = {
  tasks: TaskItem[];
  notes: string;
};

export type OneThing = {
  text: string;
  // Local date (YYYY-MM-DD) the text was written for, so a new day
  // starts with a blank card without deleting yesterday's entry.
  date: string;
};

/**
 * Everything lives in one JSON blob so new features (new fields, new
 * widgets) can be added later just by extending this shape - no
 * database migrations required.
 */
export type DashboardData = {
  version: 1;
  work: WorldData;
  life: WorldData;
  oneThing: OneThing;
};

export function emptyWorld(): WorldData {
  return { tasks: [], notes: "" };
}

export function emptyOneThing(): OneThing {
  return { text: "", date: "" };
}

export function defaultDashboardData(): DashboardData {
  return {
    version: 1,
    work: emptyWorld(),
    life: emptyWorld(),
    oneThing: emptyOneThing(),
  };
}

// Backfills any fields missing from older saved data (e.g. before a field
// existed) with defaults, so new features never require a migration.
export function normalizeDashboardData(
  data: Partial<DashboardData> | null | undefined
): DashboardData {
  const fallback = defaultDashboardData();
  if (!data) return fallback;
  return {
    version: 1,
    work: { ...fallback.work, ...data.work },
    life: { ...fallback.life, ...data.life },
    oneThing: { ...fallback.oneThing, ...data.oneThing },
  };
}
