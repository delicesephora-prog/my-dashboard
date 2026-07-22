import { dateKey } from "./date";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export type MealEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  slot: MealSlot;
  text: string;
  notes: string;
};

export type MealPlanData = {
  meals: MealEntry[];
};

export function emptyMealPlanData(): MealPlanData {
  return { meals: [] };
}

export function normalizeMealPlanData(partial: Partial<MealPlanData> | null | undefined): MealPlanData {
  return { meals: Array.isArray(partial?.meals) ? partial.meals : [] };
}

export function newMeal(date: string, slot: MealSlot, text: string): MealEntry {
  return { id: crypto.randomUUID(), date, slot, text, notes: "" };
}

export function addMeal(data: MealPlanData, meal: MealEntry): MealPlanData {
  return { ...data, meals: [...data.meals, meal] };
}

export function updateMeal(
  data: MealPlanData,
  id: string,
  updater: (m: MealEntry) => MealEntry
): MealPlanData {
  return { ...data, meals: data.meals.map((m) => (m.id === id ? updater(m) : m)) };
}

export function deleteMeal(data: MealPlanData, id: string): MealPlanData {
  return { ...data, meals: data.meals.filter((m) => m.id !== id) };
}

const SLOT_ORDER: Record<MealSlot, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };

export function mealsForDate(data: MealPlanData, dateKeyStr: string): MealEntry[] {
  return data.meals
    .filter((m) => m.date === dateKeyStr)
    .sort((a, b) => SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot]);
}

// Every date with at least one planned meal, today or later, soonest first.
export function upcomingMealDates(data: MealPlanData, now: Date = new Date()): string[] {
  const today = dateKey(now);
  const dates = new Set(data.meals.filter((m) => m.date >= today).map((m) => m.date));
  return [...dates].sort();
}
