"use client";

import { useCallback, useEffect, useRef } from "react";
import { VoiceButton } from "@/features/voice-transaction/components/VoiceButton";
import { TranscriptDisplay } from "@/features/voice-transaction/components/TranscriptDisplay";
import { useSpeechRecognition } from "@/features/voice-transaction/hooks/useSpeechRecognition";
import { useVoiceParser } from "@/features/voice-transaction/hooks/useVoiceParser";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import type { TransactionInput } from "@/features/transactions/types";
import { useAIVoiceSettings } from "@/hooks/useAIVoiceSettings";

interface Props {
  onOpenConfirm: (tx: TransactionInput) => void;
  onAutoCreate?: (tx: TransactionInput) => Promise<void>;
  isLoading?: boolean;
}

export function VoiceInlineRecorder({ onOpenConfirm, onAutoCreate, isLoading = false }: Props) {
  const processedTranscriptRef = useRef<string>("");
  const { toast } = useToast();
  const { t, audioLanguage } = useI18n();

  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    clearTranscript,
    isSupported,
  } = useSpeechRecognition(audioLanguage);

  const { ignoreVoiceVerify } = useAIVoiceSettings();
  const { parseVoice } = useVoiceParser();

  useEffect(() => {
    if (!isListening && transcript && transcript.trim().length > 0 && transcript !== processedTranscriptRef.current) {
      processedTranscriptRef.current = transcript;
      (async () => {
        const voiceParsed = await parseVoice(transcript);

        if (voiceParsed.amount > 0) {
          const transactionInput: TransactionInput = {
            amount: voiceParsed.amount,
            description: voiceParsed.note,
            type: voiceParsed.type,
            categoryId: voiceParsed.category,
            date: new Date(),
          };

          // If ignoreVoiceVerify is true and onAutoCreate provided, create transaction directly
          if (ignoreVoiceVerify && onAutoCreate) {
            try {
              await onAutoCreate(transactionInput);
              processedTranscriptRef.current = "";
              clearTranscript();
            } catch {
              toast(t("toast.createFailed") || "Không thể tạo giao dịch");
            }
          } else {
            // Open parent confirmation modal (AddTransactionModal)
            onOpenConfirm(transactionInput);
            // Reset so modal can be reopened after cancel
            processedTranscriptRef.current = "";
            clearTranscript();
          }
        } else {
          toast(t("toast.speakClearAmount") || "Vui lòng nói rõ số tiền trong giao dịch");
        }
      })();
    }
  }, [isListening, transcript, ignoreVoiceVerify, t, parseVoice, onAutoCreate, onOpenConfirm, clearTranscript, toast]);

  useEffect(() => {
    if (error) {
      toast(t("common.error") || "Lỗi", { description: error });
    }
  }, [error, t, toast]);

  const handlePressStart = useCallback(() => {
    if (!isSupported) {
      toast(t("browser.notSupported") || "Trình duyệt không hỗ trợ", {
        description: t("browser.useChromeOrSafari") || "Vui lòng sử dụng Chrome hoặc Safari",
      });
      return;
    }

    // Reset error/success state before a new recording session
    processedTranscriptRef.current = "";
    clearTranscript();

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, isSupported, clearTranscript, startListening, stopListening, t, toast]);

  // Confirmation now handled by parent AddTransactionModal

  return (
    <>
      <div className="w-full mx-auto">
        {/* Voice Button (kept visible even when showing error) */}
        <VoiceButton isListening={isListening} onToggle={handlePressStart} disabled={!isSupported || isLoading} />

        {(transcript || isListening) && (
          <div className="w-full max-w-md mx-auto mt-4">
            <TranscriptDisplay transcript={transcript} isListening={isListening} error={""} />
          </div>
        )}
      </div>
    </>
  );
}

export default VoiceInlineRecorder;
