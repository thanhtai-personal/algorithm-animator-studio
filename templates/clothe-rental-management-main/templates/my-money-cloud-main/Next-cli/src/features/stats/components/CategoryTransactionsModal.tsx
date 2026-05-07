"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, X } from "lucide-react";
import { TransactionFeedList } from "@/features/transactions/components/TransactionFeedList";
import { useTransactionsInfiniteQuery } from "@/features/transactions/queries/useTransactionsInfiniteQuery";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { TransactionDetailDialog } from "@/features/transactions/components/TransactionDetailDialog";
import type { Transaction } from "@/features/transactions/types";
import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";
import { authStore } from "@/store/authStore";
import { observer } from "mobx-react-lite";
interface CategoryTransactionsModalProps {
  open: boolean;
  onClose: () => void;
  categoryId: string | null;
  categoryName?: string;
  month: Date;
}

const PAGE_SIZE = 20;

export const CategoryTransactionsModal = observer(function CategoryTransactionsModal({
  open,
  onClose,
  categoryId,
  categoryName,
  month,
}: CategoryTransactionsModalProps) {
  const { t } = useI18n();
  const user = authStore.userSettings;
  const { isAnonymous } = useAnonymousChecker();
  const isLocal = Boolean(!user || isAnonymous || !isSupabaseConfigured);
  const isReady = Boolean((isLocal || user) && categoryId);

  const transactionsQuery = useTransactionsInfiniteQuery({
    userId: user?.user_id,
    month,
    categoryId: categoryId ?? undefined,
    limit: PAGE_SIZE,
    enabled: isReady,
    isLocal,
  });

  const transactions = useMemo(
    () => transactionsQuery.data?.pages.flat() ?? [],
    [transactionsQuery.data]
  );

  const isLoading = transactionsQuery.isLoading && transactions.length === 0;
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);

  return (
    <Drawer open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DrawerContent className="w-full max-h-[80vh] p-0 overflow-hidden rounded-t-3xl flex flex-col">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border/60 px-5 py-4">
          <div className="justify-self-start">
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="px-2">
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("common.back")}
              </Button>
            </DrawerClose>
          </div>
          <div className="flex flex-col items-center text-center">
            <DrawerTitle className="text-base">{t("stats.categoryTransactionsTitle")}</DrawerTitle>
            {categoryName && (
              <p className="text-sm text-muted-foreground">{categoryName}</p>
            )}
          </div>
          <div className="justify-self-end">
            <DrawerClose asChild>
              <button className="rounded-full border border-border/60 p-2 text-muted-foreground transition hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </DrawerClose>
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-5 py-4">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("stats.noData")}
            </div>
          ) : (
            <>
              <TransactionFeedList
                transactions={transactions}
                onTransactionClick={(tx) => setDetailTx(tx)}
                onLoadMore={() => transactionsQuery.fetchNextPage()}
                hasMore={Boolean(transactionsQuery.hasNextPage)}
                isLoadingMore={transactionsQuery.isFetchingNextPage}
                maxHeight={460}
              />
              <TransactionDetailDialog transaction={detailTx} onClose={() => setDetailTx(null)} />
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
})
