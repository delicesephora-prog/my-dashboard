import { dateKey } from "./date";

// ---------------------------------------------------------------------------
// Daily Theme: a full-screen editorial interstitial shown once per day,
// right after the Welcome screen and before the Front Page. One named
// theme per weekday with a short intro and a handful of gentle, checkable
// prompts - never a task list, always skippable in one tap. Content is
// fully hers to rewrite; the seed below is just a starting point.

export type DailyThemeDayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export const DAILY_THEME_DAY_KEYS: DailyThemeDayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

// Date.getDay() is 0 = Sunday ... 6 = Saturday, which is exactly the order
// DAILY_THEME_DAY_KEYS is in - no separate lookup table needed.
export function dayKeyForDate(d: Date): DailyThemeDayKey {
  return DAILY_THEME_DAY_KEYS[d.getDay()];
}

export type DailyThemePrompt = {
  id: string;
  text: string;
};

export type DailyThemeImage = {
  // Cached choice - persists so the hero image doesn't change every time
  // the screen opens. Empty strings until a real fetch lands.
  url: string;
  thumbUrl: string;
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;
  fetchedAt: string;
  // A user-uploaded photo always overrides the fetched one when set -
  // never cleared by a shuffle or a refetch, only by her removing it.
  customUrl: string;
};

export function emptyDailyThemeImage(): DailyThemeImage {
  return {
    url: "",
    thumbUrl: "",
    photographer: "",
    photographerUrl: "",
    sourceUrl: "",
    fetchedAt: "",
    customUrl: "",
  };
}

export type DailyTheme = {
  dayKey: DailyThemeDayKey;
  name: string;
  colorMood: string;
  intro: string;
  prompts: DailyThemePrompt[];
  imageQuery: string;
  image: DailyThemeImage;
};

export type DailyThemeData = {
  enabled: boolean;
  themes: Record<DailyThemeDayKey, DailyTheme>;
  // dateKey -> ids of prompts checked that day. Lightweight and per-date,
  // same shape as GlowUp's dailyLogs - not a permanent task list.
  completions: Record<string, string[]>;
  // "" until first shown. One per calendar day, unlike the welcome screen
  // which resets per day-part.
  lastShownKey: string;
  seedVersion: number;
};

function prompt(text: string): DailyThemePrompt {
  return { id: crypto.randomUUID(), text };
}

function theme(
  dayKey: DailyThemeDayKey,
  name: string,
  colorMood: string,
  intro: string,
  promptTexts: string[],
  imageQuery: string
): DailyTheme {
  return {
    dayKey,
    name,
    colorMood,
    intro,
    prompts: promptTexts.map(prompt),
    imageQuery,
    image: emptyDailyThemeImage(),
  };
}

export const DAILY_THEME_SEED_VERSION = 1;

function seedThemes(): Record<DailyThemeDayKey, DailyTheme> {
  return {
    sunday: theme(
      "sunday",
      "Serene Sunday",
      "Soft cream & quiet gold",
      "The quiet page before the week begins - reset, plan, breathe.",
      ["Plan the week ahead", "Sunday Reset - tidy and reset the space", "Meal prep for the week", "Nourish - a slow, real meal", "Early night"],
      "calm morning tea"
    ),
    monday: theme(
      "monday",
      "Motivated Monday",
      "Bright gold & fresh plum",
      "A clean page and a clear intention. Let's build momentum.",
      ["Set this week's intention", "Name one big goal for the week", "Build momentum - take the first small step"],
      "motivation sunrise notebook"
    ),
    tuesday: theme(
      "tuesday",
      "Tenacious Tuesday",
      "Deep plum & steady bronze",
      "Grit day. Show up for the hard thing.",
      ["Deep work block", "Tackle the hard thing first", "Progress over perfection"],
      "focused deep work desk"
    ),
    wednesday: theme(
      "wednesday",
      "Well Wednesday",
      "Warm ivory & amber",
      "Halfway there - a beat to reset and keep going steady.",
      ["Midweek reset", "Prep night for tomorrow", "Check in with myself"],
      "midweek reset candle"
    ),
    thursday: theme(
      "thursday",
      "Thoughtful Thursday",
      "Rose plum & warm gold",
      "A day to look outward - gratitude, connection, kindness.",
      ["List 3 things I'm grateful for", "Reach out to someone I love", "One act of kindness", "Learn something new"],
      "gratitude journal flowers"
    ),
    friday: theme(
      "friday",
      "Free Friday",
      "Champagne gold & twilight plum",
      "Wrap it up, wind it down, and give the win its flowers.",
      ["Wrap the work week", "Laundry", "Celebrate a win", "Protect the evening"],
      "friday evening celebration"
    ),
    saturday: theme(
      "saturday",
      "Slow & Soulful Saturday",
      "Dusty rose & candlelight gold",
      "No agenda but joy. Slow down and soak it in.",
      ["Slow morning", "Move my body joyfully", "A hobby, just for me", "Disconnect", "Treat myself"],
      "cozy self care"
    ),
  };
}

export function defaultDailyThemeData(): DailyThemeData {
  return {
    enabled: true,
    themes: seedThemes(),
    completions: {},
    lastShownKey: "",
    seedVersion: DAILY_THEME_SEED_VERSION,
  };
}

function normalizeImage(raw: Partial<DailyThemeImage> | null | undefined): DailyThemeImage {
  const empty = emptyDailyThemeImage();
  return {
    url: raw?.url ?? empty.url,
    thumbUrl: raw?.thumbUrl ?? empty.thumbUrl,
    photographer: raw?.photographer ?? empty.photographer,
    photographerUrl: raw?.photographerUrl ?? empty.photographerUrl,
    sourceUrl: raw?.sourceUrl ?? empty.sourceUrl,
    fetchedAt: raw?.fetchedAt ?? empty.fetchedAt,
    customUrl: raw?.customUrl ?? empty.customUrl,
  };
}

function normalizeTheme(
  dayKey: DailyThemeDayKey,
  fallback: DailyTheme,
  raw: Partial<DailyTheme> | null | undefined
): DailyTheme {
  if (!raw) return fallback;
  return {
    dayKey,
    name: raw.name ?? fallback.name,
    colorMood: raw.colorMood ?? fallback.colorMood,
    intro: raw.intro ?? fallback.intro,
    prompts:
      raw.prompts && raw.prompts.length > 0
        ? raw.prompts.map((p) => ({ id: p.id ?? crypto.randomUUID(), text: p.text ?? "" }))
        : fallback.prompts,
    imageQuery: raw.imageQuery ?? fallback.imageQuery,
    image: normalizeImage(raw.image),
  };
}

// Seed content only ever overwrites what's already there the very first
// time (seedVersion 0 -> 1, i.e. the field didn't exist yet) - any edit
// she makes afterward is permanent unless a future deliberate seed bump
// says otherwise, same rule every other seeded bank in this app follows.
export function normalizeDailyThemeData(
  raw: Partial<DailyThemeData> | null | undefined
): DailyThemeData {
  const fallback = defaultDailyThemeData();
  const seedVersion = raw?.seedVersion ?? 0;
  if (seedVersion < DAILY_THEME_SEED_VERSION || !raw?.themes) {
    return {
      enabled: raw?.enabled ?? fallback.enabled,
      themes: fallback.themes,
      completions: raw?.completions ?? {},
      lastShownKey: raw?.lastShownKey ?? "",
      seedVersion: DAILY_THEME_SEED_VERSION,
    };
  }
  const themes = seedThemes();
  for (const key of DAILY_THEME_DAY_KEYS) {
    themes[key] = normalizeTheme(key, themes[key], raw.themes[key]);
  }
  return {
    enabled: raw.enabled ?? true,
    themes,
    completions: raw.completions ?? {},
    lastShownKey: raw.lastShownKey ?? "",
    seedVersion: raw.seedVersion ?? DAILY_THEME_SEED_VERSION,
  };
}

export function themeForDate(data: DailyThemeData, d: Date): DailyTheme {
  return data.themes[dayKeyForDate(d)];
}

export function shouldShowDailyTheme(data: DailyThemeData, d: Date): boolean {
  if (!data.enabled) return false;
  return data.lastShownKey !== dateKey(d);
}

export function markDailyThemeShown(data: DailyThemeData, d: Date): DailyThemeData {
  return { ...data, lastShownKey: dateKey(d) };
}

export function completedPromptIdsFor(data: DailyThemeData, d: Date): string[] {
  return data.completions[dateKey(d)] ?? [];
}

export function togglePromptCompletion(
  data: DailyThemeData,
  d: Date,
  promptId: string
): DailyThemeData {
  const key = dateKey(d);
  const current = data.completions[key] ?? [];
  const next = current.includes(promptId)
    ? current.filter((id) => id !== promptId)
    : [...current, promptId];
  return { ...data, completions: { ...data.completions, [key]: next } };
}

export function updateTheme(
  data: DailyThemeData,
  dayKey: DailyThemeDayKey,
  updater: (t: DailyTheme) => DailyTheme
): DailyThemeData {
  return { ...data, themes: { ...data.themes, [dayKey]: updater(data.themes[dayKey]) } };
}
