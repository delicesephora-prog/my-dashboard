import { dateKey } from "./date";

export type DayType = "office" | "remote" | "weekend";
export const DAY_TYPES: DayType[] = ["office", "remote", "weekend"];
export const DAY_TYPE_LABELS: Record<DayType, string> = {
  office: "Office",
  remote: "Remote",
  weekend: "Weekend",
};

export type RoutineKey = "morning" | "day" | "night";
export const ROUTINE_KEYS: RoutineKey[] = ["morning", "day", "night"];
export const ROUTINE_LABELS: Record<RoutineKey, string> = {
  morning: "Morning",
  day: "Day",
  night: "Night",
};
export const ROUTINE_ICONS: Record<RoutineKey, string> = {
  morning: "🌅",
  day: "☀️",
  night: "🌙",
};
export const ROUTINE_COLORS: Record<RoutineKey, string> = {
  morning: "#C7A46B",
  day: "#4B5A24",
  night: "#6B6E9B",
};

export type RoutineStep = {
  id: string;
  text: string;
  // "" or "HH:MM" in 24h time.
  targetTime: string;
  durationMinutes: number | null;
  order: number;
};

export type RoutineVariant = {
  steps: RoutineStep[];
};

export type Routine = {
  variants: Record<DayType, RoutineVariant>;
};

export type RoutinesConfig = Record<RoutineKey, Routine>;

export type RoutineDayLog = {
  completedStepIds: Record<RoutineKey, string[]>;
};

export type RoutinesData = {
  config: RoutinesConfig;
  // Keyed by YYYY-MM-DD.
  days: Record<string, RoutineDayLog>;
};

function emptyVariant(): RoutineVariant {
  return { steps: [] };
}

export function emptyRoutine(): Routine {
  return {
    variants: { office: emptyVariant(), remote: emptyVariant(), weekend: emptyVariant() },
  };
}

export function emptyRoutinesData(): RoutinesData {
  return {
    config: { morning: emptyRoutine(), day: emptyRoutine(), night: emptyRoutine() },
    days: {},
  };
}

// Backfills any fields missing from older saved data (e.g. before a
// routine or variant existed) with defaults.
export function normalizeRoutine(partial: Partial<Routine> | null | undefined): Routine {
  const fallback = emptyRoutine();
  return {
    variants: {
      office: { steps: partial?.variants?.office?.steps ?? fallback.variants.office.steps },
      remote: { steps: partial?.variants?.remote?.steps ?? fallback.variants.remote.steps },
      weekend: { steps: partial?.variants?.weekend?.steps ?? fallback.variants.weekend.steps },
    },
  };
}

export function normalizeRoutinesData(
  partial: Partial<RoutinesData> | null | undefined
): RoutinesData {
  const fallback = emptyRoutinesData();
  return {
    config: {
      morning: normalizeRoutine(partial?.config?.morning),
      day: normalizeRoutine(partial?.config?.day),
      night: normalizeRoutine(partial?.config?.night),
    },
    days: partial?.days ?? fallback.days,
  };
}

export function emptyRoutineDayLog(): RoutineDayLog {
  return { completedStepIds: { morning: [], day: [], night: [] } };
}

// Mon/Wed/Thu = office, Tue/Fri = remote, Sat/Sun = weekend - fixed by the
// user's actual work schedule, not user-configurable.
export function dayTypeForDate(d: Date): DayType {
  const jsDay = d.getDay();
  if (jsDay === 0 || jsDay === 6) return "weekend";
  if (jsDay === 2 || jsDay === 5) return "remote";
  return "office";
}

export function stepsFor(config: RoutinesConfig, routineKey: RoutineKey, dayType: DayType): RoutineStep[] {
  return [...config[routineKey].variants[dayType].steps].sort((a, b) => a.order - b.order);
}

export function stepsForDate(config: RoutinesConfig, routineKey: RoutineKey, d: Date): RoutineStep[] {
  return stepsFor(config, routineKey, dayTypeForDate(d));
}

export function logFor(data: RoutinesData, dateStr: string): RoutineDayLog {
  const stored = data.days[dateStr];
  if (!stored) return emptyRoutineDayLog();
  return { ...emptyRoutineDayLog(), ...stored };
}

export function completionForDate(
  config: RoutinesConfig,
  data: RoutinesData,
  routineKey: RoutineKey,
  d: Date
): { done: number; total: number; pct: number | null } {
  const steps = stepsForDate(config, routineKey, d);
  const log = logFor(data, dateKey(d));
  const doneIds = new Set(log.completedStepIds[routineKey] ?? []);
  const done = steps.filter((s) => doneIds.has(s.id)).length;
  const total = steps.length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : null };
}

export type ConsistencyDay = {
  dateStr: string;
  morning: number | null;
  day: number | null;
  night: number | null;
};

export function last30DaysConsistency(
  config: RoutinesConfig,
  data: RoutinesData,
  now: Date = new Date()
): ConsistencyDay[] {
  const result: ConsistencyDay[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    d.setDate(d.getDate() - i);
    result.push({
      dateStr: dateKey(d),
      morning: completionForDate(config, data, "morning", d).pct,
      day: completionForDate(config, data, "day", d).pct,
      night: completionForDate(config, data, "night", d).pct,
    });
  }
  return result;
}

// Past days are locked - only today's log can ever be written to, so the
// consistency chart always tells the truth.
export function toggleStepDone(
  data: RoutinesData,
  routineKey: RoutineKey,
  stepId: string,
  now: Date = new Date()
): RoutinesData {
  const today = dateKey(now);
  const log = logFor(data, today);
  const current = log.completedStepIds[routineKey] ?? [];
  const next = current.includes(stepId)
    ? current.filter((id) => id !== stepId)
    : [...current, stepId];
  return {
    ...data,
    days: {
      ...data.days,
      [today]: { completedStepIds: { ...log.completedStepIds, [routineKey]: next } },
    },
  };
}
