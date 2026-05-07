"use client";

import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { X } from "lucide-react";
import { cn } from "@/utils";
import { CategoryForm } from "@/features/transactions/components/add-transaction/CategoryForm";
import { CUSTOM_CATEGORY_COLOR } from "@/features/categories/constants";
import type { CategoryIconOption } from "@/features/categories/constants";

type AddCategoryDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function AddCategoryDrawer({
  open,
  onOpenChange,
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
}: AddCategoryDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn("w-full p-0 rounded-t-3xl bg-background overflow-hidden flex flex-col gap-0", "max-h-[80vh]")}
      >
        <div className="relative flex h-full max-h-[80vh] flex-col overflow-hidden min-h-0">
          <div className="sticky top-0 z-20 px-5 pt-5 pb-4 bg-background/90 backdrop-blur">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-xl font-bold">{labels.title}</DrawerTitle>
              <button
                type="button"
                className="rounded-full border border-border/60 p-2 text-muted-foreground transition hover:text-foreground"
                onClick={() => onOpenChange(false)}
                aria-label={labels.cancel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
            <CategoryForm
              iconOptions={iconOptions}
              selectedCategoryIcon={selectedCategoryIcon}
              selectedCategoryColor={selectedCategoryColor}
              newCategoryName={newCategoryName}
              creating={creating}
              onSelectIcon={(icon, color = CUSTOM_CATEGORY_COLOR) => onSelectIcon(icon, color)}
              onChangeName={onChangeName}
              onSubmit={onSubmit}
              onCancel={onCancel}
              labels={labels}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
