import { dateKey } from "./date";

// ---------------------------------------------------------------------------
// Daily Theme: a full editorial magazine-style interstitial shown once per
// day, right after the Welcome screen and before the Front Page. One named
// theme per weekday - a hero image, a masthead title, an intro paragraph,
// and a handful of gentle, checkable prompts laid out as full editorial
// blocks (title, description, and an image) - never a task list, always
// skippable in one tap. Content is fully hers to rewrite; the seed below is
// just a starting point.

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
  title: string;
  description: string;
  // A data URI she's uploaded for this prompt's block, "" if none - shown
  // beside the title/description, alternating sides down the page.
  imageUrl: string;
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

// A small scattered mood-board image, purely decorative - her own uploads,
// dropped between sections for a scrapbook/moodboard feel.
export type AccentImage = {
  id: string;
  url: string;
};

export type DailyTheme = {
  dayKey: DailyThemeDayKey;
  name: string;
  colorMood: string;
  // A full 2-3 sentence paragraph, not a one-liner.
  intro: string;
  prompts: DailyThemePrompt[];
  imageQuery: string;
  image: DailyThemeImage;
  accentImages: AccentImage[];
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

function promptItem(title: string, description: string): DailyThemePrompt {
  return { id: crypto.randomUUID(), title, description, imageUrl: "" };
}

function theme(
  dayKey: DailyThemeDayKey,
  name: string,
  colorMood: string,
  intro: string,
  prompts: [string, string][],
  imageQuery: string
): DailyTheme {
  return {
    dayKey,
    name,
    colorMood,
    intro,
    prompts: prompts.map(([title, description]) => promptItem(title, description)),
    imageQuery,
    image: emptyDailyThemeImage(),
    accentImages: [],
  };
}

// Bumped from 1 -> 2: prompts moved from a single line of text to a full
// editorial block (title + description + image) and intro grew from a
// one-liner into a real paragraph - a wholesale content-shape change, not
// just a copy tweak, so it needs its own seed pass.
export const DAILY_THEME_SEED_VERSION = 2;

function seedThemes(): Record<DailyThemeDayKey, DailyTheme> {
  return {
    sunday: theme(
      "sunday",
      "Serene Sunday",
      "Soft cream & quiet gold",
      "Before the week claims you, take this morning back for yourself. Set the tone with a slow cup of something warm, a clear plan for what's ahead, and a home that feels ready for you - not the other way around.",
      [
        ["Plan the week ahead", "Open your calendar and walk through what's actually coming - not just what's urgent, but what matters. A few honest minutes now saves you from scrambling Wednesday."],
        ["Sunday Reset", "Clear counters, reset the laundry, put wandering things back where they belong. A tidy space Sunday night is a gift to Monday-morning you."],
        ["Meal prep for the week", "Batch what you can, prep what you can't, and know dinner is handled before the week even asks."],
        ["Nourish", "One slow, real meal today - cooked with care, eaten without rushing. Let food be pleasure, not just fuel."],
        ["Early night", "Protect your bedtime like it's an appointment with someone important. It is."],
      ],
      "calm morning tea"
    ),
    monday: theme(
      "monday",
      "Motivated Monday",
      "Bright gold & fresh plum",
      "New week, clean page. You don't need to have it all figured out by nine a.m. - you just need one clear intention and the willingness to take the first real step toward it.",
      [
        ["Set this week's intention", "Name the one word or feeling you want driving this week - focus, ease, discipline, joy. Let it be your quiet compass when things get noisy."],
        ["Name one big goal", "Pick the single thing that, if it got done this week, would make everything else feel lighter. Write it down somewhere you'll actually see it."],
        ["Build momentum", "Take the smallest real step toward that goal today. Momentum is built in inches, not leaps."],
      ],
      "motivation sunrise notebook"
    ),
    tuesday: theme(
      "tuesday",
      "Tenacious Tuesday",
      "Deep plum & steady bronze",
      "This is the day for grit, not glamour. Whatever you've been circling, avoiding, or overthinking - today's the day you show up for it anyway, imperfectly and on purpose.",
      [
        ["Deep work block", "Carve out real, uninterrupted time - phone away, tabs closed - for the work that actually needs your full mind."],
        ["Tackle the hard thing first", "Do the thing you've been avoiding before anything else gets a chance to distract you from it."],
        ["Progress over perfection", "Let 'done and imperfect' win over 'perfect and unfinished' today. Momentum matters more than polish."],
      ],
      "focused deep work desk"
    ),
    wednesday: theme(
      "wednesday",
      "Well Wednesday",
      "Warm ivory & amber",
      "Right in the middle of the week, give yourself a beat. Check in honestly, tidy what's slipping, and get tomorrow set up so the second half feels as steady as the first.",
      [
        ["Midweek reset", "Look back at Monday and Tuesday honestly - what's working, what needs adjusting - and course-correct before the week runs away from you."],
        ["Prep night", "Set tomorrow up tonight - lay out what you need, prep what you can, so morning-you starts a step ahead."],
        ["Check in with myself", "A few honest minutes with just you - how are you actually doing, underneath the to-do list?"],
      ],
      "midweek reset candle"
    ),
    thursday: theme(
      "thursday",
      "Thoughtful Thursday",
      "Rose plum & warm gold",
      "Today turns outward. It's not about what you get done - it's about who you notice, who you thank, and who you reach for. Small, sincere gestures count more than grand ones.",
      [
        ["List 3 things I'm grateful for", "Nothing has to be profound - the good coffee counts. Naming it out loud makes it stick."],
        ["Reach out to someone I love", "A call, a text, a real 'thinking of you' - to someone who'd love to hear from you today."],
        ["One act of kindness", "Something small and unasked-for, for a stranger or someone close. It costs you little and means a lot."],
        ["Learn something new", "Read, watch, or ask about something you didn't know this morning. Stay a student of your own life."],
      ],
      "gratitude journal flowers"
    ),
    friday: theme(
      "friday",
      "Free Friday",
      "Champagne gold & twilight plum",
      "The work week is closing out - let it close all the way. Wrap loose ends, give your win its flowers, and protect tonight like it's sacred, because it is.",
      [
        ["Wrap the work week", "Close out open threads, send the last emails, and leave your desk in a state your Monday self will thank you for."],
        ["Laundry", "Get it started, get it done, and walk into the weekend without it hanging over you."],
        ["Celebrate a win", "Name one real thing you did well this week - out loud, in writing, however you like. Let yourself actually feel it."],
        ["Protect the evening", "No 'just one more thing.' Tonight is yours - guard it like it matters, because it does."],
      ],
      "friday evening celebration"
    ),
    saturday: theme(
      "saturday",
      "Slow & Soulful Saturday",
      "Dusty rose & candlelight gold",
      "No agenda but joy today. Let the morning stretch out, move your body because it feels good rather than because you have to, and give yourself permission to just be, unhurried.",
      [
        ["Slow morning", "No alarm racing you out of bed. Coffee in no rush, sunlight through the window, nowhere urgent to be."],
        ["Move my body joyfully", "Dance in the kitchen, take a long walk, stretch on the floor - movement as pleasure, not punishment."],
        ["A hobby, just for me", "Time with something that's yours alone - no productivity attached, no outcome required."],
        ["Disconnect", "A real stretch of time away from the phone. Let the world go on without your notifications for a while."],
        ["Treat myself", "Something small and genuinely enjoyable, chosen just because you wanted it."],
      ],
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

function normalizePrompt(raw: Partial<DailyThemePrompt> | null | undefined): DailyThemePrompt | null {
  if (!raw) return null;
  // Defensive fallback for the pre-v2 shape ({ id, text }), in case a raw
  // blob ever slips through without going through the seed-version reseed.
  const legacyText = (raw as { text?: string }).text;
  return {
    id: raw.id ?? crypto.randomUUID(),
    title: raw.title ?? legacyText ?? "",
    description: raw.description ?? "",
    imageUrl: raw.imageUrl ?? "",
  };
}

function normalizeAccentImage(raw: Partial<AccentImage> | null | undefined): AccentImage | null {
  if (!raw?.url) return null;
  return { id: raw.id ?? crypto.randomUUID(), url: raw.url };
}

function normalizeTheme(
  dayKey: DailyThemeDayKey,
  fallback: DailyTheme,
  raw: Partial<DailyTheme> | null | undefined
): DailyTheme {
  if (!raw) return fallback;
  const prompts = (raw.prompts ?? []).map(normalizePrompt).filter((p): p is DailyThemePrompt => p !== null);
  const accentImages = (raw.accentImages ?? [])
    .map(normalizeAccentImage)
    .filter((a): a is AccentImage => a !== null);
  return {
    dayKey,
    name: raw.name ?? fallback.name,
    colorMood: raw.colorMood ?? fallback.colorMood,
    intro: raw.intro ?? fallback.intro,
    prompts: prompts.length > 0 ? prompts : fallback.prompts,
    imageQuery: raw.imageQuery ?? fallback.imageQuery,
    image: normalizeImage(raw.image),
    accentImages,
  };
}

// Seed content only ever overwrites what's already there the very first
// time (seedVersion behind the current one) - any edit she makes
// afterward is permanent unless a future deliberate seed bump says
// otherwise, same rule every other seeded bank in this app follows.
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
