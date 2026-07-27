import { dateKey } from "./date";

// ---------------------------------------------------------------------------
// Meal Calendar: "one cook, two plates" - a monthly dinner calendar where
// every recipe has a full version (his plate) and a portioned-down version
// (her Dec 8 plate) from the same cook. Data is month-keyed ("2026-08") so
// future months can be added the same way August was seeded, via
// addMealMonth() below - nothing here is hardcoded to August specifically
// except the actual seeded content.

export type MealCategory = "chicken" | "beef" | "seafood" | "haitian" | "light";

export const MEAL_CATEGORY_COLORS: Record<MealCategory, string> = {
  chicken: "#B08B4F",
  beef: "#5B2333",
  seafood: "#6F8FA0",
  haitian: "#A6643B",
  light: "#8A9B7C",
};

export const MEAL_CATEGORY_LABELS: Record<MealCategory, string> = {
  chicken: "Chicken",
  beef: "Beef",
  seafood: "Seafood",
  haitian: "Haitian",
  light: "Veg-forward",
};

export type MealRecipe = {
  id: string;
  name: string;
  emoji: string;
  category: MealCategory;
  effort: string;
  hisVersion: string;
  hersVersion: string;
  prepNote: string;
};

export type MealDay = {
  date: string; // YYYY-MM-DD
  recipeId: string;
  haulNumber: number | null;
  isPayday: boolean;
  isPrep: boolean;
  isLeftover: boolean;
  isFun: boolean;
  cooked: boolean;
};

export type MealGroceryItem = {
  id: string;
  text: string;
  // Free-text so it can hold "2 lb", "1 bag", "3 cans" etc. - editable
  // anytime, independent of the item's own description.
  quantity: string;
};

export type GroceryStoreLine = {
  id: string;
  store: string;
  items: MealGroceryItem[];
  estimatedAmount: number;
  actualAmount: number | null;
};

export type GroceryHaul = {
  id: string;
  title: string;
  sub: string;
  stores: GroceryStoreLine[];
};

export type MealBudget = {
  budgetAmount: number;
  hauls: GroceryHaul[];
};

export type PrepTask = {
  id: string;
  text: string;
  done: boolean;
};

export type PrepWeekend = {
  id: string;
  title: string;
  tag: string;
  tasks: PrepTask[];
  // Which YYYY-MM-DD dates this weekend's prep is "for" - lets the Daily
  // Dash checklist surface the right prep tasks on the right day without
  // parsing the display title.
  coversDates: string[];
};

export type LunchIdea = {
  id: string;
  emoji: string;
  title: string;
  description: string;
};

export type MealCalendarMonth = {
  month: string; // "2026-08"
  days: MealDay[];
  prepWeekends: PrepWeekend[];
  budget: MealBudget;
};

export type MealCalendarData = {
  recipes: Record<string, MealRecipe>;
  months: Record<string, MealCalendarMonth>;
  lunches: LunchIdea[];
  seedVersion: number;
};

// ---------------------------------------------------------------------------
// Seed content - ported from her August 2026 plan. His/hers text and prep
// notes are hers to rewrite from the UI; this is just the starting point.

function recipe(
  id: string,
  name: string,
  emoji: string,
  category: MealCategory,
  effort: string,
  hisVersion: string,
  hersVersion: string,
  prepNote: string
): MealRecipe {
  return { id, name, emoji, category, effort, hisVersion, hersVersion, prepNote };
}

function seedRecipes(): Record<string, MealRecipe> {
  const list: MealRecipe[] = [
    recipe(
      "tacos", "Beef Tacos + Black Beans", "🌮", "beef", "Cook · 25 min",
      "Seasoned ground beef in crisped corn-tortilla shells (bake tortillas over the oven rack at 375° for 8 min), shredded cheese, onion, hot sauce. Warm black beans + half avocado on the side.",
      "Same beef, same beans - swap shells for butter-lettuce cups or 1 low-carb tortilla. Add extra pico + avocado so the plate still feels full.",
      "Brown all 3 lb of taco/bowl beef tonight while you're at the stove - half for tacos, half boxed for street-corn bowls & crunchwrap later."
    ),
    recipe(
      "poulAnSos", "Poul an Sòs + Diri Kole", "🍗", "haitian", "Sunday batch · 90 min (makes 2 dinners)",
      "Haitian stewed chicken - épis-marinated legs simmered in tomato-onion-pepper sauce, over diri kole ak pwa (rice & beans). Fried plantains if you're feeling it.",
      "Same chicken, same sauce (it's mostly peppers, onion, tomato - already lean). Fist-size scoop of diri kole, then fill the plate with pikliz and cucumber salad.",
      "Marinate chicken in épis Saturday night. Double the batch - Monday's dinner is done. Freeze 2 cups sauce for bouyon later."
    ),
    recipe(
      "poulLeft", "Leftover Poul an Sòs", "🫕", "haitian", "Leftover · 5 min",
      "Reheat chicken + rice, fresh pikliz on top.",
      "Shred the chicken over a big greens bowl with pikliz as the dressing - zero extra cooking.",
      "Already done. This is the system working."
    ),
    recipe(
      "lentilPlate", "Chicken, Red Lentils + Basmati", "🥘", "chicken", "Fast cook · 20 min",
      "Crispy pan-seared chicken thigh over stewed red lentils (onion, garlic, curry powder, stock) + basmati + half avocado.",
      "Same plate, flipped ratio: half-scoop rice, double lentils (protein + fiber = full for hours), avocado stays.",
      "Lentils + rice were batched Sunday - tonight is just searing thighs."
    ),
    recipe(
      "beefPlantain", "Beef, Plantain + Spinach", "🍌", "beef", "Fast cook · 20 min",
      "Seasoned ground beef, 5-6 slices of fried sweet plantain, garlicky sautéed spinach.",
      "Same beef + spinach mountain, cap plantain at 3 slices. Air-fry them with a spray of oil instead of shallow-frying.",
      "Beef can come from Saturday's batch. Plantains cook in 10 min."
    ),
    recipe(
      "tortillaSoup", "Chicken Tortilla Soup", "🍲", "chicken", "Assemble · 15 min (big batch)",
      "Shredded chicken, black beans, corn, fire-roasted tomatoes, stock + taco spices. Top with tortilla strips + cheese.",
      "Naturally light - go easy on tortilla strips, add extra chicken + a spoon of Greek yogurt instead of sour cream.",
      "Uses Sunday's shredded chicken. Make the full pot: tonight + a freezer container for week 3."
    ),
    recipe(
      "salmonBites", "Honey Garlic Salmon Bites", "🍣", "seafood", "Fast cook · 20 min",
      "Cubed salmon seared in honey-garlic-soy glaze, jasmine rice, roasted broccolini.",
      "Same bites (halve the honey in her pan-half, or sauce after splitting), half rice / half cauli-rice blend, double broccolini.",
      "Frozen salmon from Walmart - thaw in fridge the night before."
    ),
    recipe(
      "steakFrites", "Steak Frites Date Night", "🥩", "beef", "Cook · 35 min",
      "Chimichurri-topped sliced steak + garlic-parm fries.",
      "Same steak + chimichurri, big arugula-date salad as the base, steal a handful of his fries. One fun plate a week is part of the plan, not a cheat.",
      "Salt the steak in the morning; it cooks in 8 min at night."
    ),
    recipe(
      "streetCorn", "Street Corn Beef Bowls", "🌽", "beef", "Prep + cook · 40 min (makes 2 dinners)",
      "Taco beef + chili-roasted sweet potato cubes, topped with creamy street-corn (corn, mayo, cheese, lime, cilantro).",
      "Same bowl - build the corn topping on Greek yogurt instead of mayo, lighter cheese, extra lime + tajín. Sweet potato stays; it's a great carb.",
      "Sunday: roast a full tray of sweet potato, mix corn topping, portion 4 bowls. Mon is grab-and-heat."
    ),
    recipe(
      "streetCornLeft", "Street Corn Bowls Rd. 2", "🌽", "beef", "Leftover · 5 min",
      "Reheat, fresh lime + cilantro.",
      "Hers is portioned already - add a handful of lettuce underneath to stretch it.",
      "Done Sunday."
    ),
    recipe(
      "kebabBowls", "Chicken Kebab Bowls", "🥙", "chicken", "Fast cook · 25 min",
      "Marinated chicken, cucumber-tomato-red onion salad, garlic yogurt sauce, warm naan/pita + seasoned fries.",
      "Same chicken + big salad + yogurt sauce. Skip the fries, keep a half pita. The salad + sauce is what makes this one satisfying.",
      "Chicken went into marinade Sunday - flavor is done before you get home."
    ),
    recipe(
      "kebabLeft", "Kebab Bowls Rd. 2 / Wraps", "🌯", "chicken", "Leftover · 10 min",
      "Leftover kebab chicken folded into a pita wrap with sauce.",
      "Chopped kebab salad - everything from last night over romaine, no wrap needed.",
      "Done."
    ),
    recipe(
      "legim", "Legim + Rice", "🍆", "haitian", "Cook · 60 min (batchable)",
      "Haitian braised vegetable stew - eggplant, cabbage, carrot, chayote, spinach, with a little beef, over white rice.",
      "Legim IS the weight-loss meal - it's a mountain of vegetables. Big bowl of legim, fist of rice. Nothing to change.",
      "Chop veg during Sunday prep or buy pre-cut cabbage. Freezes beautifully."
    ),
    recipe(
      "crunchwrap", "Crunchwrap Night", "🫓", "beef", "Fast cook · 20 min",
      "Homemade crunchwrap supreme - beef, cheese, lettuce, tomato, sour cream, tostada layer, griddled.",
      "Crunchwrap bowl: same beef + toppings over lettuce with crushed tostada on top, Greek yogurt for sour cream - or a single high-fiber wrap version.",
      "Last of Haul-1 beef. Uses fridge odds and ends before payday shop."
    ),
    recipe(
      "periPeri", "Peri Peri Chicken + Sweet Potato", "🔥", "chicken", "Cook · 35 min",
      "Peri peri marinated chicken, roasted sweet potato wedges, cucumber-tomato salad, guac + sour cream.",
      "Same everything - Greek yogurt instead of sour cream, guac stays (good fat), extra salad. This one barely needs edits.",
      "Payday-haul kickoff. Marinate chicken while unpacking groceries."
    ),
    recipe(
      "buffaloMac", "Buffalo Chicken + Mac", "🧀", "chicken", "Sunday batch · 45 min (makes 2)",
      "Crispy buffalo chicken bites + baked mac n cheese, ranch drizzle.",
      "Air-fried buffalo chicken over crunchy slaw with ranch-yogurt dressing + a real spoonful of his mac. Taste it, don't build on it.",
      "Batch double buffalo chicken Sunday - Monday's dinner + her lunch salads."
    ),
    recipe(
      "buffaloLeft", "Buffalo Chicken Rd. 2", "🥗", "chicken", "Leftover · 10 min",
      "Mac round two + reheated chicken.",
      "Buffalo chicken salad - greens, celery, shredded carrot, yogurt-ranch.",
      "Done Sunday."
    ),
    recipe(
      "friedRice", "Chicken Fried Rice + Broccolini", "🍚", "chicken", "Fast cook · 20 min",
      "Day-old rice fried with chicken thigh, sun-dried tomato, scallion, egg. Roasted broccolini.",
      "Half rice / half riced cauliflower in her portion of the pan, extra egg for protein, double broccolini.",
      "Cook the rice a day ahead (or use Sunday's batch) - cold rice fries better anyway."
    ),
    recipe(
      "pattySalad", "Beef Patties + Arugula-Date Salad", "🥬", "beef", "Fast cook · 20 min",
      "Two parm-topped beef patties, arugula salad with dates + olive oil, fried plantain.",
      "One patty, salad doubled (the dates make it feel like a treat), 2-3 plantain slices.",
      "Form patties in the morning; 10-min dinner."
    ),
    recipe(
      "tortillaSoup2", "Tortilla Soup (Freezer Round)", "🍲", "chicken", "Reheat · 10 min",
      "Week-1 freezer batch, new tortilla strips.",
      "Same, topped with avocado instead of extra strips.",
      "Past-you already cooked this. Say thank you."
    ),
    recipe(
      "cajunSalmon", "Cajun Salmon Pasta", "🍝", "seafood", "Cook · 30 min",
      "Blackened salmon over creamy cajun penne.",
      "Same salmon + sauce over half-portion pasta bulked with zucchini ribbons - sauce clings the same, half the pasta load.",
      "Thaw salmon overnight. Make sauce slightly loose so it stretches over veg."
    ),
    recipe(
      "steakPitas", "Chimichurri Steak Pitas", "🥩", "beef", "Cook · 30 min",
      "Cumin steak bites in pitas with cucumber-tomato salad, feta, green sauce.",
      "Steak bowl: everything minus one pita - salad base, feta, extra green sauce (it's herbs + lime, basically free).",
      "Marinate steak in the morning."
    ),
    recipe(
      "sosPwa", "Sòs Pwa Nwa + Diri Blan", "🫘", "haitian", "Sunday batch · 75 min (makes 2)",
      "Silky Haitian black bean sauce over white rice, avocado on the side.",
      "Bean sauce is fiber + protein - generous ladle, fist of rice, half avocado, add a boiled egg for staying power.",
      "Dry beans soaked Saturday night, simmered Sunday. Double batch = Monday handled."
    ),
    recipe(
      "sosPwaLeft", "Sòs Pwa Rd. 2 + Egg", "🍳", "haitian", "Leftover · 10 min",
      "Reheat with rice, top with a fried egg.",
      "Same - the fried egg version is honestly the best version.",
      "Done."
    ),
    recipe(
      "steakBites", "Garlic Butter Steak Bites + Mash", "🧈", "beef", "Fast cook · 25 min",
      "Garlic-butter steak bites, mashed potatoes, roasted asparagus.",
      "Same bites (pull hers before the final butter baste), cauli-mash or a half scoop of his, double asparagus.",
      "Cube steak in the morning."
    ),
    recipe(
      "burritoBowls", "Hot Honey Chicken Burrito Bowls", "🍯", "chicken", "Fast cook · 25 min (makes 2)",
      "Hot honey glazed chicken, seasoned rice, charred corn, guac, sour cream, chips.",
      "Lettuce-based bowl: same chicken (glaze brushed light), small rice scoop, corn, guac, Greek yogurt, skip chips.",
      "Chicken marinated Sunday; make double for tomorrow."
    ),
    recipe(
      "burritoLeft", "Burrito Bowls Rd. 2", "🥑", "chicken", "Leftover · 5 min",
      "Reheat + fresh guac.",
      "Hers is pre-portioned - fresh lettuce underneath.",
      "Done."
    ),
    recipe(
      "hibachi", "Shrimp Hibachi", "🦐", "seafood", "Cook · 30 min",
      "Hibachi shrimp, fried rice, zucchini + onions, yum yum sauce.",
      "Same shrimp + double zucchini-onion, half rice, yum yum made on Greek yogurt base (mayo cut 50/50).",
      "Day-old rice again - plan it Wednesday."
    ),
    recipe(
      "chickenSando", "Spicy Chicken Sandwich Night", "🍔", "chicken", "Cook · 35 min",
      "Fried spicy chicken sandwich on brioche + waffle fries.",
      "Air-fried or grilled version of the same chicken, open-faced (one bun half) or over slaw, share the fries. Second fun plate of the week - enjoy it.",
      "Brine chicken in pickle juice overnight for max flavor."
    ),
    recipe(
      "bouyon", "Bouyon Sunday", "🥣", "haitian", "Payday cook · 90 min (big pot)",
      "Haitian Sunday soup - beef, dumplings, plantain, yam, cabbage, spinach in rich broth.",
      "Broth + vegetables + beef are the meal - take 1-2 dumplings instead of 4 and you're done. This is comfort food that already fits the plan.",
      "Uses frozen épis sauce from week 1. Big pot = Monday lunches too."
    ),
    recipe(
      "steakShrimp", "Steak & Shrimp Finale", "✨", "beef", "Cook · 35 min",
      "Surf & turf - steak bites + cajun shrimp over mash, asparagus.",
      "Same steak + shrimp (that part is all protein), cauli-mash base, big asparagus pile. Close August strong.",
      "Last cook of the month. September plan drops next."
    ),
    recipe(
      "griot", "Griot ak Bannann + Pikliz", "🍖", "haitian", "Fri/Sat only · marinate ahead + fry · 45 min",
      "Twice-fried crispy pork shoulder (marinated overnight in sour orange, garlic, and épis), golden fried plantains, a big scoop of pikliz on top.",
      "Same griot, same crispy edges - protein doesn't get cut here either. Half the plantain, pikliz piled high since it's basically a spicy slaw and does the veg job too.",
      "Marinate the pork the night before. This one's a Friday/Saturday-only treat, not a weeknight regular - it earns its spot on the calendar."
    ),
    recipe(
      "pouleAkNwa", "Poule ak Nwa (Chicken in Cashew Sauce)", "🥜", "haitian", "Sunday batch · 60 min (makes 2 dinners)",
      "Bone-in chicken braised in a rich cashew-tomato sauce with épis and thyme, over diri ak pwa (rice and beans).",
      "Same chicken, same sauce - it's mostly cashew, tomato, and aromatics, already balanced. Fist of diri ak pwa, extra spoon of sauce over a bigger scoop of beans instead of rice.",
      "Toast and blend the cashews Saturday for a head start. Makes enough for Monday too."
    ),
    recipe(
      "pouleAkNwaLeft", "Poule ak Nwa Leftover Bowl", "🥣", "haitian", "Leftover · 5 min",
      "Reheat the chicken and sauce over fresh rice and beans.",
      "Shred the chicken over extra beans and greens, sauce spooned on top - same flavors, lighter carb.",
      "Already done - Sunday's batch carries the week."
    ),
    recipe(
      "soupJoumou", "Soup Joumou (Haitian Independence Soup)", "🎃", "haitian", "Special weekend · slow simmer, 2+ hours",
      "The celebration soup - beef, squash, cabbage, carrots, potatoes, macaroni, and a full pot of épis, simmered low and slow until the broth turns gold.",
      "Same soup, same broth - it's naturally balanced already. Go light on the macaroni scoop, generous on the vegetables and beef.",
      "This is the payday-weekend treat, not a regular rotation dish - let it simmer most of the afternoon."
    ),
  ];
  const record: Record<string, MealRecipe> = {};
  for (const r of list) record[r.id] = r;
  return record;
}

type SeedDay = {
  d: number;
  r: string;
  haul?: number;
  payday?: boolean;
  prep?: boolean;
  left?: boolean;
  fun?: boolean;
};

const AUGUST_2026_DAYS: SeedDay[] = [
  { d: 1, r: "tacos", haul: 1, prep: true },
  { d: 2, r: "poulAnSos", prep: true },
  { d: 3, r: "poulLeft", left: true },
  { d: 4, r: "lentilPlate" },
  { d: 5, r: "beefPlantain" },
  { d: 6, r: "tortillaSoup" },
  { d: 7, r: "griot" },
  { d: 8, r: "steakFrites", fun: true },
  { d: 9, r: "pouleAkNwa", prep: true },
  { d: 10, r: "pouleAkNwaLeft", left: true },
  { d: 11, r: "kebabBowls" },
  { d: 12, r: "kebabLeft", left: true },
  { d: 13, r: "legim" },
  { d: 14, r: "crunchwrap" },
  { d: 15, r: "soupJoumou", haul: 2, payday: true, prep: true },
  { d: 16, r: "buffaloMac", prep: true },
  { d: 17, r: "buffaloLeft", left: true },
  { d: 18, r: "friedRice" },
  { d: 19, r: "pattySalad" },
  { d: 20, r: "tortillaSoup2", left: true },
  { d: 21, r: "griot" },
  { d: 22, r: "steakPitas", fun: true },
  { d: 23, r: "sosPwa", prep: true },
  { d: 24, r: "sosPwaLeft", left: true },
  { d: 25, r: "steakBites" },
  { d: 26, r: "burritoBowls" },
  { d: 27, r: "burritoLeft", left: true },
  { d: 28, r: "hibachi" },
  { d: 29, r: "chickenSando", fun: true },
  { d: 30, r: "bouyon", payday: true, prep: true },
  { d: 31, r: "steakShrimp" },
];

function seedDaysFor(month: string, seedDays: SeedDay[]): MealDay[] {
  const [y, m] = month.split("-").map(Number);
  return seedDays.map((sd) => ({
    date: dateKey(new Date(y, m - 1, sd.d)),
    recipeId: sd.r,
    haulNumber: sd.haul ?? null,
    isPayday: sd.payday ?? false,
    isPrep: sd.prep ?? false,
    isLeftover: sd.left ?? false,
    isFun: sd.fun ?? false,
    cooked: false,
  }));
}

function storeLine(store: string, estimatedAmount: number, items: string[]): GroceryStoreLine {
  return {
    id: crypto.randomUUID(),
    store,
    estimatedAmount,
    actualAmount: null,
    items: items.map((text) => ({ id: crypto.randomUUID(), text, quantity: "" })),
  };
}

function seedAugustHauls(): GroceryHaul[] {
  return [
    {
      id: crypto.randomUUID(),
      title: "Haul 1 · Sat Aug 1",
      sub: "From the Jul 30 check · covers Aug 1-14",
      stores: [
        storeLine("🥩 Meat Market", 40, [
          "Chicken thighs, family pack ~5 lb - $13",
          "Chicken legs for poul an sòs ~3 lb - $7",
          "Ground beef ~3 lb - $14",
          "Stew beef for legim ~0.75 lb - $6",
        ]),
        storeLine("🛒 Walmart", 57, [
          "Frozen salmon portions (bag) - $10",
          "Jasmine/basmati rice 5 lb - $6",
          "Red lentils - $2.50",
          "Black beans, 4 cans - $4",
          "Corn tortillas + 1 pk flour - $5",
          "Shredded cheese 2 pk - $6",
          "Greek yogurt, big tub - $4",
          "Eggs, 18 ct - $5",
          "Chicken stock, 2 - $3",
          "Frozen corn - $2",
          "Honey + soy sauce - $6",
          "Butter - $3.50",
        ]),
        storeLine("🍉 Farmers Market", 25, [
          "Plantains ×6",
          "Avocados ×5",
          "Spinach + kale bundles",
          "Cucumbers, tomatoes, limes",
          "Onions, bell peppers, garlic, scotch bonnet",
          "Cabbage + carrots (pikliz + legim)",
          "Sweet potatoes ×4",
          "Eggplant + chayote (legim)",
          "Small watermelon",
        ]),
      ],
    },
    {
      id: crypto.randomUUID(),
      title: "Haul 2 · Sat Aug 15 💰",
      sub: "Payday haul · covers Aug 15-31",
      stores: [
        storeLine("🥩 Meat Market", 52, [
          "Sirloin or chuck steak ~3 lb - $19",
          "Chicken breasts + thighs ~5 lb - $13",
          "Ground beef ~1.5 lb - $7",
          "Shrimp ~2 lb - $13",
        ]),
        storeLine("🛒 Walmart", 50, [
          "Penne + elbow pasta - $4",
          "Heavy cream - $3.50",
          "Parmesan + mozzarella - $8",
          "Buffalo sauce + ranch - $5",
          "Dry black beans 2 lb (sòs pwa) - $3",
          "Pitas + brioche buns - $6",
          "Frozen waffle fries - $3.50",
          "Greek yogurt refill - $4",
          "Eggs, 18 ct - $5",
          "Riced cauliflower, 2 frozen bags - $5",
          "Sour cream (his) - $2.50",
        ]),
        storeLine("🍉 Farmers Market", 22, [
          "Zucchini ×4, asparagus ×2 bunches",
          "Arugula + romaine + slaw cabbage",
          "Cucumbers, tomatoes, red onion",
          "Avocados ×4, limes, cilantro + parsley",
          "Plantains, yam + dumplings-flour veg for bouyon",
          "Sweet potatoes ×3, dates (small box)",
          "Butternut squash + celery + extra carrots (soup joumou)",
        ]),
      ],
    },
  ];
}

function prepWeekend(
  id: string,
  title: string,
  tag: string,
  tasks: string[],
  coversDates: string[]
): PrepWeekend {
  return {
    id,
    title,
    tag,
    tasks: tasks.map((text) => ({ id: crypto.randomUUID(), text, done: false })),
    coversDates,
  };
}

function augustDates(...days: number[]): string[] {
  return days.map((d) => dateKey(new Date(2026, 7, d)));
}

function seedAugustPrepWeekends(): PrepWeekend[] {
  return [
    prepWeekend("w1", "Weekend 1 · Aug 1-2", "Haul + Foundation", [
      "Sat: Shop all 3 stores (see Haul 1) - 90 min",
      "Sat: Blend a big jar of épis (peppers, garlic, herbs, scallion) - it seasons half this month",
      "Sat night: brown 3 lb beef → split for tacos / bowls / crunchwrap; marinate poul an sòs chicken in épis",
      "Sun: simmer poul an sòs (double batch) + big pot diri kole",
      "Sun: batch red lentils + 4 cups plain rice; boil 6 eggs; make pikliz jar",
      "Sun: wash + chop cucumbers, salad greens into grab boxes",
    ], augustDates(1, 2)),
    prepWeekend("w2", "Weekend 2 · Aug 8-9", "Bowl Week Setup", [
      "Sat: steak frites date night - prep is just salting steak in the AM",
      "Sat: toast + blend cashews for poule ak nwa sauce",
      "Sun: braise poule ak nwa (double batch) + big pot diri ak pwa",
      "Sun: marinate kebab chicken; garlic-yogurt sauce jar",
      "Sun: cook 4 cups rice for the week (fried rice wants day-old)",
    ], augustDates(8, 9)),
    prepWeekend("w3", "Weekend 3 · Aug 15-16", "💰 Payday Reset", [
      "Sat: Haul 2 (all 3 stores) + get soup joumou simmering while unpacking - beef, squash, épis, low and slow",
      "Sat night: soup joumou for dinner, payday treat",
      "Sun: batch buffalo chicken ×2 (fry his / air-fry hers)",
      "Sun: bake mac n cheese; yogurt-ranch jar; chop slaw",
      "Sun: form beef patties; cook rice for fried-rice night",
    ], augustDates(15, 16)),
    prepWeekend("w4", "Weekend 4 · Aug 22-23", "Haitian Batch", [
      "Sat: marinate chimichurri steak in the AM; blend green sauce",
      "Sat night: soak dry black beans for sòs pwa",
      "Sun: simmer sòs pwa nwa (double) + white rice batch",
      "Sun: boil 6 eggs; marinate hot-honey chicken",
      "Sun: chop zucchini + onions for hibachi; cook rice Wed for day-old",
    ], augustDates(22, 23)),
    prepWeekend("w5", "Weekend 5 · Aug 29-30", "💰 Bouyon + Sept Bridge", [
      "Sat: pickle-brine chicken for sandwich night (do it Fri night)",
      "Sun: big pot of bouyon using week-1 frozen épis sauce",
      "Sun: portion bouyon for Monday lunches",
      "Sun: 20 min - sketch September plan while the pot simmers",
    ], augustDates(29, 30)),
  ];
}

function seedLunches(): LunchIdea[] {
  return [
    { id: crypto.randomUUID(), emoji: "🥣", title: "Greek yogurt bowl", description: "Yogurt + honey drizzle + fruit (watermelon's in season) + a handful of granola or nuts." },
    { id: crypto.randomUUID(), emoji: "🥗", title: "Leftover protein salad", description: "Last night's chicken, beef, or salmon over greens + whatever chopped veg is in the grab boxes. This is the default - dinner batches are sized for it." },
    { id: crypto.randomUUID(), emoji: "🥫", title: "Tuna-avocado situation", description: "Tuna mashed with half an avocado + lime + hot sauce, in a low-carb wrap or on cucumber slices." },
    { id: crypto.randomUUID(), emoji: "🍳", title: "Eggs + fruit plate", description: "2-3 boiled eggs from Sunday's batch, fruit, a little cheese. Zero-thought office lunch." },
    { id: crypto.randomUUID(), emoji: "🫘", title: "Sòs pwa cup", description: "A mug of black bean sauce + a boiled egg. Weirdly perfect. Very Haitian grandma energy." },
    { id: crypto.randomUUID(), emoji: "🧀", title: "Cottage cheese + watermelon", description: "Salty-sweet, high protein, takes 45 seconds." },
  ];
}

export const MEAL_CALENDAR_SEED_VERSION = 1;

// The reusable "seed a new month" function - this is how September (and
// beyond) gets added later: write its SeedDay[] + hauls + prep weekends +
// budget the same way August was written above, then call this once.
export function addMealMonth(
  data: MealCalendarData,
  month: string,
  seedDays: SeedDay[],
  hauls: GroceryHaul[],
  prepWeekends: PrepWeekend[],
  budgetAmount: number
): MealCalendarData {
  const monthData: MealCalendarMonth = {
    month,
    days: seedDaysFor(month, seedDays),
    prepWeekends,
    budget: { budgetAmount, hauls },
  };
  return { ...data, months: { ...data.months, [month]: monthData } };
}

export function defaultMealCalendarData(): MealCalendarData {
  let data: MealCalendarData = {
    recipes: seedRecipes(),
    months: {},
    lunches: seedLunches(),
    seedVersion: MEAL_CALENDAR_SEED_VERSION,
  };
  data = addMealMonth(data, "2026-08", AUGUST_2026_DAYS, seedAugustHauls(), seedAugustPrepWeekends(), 300);
  return data;
}

// ---------------------------------------------------------------------------
// Normalize - same version-gated seed rule as every other bank in this app:
// only reseed wholesale the first time (version behind current), her edits
// afterward (checkboxes, actual amounts, budget) always win.

function normalizeGroceryItem(raw: unknown): MealGroceryItem | null {
  // Back-compat: earlier saves stored items as plain strings.
  if (typeof raw === "string") {
    return raw.trim() ? { id: crypto.randomUUID(), text: raw, quantity: "" } : null;
  }
  const item = raw as Partial<MealGroceryItem> | null | undefined;
  if (!item?.text) return null;
  return {
    id: item.id ?? crypto.randomUUID(),
    text: item.text,
    quantity: item.quantity ?? "",
  };
}

function normalizeStoreLine(raw: Partial<GroceryStoreLine> | null | undefined): GroceryStoreLine | null {
  if (!raw?.store) return null;
  return {
    id: raw.id ?? crypto.randomUUID(),
    store: raw.store,
    items: (Array.isArray(raw.items) ? raw.items : []).map(normalizeGroceryItem).filter((i): i is MealGroceryItem => i !== null),
    estimatedAmount: raw.estimatedAmount ?? 0,
    actualAmount: raw.actualAmount ?? null,
  };
}

function normalizeHaul(raw: Partial<GroceryHaul> | null | undefined): GroceryHaul | null {
  if (!raw?.title) return null;
  const stores = (raw.stores ?? []).map(normalizeStoreLine).filter((s): s is GroceryStoreLine => s !== null);
  return { id: raw.id ?? crypto.randomUUID(), title: raw.title, sub: raw.sub ?? "", stores };
}

function normalizeDay(raw: Partial<MealDay> | null | undefined): MealDay | null {
  if (!raw?.date) return null;
  return {
    date: raw.date,
    recipeId: raw.recipeId ?? "",
    haulNumber: raw.haulNumber ?? null,
    isPayday: raw.isPayday ?? false,
    isPrep: raw.isPrep ?? false,
    isLeftover: raw.isLeftover ?? false,
    isFun: raw.isFun ?? false,
    cooked: raw.cooked ?? false,
  };
}

function normalizeTask(raw: Partial<PrepTask> | null | undefined): PrepTask | null {
  if (!raw?.text) return null;
  return { id: raw.id ?? crypto.randomUUID(), text: raw.text, done: raw.done ?? false };
}

function normalizeWeekend(raw: Partial<PrepWeekend> | null | undefined): PrepWeekend | null {
  if (!raw?.title) return null;
  const tasks = (raw.tasks ?? []).map(normalizeTask).filter((t): t is PrepTask => t !== null);
  return {
    id: raw.id ?? crypto.randomUUID(),
    title: raw.title,
    tag: raw.tag ?? "",
    tasks,
    coversDates: Array.isArray(raw.coversDates) ? raw.coversDates : [],
  };
}

function normalizeMonth(fallback: MealCalendarMonth, raw: Partial<MealCalendarMonth> | null | undefined): MealCalendarMonth {
  if (!raw) return fallback;
  const days = (raw.days ?? []).map(normalizeDay).filter((d): d is MealDay => d !== null);
  const prepWeekends = (raw.prepWeekends ?? []).map(normalizeWeekend).filter((w): w is PrepWeekend => w !== null);
  const hauls = (raw.budget?.hauls ?? []).map(normalizeHaul).filter((h): h is GroceryHaul => h !== null);
  return {
    month: fallback.month,
    days: days.length > 0 ? days : fallback.days,
    prepWeekends: prepWeekends.length > 0 ? prepWeekends : fallback.prepWeekends,
    budget: {
      budgetAmount: raw.budget?.budgetAmount ?? fallback.budget.budgetAmount,
      hauls: hauls.length > 0 ? hauls : fallback.budget.hauls,
    },
  };
}

function normalizeRecipe(fallback: MealRecipe, raw: Partial<MealRecipe> | null | undefined): MealRecipe {
  if (!raw) return fallback;
  return {
    id: fallback.id,
    name: raw.name ?? fallback.name,
    emoji: raw.emoji ?? fallback.emoji,
    category: raw.category ?? fallback.category,
    effort: raw.effort ?? fallback.effort,
    hisVersion: raw.hisVersion ?? fallback.hisVersion,
    hersVersion: raw.hersVersion ?? fallback.hersVersion,
    prepNote: raw.prepNote ?? fallback.prepNote,
  };
}

export function normalizeMealCalendarData(raw: Partial<MealCalendarData> | null | undefined): MealCalendarData {
  const fallback = defaultMealCalendarData();
  const seedVersion = raw?.seedVersion ?? 0;
  if (seedVersion < MEAL_CALENDAR_SEED_VERSION || !raw?.months) {
    return fallback;
  }
  const recipes: Record<string, MealRecipe> = {};
  for (const id of Object.keys(fallback.recipes)) {
    recipes[id] = normalizeRecipe(fallback.recipes[id], raw.recipes?.[id]);
  }
  // Carry forward any recipe ids she's added beyond the seed set (a future
  // "add my own recipe" tool would land here).
  for (const id of Object.keys(raw.recipes ?? {})) {
    if (!recipes[id] && raw.recipes?.[id]) {
      recipes[id] = normalizeRecipe(
        { id, name: "", emoji: "🍽️", category: "light", effort: "", hisVersion: "", hersVersion: "", prepNote: "" },
        raw.recipes[id]
      );
    }
  }
  const months: Record<string, MealCalendarMonth> = {};
  for (const month of Object.keys(fallback.months)) {
    months[month] = normalizeMonth(fallback.months[month], raw.months?.[month]);
  }
  for (const month of Object.keys(raw.months ?? {})) {
    if (!months[month] && raw.months?.[month]) {
      const rawMonth = raw.months[month] as Partial<MealCalendarMonth>;
      months[month] = {
        month,
        days: (rawMonth.days ?? []).map(normalizeDay).filter((d): d is MealDay => d !== null),
        prepWeekends: (rawMonth.prepWeekends ?? []).map(normalizeWeekend).filter((w): w is PrepWeekend => w !== null),
        budget: {
          budgetAmount: rawMonth.budget?.budgetAmount ?? 300,
          hauls: (rawMonth.budget?.hauls ?? []).map(normalizeHaul).filter((h): h is GroceryHaul => h !== null),
        },
      };
    }
  }
  return {
    recipes,
    months,
    lunches: raw.lunches && raw.lunches.length > 0 ? raw.lunches : fallback.lunches,
    seedVersion: raw.seedVersion ?? MEAL_CALENDAR_SEED_VERSION,
  };
}

// ---------------------------------------------------------------------------
// Read helpers

export function monthKeyForDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Safe fallback for a month not yet seeded (e.g. viewing September before
// it's been added) - same "generate an empty period on demand" pattern as
// quarterDataFor/weekDataFor elsewhere in this app.
export function monthDataFor(data: MealCalendarData, month: string): MealCalendarMonth {
  return (
    data.months[month] ?? {
      month,
      days: [],
      prepWeekends: [],
      budget: { budgetAmount: 0, hauls: [] },
    }
  );
}

export function recipeFor(data: MealCalendarData, recipeId: string): MealRecipe | null {
  return data.recipes[recipeId] ?? null;
}

export function dayFor(month: MealCalendarMonth, date: string): MealDay | null {
  return month.days.find((d) => d.date === date) ?? null;
}

export function haulEstimatedTotal(haul: GroceryHaul): number {
  return haul.stores.reduce((sum, s) => sum + s.estimatedAmount, 0);
}

export function haulActualTotal(haul: GroceryHaul): number {
  return haul.stores.reduce((sum, s) => sum + (s.actualAmount ?? 0), 0);
}

export function monthEstimatedSpend(month: MealCalendarMonth): number {
  return month.budget.hauls.reduce((sum, h) => sum + haulEstimatedTotal(h), 0);
}

export function monthActualSpend(month: MealCalendarMonth): number {
  return month.budget.hauls.reduce((sum, h) => sum + haulActualTotal(h), 0);
}

export function monthFlex(month: MealCalendarMonth): number {
  return month.budget.budgetAmount - monthEstimatedSpend(month);
}

export function monthCookedCount(month: MealCalendarMonth): number {
  return month.days.filter((d) => d.cooked).length;
}

// Consecutive cooked days walking backward from the most recent day that's
// either today or in the past (future days never break or extend a streak).
export function cookStreak(month: MealCalendarMonth, today: string): number {
  const pastOrToday = month.days.filter((d) => d.date <= today).sort((a, b) => (a.date < b.date ? 1 : -1));
  let streak = 0;
  for (const d of pastOrToday) {
    if (!d.cooked) break;
    streak += 1;
  }
  return streak;
}

export function dinnerForDate(
  data: MealCalendarData,
  date: string
): { day: MealDay; recipe: MealRecipe } | null {
  const month = monthKeyForDate(new Date(`${date}T00:00:00`));
  const monthData = data.months[month];
  if (!monthData) return null;
  const day = dayFor(monthData, date);
  if (!day) return null;
  const recipe = recipeFor(data, day.recipeId);
  if (!recipe) return null;
  return { day, recipe };
}

export type ChecklistPrepTask = { weekendId: string; weekendTitle: string; task: PrepTask };

// All tasks (done and not) from whichever prep weekend(s) cover this date -
// lets the Daily Dash checklist surface "prep for this weekend" on the
// right days, with a stable total so "X of Y done" doesn't shrink as items
// get checked off.
export function prepTasksDueForDate(data: MealCalendarData, date: string): ChecklistPrepTask[] {
  const month = monthKeyForDate(new Date(`${date}T00:00:00`));
  const monthData = data.months[month];
  if (!monthData) return [];
  return monthData.prepWeekends
    .filter((w) => w.coversDates.includes(date))
    .flatMap((w) => w.tasks.map((task) => ({ weekendId: w.id, weekendTitle: w.title, task })));
}

// ---------------------------------------------------------------------------
// Write helpers - all pure, operate on a full MealCalendarData and return a
// new one, following the same updater-function convention as every other
// feature in this app.

export function toggleDayCooked(data: MealCalendarData, month: string, date: string): MealCalendarData {
  const monthData = data.months[month];
  if (!monthData) return data;
  return {
    ...data,
    months: {
      ...data.months,
      [month]: {
        ...monthData,
        days: monthData.days.map((d) => (d.date === date ? { ...d, cooked: !d.cooked } : d)),
      },
    },
  };
}

export function togglePrepTask(
  data: MealCalendarData,
  month: string,
  weekendId: string,
  taskId: string
): MealCalendarData {
  const monthData = data.months[month];
  if (!monthData) return data;
  return {
    ...data,
    months: {
      ...data.months,
      [month]: {
        ...monthData,
        prepWeekends: monthData.prepWeekends.map((w) =>
          w.id === weekendId
            ? { ...w, tasks: w.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) }
            : w
        ),
      },
    },
  };
}

export function setBudgetAmount(data: MealCalendarData, month: string, amount: number): MealCalendarData {
  const monthData = data.months[month];
  if (!monthData) return data;
  return {
    ...data,
    months: {
      ...data.months,
      [month]: { ...monthData, budget: { ...monthData.budget, budgetAmount: amount } },
    },
  };
}

export function setStoreAmount(
  data: MealCalendarData,
  month: string,
  haulId: string,
  storeId: string,
  field: "estimatedAmount" | "actualAmount",
  amount: number | null
): MealCalendarData {
  const monthData = data.months[month];
  if (!monthData) return data;
  return {
    ...data,
    months: {
      ...data.months,
      [month]: {
        ...monthData,
        budget: {
          ...monthData.budget,
          hauls: monthData.budget.hauls.map((h) =>
            h.id !== haulId
              ? h
              : { ...h, stores: h.stores.map((s) => (s.id === storeId ? { ...s, [field]: amount } : s)) }
          ),
        },
      },
    },
  };
}

export function setItemQuantity(
  data: MealCalendarData,
  month: string,
  haulId: string,
  storeId: string,
  itemId: string,
  quantity: string
): MealCalendarData {
  const monthData = data.months[month];
  if (!monthData) return data;
  return {
    ...data,
    months: {
      ...data.months,
      [month]: {
        ...monthData,
        budget: {
          ...monthData.budget,
          hauls: monthData.budget.hauls.map((h) =>
            h.id !== haulId
              ? h
              : {
                  ...h,
                  stores: h.stores.map((s) =>
                    s.id !== storeId
                      ? s
                      : { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)) }
                  ),
                }
          ),
        },
      },
    },
  };
}
