"use client";

import { Check } from "lucide-react";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import type { CategoryRow } from "@/features/categories/types";
import { cn } from "@/utils";
import { useI18n } from "@/lib/i18n";

type CategoryStepProps = {
  categories: CategoryRow[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
};

export function CategoryStep({ categories, selectedCategory, onSelectCategory }: CategoryStepProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      <p className="text-sm font-medium text-muted-foreground">{t("common.selectCategory")}</p>
      <div className="grid grid-cols-4 gap-2 max-h-[350px] overflow-y-auto">
        {categories.map((category: any) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-xl p-2 transition-all",
              selectedCategory === category.id ? "bg-primary/10 scale-110" : "hover:bg-muted",
            )}
          >
            <CategoryIcon icon={category.icon} color={category.color} size="md" />
            <span className="text-xs font-medium text-center line-clamp-2">{category.name}</span>
            {selectedCategory === category.id && (
              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
