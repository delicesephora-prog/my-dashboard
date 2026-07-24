import { PrepStyle } from "./mealplan";

export type Recipe = {
  id: string;
  name: string;
  cuisine: string;
  // Estimated calories for ONE serving - a considered estimate from
  // standard ingredient/portion data, not a lab-verified number. Cher
  // always frames it that way rather than claiming false precision.
  caloriesPerServing: number;
  servings: number;
  ingredients: string[]; // grocery-ready lines, e.g. "2 lbs chicken thighs"
  prepStyle: PrepStyle;
  estCostPerServing: number;
  tags: string[];
  notes: string;
  createdAt: string;
};

export type RecipeBankData = {
  recipes: Recipe[];
};

export function emptyRecipeBankData(): RecipeBankData {
  return { recipes: [] };
}

function recipe(
  name: string,
  cuisine: string,
  caloriesPerServing: number,
  servings: number,
  ingredients: string[],
  prepStyle: PrepStyle,
  estCostPerServing: number,
  tags: string[],
  notes: string
): Recipe {
  return {
    id: crypto.randomUUID(),
    name,
    cuisine,
    caloriesPerServing,
    servings,
    ingredients,
    prepStyle,
    estCostPerServing,
    tags,
    notes,
    createdAt: new Date(0).toISOString(),
  };
}

// A starting bank leaning Haitian-American, split across the three prep
// styles so a week can actually be built from it: batch-cook things for
// Wednesday prep night, quick weeknight options, and assemble-from-leftovers
// plates that use what prep night already made.
function seedRecipes(): Recipe[] {
  return [
    recipe(
      "Poul nan Sos (Haitian Stewed Chicken)",
      "Haitian",
      420,
      6,
      [
        "3 lbs chicken thighs",
        "3 limes (for cleaning the chicken)",
        "1 batch epis (Haitian seasoning base)",
        "1 can tomato paste",
        "2 bell peppers",
        "1 onion",
        "3 cloves garlic",
        "2 cups chicken broth",
        "1 scotch bonnet pepper (whole, for flavor - remove before serving)",
      ],
      "batch-cook",
      2.75,
      ["chicken", "haitian", "prep-night"],
      "Braise low and slow - makes enough for 3 dinners. Cools and reheats well; freezes fine too."
    ),
    recipe(
      "Diri Kole ak Pwa (Rice and Red Beans)",
      "Haitian",
      380,
      6,
      [
        "3 cups rice",
        "1 can red beans (or 1.5 cups dried, soaked)",
        "1 can coconut milk",
        "1/2 batch epis",
        "2 cloves garlic",
        "1 sprig thyme",
        "2 cups water or bean broth",
      ],
      "batch-cook",
      1.1,
      ["rice", "beans", "vegetarian", "haitian", "budget", "prep-night"],
      "The default side for the week - cooks in one pot, reheats with a splash of water."
    ),
    recipe(
      "Legim (Haitian Vegetable & Beef Stew)",
      "Haitian",
      360,
      6,
      [
        "1.5 lbs beef stew meat",
        "1 eggplant",
        "1/2 head cabbage",
        "2 chayote squash",
        "3 carrots",
        "1 batch epis",
        "2 tbsp tomato paste",
        "1 scotch bonnet pepper (whole)",
      ],
      "batch-cook",
      2.9,
      ["beef", "vegetables", "haitian", "prep-night"],
      "Cooks down into a thick, almost mashed stew - very filling, reheats beautifully."
    ),
    recipe(
      "Bouyon (Haitian Beef & Root Vegetable Soup)",
      "Haitian",
      410,
      6,
      [
        "1.5 lbs beef short ribs or stew meat",
        "2 plantains (for dumplings)",
        "1 lb yams or malanga",
        "2 carrots",
        "1/2 head cabbage",
        "1 batch epis",
        "8 cups water or broth",
      ],
      "batch-cook",
      2.6,
      ["beef", "soup", "haitian", "prep-night"],
      "A full meal in a bowl - great for a cold week, keeps well 4-5 days."
    ),
    recipe(
      "Griot ak Bannann (Fried Pork with Plantains)",
      "Haitian",
      520,
      6,
      [
        "2.5 lbs pork shoulder, cubed",
        "3 limes",
        "1 batch epis",
        "1 orange (juice)",
        "4 ripe plantains",
        "Oil for frying",
      ],
      "batch-cook",
      3.1,
      ["pork", "haitian", "prep-night"],
      "Marinate overnight, boil then fry Wednesday. Reheats best re-crisped in the oven or air fryer, not the microwave."
    ),
    recipe(
      "Pikliz (Spicy Pickled Slaw)",
      "Haitian",
      35,
      10,
      ["1/2 head cabbage", "2 carrots", "1 onion", "2 scotch bonnet peppers", "2 cups white vinegar", "1 tsp salt"],
      "quick",
      0.4,
      ["condiment", "haitian", "vegetarian", "budget"],
      "Make once, keeps for weeks in the fridge - the condiment that makes everything else taste like home."
    ),
    recipe(
      "Poisson Gwo Sel (Pan-Seared Fish, Haitian Style)",
      "Haitian",
      310,
      4,
      ["4 tilapia or snapper fillets", "2 limes", "1/2 batch epis", "2 tbsp oil", "1 onion, sliced", "1 bell pepper, sliced"],
      "quick",
      3.4,
      ["fish", "haitian", "quick"],
      "Marinate in lime + epis while the pan heats - dinner in under 30 minutes."
    ),
    recipe(
      "Riz ak Djon Djon + Grilled Chicken",
      "Haitian",
      450,
      4,
      ["2 cups rice", "1 packet djon djon (dried black mushrooms)", "4 chicken breasts", "1/2 batch epis", "2 cups broth"],
      "quick",
      3.0,
      ["chicken", "rice", "haitian", "quick"],
      "The rice is the star here - earthy and rich. Grill the chicken plain and simple alongside it."
    ),
    recipe(
      "Tassot Dinde (Fried Turkey) Bowl",
      "Haitian",
      430,
      4,
      ["2 lbs turkey cutlets, cubed", "2 limes", "1/2 batch epis", "Oil for frying", "2 cups cooked rice", "Pikliz to top"],
      "quick",
      2.7,
      ["turkey", "haitian", "quick", "budget"],
      "Lighter than griot, same technique - good midweek option when prep-night leftovers are gone."
    ),
    recipe(
      "Simple Grilled Chicken & Veggie Bowl",
      "American",
      400,
      4,
      ["4 chicken breasts", "1 head broccoli", "2 cups brown rice", "2 tbsp olive oil", "salt, pepper, garlic powder"],
      "quick",
      2.6,
      ["chicken", "budget", "quick", "american"],
      "The reliable fallback when the week's simpler - 20 minutes, minimal ingredients."
    ),
    recipe(
      "Black Bean Taco Bowls",
      "American",
      420,
      4,
      ["2 cans black beans", "2 cups rice", "1 cup salsa", "1 avocado", "1 cup shredded cheese", "1 lime"],
      "quick",
      2.2,
      ["vegetarian", "budget", "quick", "american"],
      "Good meatless night - cheap, filling, and fast to throw together."
    ),
    recipe(
      "Griot + Rice + Pikliz Plate",
      "Haitian",
      600,
      1,
      ["reheated griot", "reheated diri kole", "fresh pikliz"],
      "assemble",
      0,
      ["pork", "haitian", "leftovers"],
      "Straight from Wednesday's prep - re-crisp the griot, plate with rice and a scoop of pikliz."
    ),
    recipe(
      "Poul nan Sos Leftover Bowl",
      "Haitian",
      440,
      1,
      ["reheated poul nan sos", "fresh rice or reheated diri kole", "pikliz on the side"],
      "assemble",
      0,
      ["chicken", "haitian", "leftovers"],
      "The easiest night of the week - just reheat and plate."
    ),
  ];
}

export function defaultRecipeBankData(): RecipeBankData {
  return { recipes: seedRecipes() };
}

export function normalizeRecipeBankData(partial: Partial<RecipeBankData> | null | undefined): RecipeBankData {
  if (!partial) return emptyRecipeBankData();
  return {
    recipes: (partial.recipes ?? []).map((r) => ({
      ...r,
      ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
      tags: Array.isArray(r.tags) ? r.tags : [],
    })),
  };
}

export function addRecipe(
  data: RecipeBankData,
  entry: Omit<Recipe, "id" | "createdAt">,
  now: Date = new Date()
): RecipeBankData {
  const full: Recipe = { ...entry, id: crypto.randomUUID(), createdAt: now.toISOString() };
  return { ...data, recipes: [...data.recipes, full] };
}

export function deleteRecipe(data: RecipeBankData, id: string): RecipeBankData {
  return { ...data, recipes: data.recipes.filter((r) => r.id !== id) };
}

export function findRecipeByName(data: RecipeBankData, query: string): Recipe | undefined {
  const needle = query.trim().toLowerCase();
  return data.recipes.find((r) => r.name.toLowerCase() === needle) ?? data.recipes.find((r) => r.name.toLowerCase().includes(needle));
}
