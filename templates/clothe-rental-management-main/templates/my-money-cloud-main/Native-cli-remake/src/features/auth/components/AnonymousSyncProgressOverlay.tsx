import { Modal, StyleSheet, View } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useI18n } from "@/lib/i18n";

interface AnonymousSyncProgressOverlayProps {
  open: boolean;
  done: number;
  total: number;
}

export function AnonymousSyncProgressOverlay({ open, done, total }: AnonymousSyncProgressOverlayProps) {
  const { t } = useI18n();
  if (!open) return null;
  const safeTotal = total > 0 ? total : 1;
  const percent = Math.min(100, Math.round((done / safeTotal) * 100));
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <ThemedView variant="card" style={styles.card}>
          <ThemedText style={styles.title}>{t("sync.syncing")}</ThemedText>
          <ThemedText tone="muted">{t("sync.pendingNotice", { count: total })}</ThemedText>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${percent}%` }]} />
          </View>
          <ThemedText tone="muted">{percent}%</ThemedText>
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
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  track: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 8,
  },
  fill: {
    height: "100%",
    backgroundColor: "#22c55e",
  },
});
