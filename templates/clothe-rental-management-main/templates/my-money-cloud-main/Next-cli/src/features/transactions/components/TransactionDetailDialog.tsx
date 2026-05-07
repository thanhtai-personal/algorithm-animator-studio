import { format } from "date-fns";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/utils";
import type { Transaction } from "@/features/transactions/types";
import { X } from "lucide-react";
import { categoryStore } from "@/store/categoryStore";
import { observer } from "mobx-react-lite";

interface TransactionDetailDialogProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const TransactionDetailDialog = observer(function TransactionDetailDialog({ transaction, onClose }: TransactionDetailDialogProps) {
  const { t, locale, localeCode, currency } = useI18n();
  const categoryName = transaction ? categoryStore.findById(transaction.categoryId)?.name : null;
  const detailTitle = t("transactions.detailTitle") || t("transactions.editTitle");

  return (
    <Drawer open={Boolean(transaction)} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="w-full max-h-[80vh] p-0 overflow-hidden rounded-t-3xl flex flex-col">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-border/60 px-5 py-4">
          <div />
          <div className="text-center">
            <DrawerTitle className="text-base">{detailTitle}</DrawerTitle>
            {transaction ? (
              <p className="text-sm text-muted-foreground">
                {format(transaction.date, "dd/MM/yyyy HH:mm:ss", { locale })}
              </p>
            ) : null}
          </div>
          <div className="justify-self-end">
            <DrawerClose asChild>
              <button className="rounded-full border border-border/60 p-2 text-muted-foreground transition hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </DrawerClose>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {transaction ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("common.amount")}</span>
                <span
                  className={cn(
                    "font-semibold",
                    transaction.type === "income" ? "text-emerald-500" : "text-rose-500"
                  )}
                >
                  {formatCurrency(transaction.amount, currency, localeCode)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("common.type")}</span>
                <span className="font-semibold">
                  {transaction.type === "income" ? t("common.income") : t("common.expense")}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t("common.category")}</span>
                <span className="font-semibold truncate max-w-[55%] text-right">
                  {categoryName ?? t("categories.other")}
                </span>
              </div>
              {transaction.description ? (
                <div className="pt-2">
                  <p className="text-muted-foreground text-xs mb-1">{t("common.descriptionOptional")}</p>
                  <p className="text-sm whitespace-pre-line">{transaction.description}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
});
