"use client";

import { useEffect, useMemo, useState } from "react";
import { useTransactionsInfiniteQuery } from "@/features/transactions/queries/useTransactionsInfiniteQuery";
import { TransactionList } from "@/features/transactions/components/TransactionList";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useI18n } from "@/lib/i18n";
import { getMonthRange } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Transaction } from "@/features/transactions/types";
import { Loader2 } from "lucide-react";
import { TransactionDetailDialog } from "@/features/transactions/components/TransactionDetailDialog";
import { EditTransactionModal } from "@/features/transactions/components/EditTransactionModal";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { categoryStore } from "@/store/categoryStore";
import { authStore } from "@/store/authStore";
import { observer } from "mobx-react-lite";
import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { transactionStore } from "@/store/transactionStore";
import { getCategoryIdVariants } from "@/features/categories/constants";

interface RecentTransactionsListProps {
  month: Date;
}

const PAGE_SIZE = 20;

export const RecentTransactionsList = observer(function RecentTransactionsList({ month }: RecentTransactionsListProps) {
  const { t } = useI18n();
  const user = authStore.userSettings;
  const userId = user?.user_id ?? authStore.userId ?? undefined;
  const { isAnonymous } = useAnonymousChecker();
  const { createOrUpdateTransaction, deleteTransaction } = useTransactions();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const isLocal = Boolean(isAnonymous || !userId || !isSupabaseConfigured);
  const isReady = Boolean(isLocal || userId);
  const [localPage, setLocalPage] = useState(1);

  const categoryOptions = useMemo(
    () => [
      { id: "all", name: t("categories.all"), icon: "Coins", color: "category-other" },
      ...categoryStore.categories.map((category) => ({
        id: category.id,
        name: category.name,
        icon: category.icon ?? "MoreHorizontal",
        color: category.color ?? "category-other",
      })),
    ],
    [categoryStore.categories, t]
  );

  useEffect(() => {
    if (isLocal) {
      setLocalPage(1);
    }
  }, [isLocal, selectedCategory, month]);

  const categoryIdVariants = useMemo(
    () => (selectedCategory === "all" ? [] : getCategoryIdVariants(selectedCategory)),
    [selectedCategory]
  );

  const localTransactions = isLocal
    ? (() => {
        const { start, end } = getMonthRange(month);
        const filtered = transactionStore.transactions.filter(
          (item) =>
            item.date >= start &&
            item.date <= end &&
            (selectedCategory === "all" || categoryIdVariants.includes(item.categoryId))
        );
        const sorted = [...filtered].sort((a, b) => b.date.getTime() - a.date.getTime());
        return sorted.map((item) => ({ ...item }));
      })()
    : [];

  const localVisible = isLocal ? localTransactions.slice(0, PAGE_SIZE * localPage) : [];
  const localHasMore = isLocal ? localVisible.length < localTransactions.length : false;

  const transactionsQuery = useTransactionsInfiniteQuery({
    userId,
    month,
    categoryId: selectedCategory === "all" ? undefined : selectedCategory,
    limit: PAGE_SIZE,
    enabled: Boolean(!isLocal && isReady),
    isLocal: false,
  });

  const transactions = isLocal
    ? localVisible
    : transactionsQuery.data?.pages.flat() ?? [];

  const isLoading = isLocal ? false : transactionsQuery.isLoading && transactions.length === 0;
  const hasMore = isLocal ? localHasMore : Boolean(transactionsQuery.hasNextPage);
  const isLoadingMore = isLocal ? false : transactionsQuery.isFetchingNextPage;
  const handleLoadMore = isLocal
    ? () => setLocalPage((prev) => prev + 1)
    : () => transactionsQuery.fetchNextPage();

  const handleSave = async (id: string, updates: Partial<Transaction>) => {
    try {
      const updated = await createOrUpdateTransaction({ id, ...updates } as any);
      if (!updated) {
        toast.error(t("toast.updateFailed"));
        return false;
      }
      toast.success(t("toast.transactionUpdated"));
      return true;
    } catch {
      toast.error(t("toast.updateFailed"));
      return false;
    }
  };

  const handleDelete = async () => {
    if (!deleteTx) return;
    try {
      const ok = await deleteTransaction(deleteTx.id);
      if (!ok) {
        throw new Error("delete_failed");
      }
      toast.success(t("toast.transactionDeleted"));
    } catch {
      toast.error(t("toast.deleteFailed"));
    } finally {
      setDeleteTx(null);
    }
  };

  if (isLoading) {
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

  return (
    <Card
      variant="elevated"
      className="animate-slide-up relative z-10 border border-border/70 bg-card/90 backdrop-blur"
      style={{ animationDelay: "200ms" }}
    >
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
      <CardContent className="min-h-[240px]">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3 float-animation">
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-sm">{t("dashboard.noTransactionsTitle")}</p>
            <p className="text-xs mt-1">{t("dashboard.noTransactionsSubtitle")}</p>
          </div>
        ) : (
          <>
            <TransactionList
              variant="feed"
              transactions={transactions}
              onTransactionClick={(tx) => setDetailTx(tx)}
              onEditClick={(tx) => setEditTx(tx)}
              onDeleteClick={(tx) => setDeleteTx(tx)}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
            />
            <TransactionDetailDialog transaction={detailTx} onClose={() => setDetailTx(null)} />
            <EditTransactionModal
              open={Boolean(editTx)}
              transaction={editTx}
              onClose={() => setEditTx(null)}
              onSave={handleSave}
            />
            <AlertDialog open={Boolean(deleteTx)} onOpenChange={(open) => !open && setDeleteTx(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("transactions.deleteConfirmTitle")}</AlertDialogTitle>
                </AlertDialogHeader>
                <p className="text-sm text-muted-foreground">
                  {t("transactions.deleteConfirmDesc")}
                </p>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t("transactions.deleteAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
    </Card>
  );
})
