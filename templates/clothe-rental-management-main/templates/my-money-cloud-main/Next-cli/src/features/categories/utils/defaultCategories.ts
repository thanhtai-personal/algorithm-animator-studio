"use client";

import { DEFAULT_CATEGORIES } from "@/features/categories/constants";
import type { CategoryInput } from "@/features/categories/types";

export function buildDefaultCategoryInputs(t: (key: string) => string): CategoryInput[] {
  return DEFAULT_CATEGORIES.map((cat) => ({
    id: cat.id,
    name: t(cat.nameKey) || cat.nameKey,
    icon: cat.icon,
    color: cat.color,
  }));
}
