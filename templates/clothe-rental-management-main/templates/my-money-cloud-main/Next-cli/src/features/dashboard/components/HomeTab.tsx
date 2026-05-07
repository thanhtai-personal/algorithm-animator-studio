"use client";

import { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Plus } from "lucide-react";

import { BalanceCard } from "@/features/dashboard/components/BalanceCard";
import { RecentTransactionsSection } from "@/features/dashboard/components/RecentTransactionsSection";
import { VoiceTransactionDrawer } from "@/features/transactions/components/VoiceTransactionDrawer";
import { AddTransactionModal } from "@/features/transactions/components/AddTransactionModal";
import { ReceiptPreviewDrawer } from "@/features/transactions/components/ReceiptPreviewDrawer";
import VoiceInlineRecorder from "@/features/voice-transaction/components/VoiceInlineRecorder";
import AIAssistantBorder from "@/features/dashboard/components/AIAssistantBorder";
import { VoiceButton } from "@/features/voice-transaction/components/VoiceButton";
import { useAIVoiceSettings } from "@/hooks/useAIVoiceSettings";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import { useReceiptScanner } from "@/features/transactions/hooks/useReceiptScanner";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import { useSpeechRecognition } from "@/features/voice-transaction/hooks/useSpeechRecognition";
import { useVoiceParser } from "@/features/voice-transaction/hooks/useVoiceParser";
import { useToast } from "@/hooks/use-toast";
import type { TransactionInput } from "@/features/transactions/types";
import { appShellStore } from "@/features/app-shell/stores/appShellStore";
import { homeUiStore } from "@/features/dashboard/stores/homeUiStore";
import { BalanceCardPlaceholder } from "./BalanceCardPlaceholder";
import { useHomeStat } from "../hooks/useHomeStat";
import { calculateDashboardStats } from "@/features/transactions/utils";
import { transactionStore } from "@/store/transactionStore";

export const HomeTab = observer(() => {

  const { t, localeCode, currency } = useI18n();
  const loadingLabel = t("common.loading");
  const scanner = useReceiptScanner();
  const { toast: toastHook } = useToast();
  const { ignoreVoiceVerify } = useAIVoiceSettings();
  const { parseVoice, isAIModeOn } = useVoiceParser();
  const { activeTab, pendingMic } = appShellStore;

  const {
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    clearTranscript,
    isSupported: speechSupported,
  } = useSpeechRecognition();

  const {
    createOrUpdateTransaction,
  } = useTransactions();

  const {
    categoryStats,
    selectedMonth,
    loading,
    allStats,
    balanceLoading,
  } = useHomeStat();

  const todayStats = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const todayTransactions = transactionStore.transactions.filter(
      (transaction) => transaction.date >= start && transaction.date <= end
    );
    return calculateDashboardStats(todayTransactions);
  }, [transactionStore.transactions]);

  const handleAddTransaction = useCallback(
    async (transaction: TransactionInput) => {
      const saved = await createOrUpdateTransaction(transaction);
      if (!saved) {
        toastHook(t("toast.saveFailed") || "Lưu thất bại");
        return false;
      }
      toastHook(transaction.type === "income" ? t("toast.addedIncome") : t("toast.addedExpense"), {
        description: `${transaction.description} - ${formatCurrency(transaction.amount, currency, localeCode)}`,
      });
      return true;
    },
    [createOrUpdateTransaction, currency, localeCode, t, toastHook],
  );

  const handleVoiceTransactionModal = useCallback(
    async (updatedTransaction: TransactionInput): Promise<boolean> => {
      const success = await handleAddTransaction(updatedTransaction);
      if (success) {
        homeUiStore.closeAddModal();
        homeUiStore.clearVoiceTransaction();
        homeUiStore.markTranscriptProcessed("");
        clearTranscript();
      }
      return success;
    },
    [clearTranscript, handleAddTransaction],
  );

  const handleCloseVoiceModal = useCallback(() => {
    homeUiStore.closeAddModal();
    homeUiStore.clearVoiceTransaction();
    homeUiStore.markTranscriptProcessed("");
    clearTranscript();
  }, [clearTranscript]);

  useEffect(() => {
    if (!isListening && transcript && transcript.trim().length > 0 && !homeUiStore.isTranscriptProcessed(transcript)) {
      homeUiStore.markTranscriptProcessed(transcript);
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
          if (ignoreVoiceVerify) {
            const success = await handleAddTransaction(transactionInput);
            if (success) {
              clearTranscript();
              homeUiStore.markTranscriptProcessed("");
            }
          } else {
            homeUiStore.setVoiceTransactionData(transactionInput);
            homeUiStore.openAddModal();
          }
        } else {
          toastHook(t("toast.noAmountDetected") || "Không nhận diện được số tiền", {
            description: t("toast.speakClearAmount") || "Vui lòng nói rõ số tiền trong giao dịch",
          });
          homeUiStore.markTranscriptProcessed("");
          clearTranscript();
        }
      })();
    }
  }, [isListening, transcript, ignoreVoiceVerify, t, toastHook, parseVoice, handleAddTransaction, clearTranscript]);

  useEffect(() => {
    if (speechError) {
      toastHook(t("common.error") || "Lỗi", { description: speechError });
    }
  }, [speechError, toastHook, t]);

  const openAddModal = useCallback(() => homeUiStore.openAddModal(), []);
  const micDisabled = !speechSupported;

  const handleMicToggle = useCallback(() => {
    if (!speechSupported) {
      toastHook(t("browser.notSupported") || "Trình duyệt không hỗ trợ", {
        description: t("browser.useChromeOrSafari") || "Vui lòng sử dụng Chrome hoặc Safari",
      });
      return;
    }
    if (isAIModeOn) {
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    } else {
      homeUiStore.openAudioForm();
    }
  }, [isAIModeOn, isListening, speechSupported, startListening, stopListening, t, toastHook]);

  // Sync listening/AI flags to shell store so TabBar can react without prop drilling
  useEffect(() => {
    appShellStore.setHomeListening(isListening);
  }, [isListening]);

  useEffect(() => {
    appShellStore.setHomeAIMode(isAIModeOn);
  }, [isAIModeOn]);

  // Consume queued mic action when returning to home tab
  useEffect(() => {
    if (activeTab === "home" && pendingMic) {
      handleMicToggle();
      appShellStore.consumePendingMic();
    }
  }, [activeTab, pendingMic, handleMicToggle]);

  return (
    <div className="space-y-8 pb-32">
      {balanceLoading ? <BalanceCardPlaceholder label={loadingLabel} /> : (
        <BalanceCard balance={allStats.balance} totalIncome={todayStats.totalIncome} totalExpense={todayStats.totalExpense} />
      )}

      {isAIModeOn ? (
        <AIAssistantBorder>
          <VoiceInlineRecorder
            onOpenConfirm={(tx) => {
              homeUiStore.setVoiceTransactionData(tx);
              homeUiStore.openAddModal();
            }}
            onAutoCreate={async (tx) => {
              const success = await handleAddTransaction(tx);
              if (success) {
                homeUiStore.closeAddModal();
              }
            }}
            isLoading={loading}
          />
        </AIAssistantBorder>
      ) : (
        <VoiceButton isListening={isListening} onToggle={() => homeUiStore.openAudioForm()} disabled={loading} />
      )}

      <RecentTransactionsSection month={selectedMonth} />

      {isListening ? (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center" onClick={stopListening}>
          <div
            className="w-[90%] max-w-md rounded-2xl bg-background p-4 shadow-xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              readOnly
              value={transcript}
              placeholder={t("voice.speakNow") || "Đang lắng nghe..."}
              className="w-full text-lg font-medium rounded-xl px-4 py-3 outline-none bg-transparent"
              autoFocus
            />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {t("voice.listeningHint") || "Nói nội dung giao dịch, ví dụ: 'Ăn phở 50 nghìn'"}
            </p>
          </div>
        </div>
      ) : null}

      <button onClick={openAddModal} className="fixed bottom-20 right-6 z-40">
        <div className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 bg-gradient-to-br from-orange-500 to-orange-600">
          <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
      </button>

      <AddTransactionModal
        isOpen={homeUiStore.isAddModalOpen}
        onClose={() => {
          if (homeUiStore.voiceTransactionData) {
            handleCloseVoiceModal();
          } else {
            homeUiStore.closeAddModal();
          }
        }}
        onAdd={homeUiStore.voiceTransactionData ? handleVoiceTransactionModal : handleAddTransaction}
        initialTransaction={homeUiStore.voiceTransactionData}
      />

      <VoiceTransactionDrawer
        open={homeUiStore.isAudioFormOpen}
        onClose={() => homeUiStore.closeAudioForm()}
        onSubmit={handleAddTransaction}
      />

      <input ref={scanner.fileRef} type="file" accept="image/*" className="hidden" onChange={scanner.handleFile} />

      <ReceiptPreviewDrawer
        open={scanner.showPreview}
        items={scanner.items}
        onClose={scanner.closePreview}
        onChangeItem={scanner.handleChangeItem}
        onDelete={scanner.handleDelete}
        processing={scanner.processing}
        categories={categoryStats.map((c: any) => ({
          id: c.categoryId,
          name: c.categoryName ?? "",
          icon: "📌",
          color: "#000",
          type: "expense" as const,
        }))}
        onSubmit={async (items) => {
          for (const it of items) {
            const tx: TransactionInput = {
              amount: it.amount ?? 0,
              description: it.description,
              type: it.type,
              categoryId: it.categoryId ?? categoryStats[0]?.categoryId ?? "",
              date: new Date(),
            };
            const ok = await handleAddTransaction(tx);
            if (!ok) return false;
          }
          return true;
        }}
      />
    </div>
  );
});
