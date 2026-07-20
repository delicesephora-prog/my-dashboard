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

export function emptyGroceryData(): GroceryData {
  return { items: [], staples: seedStaples() };
}

export function normalizeGroceryData(
  partial: Partial<GroceryData> | null | undefined
): GroceryData {
  return {
    items: partial?.items ?? [],
    // An empty staples list is functionally identical to "never set up" -
    // seed the default staple chips rather than leaving the row blank.
    staples: partial?.staples && partial.staples.length > 0 ? partial.staples : seedStaples(),
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
