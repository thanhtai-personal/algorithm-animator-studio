import { Modal, StyleSheet, View } from "react-native";
import { ScreenView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import type { Transaction } from "@/features/transactions/types";
import { categoryStore } from "@/store/categoryStore";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";

type Props = {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
};

export function TransactionDetailModal({ visible, transaction, onClose }: Props) {
  const { currency, localeCode, t } = useI18n();
  if (!transaction) return null;
  const category = categoryStore.categoryMap[transaction.categoryId];
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScreenView style={styles.container}>
        <ThemedText style={styles.title}>{t("transactions.detailTitle") ?? "Transaction Detail"}</ThemedText>
        <View style={styles.section}>
          <ThemedText tone="muted">{t("transactions.amount") ?? "Amount"}</ThemedText>
          <ThemedText style={styles.value}>
            {formatCurrency(transaction.amount, currency, localeCode)}
          </ThemedText>
        </View>
        <View style={styles.section}>
          <ThemedText tone="muted">{t("transactions.description") ?? "Description"}</ThemedText>
          <ThemedText style={styles.value}>{transaction.description || "-"}</ThemedText>
        </View>
        <View style={styles.section}>
          <ThemedText tone="muted">{t("transactions.category") ?? "Category"}</ThemedText>
          <ThemedText style={styles.value}>{category?.name ?? "-"}</ThemedText>
        </View>
        <View style={styles.section}>
          <ThemedText tone="muted">{t("transactions.type") ?? "Type"}</ThemedText>
          <ThemedText style={styles.value}>{transaction.type}</ThemedText>
        </View>
        <Button title={t("common.close") ?? "Close"} onPress={onClose} />
      </ScreenView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  section: {
    gap: 4,
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
});
