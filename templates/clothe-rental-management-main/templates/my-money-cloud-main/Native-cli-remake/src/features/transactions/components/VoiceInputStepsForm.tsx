import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/themeProvider";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { categoryStore } from "@/store/categoryStore";
import type { TransactionInput } from "@/features/transactions/types";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useVoiceInput } from "@/lib/voice/useVoiceInput";

type StepKey = "type" | "amount" | "category" | "notes" | "review";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (transaction: TransactionInput) => Promise<boolean>;
};

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];
const STEP_ORDER: StepKey[] = ["type", "amount", "category", "notes", "review"];

export function VoiceInputStepsForm({ open, onClose, onSubmit }: Props) {
  const { t, localeCode, currency, audioLanguage } = useI18n();
  const { colors } = useTheme();
  const { toast } = useToast();
  const categories = categoryStore.categories;
  const categoryMap = categoryStore.categoryMap;
  const currencySymbol = useMemo(() => getCurrencySymbol(currency, localeCode), [currency, localeCode]);
  const isVnd = currency?.toUpperCase() === "VND";

  const [stepIndex, setStepIndex] = useState(0);
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const formTint = transactionType === "expense" ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)";

  const step = STEP_ORDER[stepIndex];
  const selectedCategoryData = selectedCategory ? categoryMap[selectedCategory] : undefined;

  const resetForm = useCallback(() => {
    setStepIndex(0);
    setTransactionType("expense");
    setAmount("");
    setSelectedCategory("");
    setNotes("");
  }, []);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => resetForm(), 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open, resetForm]);

  const handleNext = useCallback(() => {
    if (step === "amount") {
      const parsed = Number(amount.replace(/[^\d]/g, ""));
      if (!parsed) {
        toast.error(t("common.amountRequired") ?? "Amount is required");
        return;
      }
    }
    if (step === "category" && !selectedCategory) {
      toast.error(t("common.categoryRequired") ?? "Category is required");
      return;
    }
    setStepIndex((prev) => Math.min(prev + 1, STEP_ORDER.length - 1));
  }, [amount, selectedCategory, step, t, toast]);

  const handlePrevious = useCallback(() => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!amount || !selectedCategory) {
      toast.error(t("common.requiredFields") ?? "Required fields missing");
      return;
    }
    setSubmitting(true);
    const payload: TransactionInput = {
      amount: Number(amount.replace(/[^\d]/g, "")),
      description: notes || (selectedCategoryData?.name ?? ""),
      categoryId: selectedCategory,
      type: transactionType,
      date: new Date(),
    };
    const ok = await onSubmit(payload);
    setSubmitting(false);
    if (ok) {
      onClose();
    }
  }, [amount, notes, onClose, onSubmit, selectedCategory, selectedCategoryData, t, toast, transactionType]);

  const handleAmountChange = useCallback((value: string) => {
    setAmount(value.replace(/\D/g, ""));
  }, []);

  const amountDisplay = amount ? Number(amount).toLocaleString(localeCode) : "0";

  const { isListening, listeningField, transcript, setTranscript, startListening, stopListening } = useVoiceInput({
    audioLanguage,
    onAmount: (value) => {
      setAmount(value);
      setTranscript("");
    },
    onNotes: (value) => {
      setNotes(value);
      setTranscript("");
    },
    toast: (message, variant) => {
      if (variant === "error") toast.error(message);
      else toast(message);
    },
    messages: {
      unsupported: t("toast.voiceUnsupported") ?? "Voice input not supported",
      ready: t("toast.voiceReady") ?? "Listening...",
      denied: t("addTransaction.micPermissionDenied") ?? "Microphone permission denied",
      noAmount: t("toast.voiceNoAmount") ?? "Could not recognize amount",
      noText: t("toast.voiceNoText") ?? "Could not recognize text",
      captured: t("toast.voiceCaptured") ?? "Voice captured",
    },
  });

  const stepTitle = useMemo(() => {
    switch (step) {
      case "type":
        return t("addTransaction.typeStep") ?? "Choose type";
      case "amount":
        return t("addTransaction.amountStep") ?? "Enter amount";
      case "category":
        return t("addTransaction.categoryStep") ?? "Choose category";
      case "notes":
        return t("addTransaction.notesStep") ?? "Add notes";
      case "review":
        return t("addTransaction.reviewStep") ?? "Review";
      default:
        return "";
    }
  }, [step, t]);

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <ScreenView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerSide}>
              {stepIndex > 0 ? (
                <Pressable style={[styles.iconButton, { borderColor: colors.border }]} onPress={handlePrevious}>
                  <Ionicons name="chevron-back" size={18} color={colors.text} />
                </Pressable>
              ) : null}
            </View>
            <View style={styles.headerCenter}>
              <ThemedText tone="muted" style={styles.stepCount}>
                {stepIndex + 1}/{STEP_ORDER.length}
              </ThemedText>
              <ThemedText style={styles.headerTitle}>{stepTitle}</ThemedText>
            </View>
            <View style={styles.headerSide}>
              <Pressable style={[styles.iconButton, { borderColor: colors.border }]} onPress={onClose}>
                <Ionicons name="close" size={16} color={colors.mutedText} />
              </Pressable>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${((stepIndex + 1) / STEP_ORDER.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formSurface, { backgroundColor: formTint }]}>
            {step === "type" ? (
              <View style={styles.section}>
              <ThemedText tone="muted" style={styles.typeDescription}>
                {t("addTransaction.selectTypeDescription") ?? "Choose expense or income"}
              </ThemedText>
              <View style={styles.typeGrid}>
                {(["expense", "income"] as const).map((type) => {
                  const isActive = transactionType === type;
                  const isExpense = type === "expense";
                  return (
                    <Pressable
                      key={type}
                      style={[
                        styles.typeCard,
                        { borderColor: isActive ? "transparent" : colors.border },
                        isActive
                          ? isExpense
                            ? styles.typeCardExpense
                            : styles.typeCardIncome
                          : { backgroundColor: colors.card },
                      ]}
                      onPress={() => setTransactionType(type)}
                    >
                      <View
                        style={[
                          styles.typeIcon,
                          isActive
                            ? styles.typeIconActive
                            : isExpense
                              ? styles.typeIconExpense
                              : styles.typeIconIncome,
                        ]}
                      >
                        <Ionicons
                          name={isExpense ? "arrow-down" : "arrow-up"}
                          size={24}
                          color={isActive ? "#fff" : isExpense ? "#ef4444" : "#22c55e"}
                        />
                      </View>
                      <ThemedText style={[styles.typeTitle, isActive && styles.typeTitleActive]}>
                        {t(isExpense ? "common.expense" : "common.income") ?? (isExpense ? "Expense" : "Income")}
                      </ThemedText>
                      <ThemedText tone="muted" style={[styles.typeSubtitle, isActive && styles.typeSubtitleActive]}>
                        {t(isExpense ? "addTransaction.expenseDescription" : "addTransaction.incomeDescription")}
                      </ThemedText>
                      {isActive ? (
                        <View style={styles.typeCheck}>
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
            ) : null}

            {step === "amount" ? (
              <View style={styles.section}>
              <Pressable
                style={[styles.voiceButton, { backgroundColor: colors.primary }]}
                onPress={() => startListening("amount")}
                onLongPress={() => startListening("amount")}
              >
                <Ionicons name="mic" size={18} color="#fff" />
                <ThemedText style={styles.voiceButtonText}>
                  {isListening && listeningField === "amount"
                    ? t("addTransaction.listening") ?? "Listening..."
                    : t("addTransaction.tapToSpeak") ?? "Tap to speak amount"}
                </ThemedText>
              </Pressable>
              {transcript && isListening && listeningField === "amount" ? (
                <ThemedText tone="muted" style={styles.liveTranscript}>
                  {transcript}
                </ThemedText>
              ) : null}

              <View style={styles.amountDisplay}>
                <ThemedText tone="muted" style={styles.amountLabel}>
                  {t("common.amount") ?? "Amount"}
                </ThemedText>
                <View style={styles.amountRow}>
                  <TextField
                    value={amountDisplay}
                    onChangeText={handleAmountChange}
                    placeholder="0"
                    keyboardType="numeric"
                    editable={!isVnd}
                    showSoftInputOnFocus={!isVnd}
                    style={styles.amountInput}
                  />
                  <ThemedText style={styles.currencySymbol}>{currencySymbol}</ThemedText>
                </View>
              </View>

              <View style={styles.quickRow}>
                {QUICK_AMOUNTS.map((value) => (
                  <Pressable
                    key={value}
                    style={[styles.quickButton, { backgroundColor: colors.card }]}
                    onPress={() => setAmount(value.toString())}
                  >
                    <ThemedText style={styles.quickText}>
                      {(value / 1000).toLocaleString(localeCode)}k
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              {isVnd ? (
                <View style={styles.keypadGrid}>
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"].map((key) => {
                    if (key === "back") {
                      return (
                        <Pressable
                          key="back"
                          style={[styles.keypadButton, styles.keypadAction, { borderColor: colors.border }]}
                          onPress={() => setAmount((prev) => prev.slice(0, -1))}
                        >
                          <Ionicons name="backspace" size={20} color={colors.text} />
                        </Pressable>
                      );
                    }
                    return (
                      <Pressable
                        key={key}
                        style={[styles.keypadButton, { backgroundColor: colors.primary }]}
                        onPress={() => setAmount((prev) => `${prev}${key}`)}
                      >
                        <ThemedText style={styles.keypadButtonText}>{key}</ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
            ) : null}

            {step === "category" ? (
              <View style={styles.section}>
              <ThemedText tone="muted" style={styles.sectionLabel}>
                {t("common.selectCategory") ?? "Select category"}
              </ThemedText>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => {
                  const selected = cat.id === selectedCategory;
                  return (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.categoryItem,
                        { borderColor: selected ? colors.primary : colors.border },
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <CategoryIcon icon={cat.icon || "MoreHorizontal"} color={cat.color || "category-other"} size="sm" />
                      <ThemedText style={styles.categoryText}>{cat.name}</ThemedText>
                      {selected ? (
                        <View style={[styles.categoryCheck, { backgroundColor: colors.primary }]}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
            ) : null}

            {step === "notes" ? (
              <View style={styles.section}>
              <Pressable
                style={[styles.voiceButton, { backgroundColor: colors.primary }]}
                onPress={() => startListening("notes")}
                onLongPress={() => startListening("notes")}
              >
                <Ionicons name="mic" size={18} color="#fff" />
                <ThemedText style={styles.voiceButtonText}>
                  {isListening && listeningField === "notes"
                    ? t("addTransaction.listening") ?? "Listening..."
                    : t("addTransaction.tapToSpeakNote") ?? "Tap to speak notes"}
                </ThemedText>
              </Pressable>
              {transcript && isListening && listeningField === "notes" ? (
                <ThemedText tone="muted" style={styles.liveTranscript}>
                  {transcript}
                </ThemedText>
              ) : null}
              <ThemedText tone="muted" style={styles.sectionLabel}>
                {t("common.descriptionOptional") ?? "Notes"}
              </ThemedText>
              <TextField
                value={notes}
                onChangeText={setNotes}
                placeholder={t("common.descriptionPlaceholder") ?? "Add a note..."}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={styles.notesInput}
              />
            </View>
            ) : null}

            {step === "review" ? (
              <View style={styles.section}>
              <View style={[styles.reviewCard, { backgroundColor: colors.card }]}>
                <View style={styles.reviewRow}>
                  <ThemedText tone="muted">{t("common.type") ?? "Type"}</ThemedText>
                  <View
                    style={[
                      styles.reviewBadge,
                      transactionType === "expense" ? styles.reviewExpense : styles.reviewIncome,
                    ]}
                  >
                    <Ionicons
                      name={transactionType === "expense" ? "arrow-down" : "arrow-up"}
                      size={14}
                      color={transactionType === "expense" ? "#ef4444" : "#22c55e"}
                    />
                    <ThemedText style={styles.reviewBadgeText}>
                      {t(transactionType === "expense" ? "common.expense" : "common.income") ?? transactionType}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.reviewRow}>
                  <ThemedText tone="muted">{t("common.amount") ?? "Amount"}</ThemedText>
                  <ThemedText style={styles.reviewAmount}>
                    {amount ? formatCurrency(Number(amount), currency, localeCode) : "-"}
                  </ThemedText>
                </View>
                <View style={styles.reviewRow}>
                  <ThemedText tone="muted">{t("common.category") ?? "Category"}</ThemedText>
                  <ThemedText style={styles.reviewValue}>{selectedCategoryData?.name ?? "-"}</ThemedText>
                </View>
                {notes ? (
                  <View style={styles.reviewRow}>
                    <ThemedText tone="muted">{t("common.notes") ?? "Notes"}</ThemedText>
                    <ThemedText style={styles.reviewValue}>{notes}</ThemedText>
                  </View>
                ) : null}
              </View>
              <ThemedText tone="muted" style={styles.reviewHint}>
                {t("addTransaction.confirmMessage") ?? "Confirm transaction?"}
              </ThemedText>
            </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderColor: colors.border }]}>
          {stepIndex > 0 ? (
            <Button
              title={t("common.back") ?? "Back"}
              variant="outline"
              onPress={handlePrevious}
              style={styles.backButton}
            />
          ) : null}
          {step !== "review" ? (
            <Button title={t("common.next") ?? "Next"} onPress={handleNext} style={styles.footerPrimary} />
          ) : (
            <Button
              title={submitting ? t("common.loading") ?? "Loading" : t("common.done") ?? "Done"}
              onPress={handleSubmit}
              disabled={submitting}
              style={styles.footerPrimary}
            />
          )}
        </View>
      </ScreenView>
      <Modal visible={isListening} transparent animationType="fade" onRequestClose={stopListening}>
        <Pressable style={styles.transcriptBackdrop} onPress={stopListening}>
          <Pressable style={[styles.transcriptCard, { backgroundColor: colors.card }]} onPress={() => undefined}>
            <View style={styles.transcriptHeader}>
              <View style={[styles.transcriptIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="mic" size={18} color="#fff" />
              </View>
              <ThemedText style={styles.transcriptTitle}>
                {t("addTransaction.listening") ?? "Listening..."}
              </ThemedText>
            </View>
            <ThemedText tone="muted" style={styles.transcriptText}>
              {transcript || t("voice.listeningHint") || "Say a transaction, e.g., \"Pho 50k\""}
            </ThemedText>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerSide: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  stepCount: {
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  formSurface: {
    borderRadius: 20,
    padding: 16,
  },
  section: {
    gap: 16,
  },
  typeDescription: {
    textAlign: "center",
  },
  typeGrid: {
    flexDirection: "row",
    gap: 12,
  },
  typeCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  typeCardExpense: {
    backgroundColor: "#ef4444",
  },
  typeCardIncome: {
    backgroundColor: "#22c55e",
  },
  typeIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  typeIconActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  typeIconExpense: {
    backgroundColor: "rgba(239,68,68,0.15)",
  },
  typeIconIncome: {
    backgroundColor: "rgba(34,197,94,0.15)",
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  typeTitleActive: {
    color: "#fff",
  },
  typeSubtitle: {
    fontSize: 12,
    textAlign: "center",
  },
  typeSubtitleActive: {
    color: "rgba(255,255,255,0.85)",
  },
  typeCheck: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
  },
  voiceButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  liveTranscript: {
    textAlign: "center",
    fontSize: 13,
  },
  amountDisplay: {
    alignItems: "center",
    gap: 8,
  },
  amountLabel: {
    fontSize: 12,
  },
  amountRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  amountInput: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: "700",
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "700",
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  quickButton: {
    flexBasis: "23%",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  quickText: {
    fontSize: 13,
    fontWeight: "600",
  },
  keypadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  keypadButton: {
    width: "30%",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  keypadButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  keypadAction: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  sectionLabel: {
    fontSize: 12,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  categoryItem: {
    width: "23%",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  categoryText: {
    fontSize: 11,
    textAlign: "center",
  },
  categoryCheck: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  notesInput: {
    minHeight: 100,
  },
  reviewCard: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  reviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  reviewExpense: {
    backgroundColor: "rgba(239,68,68,0.15)",
  },
  reviewIncome: {
    backgroundColor: "rgba(34,197,94,0.15)",
  },
  reviewBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  reviewAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  reviewHint: {
    textAlign: "center",
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
  },
  footerPrimary: {
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 20,
  },
  transcriptBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  transcriptCard: {
    width: "100%",
    maxWidth: 420,
    padding: 20,
    borderRadius: 18,
    gap: 12,
    alignItems: "center",
  },
  transcriptHeader: {
    alignItems: "center",
    gap: 10,
  },
  transcriptIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  transcriptText: {
    textAlign: "center",
    fontSize: 14,
  },
});
