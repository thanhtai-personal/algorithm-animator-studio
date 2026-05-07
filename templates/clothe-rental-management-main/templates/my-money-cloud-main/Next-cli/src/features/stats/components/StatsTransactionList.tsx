"use client";

import { useEffect, useMemo, useState } from "react";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { TransactionFeedList } from "@/features/transactions/components/TransactionFeedList";
import type { Transaction } from "@/features/transactions/types";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/utils";
import { format } from "date-fns";
import { categoryStore } from "@/store/categoryStore";
import { CategoryIcon } from "@/components/icons/CategoryIcon";

interface StatsTransactionListProps {
  transactions: Transaction[];
  selectedMonth: Date;
  loading?: boolean;
}

const PAGE_SIZE = 10;

export function StatsTransactionList({
  transactions,
  selectedMonth,
  loading = false,
}: StatsTransactionListProps) {
  const { t, locale, localeCode, currency } = useI18n();
  const { categories } = categoryStore;
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedMonth]);

  const categoryOptions = useMemo(
    () => [
      { id: "all", name: t("categories.all"), icon: "Coins", color: "category-other" },
      ...categories.map((category) => ({
        id: category.id,
        name: category.name,
        icon: category.icon ?? "MoreHorizontal",
        color: category.color ?? "category-other",
      })),
    ],
    [categories, t]
  );

  const filteredTransactions = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
    if (selectedCategory === "all") {
      return sorted;
    }
    return sorted.filter((transaction) => transaction.categoryId === selectedCategory);
  }, [transactions, selectedCategory]);

  const visibleTransactions = useMemo(
    () => filteredTransactions.slice(0, page * PAGE_SIZE),
    [filteredTransactions, page]
  );
  const hasMore = visibleTransactions.length < filteredTransactions.length;

  if (loading) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-lg">{t("dashboard.recentTransactions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs">{t("common.loading")}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const detailTitle = t("transactions.detailTitle") || t("transactions.editTitle");

  return (
    <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "220ms" }}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-lg">{t("dashboard.recentTransactions")}</CardTitle>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="h-9 w-full sm:w-[220px]">
            <SelectValue placeholder={t("transactions.filterCategory")} />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                <span className="flex items-center gap-2">
                  <CategoryIcon
                    icon={option.icon}
                    color={option.color}
                    size="sm"
                    className="h-6 w-6 rounded-lg shadow-none"
                  />
                  <span className="flex-1">{option.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3 float-animation">
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-sm">{t("dashboard.noTransactionsTitle")}</p>
            <p className="text-xs mt-1">{t("dashboard.noTransactionsSubtitle")}</p>
          </div>
        ) : (
          <TransactionFeedList
            transactions={visibleTransactions}
            maxHeight={420}
            onTransactionClick={(tx) => setDetailTx(tx)}
          />
        )}
        {hasMore ? (
          <Button variant="outline" onClick={() => setPage((prev) => prev + 1)}>
            {t("common.loadMore")}
          </Button>
        ) : null}
      </CardContent>

      <Dialog open={Boolean(detailTx)} onOpenChange={(open) => !open && setDetailTx(null)}>
        <DialogContent className="sm:max-w-sm">
          {detailTx ? (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>{detailTitle}</DialogTitle>
                <DialogDescription>
                  {format(detailTx.date, "dd/MM/yyyy HH:mm:ss", { locale })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("common.amount")}</span>
                  <span className={cn("font-semibold", detailTx.type === "income" ? "text-emerald-500" : "text-rose-500")}>
                    {formatCurrency(detailTx.amount, currency, localeCode)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("common.type")}</span>
                  <span className="font-semibold">
                    {detailTx.type === "income" ? t("common.income") : t("common.expense")}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{t("common.category")}</span>
                  <span className="font-semibold truncate max-w-[55%] text-right">
                    {categoryMap.get(detailTx.categoryId)?.name ?? t("categories.other")}
                  </span>
                </div>
                {detailTx.description ? (
                  <div className="pt-2">
                    <p className="text-muted-foreground text-xs mb-1">{t("common.descriptionOptional")}</p>
                    <p className="text-sm whitespace-pre-line">{detailTx.description}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
