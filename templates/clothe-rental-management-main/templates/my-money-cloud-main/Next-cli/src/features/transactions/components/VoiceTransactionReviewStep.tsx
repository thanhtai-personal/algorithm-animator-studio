import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { cn } from "@/utils";
import { formatCurrency } from "@/lib/currency";
import type { CategoryRow } from "@/features/categories/types";

interface ReviewStepProps {
  transactionType: "income" | "expense";
  amount: string;
  currency: string;
  localeCode: string;
  selectedCategoryData?: CategoryRow;
  notes: string;
  t: (key: string) => string | undefined;
}

export function VoiceTransactionReviewStep({
  transactionType,
  amount,
  currency,
  localeCode,
  selectedCategoryData,
  notes,
  t,
}: ReviewStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="bg-muted/50 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("common.type")}</span>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full",
              transactionType === "expense" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
            )}
          >
            {transactionType === "expense" ? (
              <ArrowDownCircle className="h-4 w-4" />
            ) : (
              <ArrowUpCircle className="h-4 w-4" />
            )}
            <span className="text-sm font-semibold">
              {t(transactionType === "expense" ? "common.expense" : "common.income")}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("common.amount")}</span>
          <span className="text-xl font-bold">
            {formatCurrency(parseInt(amount, 10), currency, localeCode)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("common.category")}</span>
          <div className="flex items-center gap-2">
            {selectedCategoryData && (
              <>
                {selectedCategoryData.icon && selectedCategoryData.color && <CategoryIcon
                  icon={selectedCategoryData.icon}
                  color={selectedCategoryData.color}
                  size="sm"
                />}
                <span className="text-sm font-medium">{selectedCategoryData.name}</span>
              </>
            )}
          </div>
        </div>

        {notes && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-sm text-muted-foreground">{t("common.notes")}</span>
            <span className="text-sm text-right line-clamp-3 flex-1">{notes}</span>
          </div>
        )}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        {t("addTransaction.confirmMessage")}
      </p>
    </div>
  );
}
