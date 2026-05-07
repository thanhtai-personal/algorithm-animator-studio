"use client";

import { useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Transaction } from "@/features/transactions/types";
import { formatCurrency } from "@/lib/currency";
import { formatDate, formatTime, groupByDate } from "@/lib/date";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/utils";
import { categoryStore } from "@/store/categoryStore";
import { observer } from "mobx-react-lite";
import { TransactionRowCard } from "@/features/transactions/components/TransactionRowCard";

interface TransactionFeedListProps {
  transactions: Transaction[];
  onTransactionClick?: (transaction: Transaction) => void;
  onEditClick?: (transaction: Transaction) => void;
  onDeleteClick?: (transaction: Transaction) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  maxHeight?: number;
}

type TransactionRow =
  | {
      type: "date";
      key: string;
      date: Date;
      count: number;
    }
  | {
      type: "transaction";
      key: string;
      transaction: Transaction;
    };

const HEADER_HEIGHT = 36;
const ROW_HEIGHT = 72;

export const TransactionFeedList = observer(function TransactionFeedList({
  transactions,
  onTransactionClick,
  onEditClick,
  onDeleteClick,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  maxHeight,
}: TransactionFeedListProps) {
  const { t, language, locale, localeCode, currency } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const rows = useMemo<TransactionRow[]>(() => {
    const groupedTransactions = groupByDate(transactions);
    const sortedDates = Array.from(groupedTransactions.keys()).sort((a, b) => b.localeCompare(a));
    const result: TransactionRow[] = [];

    sortedDates.forEach((dateKey) => {
      const dayTransactions = groupedTransactions.get(dateKey) ?? [];
      result.push({
        type: "date",
        key: `date-${dateKey}`,
        date: new Date(dateKey),
        count: dayTransactions.length,
      });
      dayTransactions.forEach((transaction) => {
        result.push({
          type: "transaction",
          key: transaction.id,
          transaction,
        });
      });
    });

    return result;
  }, [transactions]);

  const shouldVirtualize = transactions.length > 100;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: (index) => (rows[index]?.type === "date" ? HEADER_HEIGHT : ROW_HEIGHT),
    overscan: 6,
  });

  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) {
      return;
    }

    const root = containerRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      { root, rootMargin: "120px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  const renderRow = (row: TransactionRow) => {
    if (row.type === "date") {
      return (
        <div className="flex items-center justify-between px-1 pb-2 pt-4 text-xs font-semibold text-muted-foreground">
          <span>
            {formatDate(row.date, {
              language,
              locale,
              labels: { today: t("date.today"), yesterday: t("date.yesterday") },
            })}
          </span>
          <span>{t("dashboard.transactionCount", { count: row.count })}</span>
        </div>
      );
    }

    const transaction = row.transaction;
    const category = categoryStore.findById(transaction.categoryId);
    const description = transaction.description || t("stats.noDescription");
    const categoryName = category?.name ?? t("categories.other");
    const isIncome = transaction.type === "income";
    const amountLabel = `${isIncome ? "+" : "-"}${formatCurrency(transaction.amount, currency, localeCode)}`;
    const timeLabel = formatTime(transaction.date, { language, locale });
    const snapshot: Transaction = {
      ...transaction,
      date: new Date(transaction.date),
      createdAt: new Date(transaction.createdAt),
    };

    return (
      <TransactionRowCard
        description={description}
        categoryName={categoryName}
        categoryIcon={category?.icon || "MoreHorizontal"}
        categoryColor={category?.color || "category-other"}
        timeLabel={timeLabel}
        amountLabel={amountLabel}
        isIncome={isIncome}
        onClick={onTransactionClick ? () => onTransactionClick(snapshot) : undefined}
        onEdit={onEditClick ? () => onEditClick(snapshot) : undefined}
        onDelete={onDeleteClick ? () => onDeleteClick(snapshot) : undefined}
        editLabel={t("transactions.editTitle")}
        deleteLabel={t("transactions.deleteAction")}
      />
    );
  };

  const containerStyle =
    shouldVirtualize || typeof maxHeight === "number"
      ? { maxHeight: maxHeight ?? 520 }
      : undefined;

  return (
    <div
      ref={containerRef}
      className={cn(
        shouldVirtualize || typeof maxHeight === "number" ? "overflow-y-auto" : "overflow-visible"
      )}
      style={containerStyle}
    >
      {shouldVirtualize ? (
        <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            if (!row) return null;
            return (
              <div
                key={row.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {renderRow(row)}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.key}>{renderRow(row)}</div>
          ))}
        </div>
      )}
      <div ref={sentinelRef} />
      {isLoadingMore && (
        <div className="py-3 text-center text-xs text-muted-foreground">
          {t("common.loading")}
        </div>
      )}
    </div>
  );
});
