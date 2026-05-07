import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ScreenView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { AddTransactionModal } from "@/features/transactions/components/AddTransactionModal";
import { EditTransactionModal } from "@/features/transactions/components/EditTransactionModal";
import { VoiceTransactionModal } from "@/features/transactions/components/VoiceTransactionModal";
import { AIVoiceTransactionModal } from "@/features/transactions/components/AIVoiceTransactionModal";
import { transactionStore } from "@/store/transactionStore";
import type { Transaction, TransactionInput } from "@/features/transactions/types";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

export default function AddTransactionScreen() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showAIVoice, setShowAIVoice] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);

  const handleAdd = (payload: TransactionInput) => {
    transactionStore.upsert({
      id: `tx_${Date.now()}`,
      amount: payload.amount,
      description: payload.description,
      type: payload.type,
      categoryId: payload.categoryId,
      date: payload.date,
      createdAt: new Date(),
    });
    toast.success(
      payload.type === "income"
        ? t("toast.addedIncome") || "Income added"
        : t("toast.addedExpense") || "Expense added"
    );
    setShowAdd(false);
  };

  const handleEdit = (payload: TransactionInput) => {
    if (!editTarget) return;
    transactionStore.upsert({
      ...editTarget,
      amount: payload.amount,
      description: payload.description,
      type: payload.type,
      categoryId: payload.categoryId,
      date: payload.date,
    });
    setShowEdit(false);
  };

  return (
    <ScreenView style={styles.container}>
      <View style={styles.actions}>
        <Button title="Add (Text)" onPress={() => setShowAdd(true)} />
        <Button
          title="Edit (Text)"
          variant="outline"
          onPress={() => {
            const target = transactionStore.transactions[0] ?? null;
            setEditTarget(target);
            setShowEdit(true);
          }}
        />
        <Button title="Voice (Confirm)" variant="outline" onPress={() => setShowVoice(true)} />
        <Button title="Voice AI (Confirm)" variant="outline" onPress={() => setShowAIVoice(true)} />
      </View>

      <AddTransactionModal visible={showAdd} onClose={() => setShowAdd(false)} onSubmit={handleAdd} />
      <EditTransactionModal
        visible={showEdit}
        transaction={editTarget}
        onClose={() => setShowEdit(false)}
        onSubmit={handleEdit}
      />
      <VoiceTransactionModal
        visible={showVoice}
        transcript="Example voice transcript..."
        onClose={() => setShowVoice(false)}
        onSubmit={handleAdd}
        initial={{
          amount: 120000,
          description: "Voice input",
          type: "expense",
          categoryId: transactionStore.transactions[0]?.categoryId ?? "",
          date: new Date(),
        }}
      />
      <AIVoiceTransactionModal
        visible={showAIVoice}
        transcript="Example AI voice transcript..."
        onClose={() => setShowAIVoice(false)}
        onSubmit={handleAdd}
        initial={{
          amount: 350000,
          description: "AI voice input",
          type: "expense",
          categoryId: transactionStore.transactions[0]?.categoryId ?? "",
          date: new Date(),
        }}
      />
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  actions: {
    gap: 12,
  },
});
