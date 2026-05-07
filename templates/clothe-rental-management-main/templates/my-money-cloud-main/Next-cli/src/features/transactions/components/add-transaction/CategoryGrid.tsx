"use client";

import { Check, X } from "lucide-react";

import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { cn } from "@/utils";
import type { CategoryRow } from "@/features/categories/types";

type CategoryGridProps = {
  categories: CategoryRow[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  onDeleteRequest: (category: CategoryRow) => void;
  label: string;
};

export function CategoryGrid({ categories, selectedCategory, onSelectCategory, onDeleteRequest, label }: CategoryGridProps) {
  return (
    <div className="animate-slide-up space-y-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="grid grid-cols-4 gap-3">
        {categories.map((category: any) => (
          <div key={category.id} className="relative">
            <button
              type="button"
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                "relative flex w-full flex-col items-center gap-2 rounded-2xl p-3 transition-all duration-200",
                selectedCategory === category.id ? "bg-primary/10 scale-105" : "hover:bg-muted",
              )}
            >
              <CategoryIcon icon={category.icon} color={category.color} size="md" />
              <span className="text-xs font-medium text-center line-clamp-2">{category.name}</span>
              {selectedCategory === category.id && (
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary animate-bounce-in">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
            {!category.isDefault && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteRequest(category);
                }}
                className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-background/70 text-destructive ring-1 ring-destructive/30 shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
                aria-label={label}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
