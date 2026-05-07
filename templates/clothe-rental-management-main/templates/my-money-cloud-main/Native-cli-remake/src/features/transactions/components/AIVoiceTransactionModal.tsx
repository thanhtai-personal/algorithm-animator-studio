import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { TransactionInput } from "@/features/transactions/types";
import { ScreenView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/themeProvider";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/lib/voice/useSpeechRecognition";
import { useVoiceParser } from "@/lib/voice/useVoiceParser";
import { useAIVoiceSettings } from "@/hooks/useAIVoiceSettings";
import { AddTransactionModal } from "@/features/transactions/components/AddTransactionModal";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: TransactionInput) => boolean | void | Promise<boolean | void>;
};

export function AIVoiceTransactionModal({ visible, onClose, onSubmit }: Props) {
  const { t, audioLanguage } = useI18n();
  const { colors } = useTheme();
  const { toast } = useToast();
  const { ignoreVoiceVerify } = useAIVoiceSettings();
  const { parseVoice } = useVoiceParser();
  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    cancelListening,
    clearTranscript,
  } = useSpeechRecognition(audioLanguage);
  const [parsedTransaction, setParsedTransaction] = useState<TransactionInput | null>(null);
  const processedTranscriptRef = useRef("");

  useEffect(() => {
    if (!visible) {
      if (isListening) cancelListening();
      setParsedTransaction(null);
      clearTranscript();
      processedTranscriptRef.current = "";
    }
  }, [cancelListening, visible, clearTranscript, isListening]);

  useEffect(() => {
    if (!visible || parsedTransaction) return;
    if (!isListening && transcript && transcript.trim().length > 0 && transcript !== processedTranscriptRef.current) {
      processedTranscriptRef.current = transcript;
      (async () => {
        const voiceParsed = await parseVoice(transcript);
        if (voiceParsed.amount > 0) {
          const transactionInput: TransactionInput = {
            amount: voiceParsed.amount,
            description: voiceParsed.note,
            type: voiceParsed.type,
            categoryId: voiceParsed.categoryId,
            date: new Date(),
          };
          if (isListening) cancelListening();
          if (ignoreVoiceVerify) {
            const result = await onSubmit(transactionInput);
            if (result !== false) {
              clearTranscript();
              processedTranscriptRef.current = "";
              setParsedTransaction(null);
              onClose();
            }
          } else {
            setParsedTransaction(transactionInput);
          }
        } else {
          toast.error(t("toast.speakClearAmount") ?? "Please speak the amount clearly");
        }
      })();
    }
  }, [
    clearTranscript,
    ignoreVoiceVerify,
    isListening,
    onClose,
    onSubmit,
    parseVoice,
    parsedTransaction,
    t,
    toast,
    transcript,
    visible,
  ]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, toast]);

  const handleClose = useCallback(() => {
    if (isListening) cancelListening();
    setParsedTransaction(null);
    clearTranscript();
    processedTranscriptRef.current = "";
    onClose();
  }, [cancelListening, clearTranscript, isListening, onClose]);

  const handleToggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      clearTranscript();
      processedTranscriptRef.current = "";
      startListening();
    }
  }, [isListening, startListening, stopListening, clearTranscript]);

  return (
    <>
      <Modal visible={visible && !parsedTransaction} animationType="slide" onRequestClose={handleClose}>
        <ScreenView style={styles.container}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>{t("ai.voiceAnalysis") ?? "Voice Transaction Analysis"}</ThemedText>
            <Pressable style={[styles.closeButton, { borderColor: colors.border }]} onPress={handleClose}>
              <Ionicons name="close" size={16} color={colors.mutedText} />
            </Pressable>
          </View>

          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.micSection}>
              <Pressable
                style={[
                  styles.micButton,
                  { backgroundColor: isListening ? colors.primary : colors.card, borderColor: colors.border },
                ]}
                onPress={handleToggleListening}
              >
                <Ionicons
                  name={isListening ? "mic" : "mic-outline"}
                  size={22}
                  color={isListening ? colors.background : colors.text}
                />
              </Pressable>
              <ThemedText style={styles.micHint}>
                {t("voice.example") ?? "Example: \"Receive salary 20 million\" or \"Eat pho 50 thousand\""}
              </ThemedText>
            </View>

            {transcript ? (
              <View style={[styles.transcriptBox, { borderColor: colors.border }]}>
                <ThemedText tone="muted" style={styles.transcriptLabel}>
                  {t("ai.voiceTranscript") ?? "Transcript"}
                </ThemedText>
                <ThemedText style={styles.transcriptText}>{transcript}</ThemedText>
              </View>
            ) : null}
          </ScrollView>
        </ScreenView>
      </Modal>

      <AddTransactionModal
        visible={visible && Boolean(parsedTransaction)}
        onClose={handleClose}
        onSubmit={onSubmit}
        initial={parsedTransaction ?? undefined}
        submitLabel={t("common.confirm") ?? "Confirm"}
        title={t("ai.confirmedTransaction") ?? "Confirmed Transaction"}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 18,
  },
  scroll: {
    flex: 1,
  },
  micSection: {
    alignItems: "center",
    gap: 10,
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  micHint: {
    textAlign: "center",
    fontSize: 12,
  },
  transcriptBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  transcriptLabel: {
    fontSize: 12,
  },
  transcriptText: {
    fontSize: 14,
  },
});
