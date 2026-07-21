export type GroceryCategory =
  | "Produce"
  | "Protein"
  | "Pantry"
  | "Frozen"
  | "Household"
  | "Personal Care";

export const GROCERY_CATEGORIES: GroceryCategory[] = [
  "Produce",
  "Protein",
  "Pantry",
  "Frozen",
  "Household",
  "Personal Care",
];

export type GroceryItem = {
  id: string;
  text: string;
  category: GroceryCategory;
  done: boolean;
  createdAt: string;
};

export type StapleItem = {
  id: string;
  text: string;
  category: GroceryCategory;
};

export type GroceryData = {
  items: GroceryItem[];
  staples: StapleItem[];
  seedItemsVersion: number;
};

function staple(text: string, category: GroceryCategory): StapleItem {
  return { id: crypto.randomUUID(), text, category };
}

function seedStaples(): StapleItem[] {
  return [
    staple("Eggs", "Protein"),
    staple("Chicken", "Protein"),
    staple("Rice", "Pantry"),
    staple("Spinach", "Produce"),
    staple("Paper towels", "Household"),
  ];
}

export const GROCERY_SEED_ITEMS_VERSION = 1;

export function emptyGroceryData(): GroceryData {
  return { items: [], staples: seedStaples(), seedItemsVersion: GROCERY_SEED_ITEMS_VERSION };
}

export function normalizeGroceryData(
  partial: Partial<GroceryData> | null | undefined
): GroceryData {
  return {
    items: partial?.items ?? [],
    // An empty staples list is functionally identical to "never set up" -
    // seed the default staple chips rather than leaving the row blank.
    staples: partial?.staples && partial.staples.length > 0 ? partial.staples : seedStaples(),
    seedItemsVersion: partial?.seedItemsVersion ?? 0,
  };
}

// One-time additive seed of specific shopping items requested outside the
// app (e.g. "add body butter to my shopping list") - only adds an item if
// it isn't already on the list, and only the first time, so it never
// re-adds something the user already bought and removed.
const SEED_ITEMS: { text: string; category: GroceryCategory }[] = [
  { text: "Body butter", category: "Personal Care" },
];

export function ensureGrocerySeedItems(data: GroceryData): GroceryData {
  if (data.seedItemsVersion >= GROCERY_SEED_ITEMS_VERSION) return data;

  const hasItem = (text: string) =>
    data.items.some((i) => i.text.trim().toLowerCase() === text.toLowerCase());
  const additions: GroceryItem[] = SEED_ITEMS.filter((s) => !hasItem(s.text)).map((s) => ({
    id: crypto.randomUUID(),
    text: s.text,
    category: s.category,
    done: false,
    createdAt: new Date().toISOString(),
  }));

  return {
    ...data,
    items: additions.length > 0 ? [...data.items, ...additions] : data.items,
    seedItemsVersion: GROCERY_SEED_ITEMS_VERSION,
  };
}

export function sortGroceryItems(items: GroceryItem[]): GroceryItem[] {
  return [...items].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export type DumpItem = {
  id: string;
  text: string;
  createdAt: string;
};

export type DumpData = {
  items: DumpItem[];
};

export function emptyDumpData(): DumpData {
  return { items: [] };
}

export function normalizeDumpData(partial: Partial<DumpData> | null | undefined): DumpData {
  return { items: partial?.items ?? [] };
}

export type ListsData = {
  grocery: GroceryData;
  dump: DumpData;
};

export function emptyListsData(): ListsData {
  return { grocery: emptyGroceryData(), dump: emptyDumpData() };
}

export function normalizeListsData(partial: Partial<ListsData> | null | undefined): ListsData {
  return {
    grocery: normalizeGroceryData(partial?.grocery),
    dump: normalizeDumpData(partial?.dump),
  };
}
