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

export type WeekTask = {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
};

export type WeekData = {
  tasks: WeekTask[];
  // One ISO timestamp per logged workout session this week.
  workouts: string[];
  // Always exactly 3 slots; empty strings render as unset goals.
  weeklyFocus: string[];
  reflection: string;
};

export function emptyWeekData(): WeekData {
  return { tasks: [], workouts: [], weeklyFocus: ["", "", ""], reflection: "" };
}

export type CurrentlyReading = {
  title: string;
  author: string;
};

export type LifeWeekly = {
  workoutGoal: number;
  currentlyReading: CurrentlyReading;
  // Keyed by the Monday date (YYYY-MM-DD) of each week.
  weeks: Record<string, WeekData>;
};

export function emptyLifeWeekly(): LifeWeekly {
  return {
    workoutGoal: 3,
    currentlyReading: { title: "", author: "" },
    weeks: {},
  };
}

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
  lifeWeekly: LifeWeekly;
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
    lifeWeekly: emptyLifeWeekly(),
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
    lifeWeekly: {
      ...fallback.lifeWeekly,
      ...data.lifeWeekly,
      currentlyReading: {
        ...fallback.lifeWeekly.currentlyReading,
        ...data.lifeWeekly?.currentlyReading,
      },
      weeks: data.lifeWeekly?.weeks ?? {},
    },
  };
}

// Fills in any weeks missing from the stored map (e.g. a week never
// visited before) with a blank WeekData, without persisting it until
// the user actually changes something in that week.
export function weekDataFor(lifeWeekly: LifeWeekly, weekKey: string): WeekData {
  const stored = lifeWeekly.weeks[weekKey];
  if (!stored) return emptyWeekData();
  return { ...emptyWeekData(), ...stored };
}
