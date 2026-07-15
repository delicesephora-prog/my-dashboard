// Vercel's serverless functions run in UTC, not Eastern time - so raw
// `new Date().getDay()` / `.getHours()` calls are wrong for anything that
// needs to know Sephora's actual local weekday or clock time (especially
// after ~7-8pm ET, once UTC has already crossed into the next day).
// These helpers read true Eastern wall-clock parts via Intl, DST-aware.

const TIME_ZONE = "America/New_York";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type EasternParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  weekday: number; // 0 = Sunday ... 6 = Saturday, matches Date#getDay()
};

export function easternParts(now: Date = new Date()): EasternParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")) % 24, // some runtimes report midnight as "24"
    minute: Number(get("minute")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
  };
}

// Builds a Date via the local Date constructor from real Eastern wall-clock
// parts. On a UTC-runtime server this yields a Date object whose own
// .getDay()/.getHours()/.getMinutes() read back as true Eastern values, so
// it can be passed straight into existing helpers (rhythm.ts, routines.ts)
// without changing them.
export function fakeEasternDate(now: Date = new Date()): Date {
  const p = easternParts(now);
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, 0, 0);
}

export function easternDateKey(now: Date = new Date()): string {
  const p = easternParts(now);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function easternMinutesSinceMidnight(now: Date = new Date()): number {
  const p = easternParts(now);
  return p.hour * 60 + p.minute;
}

export function isEasternWeekday(now: Date = new Date()): boolean {
  const p = easternParts(now);
  return p.weekday >= 1 && p.weekday <= 5;
}

// 10:00pm through 6:30am Eastern - no text of any kind goes out in this
// window, regardless of what any individual setting says.
export function isEasternQuietHours(now: Date = new Date()): boolean {
  const mins = easternMinutesSinceMidnight(now);
  return mins >= 22 * 60 || mins < 6 * 60 + 30;
}

// True when the real Eastern clock time is within `windowMinutes` of the
// "HH:MM" target - lets a cron that fires a little early/late, or a
// user-configured time that doesn't land exactly on a Vercel trigger, still
// match its intended slot.
export function isNearEasternTime(
  target: string,
  now: Date = new Date(),
  windowMinutes = 45
): boolean {
  const [th, tm] = target.split(":").map(Number);
  if (Number.isNaN(th) || Number.isNaN(tm)) return false;
  const targetMins = th * 60 + tm;
  const nowMins = easternMinutesSinceMidnight(now);
  return Math.abs(nowMins - targetMins) <= windowMinutes;
}
