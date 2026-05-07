import { useCallback, useRef } from "react";
import { appLockStore } from "@/features/auth/stores/AppLockStore";
import { useI18n } from "@/lib/i18n";
import { APP_LOCK_PIN_LENGTH } from "@/features/auth/utils/constants";
import { getAppLockConfig } from "@/lib/appLock";
import { authStore } from "@/store/authStore";
import storageAdapter from "@/lib/storageAdapter";

/**
 * useAppLockGate - UI logic for AppLockGate component
 * - No duplicate business logic: delegates to AppLockStore
 * - Handles pin input, unlock, error, and focus logic
 */
export function useAppLockGate() {
  const { t: translate } = useI18n();
  const t = translate;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // UI state from store
  const { pinDigits, error, attempting, locked } = appLockStore;

  // Should show lock screen
  const shouldLock = locked;

  // Handle pin digit change
  const handleDigitChange = useCallback((index: number, value: string) => {
    const digits = [...pinDigits];
    digits[index] = value.replace(/[^0-9]/g, "");
    appLockStore.setPinDigits(digits);
    // Auto focus next input
    if (value && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [pinDigits]);

  // Unlock handler
  const handleUnlock = useCallback(async () => {
    appLockStore.setAttempting(true);
    const userId =
      authStore.userId ||
      authStore.anonId ||
      storageAdapter.getUserId() ||
      storageAdapter.getAnonId() ||
      "local";
    const pin = pinDigits.join("");
    const { pinHash } = getAppLockConfig();
    if (pin.length !== APP_LOCK_PIN_LENGTH) {
      appLockStore.setError(t("auth.lockPinInvalid"));
      appLockStore.setAttempting(false);
      return;
    }
    const valid = await appLockStore.verifyPin(userId, pin, pinHash);
    appLockStore.setAttempting(false);
    if (valid) {
      appLockStore.setError(null);
      appLockStore.setLocked(false);
      appLockStore.resetPinInput();
    } else {
      appLockStore.setError(t("auth.lockPinInvalid"));
      appLockStore.resetPinInput();
      inputRefs.current[0]?.focus();
    }
  }, [pinDigits, t]);

  // Handle key down (backspace, enter)
  const handleDigitKeyDown = useCallback((index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !pinDigits[index] && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "Enter") {
      handleUnlock();
    }
  }, [pinDigits, handleUnlock]);

  // Use password instead (sign out)
  const handleUsePassword = useCallback(() => {
    // TODO: Implement sign out logic
    appLockStore.setLocked(false);
    appLockStore.resetPinInput();
  }, []);

  return {
    t,
    PIN_LENGTH: APP_LOCK_PIN_LENGTH,
    shouldLock,
    error,
    attempting,
    inputRefs,
    handleDigitChange,
    handleDigitKeyDown,
    handleUnlock,
    handleUsePassword,
  };
}
