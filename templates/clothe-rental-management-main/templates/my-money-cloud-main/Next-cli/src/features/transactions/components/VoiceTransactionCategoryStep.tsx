import { Check } from "lucide-react";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { cn } from "@/utils";
import type { CategoryRow } from "@/features/categories/types";

interface CategoryStepProps {
  categories: CategoryRow[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  t: (key: string) => string | undefined;
}

export function VoiceTransactionCategoryStep({
  categories,
  selectedCategory,
  onSelectCategory,
  t,
}: CategoryStepProps) {
  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      <p className="text-sm font-medium text-muted-foreground">{t("common.selectCategory")}</p>
      <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-xl p-3 transition-all",
              selectedCategory === category.id
                ? "bg-primary/10 scale-105 ring-2 ring-primary"
                : "hover:bg-muted"
            )}
          >
            {category.icon && category.color && <CategoryIcon
              icon={category.icon}
              color={category.color}
              size="md"
            />}
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
