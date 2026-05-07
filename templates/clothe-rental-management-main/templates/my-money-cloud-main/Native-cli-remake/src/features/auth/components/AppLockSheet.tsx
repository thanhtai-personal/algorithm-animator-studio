import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, TextInput, View, useWindowDimensions } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { getAppLockConfig, setAppLockConfig, setAppLockPin, clearAppLockPin, verifyAppLockPin } from "@/lib/appLock";
import { authStore } from "@/store/authStore";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/themeProvider";

type AppLockSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function AppLockSheet({ open, onClose }: AppLockSheetProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const config = getAppLockConfig();
  const enabled = config.enabled && config.method === "pin";
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [disablePin, setDisablePin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const userId = authStore.userId || authStore.anonId || "local";

  useEffect(() => {
    if (!open) {
      setPin("");
      setConfirm("");
      setDisablePin("");
      setError(null);
    }
  }, [open]);

  const handleEnable = async () => {
    if (pin.length < 4 || pin !== confirm) {
      setError(pin.length < 4 ? t("auth.lockPinLength") : t("auth.lockPinMismatch"));
      return;
    }
    const result = await setAppLockPin(userId, pin);
    if (!result.success) {
      setError(result.error === "storageUnavailable" ? t("auth.lockStorageUnavailable") : t("auth.lockSetupFailed"));
      return;
    }
    setAppLockConfig(true, "pin");
    setPin("");
    setConfirm("");
    setError(null);
    onClose();
  };

  const handleDisable = async () => {
    if (disablePin.length < 4) {
      setError(t("auth.lockPinLength"));
      return;
    }
    const valid = await verifyAppLockPin(userId, disablePin);
    if (!valid) {
      setError(t("auth.lockPinInvalid"));
      return;
    }
    clearAppLockPin();
    setAppLockConfig(false, null);
    setDisablePin("");
    setError(null);
    onClose();
  };

  const handlePinChange = (value: string, setter: (next: string) => void) => {
    const sanitized = value.replace(/\D/g, "").slice(0, 4);
    setter(sanitized);
  };

  return (
    <Modal transparent visible={open} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card, maxHeight: height * 0.8 }]}>
          <ThemedText style={styles.sheetTitle}>{t("auth.lockTitle") ?? "Screen lock"}</ThemedText>

          {enabled ? (
            <View style={styles.section}>
              <ThemedText>{t("auth.lockEnabled") ?? "Screen lock enabled"}</ThemedText>
              <PinInput
                label={t("auth.lockPin") ?? "PIN"}
                value={disablePin}
                onChange={(value) => handlePinChange(value, setDisablePin)}
                colors={colors}
              />
              {error ? <ThemedText tone="danger">{error}</ThemedText> : null}
              <Button title={t("auth.lockDisable") ?? "Disable"} variant="outline" onPress={handleDisable} />
            </View>
          ) : (
            <View style={styles.section}>
              <PinInput
                label={t("auth.lockPin") ?? "PIN"}
                value={pin}
                onChange={(value) => handlePinChange(value, setPin)}
                colors={colors}
              />
              <PinInput
                label={t("auth.lockPinConfirm") ?? "Confirm PIN"}
                value={confirm}
                onChange={(value) => handlePinChange(value, setConfirm)}
                colors={colors}
              />
              {error ? <ThemedText tone="danger">{error}</ThemedText> : null}
              <Button title={t("auth.lockSavePin") ?? "Save PIN"} onPress={handleEnable} />
            </View>
          )}

          <Button title={t("common.close") ?? "Close"} variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type PinInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  colors: ReturnType<typeof useTheme>["colors"];
};

function PinInput({ label, value, onChange, colors }: PinInputProps) {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const digits = Array.from({ length: 4 }, (_, index) => value[index] ?? "");

  const updateDigits = (nextDigits: string[]) => {
    onChange(nextDigits.join(""));
  };

  const clearFromIndex = (index: number) => {
    const nextDigits = [...digits];
    for (let i = index; i < 4; i += 1) {
      nextDigits[i] = "";
    }
    updateDigits(nextDigits);
  };

  const handleDigitChange = (index: number, text: string) => {
    const sanitized = text.replace(/\D/g, "");
    if (!sanitized) {
      clearFromIndex(index);
      return;
    }
    const nextDigits = [...digits];
    if (sanitized.length > 1) {
      sanitized.split("").forEach((digit, offset) => {
        const target = index + offset;
        if (target < 4) {
          nextDigits[target] = digit;
        }
      });
    } else {
      nextDigits[index] = sanitized;
    }
    updateDigits(nextDigits);
    const nextIndex = Math.min(index + sanitized.length, 3);
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
    <View style={styles.pinInput}>
      <ThemedText style={styles.pinLabel} tone="muted">
        {label}
      </ThemedText>
      <View style={styles.pinRow}>
        {digits.map((digit, index) => (
          <TextInput
            key={`${label}-${index}`}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            value={digit}
            onChangeText={(text) => handleDigitChange(index, text)}
            onKeyPress={(event) => handleKeyPress(index, event.nativeEvent.key)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex((current) => (current === index ? null : current))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={1}
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
  );
}

const styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    gap: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  section: {
    gap: 12,
  },
  pinInput: {
    gap: 10,
  },
  pinLabel: {
    fontSize: 13,
  },
  pinRow: {
    flexDirection: "row",
    gap: 10,
  },
  pinBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
  },
});
