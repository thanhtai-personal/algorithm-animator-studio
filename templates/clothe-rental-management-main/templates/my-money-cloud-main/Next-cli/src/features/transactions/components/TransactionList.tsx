"use client";

import { Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionFeedList } from "@/features/transactions/components/TransactionFeedList";
import { formatCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/utils";
import type { Transaction } from "@/features/transactions/types";
import { categoryStore } from "@/store/categoryStore";
import { categoryIcons, categoryLabels } from "@/features/voice-transaction/types/transaction";
import { observer } from "mobx-react-lite";

type TransactionBase = {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  type: "income" | "expense";
  date: Date | string;
  category?: string;
};

type FeedProps = {
  variant: "feed";
  transactions: Transaction[];
  onTransactionClick?: (transaction: Transaction) => void;
  onEditClick?: (transaction: Transaction) => void;
  onDeleteClick?: (transaction: Transaction) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  maxHeight?: number;
};

type StatsProps = {
  variant: "stats";
  transactions: Transaction[];
  localeCode: string;
  currency: string;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  onOpenDetail: (tx: Transaction) => void;
  t: (key: string) => string;
};

type VoiceProps = {
  variant: "voice";
  transactions: TransactionBase[];
  onEdit?: (transaction: TransactionBase) => void;
  onDelete?: (id: string) => void;
};

type TransactionListProps = FeedProps | StatsProps | VoiceProps;

export const TransactionList = observer(function TransactionList(props: TransactionListProps) {
  if (props.variant === "feed") {
    return (
      <TransactionFeedList
        transactions={props.transactions}
        onTransactionClick={props.onTransactionClick}
        onEditClick={props.onEditClick}
        onDeleteClick={props.onDeleteClick}
        onLoadMore={props.onLoadMore}
        hasMore={props.hasMore}
        isLoadingMore={props.isLoadingMore}
        maxHeight={props.maxHeight}
      />
    );
  }

  if (props.variant === "stats") {
    const { transactions, localeCode, currency, onEdit, onDelete, onOpenDetail, t } = props;
    const { categoryMap } = categoryStore;

    return (
      <div className="space-y-3">
        {transactions.map((transaction) => {
          const category = categoryMap[transaction.categoryId];
          return (
            <div
              key={transaction.id}
              className={cn(
                "rounded-2xl border px-4 py-3 cursor-pointer transition hover:scale-y-[1.01]",
                transaction.type === "income"
                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                  : "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800",
              )}
              onClick={() => onOpenDetail(transaction)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat(localeCode, {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }).format(transaction.date)}
                  </p>
                  <p className="text-sm font-semibold">{category?.name ?? t("categories.other")}</p>
                  {transaction.description ? (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{transaction.description}</p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className={cn("text-sm font-semibold", transaction.type === "income" ? "text-emerald-500" : "text-rose-500")}>
                    {formatCurrency(transaction.amount, currency, localeCode)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(transaction);
                      }}
                      aria-label={t("transactions.editTitle")}
                      title={t("transactions.editTitle")}
                      className="h-6 w-6"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">{t("transactions.editTitle")}</span>
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(transaction);
                      }}
                      aria-label={t("transactions.deleteAction")}
                      title={t("transactions.deleteAction")}
                      className="h-6 w-6"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t("transactions.deleteAction")}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const { transactions, onEdit, onDelete } = props;
  const { t, currency, localeCode } = useI18n();

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="w-full">
      {transactions.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card variant="elevated">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{t("transactions.income") || "Thu nhập"}</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                +{formatCurrency(totalIncome, currency, localeCode)}
              </p>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{t("transactions.expense") || "Chi tiêu"}</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
                -{formatCurrency(totalExpense, currency, localeCode)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">{t("transactions.empty") || "Chưa có giao dịch nào"}</p>
            <p className="text-xs mt-1">{t("transactions.tapMicToAdd") || "Nhấn giữ nút micro để thêm"}</p>
          </div>
        ) : (
          transactions.map((transaction, index) => {
            const isIncome = transaction.type === "income";
            const amountColor = isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
            const defaultCategory = isIncome ? "other_income" : "other_expense";
            const category = (transaction.category as string) || defaultCategory;
            const categoryIconsRecord = categoryIcons as Record<string, string>;
            const categoryLabelsRecord = categoryLabels as Record<string, string>;
            const categoryIcon = categoryIconsRecord[category] || "💰";
            const categoryLabel = categoryLabelsRecord[category] || t("categories.other") || "Other";
            const transactionDate = transaction.date instanceof Date ? transaction.date : new Date(transaction.date);

            return (
              <Card
                key={transaction.id}
                variant="elevated"
                className={cn(
                  "overflow-hidden animate-in fade-in slide-in-from-bottom-4 transition-colors",
                  "hover:shadow-md"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0",
                          isIncome
                            ? "bg-emerald-100 dark:bg-emerald-950"
                            : "bg-rose-100 dark:bg-rose-950"
                        )}
                      >
                        {categoryIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm md:text-base">
                          {categoryLabel}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mt-0.5">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {transactionDate.toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <p className={cn("font-bold text-base md:text-lg whitespace-nowrap", amountColor)}>
                        {isIncome ? "+" : "-"}
                        {formatCurrency(transaction.amount, currency, localeCode)}
                      </p>
                      {(onEdit || onDelete) && (
                        <div className="flex gap-1 ml-2">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(transaction)}
                              className="p-2 rounded hover:bg-foreground/10 transition-colors text-foreground/60 hover:text-foreground"
                              title={t("common.edit") || "Sửa"}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(transaction.id)}
                              className="p-2 rounded hover:bg-destructive/10 transition-colors text-destructive"
                              title={t("common.delete") || "Xóa"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
});
