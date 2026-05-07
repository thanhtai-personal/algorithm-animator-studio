import { useCallback } from "react";
import { appLockStore } from "@/features/auth/stores/AppLockStore";
import { useI18n } from "@/lib/i18n";
import { APP_LOCK_PIN_LENGTH } from "@/features/auth/utils/constants";
import { getAppLockConfig } from "@/lib/appLock";
import { authStore } from "@/store/authStore";
import storageAdapter from "@/lib/storageAdapter";
import { useAuthActions } from "@/features/auth/hooks/login/useAuthActions";

export function useAppLockGate() {
  const { t } = useI18n();
  const { signOut } = useAuthActions();
  const { pinDigits, error, attempting, locked } = appLockStore;

  const handlePinChange = useCallback(
    (value: string) => {
      const sanitized = value.replace(/[^0-9]/g, "").slice(0, APP_LOCK_PIN_LENGTH);
      const next = sanitized.split("");
      while (next.length < APP_LOCK_PIN_LENGTH) next.push("");
      appLockStore.setPinDigits(next);
    },
    []
  );

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
      appLockStore.setError(t("auth.lockPinLength"));
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
    }
  }, [pinDigits, t]);

  const handleSignOut = useCallback(() => {
    void signOut();
  }, [signOut]);

  return {
    t,
    PIN_LENGTH: APP_LOCK_PIN_LENGTH,
    shouldLock: locked,
    error,
    attempting,
    pin: pinDigits.join(""),
    handlePinChange,
    handleUnlock,
    handleSignOut,
  };
}
