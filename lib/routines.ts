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
  morning: "#B08B4F",
  day: "#5B2333",
  night: "#3D1622",
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
  seedVersion: number;
  glowUpdateVersion: number;
};

function emptyVariant(): RoutineVariant {
  return { steps: [] };
}

export function emptyRoutine(): Routine {
  return {
    variants: { office: emptyVariant(), remote: emptyVariant(), weekend: emptyVariant() },
  };
}

// Bump whenever the seed content below changes and existing saved routines
// should be replaced rather than left alone - see the seedVersion migration
// in normalizeRoutinesData.
export const ROUTINES_SEED_VERSION = 1;

function step(text: string, targetTime = "", durationMinutes: number | null = null): Omit<RoutineStep, "id" | "order"> {
  return { text, targetTime, durationMinutes };
}

function variant(steps: Omit<RoutineStep, "id" | "order">[]): RoutineVariant {
  return {
    steps: steps.map((s, i) => ({ ...s, id: crypto.randomUUID(), order: i })),
  };
}

export function seedRoutinesConfig(): RoutinesConfig {
  return {
    morning: {
      variants: {
        office: variant([
          step("Wake — no phone 15 min", "06:00"),
          step("Make bed + water"),
          step("Devotional + prayer", "06:15"),
          step("Shower + get ready"),
          step("Breakfast / grab lunch", "07:15"),
          step("Out the door", "07:35"),
          step("Commute: worship or audiobook"),
        ]),
        remote: variant([
          step("Wake — no phone 15 min", "06:30"),
          step("Make bed + water"),
          step("Devotional + prayer (20 min)"),
          step("Workout or walk"),
          step("Shower + dress like it counts"),
          step("Breakfast + set One Thing", "08:30"),
          step("At desk", "09:00"),
        ]),
        weekend: variant([
          step("Wake naturally — make the bed"),
          step("Unhurried devotional + journal"),
          step("Slow breakfast with O"),
          step("Movement: gym / walk / stretch"),
          step("One \"future me\" task"),
        ]),
      },
    },
    day: {
      variants: {
        office: variant([
          step("Real lunch away from desk", "12:30"),
          step("5-min walk outside"),
          step("Water check"),
          step("Inbox + task triage", "15:00"),
          step("Write tomorrow's top 3"),
        ]),
        remote: variant([
          step("Lunch away from laptop", "12:30"),
          step("10-min walk outside"),
          step("Water check"),
          step("Triage + one home micro-task", "15:00"),
          step("Hard stop — plan tomorrow", "17:30"),
        ]),
        weekend: variant([
          step("Water + light lunch"),
          step("One home zone task"),
          step("Something that fills you"),
        ]),
      },
    },
    night: {
      variants: {
        office: variant([
          step("Kitchen reset + pack lunch", "20:30"),
          step("Pick tomorrow's outfit"),
          step("Skincare"),
          step("Phone charges across room", "21:30"),
          step("Daily review (2 min)"),
          step("Prayer + 3 gratitudes"),
          step("Lights out", "22:30"),
        ]),
        remote: variant([
          step("Kitchen reset", "20:30"),
          step("Tidy desk for tomorrow"),
          step("Skincare"),
          step("Phone charges across room", "21:30"),
          step("Daily review (2 min)"),
          step("Prayer + 3 gratitudes"),
          step("Lights out", "22:30"),
        ]),
        weekend: variant([
          step("Kitchen reset"),
          step("Skincare"),
          step("Daily review"),
          step("Prayer + 3 gratitudes"),
          step("Sunday: peek at week ahead"),
        ]),
      },
    },
  };
}

export function emptyRoutinesData(): RoutinesData {
  return {
    config: seedRoutinesConfig(),
    days: {},
    seedVersion: ROUTINES_SEED_VERSION,
    glowUpdateVersion: ROUTINES_GLOW_UPDATE_VERSION,
  };
}

// One-time, additive expansion of the "Shower + get ready" morning step and
// the "Skincare" night step into the real, checkable product-by-product
// routine - gated by glowUpdateVersion (separate from seedVersion, which
// wipes all saved data) so it runs exactly once against existing saved
// routines and never re-inserts a step the user has since edited or
// deleted.
export const ROUTINES_GLOW_UPDATE_VERSION = 1;

const MORNING_GLOW_STEPS: Omit<RoutineStep, "id" | "order">[] = [
  step("Shower — Native body wash + Dove antibacterial, African net sponge (3–4x/week, not daily)"),
  step("✦ Face: CeraVe Acne Control Cleanser, in shower (AM + PM — if skin feels tight, switch to PM only)"),
  step("Pat skin damp, don't rub dry"),
  step("Body: CeraVe Moisturizing Lotion on damp skin — whole body"),
  step("✦ Body butter on dry zones (elbows, knees, legs)"),
  step("Body: Tree Hut Tropical Glow Firming Oil on glow zones (arms, chest, shoulders) — seals"),
  step("Body: Vaseline Cocoa Radiant 72hr lotion — extra-dry days only (optional)"),
  step("Deodorant"),
  step("Face: Naturium Vitamin C + Turmeric Brightening Face Oil"),
  step("✦ Face moisturizer"),
  step("Face: Black Girl Sunscreen — LAST step, every day, non-negotiable"),
  step("Lips: lip treatment, sit a few minutes, then Aquaphor"),
  step("Edges oiled + get dressed"),
];

const REMOTE_MORNING_EXTRAS: Omit<RoutineStep, "id" | "order">[] = [
  step("Tend Skin on bikini area if needed (shave days only)"),
  step("One small self-care add of choice"),
];

const NIGHT_SKINCARE_STEPS: Omit<RoutineStep, "id" | "order">[] = [
  step("Cleanse face — CeraVe Acne Control Cleanser (AM + PM — if skin feels tight, switch to PM only)"),
  step("✦ Treatment: niacinamide serum (alternate nights to start)"),
  step("✦ Night moisturizer"),
  step("Lips: Aquaphor"),
  step("✦ Body butter on feet + elbows"),
];

// Replaces the single step matching `matchText` with `replacement`, or
// leaves the list untouched if that step is no longer present (already
// edited or deleted by the user).
function expandStep(
  steps: RoutineStep[],
  matchText: string,
  replacement: Omit<RoutineStep, "id" | "order">[]
): RoutineStep[] {
  const idx = steps.findIndex((s) => s.text === matchText);
  if (idx === -1) return steps;
  const inserted = replacement.map((s) => ({ ...s, id: crypto.randomUUID() }));
  return [...steps.slice(0, idx), ...inserted, ...steps.slice(idx + 1)].map((s, i) => ({ ...s, order: i }));
}

// Inserts `additions` right after the step matching `afterText` (or at the
// end if that step isn't found).
function insertStepsAfter(
  steps: RoutineStep[],
  afterText: string,
  additions: Omit<RoutineStep, "id" | "order">[]
): RoutineStep[] {
  const idx = steps.findIndex((s) => s.text === afterText);
  const insertAt = idx === -1 ? steps.length : idx + 1;
  const inserted = additions.map((s) => ({ ...s, id: crypto.randomUUID() }));
  return [...steps.slice(0, insertAt), ...inserted, ...steps.slice(insertAt)].map((s, i) => ({ ...s, order: i }));
}

export function applyGlowRoutineUpdate(data: RoutinesData): RoutinesData {
  if (data.glowUpdateVersion >= ROUTINES_GLOW_UPDATE_VERSION) return data;

  const morning = data.config.morning;
  const night = data.config.night;

  return {
    ...data,
    config: {
      ...data.config,
      morning: {
        variants: {
          office: { steps: expandStep(morning.variants.office.steps, "Shower + get ready", MORNING_GLOW_STEPS) },
          remote: {
            steps: expandStep(morning.variants.remote.steps, "Shower + dress like it counts", [
              ...MORNING_GLOW_STEPS,
              ...REMOTE_MORNING_EXTRAS,
            ]),
          },
          weekend: {
            steps: insertStepsAfter(
              morning.variants.weekend.steps,
              "Unhurried devotional + journal",
              MORNING_GLOW_STEPS
            ),
          },
        },
      },
      night: {
        variants: {
          office: { steps: expandStep(night.variants.office.steps, "Skincare", NIGHT_SKINCARE_STEPS) },
          remote: { steps: expandStep(night.variants.remote.steps, "Skincare", NIGHT_SKINCARE_STEPS) },
          weekend: { steps: expandStep(night.variants.weekend.steps, "Skincare", NIGHT_SKINCARE_STEPS) },
        },
      },
    },
    glowUpdateVersion: ROUTINES_GLOW_UPDATE_VERSION,
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
  if ((partial?.seedVersion ?? 0) < ROUTINES_SEED_VERSION) {
    return {
      config: seedRoutinesConfig(),
      days: {},
      seedVersion: ROUTINES_SEED_VERSION,
      glowUpdateVersion: ROUTINES_GLOW_UPDATE_VERSION,
    };
  }
  const fallback = emptyRoutinesData();
  return {
    config: {
      morning: normalizeRoutine(partial?.config?.morning),
      day: normalizeRoutine(partial?.config?.day),
      night: normalizeRoutine(partial?.config?.night),
    },
    days: partial?.days ?? fallback.days,
    seedVersion: partial?.seedVersion ?? ROUTINES_SEED_VERSION,
    glowUpdateVersion: partial?.glowUpdateVersion ?? 0,
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
