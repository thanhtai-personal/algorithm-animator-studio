"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { Form } from "@/components/form/Form";
import { cn } from "@/utils";
import { CUSTOM_CATEGORY_COLOR } from "@/features/categories/constants";
import type { CategoryIconOption } from "@/features/categories/constants";

type CategoryFormProps = {
  iconOptions: CategoryIconOption[];
  selectedCategoryIcon: string;
  selectedCategoryColor: string;
  newCategoryName: string;
  creating: boolean;
  onSelectIcon: (icon: string, color?: string) => void;
  onChangeName: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  labels: {
    title: string;
    iconLabel: string;
    namePlaceholder: string;
    createAction: string;
    creatingLabel: string;
    cancel: string;
  };
};

export function CategoryForm({
  iconOptions,
  selectedCategoryIcon,
  selectedCategoryColor,
  newCategoryName,
  creating,
  onSelectIcon,
  onChangeName,
  onSubmit,
  onCancel,
  labels,
}: CategoryFormProps) {
  return (
    <Form.Section
      title={labels.title}
      action={
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {labels.cancel}
        </Button>
      }
      className="border-dashed border-muted-foreground/30 bg-muted/40"
      contentClassName="space-y-3"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{labels.iconLabel}</p>
        <div className="grid grid-cols-6 gap-2">
          {iconOptions.map((option) => {
            const isSelected = selectedCategoryIcon === option.icon;
            return (
              <button
                key={option.icon}
                type="button"
                onClick={() => onSelectIcon(option.icon, option.color ?? CUSTOM_CATEGORY_COLOR)}
                className={cn(
                  "flex items-center justify-center rounded-2xl p-1 transition-all",
                  isSelected ? "ring-2 ring-primary" : "hover:bg-muted/60",
                )}
                aria-label={option.nameKey ?? "categories.other"}
              >
                <CategoryIcon
                  icon={option.icon}
                  color={option.color ?? CUSTOM_CATEGORY_COLOR}
                  size="sm"
                  className={cn(isSelected && "scale-105")}
                />
              </button>
            );
          })}
        </div>
      </div>

      <Input
        value={newCategoryName}
        onChange={(event) => onChangeName(event.target.value)}
        placeholder={labels.namePlaceholder}
        className="rounded-xl"
      />
      <Button className="w-full rounded-xl" onClick={onSubmit} disabled={creating || !newCategoryName.trim()}>
        {creating ? labels.creatingLabel : labels.createAction}
      </Button>
    </Form.Section>
  );
}
