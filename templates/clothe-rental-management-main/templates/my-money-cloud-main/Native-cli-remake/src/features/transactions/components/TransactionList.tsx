import { StyleSheet, View } from "react-native";
import { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";

import { ThemedText } from "@/components/ThemedText";
import { useI18n } from "@/lib/i18n";
import { formatDate, groupByDate } from "@/lib/date";
import type { Transaction } from "@/features/transactions/types";
import { TransactionTimeCard } from "@/features/transactions/components/TransactionCard";

type Props = {
  transactions: Transaction[];
  onDetail?: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
};

type TransactionRowHandlers = Pick<Props, "onDetail" | "onEdit" | "onDelete">;

function useTransactionRowRenderer({ onDetail, onEdit, onDelete }: TransactionRowHandlers) {
  return useCallback(
    (transaction: Transaction) => (
      <TransactionTimeCard
        transaction={transaction}
        onPress={onDetail}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ),
    [onDelete, onDetail, onEdit]
  );
}

export const HomeTransactionList = observer(function HomeTransactionList({
  transactions,
  onDetail,
  onEdit,
  onDelete,
}: Props) {
  const { t, language, locale } = useI18n();
  const renderRow = useTransactionRowRenderer({ onDetail, onEdit, onDelete });

  const homeRows = useMemo(() => {
    const grouped = groupByDate(transactions);
    const sortedDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));
    const rows: Array<
      | { type: "date"; key: string; date: Date; count: number }
      | { type: "transaction"; key: string; transaction: Transaction }
    > = [];
    sortedDates.forEach((dateKey) => {
      const items = grouped.get(dateKey) ?? [];
      rows.push({ type: "date", key: `date-${dateKey}`, date: new Date(dateKey), count: items.length });
      items.forEach((transaction) => {
        rows.push({ type: "transaction", key: transaction.id, transaction });
      });
    });
    return rows;
  }, [transactions]);

  return (
    <View style={styles.homeList}>
      {homeRows.map((row) => {
        if (row.type === "date") {
          const label = formatDate(row.date, {
            language,
            locale,
            labels: { today: t("date.today"), yesterday: t("date.yesterday") },
          });
          return (
            <View key={row.key} style={styles.homeDateRow}>
              <ThemedText tone="muted" style={styles.homeDateLabel}>
                {label}
              </ThemedText>
              <ThemedText tone="muted" style={styles.homeDateCount}>
                {t("dashboard.transactionCount", { count: row.count })}
              </ThemedText>
            </View>
          );
        }
        return <View key={row.key}>{renderRow(row.transaction)}</View>;
      })}
    </View>
  );
});

export const StatsTransactionList = observer(function StatsTransactionList({
  transactions,
  onDetail,
  onEdit,
  onDelete,
}: Props) {
  const renderRow = useTransactionRowRenderer({ onDetail, onEdit, onDelete });

  return (
    <View style={styles.list}>
      {transactions.map((transaction) => (
        <View key={transaction.id}>
          {renderRow(transaction)}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  homeList: {
    gap: 10,
  },
  homeDateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 4,
  },
  homeDateLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  homeDateCount: {
    fontSize: 12,
  },
  list: {
    gap: 10,
  },
});
