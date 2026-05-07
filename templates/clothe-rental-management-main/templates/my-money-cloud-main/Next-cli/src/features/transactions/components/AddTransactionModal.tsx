"use client";

import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { Form } from "@/components/form/Form";
import { X } from "lucide-react";

import { AddCategoryDrawer } from "@/features/transactions/components/add-transaction/AddCategoryDrawer";
import { CategoryGrid } from "@/features/transactions/components/add-transaction/CategoryGrid";
import { AmountSection } from "@/features/transactions/components/add-transaction/AmountSection";
import { DeleteCategoryDialog } from "@/features/transactions/components/add-transaction/DeleteCategoryDialog";
import { DescriptionField } from "@/features/transactions/components/add-transaction/DescriptionField";
import { TypeToggle } from "@/features/transactions/components/add-transaction/TypeToggle";
import type { TransactionInput } from "@/features/transactions/types";
import { useAddTransactionForm } from "@/features/transactions/hooks/useAddTransactionForm";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: TransactionInput) => Promise<boolean>;
  initialTransaction?: TransactionInput | null;
}

export function AddTransactionModal({ isOpen, onClose, onAdd, initialTransaction }: AddTransactionModalProps) {
  const { t, localeCode, currency, currencySymbol, categories, iconOptions, creating, deleting, state, actions } =
    useAddTransactionForm({ isOpen, onClose, onAdd, initialTransaction });
  const isVnd = (currency ?? "").toUpperCase() === "VND";
  const shouldAutoFocusAmount = !initialTransaction && !isVnd;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => (!open ? actions.handleClose() : undefined)}>
      <DrawerContent
        className={cn("w-full p-0 rounded-t-3xl bg-background overflow-hidden flex flex-col gap-0", "max-h-[80vh]")}
      >
        <div className="relative flex h-full max-h-[80vh] flex-col overflow-hidden min-h-0">
          <div
            className={cn(
              "absolute inset-0 pointer-events-none transition-colors duration-300",
              state.type === "income" ? "bg-green-500/10" : "bg-red-500/10",
            )}
          />
          <div className="relative z-10 flex flex-col flex-1 overflow-hidden min-h-0">
            <div className="sticky top-0 z-20 px-5 pt-5 pb-4 bg-background/90 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <DrawerTitle className="text-xl font-bold">{t("addTransaction.title")}</DrawerTitle>
                <DrawerClose asChild>
                  <button className="rounded-full border border-border/60 p-2 text-muted-foreground transition hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </DrawerClose>
              </div>
              <TypeToggle
                value={state.type}
                onChange={actions.setType}
                expenseLabel={t("common.expense")}
                incomeLabel={t("common.income")}
              />
            </div>

            <Form.Root className="flex-1 overflow-y-auto p-5 pt-0 space-y-6 min-h-0">
              <Form.Section title={t("common.amount")}>
                <AmountSection
                  amount={state.amount}
                  localeCode={localeCode}
                  currencySymbol={currencySymbol}
                  currency={currency}
                  onAmountChange={actions.setAmount}
                  onQuickSelect={(value) => actions.setAmount(value)}
                  label={t("common.amount")}
                  autoFocus={shouldAutoFocusAmount}
                />
              </Form.Section>

              <Form.Section title={t("common.descriptionOptional")}>
                <DescriptionField
                  value={state.description}
                  onChange={actions.setDescription}
                  label=""
                  placeholder={t("common.descriptionPlaceholder")}
                />
              </Form.Section>

              <Form.Section
                title={t("common.category")}
                action={
                  !state.isCategoryDrawerOpen && (
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => actions.setCategoryDrawerOpen(true)}>
                      {t("categories.addAction")}
                    </Button>
                  )
                }
              >
                <CategoryGrid
                  categories={categories}
                  selectedCategory={state.selectedCategory}
                  onSelectCategory={actions.setSelectedCategory}
                  onDeleteRequest={(category) => actions.setDeleteTarget(category)}
                  label=""
                />
              </Form.Section>
            </Form.Root>
          </div>
        </div>
        <div className="relative z-10 flex gap-3 px-5 pb-5 pt-3 bg-background/90 backdrop-blur">
          <Button onClick={actions.handleSubmit} disabled={!state.canSubmit} className={cn("w-full", state.type === "income" ? "bg-gradient-success" : "")}>
            {t("common.done")}
          </Button>
        </div>
      </DrawerContent>

      <DeleteCategoryDialog
        open={Boolean(state.deleteTarget)}
        deleting={deleting}
        target={state.deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            actions.setDeleteTarget(null);
          }
        }}
        onConfirm={actions.handleDeleteCategory}
        labels={{
          title: t("categories.deleteTitle"),
          description: t("categories.deleteMessage"),
          cancel: t("common.cancel"),
          confirm: t("categories.deleteAction"),
          loading: t("common.loading"),
        }}
      />

      <AddCategoryDrawer
        open={state.isCategoryDrawerOpen}
        onOpenChange={(open) => {
          actions.setCategoryDrawerOpen(open);
          if (!open) {
            actions.setNewCategoryName("");
          }
        }}
        iconOptions={iconOptions}
        selectedCategoryIcon={state.selectedCategoryIcon}
        selectedCategoryColor={state.selectedCategoryColor}
        newCategoryName={state.newCategoryName}
        creating={creating}
        onSelectIcon={(icon, color) => {
          actions.setSelectedCategoryIcon(icon);
          actions.setSelectedCategoryColor(color ?? state.selectedCategoryColor);
        }}
        onChangeName={actions.setNewCategoryName}
        onSubmit={actions.handleCreateCategory}
        onCancel={() => {
          actions.setCategoryDrawerOpen(false);
          actions.setNewCategoryName("");
        }}
        labels={{
          title: t("categories.addTitle"),
          iconLabel: t("categories.iconLabel"),
          namePlaceholder: t("categories.namePlaceholder"),
          createAction: t("categories.createAction"),
          creatingLabel: t("common.loading"),
          cancel: t("common.cancel"),
        }}
      />
    </Drawer>
  );
}
