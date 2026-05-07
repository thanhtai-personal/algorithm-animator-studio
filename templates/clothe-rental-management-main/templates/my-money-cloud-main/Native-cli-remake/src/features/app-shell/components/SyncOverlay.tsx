import { Modal, StyleSheet, View } from "react-native";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/lib/themeProvider";
import { useI18n } from "@/lib/i18n";

type SyncOverlayProps = {
  open: boolean;
  progress: { done: number; total: number };
  status: string;
  error: string | null;
  onPause: () => void;
};

export function SyncOverlay({ open, progress, status, error, onPause }: SyncOverlayProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  if (!open) return null;
  const safeTotal = progress.total > 0 ? progress.total : 1;
  const percent = Math.min(100, Math.round((progress.done / safeTotal) * 100));
  const description =
    status || t("sync.pendingNotice", { count: progress.total }) || "Syncing your data";

  return (
    <Modal visible={open} transparent animationType="fade">
      <View style={styles.backdrop}>
        <ThemedView variant="card" style={[styles.card, { borderColor: colors.border }]}>
          <ThemedText style={styles.title}>{t("sync.syncing")}</ThemedText>
          <ThemedText tone="muted" style={styles.subtitle}>{description}</ThemedText>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: colors.primary }]} />
          </View>
          <View style={styles.progressRow}>
            <ThemedText tone="muted">{percent}%</ThemedText>
            <ThemedText tone="muted">{progress.done}/{progress.total}</ThemedText>
          </View>
          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
          <Button title={t("common.cancel") ?? "Pause"} variant="outline" onPress={onPause} />
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 20,
    borderWidth: 1,
    borderRadius: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  errorText: {
    fontSize: 12,
    color: "#f87171",
  },
});
