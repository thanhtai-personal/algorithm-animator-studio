import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { observer } from "mobx-react-lite";
import { useAppLockGate } from "@/features/auth/hooks/login/useAppLockGate";
import { AdFreeScreenView, ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/lib/themeProvider";

export const AppLockGate = observer(({ children }: { children: React.ReactNode }) => {
  const { t, PIN_LENGTH, shouldLock, error, attempting, pin, handlePinChange, handleUnlock, handleSignOut } =
    useAppLockGate();
  const { colors } = useTheme();
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!shouldLock) return;
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, [shouldLock]);

  const digits = Array.from({ length: PIN_LENGTH }, (_, index) => pin[index] ?? "");
  const updateDigits = (nextDigits: string[]) => {
    handlePinChange(nextDigits.join(""));
  };

  const clearFromIndex = (index: number) => {
    const nextDigits = [...digits];
    for (let i = index; i < PIN_LENGTH; i += 1) {
      nextDigits[i] = "";
    }
    updateDigits(nextDigits);
  };

  const handleDigitChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, "");
    if (!sanitized) {
      clearFromIndex(index);
      return;
    }
    const nextDigits = [...digits];
    if (sanitized.length > 1) {
      sanitized.split("").forEach((digit, offset) => {
        const target = index + offset;
        if (target < PIN_LENGTH) {
          nextDigits[target] = digit;
        }
      });
    } else {
      nextDigits[index] = sanitized;
    }
    updateDigits(nextDigits);
    const nextIndex = Math.min(index + sanitized.length, PIN_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key !== "Backspace") return;
    if (digits[index]) {
      clearFromIndex(index);
      return;
    }
    if (index > 0) {
      clearFromIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <>
      {children}
      {shouldLock ? (
        <View style={styles.overlay}>
          <AdFreeScreenView style={styles.screen}>
            <ThemedView variant="card" style={styles.card}>
              <ThemedText style={styles.title}>{t("auth.lockTitle")}</ThemedText>
              <ThemedText tone="muted" style={styles.subtitle}>
                {t("auth.lockSubtitlePin")}
              </ThemedText>

              <View style={styles.pinInput}>
                <ThemedText style={styles.pinLabel}>{t("auth.lockPin")}</ThemedText>
                <View style={styles.pinRow}>
                  {digits.map((digit, index) => (
                    <TextInput
                      key={`lock-pin-${index}`}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      value={digit}
                      onChangeText={(value) => handleDigitChange(index, value)}
                      onKeyPress={(event) => handleKeyPress(index, event.nativeEvent.key)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex((current) => (current === index ? null : current))}
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={1}
                      editable={!attempting}
                      textContentType="oneTimeCode"
                      style={[
                        styles.pinBox,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        focusedIndex === index && { borderColor: colors.primary, shadowColor: colors.primary },
                      ]}
                    />
                  ))}
                </View>
              </View>

              {!!error && (
                <ThemedText tone="danger" style={styles.error}>
                  {error}
                </ThemedText>
              )}
              <View style={styles.buttonGroup}>
                <Button
                  title={t("auth.lockUnlock")}
                  onPress={handleUnlock}
                  loading={attempting}
                  style={styles.primaryButton}
                />
                <Pressable
                  onPress={handleSignOut}
                  style={[styles.signOutButton, { borderColor: colors.danger }]}
                >
                  <ThemedText style={[styles.signOutText, { color: colors.danger }]}>
                    {t("auth.signOut")}
                  </ThemedText>
                </Pressable>
              </View>
            </ThemedView>
          </AdFreeScreenView>
        </View>
      ) : null}
    </>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    justifyContent: "center",
  },
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
  },
  pinInput: {
    marginTop: 6,
    gap: 8,
  },
  pinLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  pinRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  pinBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
  },
  error: {
    marginTop: 2,
    fontSize: 12,
  },
  buttonGroup: {
    gap: 10,
    marginTop: 6,
  },
  primaryButton: {
    borderRadius: 999,
    width: "100%",
  },
  signOutButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  signOutText: {
    fontWeight: "600",
  },
});
