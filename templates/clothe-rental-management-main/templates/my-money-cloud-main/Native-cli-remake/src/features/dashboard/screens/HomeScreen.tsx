import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
// gradient removed due to UI issues

import { ScreenView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/themeProvider";
import { formatCompactNumber, formatCurrency } from "@/lib/currency";
import { useHomeStat } from "@/features/dashboard/hooks/useHomeStat";
import { useAIVoiceSettings } from "@/hooks/useAIVoiceSettings";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";
import { useAnonymousMode } from "@/hooks/useAnonymousMode";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/lib/voice/useSpeechRecognition";
import { useVoiceParser } from "@/lib/voice/useVoiceParser";
import { transactionStore } from "@/store/transactionStore";
import { categoryStore } from "@/store/categoryStore";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { authStore } from "@/store/authStore";
import { appShellStore } from "@/features/app-shell/stores/appShellStore";
import { homeUiStore } from "@/features/dashboard/stores/homeUiStore";
import { transactionService } from "@/features/transactions/services/transactionService";
import type { Transaction, TransactionInput, TransactionUpdate } from "@/features/transactions/types";
import { AddTransactionModal } from "@/features/transactions/components/AddTransactionModal";
import { EditTransactionModal } from "@/features/transactions/components/EditTransactionModal";
import { TransactionDetailModal } from "@/features/transactions/components/TransactionDetailModal";
import { VoiceInputStepsForm } from "@/features/transactions/components/VoiceInputStepsForm";
import { AIVoiceInlineRecorder } from "@/features/transactions/components/AIVoiceInlineRecorder";
import { calculateDashboardStats } from "@/features/transactions/utils";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { HomeTransactionList } from "@/features/transactions/components/TransactionList";

export const HomeScreen = observer(function HomeScreen() {
  const router = useRouter();
  const { t, localeCode, currency, language, audioLanguage } = useI18n();
  const { colors } = useTheme();
  const { isOnline } = useOnlineChecker();
  const { isAnonymous } = useAnonymousMode();
  const { toast } = useToast();
  const { ignoreVoiceVerify, useAI } = useAIVoiceSettings();
  const { parseVoice } = useVoiceParser();
  const {
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    cancelListening,
    clearTranscript,
  } = useSpeechRecognition(audioLanguage);

  const { allStats, monthTransactions } = useHomeStat();
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

  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [detailTarget, setDetailTarget] = useState<Transaction | null>(null);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const selectedCategoryData = useMemo(() => {
    if (selectedCategory === "all") {
      return {
        name: t("common.allCategories") ?? "All categories",
        icon: "Coins",
        color: "category-other",
      };
    }
    const category = categoryStore.categoryMap[selectedCategory];
    return {
      name: category?.name ?? t("categories.other") ?? "Other",
      icon: category?.icon ?? "MoreHorizontal",
      color: category?.color ?? "category-other",
    };
  }, [selectedCategory, t]);

  const filteredTransactions = useMemo(() => {
    const base =
      selectedCategory === "all"
        ? monthTransactions
        : monthTransactions.filter((tx) => tx.categoryId === selectedCategory);
    return [...base].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [monthTransactions, selectedCategory]);

  const recentTransactions = useMemo(
    () => filteredTransactions.slice(0, 5),
    [filteredTransactions]
  );
  const parseRequestIdRef = useRef(0);
  const voiceResettingRef = useRef(false);
  const pendingVoiceConfirmOpenRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAIModeOn = useAI;

  useEffect(() => {
    appShellStore.setHomeAIMode(isAIModeOn);
  }, [isAIModeOn]);

  useEffect(() => {
    appShellStore.setHomeListening(isListening);
  }, [isListening]);

  const buildLocalTransaction = (input: TransactionInput): Transaction => {
    const id =
      input.id ||
      (typeof globalThis.crypto?.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : Math.random().toString(36).slice(2));
    return {
      id,
      amount: input.amount,
      description: input.description,
      categoryId: input.categoryId,
      type: input.type,
      date: input.date,
      createdAt: new Date(),
    };
  };

  const persistOfflineTransaction = (input: TransactionInput) => {
    if (!authStore.userId) return;
    offlineQueueStore.enqueue({
      id: `offline-transaction-create-${Date.now()}`,
      entity: "transaction",
      action: "create",
      payload: {
        id: input.id ?? Math.random().toString(36).slice(2),
        amount: input.amount,
        description: input.description,
        categoryId: input.categoryId,
        type: input.type,
        date: input.date.toISOString(),
      },
    });
  };

  const persistOfflineTransactionUpdate = (id: string, updates: TransactionUpdate) => {
    if (!authStore.userId) return;
    const payloadUpdates = {
      ...updates,
      date: updates.date instanceof Date ? updates.date.toISOString() : updates.date,
    };
    offlineQueueStore.enqueue({
      id: `offline-transaction-update-${Date.now()}`,
      entity: "transaction",
      action: "update",
      payload: { id, updates: payloadUpdates },
    });
  };

  const persistOfflineTransactionDelete = (id: string) => {
    if (!authStore.userId) return;
    offlineQueueStore.enqueue({
      id: `offline-transaction-delete-${Date.now()}`,
      entity: "transaction",
      action: "delete",
      payload: { id },
    });
  };

  const createTransaction = useCallback(
    async (input: TransactionInput) => {
      if (isAnonymous || !isOnline) {
        const localTx = buildLocalTransaction(input);
        transactionStore.upsert(localTx);
        if (!isAnonymous && !isOnline) {
          persistOfflineTransaction({ ...input, id: localTx.id });
        }
        return localTx;
      }
      try {
        const saved = await transactionService.create({ input });
        transactionStore.upsert(saved);
        return saved;
      } catch {
        toast.error(t("transactions.createFailed") ?? "Unable to create transaction");
        return null;
      }
    },
    [isAnonymous, isOnline, toast, t]
  );

  const updateTransaction = useCallback(
    async (id: string, updates: TransactionUpdate) => {
      if (isAnonymous || !isOnline) {
        const current = transactionStore.transactions.find((item) => item.id === id);
        if (!current) return null;
        const next: Transaction = {
          ...current,
          ...updates,
          date: updates.date ? new Date(updates.date) : current.date,
        };
        transactionStore.upsert(next);
        if (!isAnonymous && !isOnline) {
          persistOfflineTransactionUpdate(id, updates);
        }
        return next;
      }
      try {
        const updated = await transactionService.update({ id, updates });
        transactionStore.upsert(updated);
        return updated;
      } catch {
        return null;
      }
    },
    [isAnonymous, isOnline]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (isAnonymous || !isOnline) {
        transactionStore.remove(id);
        if (!isAnonymous && !isOnline) {
          persistOfflineTransactionDelete(id);
        }
        return true;
      }
      try {
        await transactionService.remove({ id });
        transactionStore.remove(id);
        return true;
      } catch {
        return false;
      }
    },
    [isAnonymous, isOnline]
  );

  const resetVoiceSession = useCallback(() => {
    parseRequestIdRef.current += 1;
    voiceResettingRef.current = true;
    if (pendingVoiceConfirmOpenRef.current) {
      clearTimeout(pendingVoiceConfirmOpenRef.current);
      pendingVoiceConfirmOpenRef.current = null;
    }
    cancelListening();
    homeUiStore.closeAudioForm();
    homeUiStore.clearVoiceTransaction();
    clearTranscript();
    homeUiStore.markTranscriptProcessed("");
    setTimeout(() => {
      voiceResettingRef.current = false;
    }, 0);
  }, [cancelListening, clearTranscript]);

  useEffect(() => {
    return () => {
      if (pendingVoiceConfirmOpenRef.current) {
        clearTimeout(pendingVoiceConfirmOpenRef.current);
        pendingVoiceConfirmOpenRef.current = null;
      }
    };
  }, []);

  const handleAddTransaction = useCallback(
    async (payload: TransactionInput) => {
      const saved = await createTransaction(payload);
      if (!saved) return false;
      toast.success(
        payload.type === "income"
          ? t("toast.addedIncome") || "Income added"
          : t("toast.addedExpense") || "Expense added"
      );
      homeUiStore.closeAddModal();
      resetVoiceSession();
      return true;
    },
    [createTransaction, resetVoiceSession, t, toast]
  );

  const handleAudioFormSubmit = useCallback(
    async (payload: TransactionInput) => {
      const saved = await createTransaction(payload);
      if (!saved) return false;
      toast.success(
        payload.type === "income"
          ? t("toast.addedIncome") || "Income added"
          : t("toast.addedExpense") || "Expense added"
      );
      resetVoiceSession();
      return true;
    },
    [createTransaction, resetVoiceSession, t, toast]
  );

  const handleEditSave = useCallback(
    async (payload: TransactionInput) => {
      if (!editTarget) return;
      const updates: TransactionUpdate = {
        amount: payload.amount,
        description: payload.description,
        categoryId: payload.categoryId,
        type: payload.type,
        date: payload.date,
      };
      const updated = await updateTransaction(editTarget.id, updates);
      if (!updated) {
        toast.error(t("toast.updateFailed") ?? "Unable to update transaction");
        return;
      }
      toast.success(t("toast.transactionUpdated") ?? "Transaction updated");
      setEditTarget(null);
    },
    [editTarget, t, toast, updateTransaction]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const ok = await deleteTransaction(deleteTarget.id);
    if (ok) {
      toast.success(t("toast.transactionDeleted") ?? "Transaction deleted");
    } else {
      toast.error(t("toast.deleteFailed") ?? "Unable to delete transaction");
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteTransaction, t, toast]);

  const handleCloseAddModal = useCallback(() => {
    homeUiStore.closeAddModal();
    resetVoiceSession();
  }, [resetVoiceSession]);

  const handleAIMicToggle = useCallback(() => {
    if (!isAIModeOn) {
      homeUiStore.openAudioForm();
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      homeUiStore.markTranscriptProcessed("");
      clearTranscript();
      startListening();
    }
  }, [clearTranscript, isAIModeOn, isListening, startListening, stopListening]);

  useEffect(() => {
    if (!isAIModeOn) {
      if (isListening) {
        cancelListening();
      }
      homeUiStore.markTranscriptProcessed("");
      clearTranscript();
      return;
    }
    if (!homeUiStore.isAudioFormOpen) return;
    homeUiStore.closeAudioForm();
    if (isListening) {
      stopListening();
      return;
    }
    homeUiStore.markTranscriptProcessed("");
    clearTranscript();
    startListening();
  }, [cancelListening, clearTranscript, isAIModeOn, isListening, startListening, stopListening, homeUiStore.isAudioFormOpen]);

  useEffect(() => {
    if (!isAIModeOn) return;
    if (voiceResettingRef.current) return;
    if (homeUiStore.isAddModalOpen) return;
    const trimmed = transcript.trim();
    if (!isListening && trimmed.length > 0 && !homeUiStore.isTranscriptProcessed(trimmed)) {
      homeUiStore.markTranscriptProcessed(trimmed);
      const currentRequestId = ++parseRequestIdRef.current;
      (async () => {
        const voiceParsed = await parseVoice(trimmed);
        if (currentRequestId !== parseRequestIdRef.current || voiceResettingRef.current) return;
        if (voiceParsed.amount > 0) {
          const transactionInput: TransactionInput = {
            amount: voiceParsed.amount,
            description: voiceParsed.note,
            type: voiceParsed.type,
            categoryId: voiceParsed.categoryId,
            date: new Date(),
          };
          if (ignoreVoiceVerify) {
            const saved = await createTransaction(transactionInput);
            if (currentRequestId !== parseRequestIdRef.current || voiceResettingRef.current) return;
            if (saved) {
              toast.success(
                transactionInput.type === "income"
                  ? t("toast.addedIncome") || "Income added"
                  : t("toast.addedExpense") || "Expense added"
              );
              resetVoiceSession();
            }
          } else {
            if (pendingVoiceConfirmOpenRef.current) {
              clearTimeout(pendingVoiceConfirmOpenRef.current);
            }
            // Delay opening the confirm modal slightly to avoid Android Modal-on-Modal transition glitches
            // (voice overlay closes right before this modal opens, causing first layout to render incorrectly).
            pendingVoiceConfirmOpenRef.current = setTimeout(() => {
              pendingVoiceConfirmOpenRef.current = null;
              if (currentRequestId !== parseRequestIdRef.current || voiceResettingRef.current) return;
              homeUiStore.openAddModal(transactionInput);
            }, 220);
          }
        } else {
          toast.error(t("toast.noAmountDetected") ?? "Amount not detected");
          resetVoiceSession();
        }
      })().catch(() => {
        if (currentRequestId !== parseRequestIdRef.current || voiceResettingRef.current) return;
        toast.error(t("toast.noAmountDetected") ?? "Amount not detected");
        resetVoiceSession();
      });
    }
  }, [
    createTransaction,
    ignoreVoiceVerify,
    isAIModeOn,
    isListening,
    parseVoice,
    resetVoiceSession,
    t,
    toast,
    transcript,
    homeUiStore.isAddModalOpen,
  ]);

  useEffect(() => {
    if (speechError) {
      toast.error(speechError);
    }
  }, [speechError, toast]);

  return (
    <ScreenView style={styles.container}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled
      >
        <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <View style={styles.balanceDecorLarge} />
          <View style={styles.balanceDecorSmall} />
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIcon}>
              <Ionicons name="wallet-outline" size={20} color="#fff" />
            </View>
            <ThemedText style={styles.balanceLabel}>
              {t("dashboard.currentBalance") ?? "Current balance"}
            </ThemedText>
          </View>
          <ThemedText style={styles.balanceValue}>
            {formatCurrency(allStats.balance, currency, localeCode)}
          </ThemedText>
          <View style={styles.balanceStatsRow}>
            <View style={styles.balanceStat}>
              <View style={styles.balanceStatIcon}>
                <Ionicons name="trending-up" size={14} color="#fff" />
              </View>
              <ThemedText style={styles.balanceStatLabel}>{t("dashboard.income") ?? "Income"}</ThemedText>
              <ThemedText style={styles.balanceStatValue}>
                +{formatCompactNumber(todayStats.totalIncome, language)}
              </ThemedText>
            </View>
            <View style={styles.balanceStat}>
              <View style={[styles.balanceStatIcon, styles.balanceStatIconSoft]}>
                <Ionicons name="trending-down" size={14} color="#fff" />
              </View>
              <ThemedText style={styles.balanceStatLabel}>{t("dashboard.expense") ?? "Expense"}</ThemedText>
              <ThemedText style={styles.balanceStatValue}>
                -{formatCompactNumber(todayStats.totalExpense, language)}
              </ThemedText>
            </View>
          </View>
        </View>

        {isAIModeOn ? (
          <AIVoiceInlineRecorder
            open={isListening}
            isListening={isListening}
            transcript={transcript}
            onToggle={handleAIMicToggle}
            onClose={resetVoiceSession}
          />
        ) : (
          <Pressable onPress={() => homeUiStore.openAudioForm()}>
            <View style={[styles.voiceCard, { backgroundColor: colors.primary }]}>
              <View style={styles.voiceIcon}>
                <Ionicons name="mic-off" size={22} color="#fff" />
              </View>
              <ThemedText style={styles.voiceTitle}>{t("voice.tapToSpeak") ?? "Tap to speak"}</ThemedText>
              <ThemedText style={styles.voiceSubtitle}>
                {t("voice.example") ?? "Example: \"Salary 20 million\" or \"Pho 50k\""}
              </ThemedText>
            </View>
          </Pressable>
        )}

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{t("dashboard.recentTransactions") ?? "Recent transactions"}</ThemedText>
          <Pressable onPress={() => router.push("/stats")}>
            <ThemedText tone="muted" style={styles.viewAll}>
              {t("transactions.viewAll") ?? "View all"}
            </ThemedText>
          </Pressable>
        </View>
        <Card style={styles.recentCard}>
          <Pressable style={[styles.filterButton, { borderColor: colors.border }]} onPress={() => setCategorySheetOpen(true)}>
            <View style={styles.filterLabel}>
              <CategoryIcon
                icon={selectedCategoryData.icon}
                color={selectedCategoryData.color}
                size="sm"
                style={styles.filterIcon}
              />
              <ThemedText style={styles.filterButtonText}>{selectedCategoryData.name}</ThemedText>
            </View>
            <Ionicons name="chevron-down" size={16} color={colors.mutedText} />
          </Pressable>
          {recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.border }]} />
              <ThemedText tone="muted" style={styles.emptyTitle}>
                {t("dashboard.noTransactionsTitle") ?? "No transactions yet"}
              </ThemedText>
              <ThemedText tone="muted" style={styles.emptySubtitle}>
                {t("dashboard.noTransactionsSubtitle") ?? "Start adding your expenses!"}
              </ThemedText>
            </View>
          ) : (
            <HomeTransactionList
              transactions={recentTransactions}
              onDetail={(item) => setDetailTarget(item)}
              onEdit={(item) => setEditTarget(item)}
              onDelete={(item) => setDeleteTarget(item)}
            />
          )}
        </Card>
      </ScrollView>

      <Pressable style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => homeUiStore.openAddModal()}>
        <Ionicons name="add" size={24} color={colors.background} />
      </Pressable>

      <AddTransactionModal
        visible={homeUiStore.isAddModalOpen}
        onClose={handleCloseAddModal}
        onSubmit={handleAddTransaction}
        initial={homeUiStore.voiceTransactionData ?? undefined}
      />
      <EditTransactionModal
        visible={Boolean(editTarget)}
        transaction={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEditSave}
      />
      <TransactionDetailModal
        visible={Boolean(detailTarget)}
        transaction={detailTarget}
        onClose={() => setDetailTarget(null)}
      />
      {!isAIModeOn ? (
        <VoiceInputStepsForm
          open={homeUiStore.isAudioFormOpen}
          onClose={() => homeUiStore.closeAudioForm()}
          onSubmit={handleAudioFormSubmit}
        />
      ) : null}

      <Modal
        visible={Boolean(deleteTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <Pressable style={styles.confirmBackdrop} onPress={() => setDeleteTarget(null)}>
          <Pressable style={[styles.confirmCard, { backgroundColor: colors.card }]} onPress={() => undefined}>
            <ThemedText style={styles.confirmTitle}>
              {t("transactions.deleteTitle") ?? "Delete transaction?"}
            </ThemedText>
            <ThemedText tone="muted">
              {t("transactions.deleteMessage") ?? "This action cannot be undone."}
            </ThemedText>
            <View style={styles.confirmActions}>
              <Button title={t("common.cancel") ?? "Cancel"} variant="outline" onPress={() => setDeleteTarget(null)} />
              <Button title={t("common.delete") ?? "Delete"} onPress={handleDeleteConfirm} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={categorySheetOpen} animationType="slide" onRequestClose={() => setCategorySheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setCategorySheetOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card }]}>
            <ThemedText style={styles.sheetTitle}>{t("transactions.filterCategory") ?? "Category"}</ThemedText>
            <View style={styles.sheetOptions}>
              <Pressable
                style={[styles.sheetOption, { borderColor: selectedCategory === "all" ? colors.primary : colors.border }]}
                onPress={() => {
                  setSelectedCategory("all");
                  setCategorySheetOpen(false);
                }}
              >
                <View style={styles.sheetOptionLabel}>
                  <CategoryIcon icon="Coins" color="category-other" size="sm" style={styles.sheetIcon} />
                  <ThemedText style={styles.sheetOptionText}>{t("common.allCategories") ?? "All categories"}</ThemedText>
                </View>
                {selectedCategory === "all" ? <Ionicons name="checkmark" size={16} color={colors.primary} /> : null}
              </Pressable>
              {categoryStore.categories.map((cat) => {
                const selected = cat.id === selectedCategory;
                return (
                  <Pressable
                    key={cat.id}
                    style={[styles.sheetOption, { borderColor: selected ? colors.primary : colors.border }]}
                    onPress={() => {
                      setSelectedCategory(cat.id);
                      setCategorySheetOpen(false);
                    }}
                  >
                    <View style={styles.sheetOptionLabel}>
                      <CategoryIcon
                        icon={cat.icon || "MoreHorizontal"}
                        color={cat.color || "category-other"}
                        size="sm"
                        style={styles.sheetIcon}
                      />
                      <ThemedText style={styles.sheetOptionText}>{cat.name}</ThemedText>
                    </View>
                    {selected ? <Ionicons name="checkmark" size={16} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </View>
            <Button title={t("common.close") ?? "Close"} variant="outline" onPress={() => setCategorySheetOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 32,
    paddingBottom: 200,
    gap: 18,
    flexGrow: 1,
  },
  balanceCard: {
    borderRadius: 24,
    padding: 18,
    overflow: "hidden",
  },
  balanceDecorLarge: {
    position: "absolute",
    right: -20,
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  balanceDecorSmall: {
    position: "absolute",
    right: 10,
    top: 50,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  balanceIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
  },
  balanceValue: {
    marginTop: 12,
    marginBottom: 16,
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
  },
  balanceStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  balanceStat: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  balanceStatIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "rgba(34,197,94,0.8)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  balanceStatIconSoft: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  balanceStatLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
  },
  balanceStatValue: {
    color: "#fff",
    fontWeight: "700",
    marginTop: 2,
  },
  voiceCard: {
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  voiceIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  voiceHeader: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  voiceBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceHeaderText: {
    flex: 1,
  },
  voiceSubtitle: {
    fontSize: 12,
    marginTop: 2,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  voiceInput: {
    marginTop: 6,
  },
  voiceActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  voiceFootnote: {
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  viewAll: {
    fontSize: 12,
    fontWeight: "600",
  },
  recentCard: {
    paddingVertical: 12,
    gap: 12,
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  filterIcon: {
    shadowOpacity: 0,
    elevation: 0,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 6,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.25,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 32,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sheetOptions: {
    gap: 8,
  },
  sheetOption: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetOptionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  sheetIcon: {
    shadowOpacity: 0,
    elevation: 0,
  },
  sheetOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 8,
  },
});
