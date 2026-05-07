"use client";

import { useEffect, useMemo, useState } from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AmountKeypad } from "@/components/inputs/AmountKeypad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import type { Transaction, TransactionUpdate, TransactionType } from "@/features/transactions/types";
import { formatCurrency, getCurrencySymbol, parseCurrencyInput } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/utils";
import { Check, X } from "lucide-react";
import { categoryStore } from "@/store/categoryStore";
import { observer } from "mobx-react-lite";

interface EditTransactionModalProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (id: string, updates: TransactionUpdate) => Promise<boolean>;
  isSaving?: boolean;
}

export const EditTransactionModal = observer(function EditTransactionModal({
  open,
  transaction,
  onClose,
  onSave,
  isSaving = false,
}: EditTransactionModalProps) {
  const { t, localeCode, currency } = useI18n();
  const currencySymbol = getCurrencySymbol(currency, localeCode);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const { categories } = categoryStore;

  useEffect(() => {
    if (!transaction) return;
    setType(transaction.type);
    setAmount(String(transaction.amount));
    setDescription(transaction.description ?? "");
    setSelectedCategory(transaction.categoryId);
  }, [transaction]);

  useEffect(() => {
    if (!selectedCategory) return;
    if (!categories.find((item) => item.id === selectedCategory)) {
      setSelectedCategory("");
    }
  }, [categories, selectedCategory]);

  const selectedCategoryData = useMemo(
    () => categories.find((item) => item.id === selectedCategory),
    [categories, selectedCategory]
  );

  const handleAmountChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setAmount(digits);
  };

  const handleSubmit = async () => {
    if (!transaction) return;
    const parsedAmount = parseCurrencyInput(amount);
    const success = await onSave(transaction.id, {
      amount: parsedAmount,
      description: description.trim(),
      categoryId: selectedCategory,
      type,
    });
    if (success) {
      onClose();
    }
  };

  const isValid = parseCurrencyInput(amount) > 0 && Boolean(selectedCategory);

  const handleClose = () => {
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={(next) => (!next ? handleClose() : undefined)}>
      <DrawerContent className="w-full max-h-[80vh] p-0 overflow-hidden rounded-t-3xl flex flex-col min-h-0">
        <DrawerHeader className="flex items-center justify-between p-5 pb-0">
          <DrawerTitle className="text-xl font-bold">{t("transactions.editTitle")}</DrawerTitle>
          <DrawerClose asChild>
            <button className="rounded-full border border-border/60 p-2 text-muted-foreground transition hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex gap-2 p-1 bg-muted rounded-2xl">
            <button
              onClick={() => setType("expense")}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                type === "expense"
                  ? "bg-gradient-primary text-white shadow-2d"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("common.expense")}
            </button>
            <button
              onClick={() => setType("income")}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                type === "income"
                  ? "bg-gradient-success text-white shadow-2d"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("common.income")}
            </button>
          </div>

          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-2">{t("common.amount")}</p>
            <div className="relative">
              <input
                type="text"
                inputMode="none"
                value={amount ? parseInt(amount, 10).toLocaleString(localeCode) : ""}
                onChange={(event) => handleAmountChange(event.target.value)}
                placeholder="0"
                readOnly
                className="w-full text-center text-4xl font-extrabold bg-transparent border-none outline-none"
              />
              <span className="text-2xl font-bold text-muted-foreground">{currencySymbol}</span>
            </div>
            <div className="mt-4">
              <AmountKeypad value={amount} onChange={handleAmountChange} currency={currency} />
            </div>
          </div>

          <div>
            <p className="text-muted-foreground text-sm mb-3">{t("common.category")}</p>
            <div className="grid grid-cols-4 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200",
                    selectedCategory === category.id
                      ? "bg-primary/10 scale-105"
                      : "hover:bg-muted"
                  )}
                >
                  <CategoryIcon icon={category.icon || ""} color={category.color || ""} size="md" />
                  <span className="text-xs font-medium text-center line-clamp-2">
                    {category.name}
                  </span>
                  {selectedCategory === category.id && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center animate-bounce-in">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              {t("common.descriptionOptional")}
            </label>
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("common.descriptionPlaceholder")}
              className="rounded-xl h-12"
            />
          </div>

          <div className="bg-muted rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("common.amount")}</span>
              <span className="font-bold">
                {formatCurrency(parseCurrencyInput(amount) || 0, currency, localeCode)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("common.category")}</span>
              <div className="flex items-center gap-2">
                {selectedCategory && (
                  <>
                    <CategoryIcon
                      icon={selectedCategoryData?.icon || "MoreHorizontal"}
                      color={selectedCategoryData?.color || "category-other"}
                      size="sm"
                    />
                    <span className="font-medium">
                      {selectedCategoryData ? selectedCategoryData.name : ""}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("common.type")}</span>
              <span
                className={cn(
                  "font-medium",
                  type === "income" ? "text-success" : "text-foreground"
                )}
              >
                {type === "income" ? t("common.income") : t("common.expense")}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              {t("common.back")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSaving}
              className={cn("flex-1", type === "income" ? "bg-gradient-success" : "")}
            >
              {isSaving ? t("common.loading") : t("transactions.updateAction")}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
});
