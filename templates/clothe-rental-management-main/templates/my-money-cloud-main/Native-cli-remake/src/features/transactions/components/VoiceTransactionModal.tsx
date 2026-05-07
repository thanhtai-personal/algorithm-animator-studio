import { Modal, ScrollView, StyleSheet } from "react-native";
import { VndKeypadTransactionForm } from "@/features/transactions/components/TransactionForm";
import type { TransactionInput } from "@/features/transactions/types";
import { ScreenView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";

type Props = {
  visible: boolean;
  transcript: string;
  initial?: Partial<TransactionInput>;
  onClose: () => void;
  onSubmit: (payload: TransactionInput) => void;
};

export function VoiceTransactionModal({ visible, transcript, initial, onClose, onSubmit }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScreenView style={styles.container}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText tone="muted" style={styles.transcriptLabel}>
            Voice transcript
          </ThemedText>
          <ThemedText style={styles.transcript}>{transcript}</ThemedText>
          <VndKeypadTransactionForm
            header="Confirm transaction"
            submitLabel="Save"
            initial={initial}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        </ScrollView>
      </ScreenView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  transcriptLabel: {
    marginBottom: 4,
  },
  transcript: {
    marginBottom: 12,
  },
});
