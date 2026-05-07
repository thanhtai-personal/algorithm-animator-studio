import { Pressable, StyleSheet, View, type GestureResponderEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo } from "react";

import { ThemedText } from "@/components/ThemedText";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/themeProvider";
import { formatCurrency } from "@/lib/currency";
import { formatDate, formatTime } from "@/lib/date";
import { categoryStore } from "@/store/categoryStore";
import type { Transaction } from "@/features/transactions/types";

type TransactionCardActionProps = {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
};

type TransactionCardBaseProps = TransactionCardActionProps & {
  subtitleVariant: "category-time" | "category-date-time";
};

const TransactionCardBase = observer(function TransactionCardBase({
  transaction,
  subtitleVariant,
  onPress,
  onEdit,
  onDelete,
}: TransactionCardBaseProps) {
  const { t, currency, localeCode, language, locale } = useI18n();
  const { colors } = useTheme();
  const category = categoryStore.categoryMap[transaction.categoryId];
  const editActionBorderStyle = useMemo(() => ({ borderColor: colors.border }), [colors.border]);
  const deleteActionBorderStyle = useMemo(() => ({ borderColor: colors.danger }), [colors.danger]);

  const title = transaction.description || t("stats.noDescription") || "No description";
  const categoryLabel = category?.name ?? t("categories.other") ?? "Other";
  const subtitleParts = [categoryLabel];
  if (subtitleVariant === "category-date-time") {
    subtitleParts.push(
      formatDate(transaction.date, {
        language,
        locale,
        labels: { today: t("date.today"), yesterday: t("date.yesterday") },
      })
    );
  }
  if (subtitleVariant === "category-time" || subtitleVariant === "category-date-time") {
    subtitleParts.push(formatTime(transaction.date, { language, locale }));
  }
  const subtitle = subtitleParts.join(" • ");
  const amountLabel = `${transaction.type === "expense" ? "-" : "+"}${formatCurrency(
    transaction.amount,
    currency,
    localeCode
  )}`;
  const handlePress = useCallback(() => {
    onPress?.(transaction);
  }, [onPress, transaction]);
  const handleEditPress = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation?.();
      onEdit?.(transaction);
    },
    [onEdit, transaction]
  );
  const handleDeletePress = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation?.();
      onDelete?.(transaction);
    },
    [onDelete, transaction]
  );

  return (
    <Pressable
      style={[
        styles.card,
        transaction.type === "income" ? styles.cardIncome : styles.cardExpense,
      ]}
      onPress={handlePress}
    >
      <View style={styles.left}>
        <CategoryIcon
          icon={category?.icon || "MoreHorizontal"}
          color={category?.color || "category-other"}
          size="sm"
        />
        <View style={styles.text}>
          <ThemedText style={styles.title} numberOfLines={1}>
            {title}
          </ThemedText>
          <ThemedText tone="muted" style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </ThemedText>
        </View>
      </View>
      <View style={styles.right}>
        <ThemedText
          style={[
            styles.amount,
            transaction.type === "income" ? styles.amountIncome : styles.amountExpense,
          ]}
        >
          {amountLabel}
        </ThemedText>
        {onEdit || onDelete ? (
          <View style={styles.actions}>
            {onEdit ? (
              <Pressable
                style={[styles.actionButton, editActionBorderStyle]}
                onPress={handleEditPress}
              >
                <Ionicons name="create-outline" size={16} color={colors.text} />
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable
                style={[styles.actionButton, deleteActionBorderStyle]}
                onPress={handleDeletePress}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

export const TransactionTimeCard = observer(function TransactionTimeCard(props: TransactionCardActionProps) {
  return <TransactionCardBase {...props} subtitleVariant="category-time" />;
});

export const TransactionDateTimeCard = observer(function TransactionDateTimeCard(props: TransactionCardActionProps) {
  return <TransactionCardBase {...props} subtitleVariant="category-date-time" />;
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardIncome: {
    backgroundColor: "rgba(34,197,94,0.08)",
    borderColor: "rgba(34,197,94,0.2)",
  },
  cardExpense: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderColor: "rgba(239,68,68,0.2)",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amount: {
    fontSize: 14,
    fontWeight: "700",
  },
  amountIncome: {
    color: "#22c55e",
  },
  amountExpense: {
    color: "#ef4444",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
