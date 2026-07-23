// A small monthly accent for Greeting - hand-curated per lib/welcome.ts's
// convention for "one per period" content, keyed by calendar month so it
// shifts twelve times a year rather than daily.
export type SeasonalAccent = {
  icon: string;
  label: string;
};

const BANK: SeasonalAccent[] = [
  { icon: "❄️", label: "Fresh Start" }, // January
  { icon: "🌹", label: "Tender" }, // February
  { icon: "🌱", label: "New Growth" }, // March
  { icon: "🌷", label: "Bloom" }, // April
  { icon: "🌼", label: "Renewal" }, // May
  { icon: "☀️", label: "Golden Hour" }, // June
  { icon: "🍑", label: "Warmth" }, // July
  { icon: "🌾", label: "Harvest Light" }, // August
  { icon: "🍂", label: "Turning" }, // September
  { icon: "🎃", label: "Cozy" }, // October
  { icon: "🍁", label: "Gratitude" }, // November
  { icon: "✨", label: "Wonder" }, // December
];

export function seasonalAccent(now: Date = new Date()): SeasonalAccent {
  return BANK[now.getMonth()];
}
