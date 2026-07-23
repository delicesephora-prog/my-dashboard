export type AmbianceTrack = "rain" | "cafe" | "piano";

export const AMBIANCE_TRACKS: AmbianceTrack[] = ["rain", "cafe", "piano"];

export const AMBIANCE_TRACK_LABELS: Record<AmbianceTrack, string> = {
  rain: "Rain",
  cafe: "Café",
  piano: "Piano",
};

export type AmbianceData = {
  checkSoundEnabled: boolean;
  chimeEnabled: boolean;
  focusSoundEnabled: boolean;
  focusTrack: AmbianceTrack;
};

// Everything here defaults off - sound is opt-in, never a surprise the
// first time she opens the app.
export function emptyAmbianceData(): AmbianceData {
  return {
    checkSoundEnabled: false,
    chimeEnabled: false,
    focusSoundEnabled: false,
    focusTrack: "rain",
  };
}

export function normalizeAmbianceData(
  partial: Partial<AmbianceData> | null | undefined
): AmbianceData {
  const fallback = emptyAmbianceData();
  if (!partial) return fallback;
  return {
    checkSoundEnabled: partial.checkSoundEnabled ?? fallback.checkSoundEnabled,
    chimeEnabled: partial.chimeEnabled ?? fallback.chimeEnabled,
    focusSoundEnabled: partial.focusSoundEnabled ?? fallback.focusSoundEnabled,
    focusTrack: AMBIANCE_TRACKS.includes(partial.focusTrack as AmbianceTrack)
      ? (partial.focusTrack as AmbianceTrack)
      : fallback.focusTrack,
  };
}

// A module-level cache of the current settings, kept in sync by Dashboard.tsx
// whenever data.ambiance changes. lib/sound.ts reads this directly, so the
// dozens of existing CheckCircle/HabitCell call sites don't need this
// setting threaded through as a prop.
let current: AmbianceData = emptyAmbianceData();

export function setAmbianceSettings(data: AmbianceData) {
  current = data;
}

export function getAmbianceSettings(): AmbianceData {
  return current;
}
