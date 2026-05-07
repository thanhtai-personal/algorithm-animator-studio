interface DefaultCategory {
  id: string;
  nameKey: string;
  icon: string;
  color: string;
}

export interface CategoryIconOption {
  icon: string;
  color: string;
  nameKey?: string;
}

export const DEFAULT_CATEGORY_IDS = {
  food: "330d5fff-a87e-45d6-8e57-8a6019b1d454",
  transport: "e0b5f9fd-a681-49b7-a782-2347cc902673",
  shopping: "2b5f555c-b02e-4a01-866d-434b04264517",
  entertainment: "bb70d0bb-99b9-494e-a437-1fc0be383de6",
  health: "07db0546-9a89-4e9c-8fac-30aad3bf0434",
  bills: "75df7198-880d-4061-a7a0-c3f902c3349b",
  education: "7fb80c47-faa7-4c07-a09e-0ebbab1d4d59",
  other: "8d435365-dc18-41d2-91fc-b0ceb6f9d750",
  salary: "6a7f776c-d07a-46ab-90e0-bddfeb669e0c",
  bonus: "2251b9fd-2159-4331-93bf-b87aa33b3a28",
  investment: "acbfc993-0feb-4d00-9e82-80a2d03a741a",
  otherIncome: "e44237d7-2cdc-48ca-b90d-ee8e8ab34aa9",
} as const;

export const LEGACY_DEFAULT_CATEGORY_ID_MAP: Record<string, string> = {
  "1": DEFAULT_CATEGORY_IDS.food,
  "2": DEFAULT_CATEGORY_IDS.transport,
  "3": DEFAULT_CATEGORY_IDS.shopping,
  "4": DEFAULT_CATEGORY_IDS.entertainment,
  "5": DEFAULT_CATEGORY_IDS.health,
  "6": DEFAULT_CATEGORY_IDS.bills,
  "7": DEFAULT_CATEGORY_IDS.education,
  "8": DEFAULT_CATEGORY_IDS.other,
  "9": DEFAULT_CATEGORY_IDS.salary,
  "10": DEFAULT_CATEGORY_IDS.bonus,
  "11": DEFAULT_CATEGORY_IDS.investment,
  "12": DEFAULT_CATEGORY_IDS.otherIncome,
};

export function normalizeCategoryId(id: string) {
  return LEGACY_DEFAULT_CATEGORY_ID_MAP[id] ?? id;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { id: DEFAULT_CATEGORY_IDS.food, nameKey: "categories.food", icon: "UtensilsCrossed", color: "category-food" },
  { id: DEFAULT_CATEGORY_IDS.transport, nameKey: "categories.transport", icon: "Car", color: "category-transport" },
  { id: DEFAULT_CATEGORY_IDS.shopping, nameKey: "categories.shopping", icon: "ShoppingBag", color: "category-shopping" },
  { id: DEFAULT_CATEGORY_IDS.entertainment, nameKey: "categories.entertainment", icon: "Gamepad2", color: "category-entertainment" },
  { id: DEFAULT_CATEGORY_IDS.health, nameKey: "categories.health", icon: "Heart", color: "category-health" },
  { id: DEFAULT_CATEGORY_IDS.bills, nameKey: "categories.bills", icon: "Receipt", color: "category-bills" },
  { id: DEFAULT_CATEGORY_IDS.education, nameKey: "categories.education", icon: "GraduationCap", color: "category-education" },
  { id: DEFAULT_CATEGORY_IDS.other, nameKey: "categories.other", icon: "MoreHorizontal", color: "category-other" },
  { id: DEFAULT_CATEGORY_IDS.salary, nameKey: "categories.salary", icon: "Wallet", color: "category-health" },
  { id: DEFAULT_CATEGORY_IDS.bonus, nameKey: "categories.bonus", icon: "Gift", color: "category-entertainment" },
  { id: DEFAULT_CATEGORY_IDS.investment, nameKey: "categories.investment", icon: "TrendingUp", color: "category-education" },
  { id: DEFAULT_CATEGORY_IDS.otherIncome, nameKey: "categories.otherIncome", icon: "Plus", color: "category-other" },
];

export const CUSTOM_CATEGORY_ICON = "MoreHorizontal";
export const CUSTOM_CATEGORY_COLOR = "category-other";
export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  ...DEFAULT_CATEGORIES.map((item) => ({
    icon: item.icon,
    color: item.color,
    nameKey: item.nameKey,
  })),
  { icon: "Plane", color: "category-transport" },
  { icon: "Home", color: "category-bills" },
  { icon: "PiggyBank", color: "category-education" },
  { icon: "Coffee", color: "category-food" },
  { icon: "Briefcase", color: "category-education" },
  { icon: "Sparkles", color: "category-other" },
  { icon: "Music4", color: "category-entertainment" },
  { icon: "Activity", color: "category-health" },
  { icon: "Coins", color: "category-bills" },
];

export function getAllCategoryIconOptions() {
  // de-duplicate by icon name, keep first color
  const unique = new Map<string, CategoryIconOption>();
  CATEGORY_ICON_OPTIONS.forEach((option) => {
    if (!unique.has(option.icon)) {
      unique.set(option.icon, option);
    }
  });
  return Array.from(unique.values());
}

// Fallback category ID for transactions without valid categories
export const FALLBACK_CATEGORY_ID = DEFAULT_CATEGORY_IDS.other;
