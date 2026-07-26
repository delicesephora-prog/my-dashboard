// ---------------------------------------------------------------------------
// Cher's voice, centralized: greeting pools, toast line pools, a no-repeat
// picker, and a tiny cross-component event bus so any component can prompt
// a Cher toast without prop-drilling a callback through the whole tree.
// Voice rules for any future lines added here: lowercase-casual, warm
// hype-girl bestie, emojis sparingly but well, references her real world
// (Dec 8, OBIO, vaults, the snowball, Olivier, Jamaica, épis) - never
// generic corporate wellness speak.

export type CherLine = { id: string; text: string };

function pickNoRepeat(pool: CherLine[], lastId: string): CherLine {
  const candidates = pool.length > 1 ? pool.filter((p) => p.id !== lastId) : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Plain random pick, for one-shot toast pools that don't need no-repeat
// tracking (they're already deduped once per context per day upstream).
export function pickLine(pool: CherLine[]): CherLine {
  return pool[Math.floor(Math.random() * pool.length)];
}

// ---------------------------------------------------------------------------
// Greetings - time-of-day bucket, with day-aware lines mixed in.

type Bucket = "dawn" | "morning" | "afternoon" | "evening" | "night" | "witching";

function bucketForHour(hour: number): Bucket {
  if (hour >= 5 && hour < 9) return "dawn";
  if (hour >= 9 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  if (hour >= 1 && hour < 5) return "witching";
  return "night"; // 21:00-00:59
}

const GREETING_POOLS: Record<Bucket, CherLine[]> = {
  dawn: [
    { id: "dawn-1", text: "morning, CEO 🌅" },
    { id: "dawn-2", text: "up before the sun? december 8 energy." },
    { id: "dawn-3", text: "wake up n run di ting 😮‍💨" },
  ],
  morning: [
    { id: "morning-1", text: "mid-morning check-in, boss" },
    { id: "morning-2", text: "OBIO's finest has entered the chat" },
  ],
  afternoon: [
    { id: "afternoon-1", text: "afternoon sess ☀️" },
    { id: "afternoon-2", text: "midday reset — hydrate first, then scroll" },
  ],
  evening: [
    { id: "evening-1", text: "evening wind-down loading…" },
    { id: "evening-2", text: "off the clock. now the REAL work (dinner) begins 🍽️" },
  ],
  night: [
    { id: "night-1", text: "late night sess 🌙" },
    { id: "night-2", text: "burning the oil I see 👀" },
    { id: "night-3", text: "night owl hours. respectfully, one more task then bed" },
  ],
  witching: [], // handled specially below - needs the live time in the line
};

function witchingHourLine(now: Date): CherLine {
  const time = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return { id: "witching-live", text: `SEPH. it is ${time}. why are we here 😭 (love you tho)` };
}

// Day-of-week and payday flavor - mixed into the time-bucket pool rather
// than replacing it, so it's a possibility, not a guarantee.
function dayAwareLines(now: Date): CherLine[] {
  const day = now.getDate();
  const weekday = now.getDay(); // 0 = Sunday
  const lines: CherLine[] = [];
  if (day === 15 || day === 30) {
    lines.push({ id: "payday", text: "PAYDAY 💰 the vaults are eating good tonight" });
  }
  if (weekday === 1) lines.push({ id: "monday", text: "monday. office mode, let's get it." });
  if (weekday === 2 || weekday === 5) {
    lines.push({ id: "remote-day", text: "wfh uniform: blazer up top, comfort down low" });
  }
  if (weekday === 6) lines.push({ id: "saturday", text: "haul day baby 🛒" });
  if (weekday === 0) lines.push({ id: "sunday", text: "power hour sunday — 90 mins, that's all I ask" });
  return lines;
}

// now: current time. lastId: the id of the line shown last time, so this
// never repeats back-to-back.
export function getCherGreeting(now: Date, lastId: string): CherLine {
  const bucket = bucketForHour(now.getHours());
  if (bucket === "witching") return witchingHourLine(now);
  const pool = [...GREETING_POOLS[bucket], ...dayAwareLines(now)];
  return pickNoRepeat(pool, lastId);
}

// ---------------------------------------------------------------------------
// Toast context lines - short, auto-dismissing one-liners triggered by real
// actions. Each pool is keyed by the same contextKey used for the
// once-per-day dedup log (see CherData.toastLog in lib/types.ts).

export const TASK_CHECKED_POOL: CherLine[] = [
  { id: "task-1", text: "okayyy productive 😌" },
  { id: "task-2", text: "that's one. keep it cute." },
  { id: "task-3", text: "small wins stack, remember?" },
];

export const PREP_ALL_DONE_POOL: CherLine[] = [
  { id: "prep-1", text: "meal prep DONE — future you says thank you 💅" },
];

export function cookNightLine(streak: number, isHaitian: boolean, recipeName: string): CherLine {
  if (isHaitian) {
    return { id: "cook-haitian", text: `${recipeName} night — grandma would approve 🇭🇹` };
  }
  return { id: "cook-streak", text: `chef behavior 🔥 streak: ${streak}` };
}

export const BUDGET_UNDER_POOL: CherLine[] = [
  { id: "budget-1", text: "under budget?? the debt snowball is SHAKING" },
  { id: "budget-2", text: "every dollar saved = one step closer to Jamaica 🏝️" },
];

export function randomHelloLine(daysUntilDec8: number): CherLine {
  const pool: CherLine[] = [
    { id: "hello-1", text: "hi. that's it. just hi 🫶" },
    { id: "hello-2", text: "checking on my favorite ops admin" },
    { id: "hello-3", text: `${daysUntilDec8} days until dec 8. unrecognizable loading…` },
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Tab pop-ins are context-computed from live numbers rather than a static
// pool, so the copy itself lives with its data - these just keep the voice
// consistent and centralized.
export function moneyTabLine(bufferUsd: number, overCategoryName: string | null): string {
  if (overCategoryName) {
    return `heads up - ${overCategoryName} is running hot this month 👀`;
  }
  if (bufferUsd > 0) {
    return `left to breathe: $${Math.round(bufferUsd)}. she's holding steady 🫡`;
  }
  return "budget's tight this stretch - let's find you some breathing room";
}

export function routinesTabLine(atRiskCount: number, doneToday: number, totalToday: number): string {
  if (atRiskCount > 0) {
    return `a couple weekly goals need love before the week's out - you got this`;
  }
  if (totalToday > 0 && doneToday === totalToday) {
    return "today's routines: fully cleared. that's the whole game 🙌";
  }
  return "rituals are here whenever you're ready for them";
}

// ---------------------------------------------------------------------------
// Cross-component event bus - lets any component (e.g. a shared checkbox
// used everywhere) signal "something happened" without threading a new
// prop down through the entire tree. Dashboard.tsx is the single
// subscriber that turns pings into an actual toast, applying the
// once-per-context-per-day dedup and the frequency setting.

type CherPingListener = (contextKey: string) => void;
const listeners: CherPingListener[] = [];

export function pingCher(contextKey: string): void {
  listeners.forEach((l) => l(contextKey));
}

export function onCherPing(cb: CherPingListener): () => void {
  listeners.push(cb);
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
}

// ---------------------------------------------------------------------------
// Persisted Cher state - the frequency dial, dedup logs, and the dash-clear
// streak. Frequency governs ambient chatter only (toasts, tab pop-ins, the
// random hello, and the contextual greeting text) - it never touches the
// Daily Theme/Dash's own on/off toggle or its checklist mechanics.

export type CherFrequency = "off" | "quiet" | "full";

export type CherData = {
  frequency: CherFrequency;
  lastGreetingId: string;
  // contextKey -> dateKey it last showed a toast, for the once-per-context-
  // per-day rule.
  toastLog: Record<string, string>;
  dashStreak: { current: number; longest: number; lastClearedKey: string };
  // dateKey the random "just checking in" hello last fired, "" if never.
  lastRandomHelloKey: string;
};

export function defaultCherData(): CherData {
  return {
    frequency: "full",
    lastGreetingId: "",
    toastLog: {},
    dashStreak: { current: 0, longest: 0, lastClearedKey: "" },
    lastRandomHelloKey: "",
  };
}

export function normalizeCherData(raw: Partial<CherData> | null | undefined): CherData {
  const fallback = defaultCherData();
  return {
    frequency: raw?.frequency ?? fallback.frequency,
    lastGreetingId: raw?.lastGreetingId ?? "",
    toastLog: raw?.toastLog ?? {},
    dashStreak: {
      current: raw?.dashStreak?.current ?? 0,
      longest: raw?.dashStreak?.longest ?? 0,
      lastClearedKey: raw?.dashStreak?.lastClearedKey ?? "",
    },
    lastRandomHelloKey: raw?.lastRandomHelloKey ?? "",
  };
}

// Ambient toasts (task-checked, tab pop-ins, cook-night, budget-under,
// random hello) are suppressed at both "quiet" and "off" - only "full"
// chatter shows them. Real milestone celebrations are a separate,
// pre-existing system and aren't gated by this at all.
export function shouldShowCherToast(data: CherData, contextKey: string, today: string): boolean {
  if (data.frequency !== "full") return false;
  return data.toastLog[contextKey] !== today;
}

export function markCherToastShown(data: CherData, contextKey: string, today: string): CherData {
  return { ...data, toastLog: { ...data.toastLog, [contextKey]: today } };
}

// Greeting personality is available at "quiet" too (it's presence, not
// chatter) - only "off" reverts to a plain, unvoiced greeting.
export function shouldShowCherGreeting(data: CherData): boolean {
  return data.frequency !== "off";
}

// Streak update: no-op if already cleared today; otherwise extends the
// streak if yesterday was also cleared, or restarts it at 1. Same
// consecutive-days-with-gap-reset shape as lib/knowledge.ts's scholar
// streak.
export function recordDashCleared(data: CherData, today: string, yesterday: string): CherData {
  if (data.dashStreak.lastClearedKey === today) return data;
  const current = data.dashStreak.lastClearedKey === yesterday ? data.dashStreak.current + 1 : 1;
  const longest = Math.max(data.dashStreak.longest, current);
  return { ...data, dashStreak: { current, longest, lastClearedKey: today } };
}
