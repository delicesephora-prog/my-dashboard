export type ThemeMode = "auto" | "light" | "evening";

export const THEME_MODES: ThemeMode[] = ["auto", "light", "evening"];

export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  auto: "Auto (day / evening)",
  light: "Always Warm Light",
  evening: "Always Evening Luxe",
};

export type AppearanceData = {
  themeMode: ThemeMode;
};

export function emptyAppearanceData(): AppearanceData {
  return { themeMode: "auto" };
}

export function normalizeAppearanceData(
  partial: Partial<AppearanceData> | null | undefined
): AppearanceData {
  const fallback = emptyAppearanceData();
  if (!partial) return fallback;
  return {
    themeMode: THEME_MODES.includes(partial.themeMode as ThemeMode)
      ? (partial.themeMode as ThemeMode)
      : fallback.themeMode,
  };
}

// Evening Luxe kicks in after sunset and before the household wakes up -
// a fixed window rather than a real sunset calculation, since the app has
// no location data to compute one from.
export function isEveningNow(now: Date = new Date()): boolean {
  const hour = now.getHours();
  return hour >= 19 || hour < 6;
}

export function effectiveIsEvening(mode: ThemeMode, now: Date = new Date()): boolean {
  if (mode === "light") return false;
  if (mode === "evening") return true;
  return isEveningNow(now);
}
