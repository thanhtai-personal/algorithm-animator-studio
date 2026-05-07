import { Modal, StyleSheet, View } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useI18n } from "@/lib/i18n";

interface ConfirmAnonDataEraseModalProps {
  open: boolean;
  email?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmAnonDataEraseModal({ open, email, onConfirm, onCancel }: ConfirmAnonDataEraseModalProps) {
  const { t } = useI18n();
  return (
    <Modal visible={open} transparent animationType="fade">
      <View style={styles.backdrop}>
        <ThemedView variant="card" style={styles.card}>
          <ThemedText style={styles.title}>{t("auth.switchAccountTitle")}</ThemedText>
          <ThemedText tone="muted" style={styles.subtitle}>
            {t("auth.switchAccountDescription")}
          </ThemedText>
          {email ? <ThemedText tone="muted">{email}</ThemedText> : null}
          <View style={styles.actions}>
            <Button title={t("auth.switchAccountErase")} variant="outline" onPress={onConfirm} />
            <Button title={t("auth.switchAccountCancel")} variant="ghost" onPress={onCancel} />
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 20,
    borderRadius: 16,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    marginBottom: 8,
  },
  actions: {
    gap: 8,
    marginTop: 8,
  },
});
