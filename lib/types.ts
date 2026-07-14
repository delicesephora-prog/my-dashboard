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

/**
 * Everything lives in one JSON blob so new features (new fields, new
 * widgets) can be added later just by extending this shape - no
 * database migrations required.
 */
export type DashboardData = {
  version: 1;
  work: WorldData;
  life: WorldData;
};

export function emptyWorld(): WorldData {
  return { tasks: [], notes: "" };
}

export function defaultDashboardData(): DashboardData {
  return {
    version: 1,
    work: emptyWorld(),
    life: emptyWorld(),
  };
}
