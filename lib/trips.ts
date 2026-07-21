import { dateKey } from "./date";

export type ItineraryEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  text: string;
};

export type PackingItem = {
  id: string;
  text: string;
  packed: boolean;
};

export type TripBudgetItem = {
  id: string;
  category: string;
  estimated: number;
  actual: number;
};

export type Trip = {
  id: string;
  name: string;
  destination: string;
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD
  notes: string;
  itinerary: ItineraryEvent[];
  packingList: PackingItem[];
  budget: TripBudgetItem[];
};

export type SavedIdea = {
  id: string;
  text: string;
  link: string;
  notes: string;
};

export type TripsData = {
  trips: Trip[];
  savedIdeas: SavedIdea[];
};

export function emptyTripsData(): TripsData {
  return { trips: [], savedIdeas: [] };
}

export function normalizeTripsData(partial: Partial<TripsData> | null | undefined): TripsData {
  return {
    trips: partial?.trips ?? [],
    savedIdeas: partial?.savedIdeas ?? [],
  };
}

export function newTrip(name: string, destination: string): Trip {
  return {
    id: crypto.randomUUID(),
    name,
    destination,
    startDate: null,
    endDate: null,
    notes: "",
    itinerary: [],
    packingList: [],
    budget: [],
  };
}

// Upcoming = no start date yet (still being planned) or start date today/future.
export function upcomingTrips(trips: Trip[], now: Date = new Date()): Trip[] {
  const today = dateKey(now);
  return trips
    .filter((t) => !t.startDate || t.startDate >= today)
    .sort((a, b) => (a.startDate ?? "9999-99-99").localeCompare(b.startDate ?? "9999-99-99"));
}

export function pastTrips(trips: Trip[], now: Date = new Date()): Trip[] {
  const today = dateKey(now);
  return trips
    .filter((t) => t.startDate && t.startDate < today)
    .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""));
}

export function daysUntilTrip(trip: Trip, now: Date = new Date()): number | null {
  if (!trip.startDate) return null;
  const today = dateKey(now);
  if (trip.startDate < today) return null;
  const [y, m, d] = trip.startDate.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - from.getTime()) / 86400000);
}

export function packingProgress(items: PackingItem[]): { packed: number; total: number } {
  return { packed: items.filter((i) => i.packed).length, total: items.length };
}

export function tripBudgetTotals(items: TripBudgetItem[]): { estimated: number; actual: number } {
  return {
    estimated: items.reduce((sum, b) => sum + b.estimated, 0),
    actual: items.reduce((sum, b) => sum + b.actual, 0),
  };
}
