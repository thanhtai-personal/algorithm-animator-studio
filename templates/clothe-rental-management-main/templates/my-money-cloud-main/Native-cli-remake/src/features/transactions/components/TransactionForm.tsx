import React, { useMemo, useRef } from "react";
import { Animated, Modal, PanResponder, Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import type { TransactionInput, Transaction } from "@/features/transactions/types";
import { categoryStore } from "@/store/categoryStore";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import { useTheme } from "@/lib/themeProvider";
import { Ionicons } from "@expo/vector-icons";
import { CategoryIcon } from "@/components/icons/CategoryIcon";

type Props = {
  initial?: Partial<Transaction> | null;
  submitLabel?: string;
  onSubmit: (payload: TransactionInput) => void;
  onCancel?: () => void;
  header?: string;
};

type TransactionFormBaseProps = Props & {
  amountInputVariant: "system-keyboard" | "vnd-keypad";
};

function TransactionFormBase({
  initial,
  submitLabel = "Save",
  onSubmit,
  onCancel,
  header,
  amountInputVariant,
}: TransactionFormBaseProps) {
  const categories = categoryStore.categories;
  const { currency, localeCode } = useI18n();
  const { colors } = useTheme();
  const defaults = useMemo(() => {
    return {
      amount: initial?.amount ? String(initial.amount) : "",
      description: initial?.description ?? "",
      type: (initial?.type as TransactionInput["type"]) ?? "expense",
      categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
      date: initial?.date ? new Date(initial.date) : new Date(),
    };
  }, [initial, categories]);

  const [amount, setAmount] = React.useState(defaults.amount);
  const [description, setDescription] = React.useState(defaults.description);
  const [type, setType] = React.useState<TransactionInput["type"]>(defaults.type);
  const [categoryId, setCategoryId] = React.useState(defaults.categoryId);
  const [keypadOpen, setKeypadOpen] = React.useState(false);
  const keypadTranslateY = useRef(new Animated.Value(0)).current;
  const isVnd = amountInputVariant === "vnd-keypad" && currency?.toUpperCase() === "VND";
  const formTint = type === "expense" ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)";

  React.useEffect(() => {
    if (!keypadOpen) {
      keypadTranslateY.setValue(0);
    }
  }, [keypadOpen, keypadTranslateY]);

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

  const handleSubmit = () => {
    const parsedAmount = Number(String(amount).replace(/[^\d]/g, "")) || 0;
    if (!parsedAmount) return;
    onSubmit({
      amount: parsedAmount,
      description,
      type,
      categoryId,
      date: defaults.date,
    });
  };

  return (
    <View style={styles.container}>
      {header ? <ThemedText style={styles.header}>{header}</ThemedText> : null}
      <Card style={[styles.formCard, { backgroundColor: formTint }]}>
        <ThemedText tone="muted" style={styles.label}>Amount</ThemedText>
        <Pressable onPress={() => (isVnd ? setKeypadOpen(true) : undefined)}>
          <TextField
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            showSoftInputOnFocus={!isVnd}
            editable={!isVnd}
            style={styles.field}
          />
        </Pressable>
        <ThemedText tone="muted" style={styles.label}>Description</ThemedText>
        <TextField value={description} onChangeText={setDescription} style={styles.field} />
        <ThemedText tone="muted" style={styles.label}>Type</ThemedText>
        <View style={styles.row}>
          <Button title="Expense" variant={type === "expense" ? "primary" : "outline"} onPress={() => setType("expense")} />
          <Button title="Income" variant={type === "income" ? "primary" : "outline"} onPress={() => setType("income")} />
        </View>
        <ThemedText tone="muted" style={styles.label}>Category</ThemedText>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => {
            const selected = categoryId === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryItem,
                  { borderColor: selected ? colors.primary : colors.border },
                ]}
                onPress={() => setCategoryId(cat.id)}
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
        <View style={styles.actions}>
          <Button
            title={submitLabel}
            onPress={handleSubmit}
            backgroundColor={type === "expense" ? "#ef4444" : "#22c55e"}
            textColor="#fff"
          />
          {onCancel ? <Button title="Cancel" variant="ghost" onPress={onCancel} /> : null}
        </View>
      </Card>
      {isVnd ? (
        <Modal transparent visible={keypadOpen} animationType="slide" onRequestClose={() => setKeypadOpen(false)}>
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
                <ThemedText style={styles.keypadTitle}>Amount</ThemedText>
                <Pressable style={[styles.closeButton, { borderColor: colors.border }]} onPress={() => setKeypadOpen(false)}>
                  <Ionicons name="close" size={16} color={colors.mutedText} />
                </Pressable>
              </View>
              <View style={styles.keypadDisplay}>
                <ThemedText style={styles.keypadAmount}>
                  {amount ? formatCurrency(Number(amount), currency, localeCode) : "0"}
                </ThemedText>
              </View>
              <View style={styles.keypadGrid}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"].map((key) => {
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
                    <Pressable key={key} style={styles.keypadButton} onPress={() => setAmount((prev) => `${prev}${key}`)}>
                      <ThemedText style={styles.keypadButtonText}>{key}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.keypadFooter}>
                <Button title="Clear" variant="ghost" onPress={() => setAmount("")} />
                <Button title="Done" onPress={() => setKeypadOpen(false)} style={styles.doneButton} />
              </View>
            </Animated.View>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

export function TransactionForm(props: Props) {
  return <TransactionFormBase {...props} amountInputVariant="system-keyboard" />;
}

export function VndKeypadTransactionForm(props: Props) {
  return <TransactionFormBase {...props} amountInputVariant="vnd-keypad" />;
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    fontSize: 18,
    fontWeight: "700",
  },
  label: {
    marginBottom: 6,
  },
  field: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-start",
    marginBottom: 12,
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
  actions: {
    gap: 8,
  },
  formCard: {
    borderRadius: 18,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  keypadSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
  },
  keypadHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  keypadTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  keypadDisplay: {
    paddingVertical: 8,
    alignItems: "center",
  },
  keypadAmount: {
    fontSize: 24,
    fontWeight: "700",
  },
  keypadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  keypadButton: {
    width: "30%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  keypadButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  keypadAction: {
    borderWidth: 1,
  },
  keypadFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 8,
    gap: 12,
  },
  doneButton: {
    paddingHorizontal: 24,
  },
});
