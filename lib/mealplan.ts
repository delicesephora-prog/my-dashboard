import { dateKey } from "./date";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

// How a planned meal gets made: a big Wednesday-prep-night batch that
// reheats over several days, a fast weeknight cook, or something plated
// fresh from already-prepped components. "" means not set (a plain
// freeform entry with no prep plan attached).
export type PrepStyle = "batch-cook" | "quick" | "assemble" | "";

export type MealEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  slot: MealSlot;
  text: string;
  notes: string;
  calories: number; // estimated per-serving calories, 0 = not estimated
  ingredients: string[]; // grocery-ready lines, e.g. "2 lbs chicken thighs"
  prepStyle: PrepStyle;
  recipeId: string; // links back to lib/recipes.ts's bank, "" if freeform
};

export type MealPlanData = {
  meals: MealEntry[];
};

export function emptyMealPlanData(): MealPlanData {
  return { meals: [] };
}

export function normalizeMealPlanData(partial: Partial<MealPlanData> | null | undefined): MealPlanData {
  const meals = Array.isArray(partial?.meals) ? partial.meals : [];
  return {
    meals: meals.map((m) => ({
      ...m,
      calories: typeof m.calories === "number" ? m.calories : 0,
      ingredients: Array.isArray(m.ingredients) ? m.ingredients : [],
      prepStyle: m.prepStyle ?? "",
      recipeId: m.recipeId ?? "",
    })),
  };
}

export function newMeal(date: string, slot: MealSlot, text: string): MealEntry {
  return { id: crypto.randomUUID(), date, slot, text, notes: "", calories: 0, ingredients: [], prepStyle: "", recipeId: "" };
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
