"use client";

import { useState, useCallback, useEffect } from "react";
import { Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VoiceButton } from "@/features/voice-transaction/components/VoiceButton";
import { TranscriptDisplay } from "@/features/voice-transaction/components/TranscriptDisplay";
import { useSpeechRecognition } from "@/features/voice-transaction/hooks/useSpeechRecognition";
import { useVoiceParser } from "@/features/voice-transaction/hooks/useVoiceParser";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import type { TransactionInput } from "@/features/transactions/types";

interface VoiceTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onTransactionParsed: (transaction: TransactionInput) => Promise<boolean>;
  isLoading?: boolean;
}

export function VoiceTransactionModal({
  open,
  onClose,
  onTransactionParsed,
  isLoading = false,
}: VoiceTransactionModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [parsedTransaction, setParsedTransaction] = useState<TransactionInput | null>(null);
  const { toast } = useToast();
  const { t, localeCode, currency } = useI18n();

  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechRecognition();

  const { parseVoice } = useVoiceParser();

  // Handle speech recognition result
  useEffect(() => {
    if (!isListening && transcript && transcript.trim().length > 0) {
      (async () => {
        const voiceParsed = await parseVoice(transcript);

        if (voiceParsed.amount > 0) {
          // Map voice-transaction format to API Transaction format
          const transactionInput: TransactionInput = {
            amount: voiceParsed.amount,
            description: voiceParsed.note,
            type: voiceParsed.type,
            categoryId: voiceParsed.category,
            date: new Date(),
          };

          setParsedTransaction(transactionInput);
          setShowSuccess(true);

          toast(t("toast.addedTransaction") || "Ghi chép thành công", {
            description: `${voiceParsed.note} - ${formatCurrency(voiceParsed.amount, currency, localeCode)}`,
          });
        } else {
          toast(t("toast.noAmountDetected") || "Không nhận diện được số tiền", {
            description: t("toast.speakClearAmount") || "Vui lòng nói rõ số tiền trong giao dịch",
          });
        }
      })();
    }
  }, [isListening, transcript, parseVoice, toast, t, currency, localeCode]);

  // Handle error
  useEffect(() => {
    if (error) {
      toast(t("common.error") || "Lỗi", { description: error });
    }
  }, [error, toast, t]);

  const handlePressStart = useCallback(() => {
    if (!isSupported) {
      toast(t("browser.notSupported") || "Trình duyệt không hỗ trợ", {
        description: t("browser.useChromeOrSafari") || "Vui lòng sử dụng Chrome hoặc Safari",
      });
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isSupported, isListening, startListening, stopListening, toast, t]);

  const handleConfirm = useCallback(async () => {
    if (!parsedTransaction) return;

    try {
      const success = await onTransactionParsed(parsedTransaction);
      if (success) {
        setTimeout(() => {
          setShowSuccess(false);
          setParsedTransaction(null);
          onClose();
        }, 1000);
      }
    } catch (error) {
      toast(t("common.error") || "Lỗi", { description: t("toast.saveFailed") || "Không thể lưu giao dịch" });
    }
  }, [parsedTransaction, onTransactionParsed, onClose, toast, t]);

  const handleCancel = useCallback(() => {
    setShowSuccess(false);
    setParsedTransaction(null);
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !newOpen && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("ai.voiceAnalysis") || "Voice Transaction Analysis"}</DialogTitle>
        </DialogHeader>

        {/* Success animation */}
        {showSuccess && (
          <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 rounded-lg">
            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center animate-bounce">
              <Check className="w-10 h-10 text-white" />
            </div>
          </div>
        )}

        <div className="space-y-6 py-4">
          {/* Voice Input Section */}
          <div className="flex flex-col items-center gap-4">
            {/* Voice button */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <VoiceButton
                isListening={isListening}
                onToggle={handlePressStart}
                disabled={!isSupported || isLoading}
              />
            </div>

            {/* Transcript display */}
            {(transcript || error || isListening) && (
              <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TranscriptDisplay
                  transcript={transcript}
                  isListening={isListening}
                  error={error}
                />
              </div>
            )}

            {/* Hint text */}
            {!transcript && !isListening && !parsedTransaction && (
              <p className="text-sm text-muted-foreground text-center max-w-xs animate-in fade-in duration-500">
                {t("voice.example") || "Ví dụ: \"Nhận lương 20 triệu\" hoặc \"Đi ăn phở 50 nghìn\""}
              </p>
            )}
          </div>

          {/* Parsed Transaction Confirmation */}
          {parsedTransaction && !isLoading && (
            <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800 space-y-3">
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                {t("ai.confirmedTransaction") || "Confirmed Transaction:"}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("transactions.description") || "Description"}:</span>
                  <span className="font-medium">{parsedTransaction.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("transactions.type") || "Type"}:</span>
                  <span className="font-medium">
                    {parsedTransaction.type === "income"
                      ? t("transactions.income") || "Income"
                      : t("transactions.expense") || "Expense"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("transactions.amount") || "Amount"}:</span>
                  <span
                    className={`font-bold ${
                      parsedTransaction.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {parsedTransaction.type === "income" ? "+" : "-"}
                    {formatCurrency(
                      parsedTransaction.amount,
                      currency,
                      localeCode
                    )}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setParsedTransaction(null)}
                  className="flex-1 px-3 py-2 rounded border border-destructive text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium"
                  disabled={isLoading}
                >
                  <X className="w-4 h-4 inline mr-1" />
                  {t("common.cancel") || "Cancel"}
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors text-sm font-medium disabled:opacity-50"
                  disabled={isLoading}
                >
                  <Check className="w-4 h-4 inline mr-1" />
                  {t("common.confirm") || "Confirm"}
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
