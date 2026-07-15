// Settings + send-log for the Rhythm/Routines text alert system. Kept
// fully separate from the older `smsAlerts` field (which only tracks
// already-alerted overdue task ids for a different feature).

export type TextAlertsSettings = {
  morningEnabled: boolean;
  morningWeekdayTime: string; // "HH:MM", 24h
  morningWeekendTime: string;
  anchorNudgesEnabled: boolean;
  nightEnabled: boolean;
  nightTime: string;
};

export type TextAlertsData = {
  settings: TextAlertsSettings;
  // Keyed by YYYY-MM-DD (Eastern date) - the list of message tags already
  // sent that day (e.g. "morning", "night", "anchor:<id>"). Never more
  // than 3 entries; only today's key is ever written to.
  log: Record<string, string[]>;
};

const MAX_PER_DAY = 3;

export function defaultTextAlertsSettings(): TextAlertsSettings {
  return {
    morningEnabled: true,
    morningWeekdayTime: "07:00",
    morningWeekendTime: "08:30",
    anchorNudgesEnabled: true,
    nightEnabled: true,
    nightTime: "21:00",
  };
}

export function emptyTextAlertsData(): TextAlertsData {
  return { settings: defaultTextAlertsSettings(), log: {} };
}

export function normalizeTextAlertsData(
  partial: Partial<TextAlertsData> | null | undefined
): TextAlertsData {
  const fallback = defaultTextAlertsSettings();
  return {
    settings: {
      morningEnabled: partial?.settings?.morningEnabled ?? fallback.morningEnabled,
      morningWeekdayTime: partial?.settings?.morningWeekdayTime ?? fallback.morningWeekdayTime,
      morningWeekendTime: partial?.settings?.morningWeekendTime ?? fallback.morningWeekendTime,
      anchorNudgesEnabled: partial?.settings?.anchorNudgesEnabled ?? fallback.anchorNudgesEnabled,
      nightEnabled: partial?.settings?.nightEnabled ?? fallback.nightEnabled,
      nightTime: partial?.settings?.nightTime ?? fallback.nightTime,
    },
    log: partial?.log ?? {},
  };
}

export function sentTagsToday(data: TextAlertsData, dateKey: string): string[] {
  return data.log[dateKey] ?? [];
}

export function canSendMore(data: TextAlertsData, dateKey: string): boolean {
  return sentTagsToday(data, dateKey).length < MAX_PER_DAY;
}

export function alreadySent(data: TextAlertsData, dateKey: string, tag: string): boolean {
  return sentTagsToday(data, dateKey).includes(tag);
}

// Records that a message tagged `tag` went out today. Past days are never
// touched - only today's key is ever written to.
export function recordSent(data: TextAlertsData, dateKey: string, tag: string): TextAlertsData {
  const existing = sentTagsToday(data, dateKey);
  if (existing.includes(tag)) return data;
  return { ...data, log: { ...data.log, [dateKey]: [...existing, tag] } };
}
