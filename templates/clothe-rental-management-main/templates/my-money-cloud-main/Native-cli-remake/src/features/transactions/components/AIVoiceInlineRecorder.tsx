import { useCallback } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/themeProvider";

type Props = {
  open: boolean;
  isListening: boolean;
  transcript: string;
  onToggle: () => void;
  onClose: () => void;
  isLoading?: boolean;
};

export function AIVoiceInlineRecorder({ open, isListening, transcript, onToggle, onClose, isLoading }: Props) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <>
      <Pressable style={[styles.voiceCard, { backgroundColor: colors.primary }]} onPress={onToggle} disabled={isLoading}>
        <View style={[styles.aiBadge, { backgroundColor: colors.background }]}>
          <ThemedText style={[styles.aiBadgeText, { color: colors.primary }]}>
            {t("ai.mode") ?? "Chế độ trợ lý AI"}
          </ThemedText>
        </View>
        <View style={styles.voiceIcon}>
          <Ionicons name={isListening ? "mic" : "mic-off"} size={22} color="#fff" />
        </View>
        <ThemedText style={styles.voiceTitle}>
          {isListening ? t("voice.listening") ?? "Listening..." : t("voice.tapToSpeak") ?? "Tap to speak"}
        </ThemedText>
        <ThemedText style={styles.voiceSubtitle}>
          {t("voice.example") ?? "Example: \"Salary 20 million\" or \"Pho 50k\""}
        </ThemedText>
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={handleClose}>
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={[styles.overlayCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => undefined}>
            <ThemedText style={styles.overlayTitle}>
              {t("voice.listening") ?? "Listening..."}
            </ThemedText>
            <ThemedText tone="muted" style={styles.overlayText}>
              {transcript || t("voice.example") || "Example: \"Salary 20 million\" or \"Pho 50k\""}
            </ThemedText>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  voiceCard: {
    borderRadius: 22,
    padding: 18,
    alignItems: "center",
    gap: 10,
    position: "relative",
  },
  aiBadge: {
    position: "absolute",
    top: 10,
    right: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  voiceIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  voiceSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  overlayCard: {
    width: "100%",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    gap: 8,
  },
  overlayTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  overlayText: {
    fontSize: 14,
    textAlign: "center",
  },
});
