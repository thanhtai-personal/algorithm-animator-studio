import React, { useMemo, useRef, useState } from "react";
import { Alert, Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
import type { TransactionInput } from "@/features/transactions/types";
import { ThemedText } from "@/components/ThemedText";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/themeProvider";
import { formatCurrency } from "@/lib/currency";
import { categoryStore } from "@/store/categoryStore";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import {
  DEFAULT_CATEGORY_IDS,
  CUSTOM_CATEGORY_COLOR,
  CUSTOM_CATEGORY_ICON,
} from "@/features/categories/constants";
import type { CategoryInput, CategoryRow } from "@/features/categories/types";
import { CategoryModal } from "@/features/categories/components/CategoryModal";
import { useToast } from "@/hooks/use-toast";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: TransactionInput) => boolean | void | Promise<boolean | void>;
  initial?: TransactionInput | null;
  submitLabel?: string;
  title?: string;
};

const DEFAULT_CATEGORY_ID_SET = new Set(Object.values(DEFAULT_CATEGORY_IDS));

export const AddTransactionModal = observer(function AddTransactionModal({
  visible,
  onClose,
  onSubmit,
  initial,
  submitLabel,
  title,
}: Props) {
  const { t, currency, localeCode } = useI18n();
  const { colors } = useTheme();
  const { toast } = useToast();
  const categories = categoryStore.categories;
  const [type, setType] = useState<TransactionInput["type"]>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(() => categories[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const hasInitializedRef = useRef(false);
  const formTranslateY = useRef(new Animated.Value(0)).current;
  const keypadTranslateY = useRef(new Animated.Value(0)).current;
  const formTint = type === "expense" ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)";
  const categoryIdsKey = categories.map((cat) => cat.id).join("|");
  const hasSelectedCategory = Boolean(selectedCategory && categories.some((cat) => cat.id === selectedCategory));

  React.useEffect(() => {
    if (!visible) {
      hasInitializedRef.current = false;
      setCategoryModalOpen(false);
      setEditingCategory(null);
      setKeypadOpen(false);
      return;
    }
    if (hasInitializedRef.current) return;
    const fallbackCategory = categories[0]?.id ?? "";
    const initialCategory =
      initial?.categoryId && categories.some((cat) => cat.id === initial.categoryId)
        ? initial.categoryId
        : fallbackCategory;
    setType(initial?.type ?? "expense");
    setAmount(initial?.amount ? String(initial.amount) : "");
    setDescription(initial?.description ?? "");
    setSelectedCategory(initialCategory);
    setCategoryModalOpen(false);
    setEditingCategory(null);
    hasInitializedRef.current = true;
  }, [visible, initial, categoryIdsKey, categories]);

  React.useEffect(() => {
    if (!visible) return;
    if (!categories.length) {
      if (selectedCategory) {
        setSelectedCategory("");
      }
      return;
    }
    if (selectedCategory && categories.some((cat) => cat.id === selectedCategory)) return;
    setSelectedCategory(categories[0]?.id ?? "");
  }, [visible, categoryIdsKey, selectedCategory, categories]);

  React.useEffect(() => {
    if (!visible) {
      formTranslateY.setValue(0);
    }
  }, [visible, formTranslateY]);

  React.useEffect(() => {
    if (!keypadOpen) {
      keypadTranslateY.setValue(0);
    }
  }, [keypadOpen, keypadTranslateY]);

  const quickAmounts = useMemo(() => [50000, 100000, 200000, 500000], []);
  const parsedAmount = Number(String(amount).replace(/[^\d]/g, "")) || 0;
  const canSubmit = parsedAmount > 0 && hasSelectedCategory;
  const isVnd = currency?.toUpperCase() === "VND";
  const amountDisplay = isVnd
    ? (parsedAmount ? formatCurrency(parsedAmount, currency, localeCode) : "")
    : amount;

  const keypadPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            keypadTranslateY.setValue(gesture.dy);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          const shouldClose = gesture.dy > 120 || gesture.vy > 1.1;
          if (shouldClose) {
            Animated.timing(keypadTranslateY, {
              toValue: 320,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              keypadTranslateY.setValue(0);
              setKeypadOpen(false);
            });
          } else {
            Animated.spring(keypadTranslateY, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(keypadTranslateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [keypadTranslateY]
  );

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (category: CategoryRow) => {
    if (DEFAULT_CATEGORY_ID_SET.has(category.id as any)) return;
    setEditingCategory(category);
    setCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = (input: CategoryInput) => {
    if (editingCategory) {
      categoryStore.upsert({
        ...editingCategory,
        name: input.name,
        icon: input.icon ?? editingCategory.icon ?? null,
        color: input.color ?? editingCategory.color ?? null,
      });
      setSelectedCategory(editingCategory.id);
    } else {
      const id =
        typeof globalThis.crypto?.randomUUID === "function"
          ? globalThis.crypto.randomUUID()
          : `cat_${Date.now()}`;
      categoryStore.upsert({
        id,
        user_id: null,
        anon_key: null,
        name: input.name,
        icon: input.icon ?? null,
        color: input.color ?? null,
        created_at: new Date().toISOString(),
      });
      setSelectedCategory(id);
    }
    handleCloseCategoryModal();
  };

  const handleDeleteCategory = (category: CategoryRow) => {
    if (DEFAULT_CATEGORY_ID_SET.has(category.id as any)) return;
    Alert.alert(
      t("categories.deleteTitle") ?? "Delete category?",
      t("categories.deleteMessage") ?? "This custom category will be permanently removed.",
      [
        { text: t("common.cancel") ?? "Cancel", style: "cancel" },
        {
          text: t("categories.deleteAction") ?? "Delete",
          style: "destructive",
          onPress: () => {
            categoryStore.remove(category.id);
            if (editingCategory?.id === category.id) {
              handleCloseCategoryModal();
            }
            if (selectedCategory === category.id) {
              setSelectedCategory(categoryStore.categories[0]?.id ?? "");
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (parsedAmount <= 0) {
      toast.error(t("common.amountRequired") ?? "Amount is required");
      return;
    }
    if (!hasSelectedCategory) {
      toast.error(t("common.categoryRequired") ?? "Category is required");
      return;
    }
    setSubmitting(true);
    try {
      const result = await onSubmit({
        amount: parsedAmount,
        description,
        type,
        categoryId: selectedCategory,
        date: initial?.date ?? new Date(),
      });
      if (result === false) return;
      setAmount("");
      setDescription("");
      setType("expense");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropFill} onPress={onClose} />
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: colors.background, transform: [{ translateY: formTranslateY }] },
            ]}
          >
            <View style={styles.header}>
              <ThemedText style={styles.title}>
                {title ?? t("addTransaction.title") ?? "Add transaction"}
              </ThemedText>
              <Pressable style={[styles.closeButton, { borderColor: colors.border }]} onPress={onClose}>
                <Ionicons name="close" size={16} color={colors.mutedText} />
              </Pressable>
            </View>

            <View style={[styles.typeToggle, { backgroundColor: colors.card }]}>
              <Pressable
                style={[
                  styles.typeButton,
                  type === "expense" && { backgroundColor: colors.primary },
                ]}
                onPress={() => setType("expense")}
              >
                <ThemedText style={[styles.typeText, type === "expense" && styles.typeTextActive]}>
                  {t("common.expense") ?? "Expense"}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.typeButton,
                  type === "income" && { backgroundColor: colors.primary },
                ]}
                onPress={() => setType("income")}
              >
                <ThemedText style={[styles.typeText, type === "income" && styles.typeTextActive]}>
                  {t("common.income") ?? "Income"}
                </ThemedText>
              </Pressable>
            </View>

            <View style={[styles.formSurface, { backgroundColor: formTint }]}>
              <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                style={styles.formScroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                keyboardDismissMode="on-drag"
                scrollEventThrottle={16}
              >
                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>{t("common.amount") ?? "Amount"}</ThemedText>
                  <Pressable onPress={() => isVnd && setKeypadOpen(true)}>
                    <TextField
                      value={amountDisplay}
                      onChangeText={setAmount}
                      keyboardType="numeric"
                      placeholder={t("addTransaction.amountTitle") ?? "Enter amount"}
                      showSoftInputOnFocus={!isVnd}
                      editable={!isVnd}
                      style={[styles.amountInput, { borderColor: colors.border, color: colors.text }]}
                    />
                  </Pressable>
                  <View style={styles.quickRow}>
                    {quickAmounts.map((value) => (
                      <Pressable
                        key={value}
                        style={[styles.quickChip, { borderColor: colors.border }]}
                        onPress={() => setAmount(String(value))}
                      >
                        <ThemedText style={styles.quickText}>
                          {formatCurrency(value, currency, localeCode)}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>{t("common.descriptionOptional") ?? "Description"}</ThemedText>
                  <TextField
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t("common.descriptionPlaceholder") ?? "Add a note..."}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    style={[styles.descriptionInput, { borderColor: colors.border }]}
                  />
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>{t("common.category") ?? "Category"}</ThemedText>
                    <View style={styles.sectionActions}>
                      {selectedCategory
                        ? (() => {
                            const currentCategory = categoryStore.categoryMap[selectedCategory];
                            if (!currentCategory || DEFAULT_CATEGORY_ID_SET.has(currentCategory.id as any)) return null;
                            return (
                              <Pressable onPress={() => handleOpenEditCategory(currentCategory)}>
                                <ThemedText tone="muted" style={styles.addCategoryText}>
                                  {t("common.edit") ?? "Edit"}
                                </ThemedText>
                              </Pressable>
                            );
                          })()
                        : null}
                      <Pressable onPress={handleOpenAddCategory}>
                        <ThemedText tone="muted" style={styles.addCategoryText}>
                          {t("categories.addAction") ?? "Add category"}
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.categoryGrid}>
                    {categories.map((cat) => {
                      const selected = cat.id === selectedCategory;
                      const isDefault = DEFAULT_CATEGORY_ID_SET.has(cat.id as any);
                      return (
                        <Pressable
                          key={cat.id}
                          style={[
                            styles.categoryItem,
                            { borderColor: selected ? colors.primary : colors.border },
                            selected && { backgroundColor: colors.card },
                          ]}
                          onPress={() => setSelectedCategory(cat.id)}
                          onLongPress={() => handleOpenEditCategory(cat)}
                        >
                          <CategoryIcon
                            icon={cat.icon || CUSTOM_CATEGORY_ICON}
                            color={cat.color || CUSTOM_CATEGORY_COLOR}
                            size="sm"
                          />
                          <ThemedText style={styles.categoryText}>{cat.name}</ThemedText>
                          {selected ? (
                            <View style={[styles.categoryCheck, { backgroundColor: colors.primary }]}>
                              <Ionicons name="checkmark" size={12} color="#fff" />
                            </View>
                          ) : null}
                          {!isDefault ? (
                            <Pressable
                              style={[styles.categoryDelete, { backgroundColor: colors.background, borderColor: colors.border }]}
                              onPress={(event) => {
                                event.stopPropagation();
                                handleDeleteCategory(cat);
                              }}
                            >
                              <Ionicons name="close" size={10} color={colors.mutedText} />
                            </Pressable>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>

                </View>
              </ScrollView>

              <View style={[styles.footer, { borderColor: colors.border }]}>
                <Button
                  title={submitLabel ?? t("common.done") ?? "Done"}
                  onPress={handleSubmit}
                  loading={submitting}
                  disabled={!canSubmit || submitting}
                  style={[styles.doneButton, (!canSubmit || submitting) && styles.doneButtonDisabled]}
                />
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
      <Modal transparent visible={keypadOpen && isVnd} animationType="slide" onRequestClose={() => setKeypadOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setKeypadOpen(false)}>
          <Animated.View
            style={[
              styles.keypadSheet,
              { backgroundColor: colors.card, transform: [{ translateY: keypadTranslateY }] },
            ]}
            {...keypadPanResponder.panHandlers}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.keypadHeader}>
              <ThemedText style={styles.keypadTitle}>{t("common.amount") ?? "Amount"}</ThemedText>
              <Pressable style={[styles.closeButton, { borderColor: colors.border }]} onPress={() => setKeypadOpen(false)}>
                <Ionicons name="close" size={16} color={colors.mutedText} />
              </Pressable>
            </View>
            <View style={styles.keypadDisplay}>
              <ThemedText style={styles.keypadAmount}>
                {parsedAmount ? formatCurrency(parsedAmount, currency, localeCode) : "0"}
              </ThemedText>
            </View>
            <View style={styles.keypadGrid}>
            {["1","2","3","4","5","6","7","8","9","000","0","back"].map((key) => {
              if (key === "") {
                return <View key="spacer" style={styles.keypadButton} />;
              }
              if (key === "back") {
                return (
                    <Pressable
                      key="back"
                      style={[styles.keypadButton, styles.keypadAction]}
                      onPress={() => setAmount((prev) => prev.slice(0, -1))}
                    >
                      <Ionicons name="backspace" size={20} color={colors.text} />
                    </Pressable>
                  );
              }
              return (
                <Pressable
                  key={key}
                  style={styles.keypadButton}
                  onPress={() => setAmount((prev) => `${prev}${key}`)}
                >
                  <ThemedText style={styles.keypadButtonText}>{key}</ThemedText>
                </Pressable>
              );
            })}
            </View>
            <View style={styles.keypadFooter}>
              <Button title={t("common.clear") ?? "Clear"} variant="ghost" onPress={() => setAmount("")} />
              <Button title={t("common.done") ?? "Done"} onPress={() => setKeypadOpen(false)} style={styles.doneButton} />
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
      <CategoryModal
        visible={categoryModalOpen}
        initial={editingCategory}
        onClose={handleCloseCategoryModal}
        onSubmit={handleSaveCategory}
      />
    </>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    height: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    minHeight: 0,
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
  typeToggle: {
    marginHorizontal: 18,
    borderRadius: 14,
    padding: 4,
    flexDirection: "row",
    gap: 6,
  },
  formSurface: {
    marginTop: 12,
    marginHorizontal: 18,
    borderRadius: 20,
    overflow: "hidden",
    flex: 1,
    minHeight: 0,
  },
  formScroll: {
    flex: 1,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  typeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  typeTextActive: {
    color: "#fff",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  amountInput: {
    fontSize: 22,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickText: {
    fontSize: 12,
    fontWeight: "600",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  categoryItem: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 10,
    flexBasis: "22%",
    maxWidth: "22%",
    alignItems: "center",
    gap: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
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
  categoryDelete: {
    position: "absolute",
    top: -6,
    left: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  addCategoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 90,
  },
  footer: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  keypadSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    gap: 12,
  },
  keypadHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  keypadTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  keypadDisplay: {
    alignItems: "center",
    paddingVertical: 8,
  },
  keypadAmount: {
    fontSize: 22,
    fontWeight: "700",
  },
  keypadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  keypadButton: {
    width: "30%",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  keypadButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
  keypadAction: {
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  keypadFooter: {
    flexDirection: "row",
    gap: 14,
    justifyContent: "flex-end",
  },
  doneButton: {
    paddingHorizontal: 20,
  },
  doneButtonDisabled: {
    opacity: 0.55,
  },
});
