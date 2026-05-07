"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useThemeVariant } from "@/lib/themeVariants";
import { useAIVoiceSettings } from "@/hooks/useAIVoiceSettings";
import {
  clearAppLockPin,
  getAppLockConfig,
  setAppLockConfig,
  setAppLockPin,
  verifyAppLockPin,
  isAppLockPinHash,
  updateRemoteAppLockConfig,
} from "@/lib/appLock";
import { toast } from "sonner";

import { authStore } from "@/store/authStore";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { updateUserSettings } from "@/features/app-shell/services/user";
import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";

export const useUserSetting = () => {
  const PIN_LENGTH = 4;
  const { t } = useI18n();
  const { variant, setVariant } = useThemeVariant();
  const { ignoreVoiceVerify, useAI } = useAIVoiceSettings();
  const isAIModeOn = useAI;
  const supabase = getSupabaseBrowserClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [lockVisible, setLockVisible] = useState(false);
  const [pinCode, setPinCode] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [pinConfirm, setPinConfirm] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [pinError, setPinError] = useState<string | null>(null);
  const [lockUpdating, setLockUpdating] = useState(false);
  const user = authStore.userSettings;
  const { isAnonymous } = useAnonymousChecker();
  const { isOnline } = useOnlineChecker();

  useEffect(() => {
    const refreshConfig = () => {
      const config = getAppLockConfig();
      const enabled = config.enabled && config.method === "pin";
      setLockEnabled(enabled);
      setLockVisible(enabled);
    };
    refreshConfig();
    window.addEventListener("storage", refreshConfig);
    window.addEventListener("app-lock-update", refreshConfig);
    return () => {
      window.removeEventListener("storage", refreshConfig);
      window.removeEventListener("app-lock-update", refreshConfig);
    };
  }, []);


  const reportPinError = (message: string) => {
    setPinError(message);
    toast.error(message);
  };

  // Update user settings logic (online/offline/anonymous)
  const updateUserSetting = async (updates: Partial<import("@/types/userSettings").UserSettings>) => {
    if (isAnonymous) {
      // Anonymous: update local store only, never call API
      authStore.upsert(updates);
      return;
    }

    if (!isOnline) {
      // Offline (non-anonymous): update local store and enqueue
      authStore.upsert(updates);
      offlineQueueStore.enqueue({
        id: Math.random().toString(36).substring(2),
        entity: "settings",
        action: "update",
        payload: { updates },
      });
      return;
    }

    // Online (non-anonymous): call API and update store
    try {
      const updated = await updateUserSettings(updates);
      authStore.upsert(updated);
    } catch {
      toast.error(t("common.updateFailed"));
    }
  };

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.email || !currentPassword || !newPassword || !confirmPassword) {
      toast.error(t("auth.missingFields"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }
    if (updating) {
      return;
    }

    setUpdating(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        toast.error(t("auth.invalidCurrentPassword"));
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(t("auth.passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setUpdating(false);
    }
  };

  const handleSavePin = async () => {
    if (lockUpdating) return;
    const localUserId = authStore.userId || authStore.anonId || user?.user_id;
    if (!localUserId) {
      reportPinError(t("auth.missingFields"));
      return;
    }
    const trimmedPin = pinCode.join("").trim();
    const trimmedConfirm = pinConfirm.join("").trim();
    if (trimmedPin.length !== PIN_LENGTH) {
      reportPinError(t("auth.lockPinLength"));
      return;
    }
    if (trimmedPin !== trimmedConfirm) {
      reportPinError(t("auth.lockPinMismatch"));
      return;
    }
    setLockUpdating(true);
    setPinError(null);
    const result = await setAppLockPin(localUserId, trimmedPin);
    if (!result.success) {
      const message =
        result.error === "storageUnavailable"
          ? t("auth.lockStorageUnavailable")
          : t("auth.lockSetupFailed");
      reportPinError(message);
      setLockUpdating(false);
      return;
    }
    setAppLockConfig(true, "pin");
    if (!isAnonymous) {
      const remoteUserId = authStore.userId || user?.user_id;
      if (remoteUserId && isAppLockPinHash(result.pinHash)) {
        await updateRemoteAppLockConfig(supabase, remoteUserId, {
          enabled: true,
          method: "pin",
          pinHash: result.pinHash,
        });
      }
    }
    setLockEnabled(true);
    toast.success(t("auth.lockEnabled"));
    setPinCode(Array(PIN_LENGTH).fill(""));
    setPinConfirm(Array(PIN_LENGTH).fill(""));
    setPinError(null);
    setLockUpdating(false);
  };

  const handleDisableLock = async (pinOverride?: string) => {
    if (lockUpdating) return false;
    const localUserId = authStore.userId || authStore.anonId || user?.user_id;
    if (!localUserId) {
      reportPinError(t("auth.missingFields"));
      return false;
    }
    const trimmedPin = (pinOverride ?? pinCode.join("")).trim();
    if (trimmedPin.length !== PIN_LENGTH) {
      reportPinError(t("auth.lockPinLength"));
      return false;
    }
    setLockUpdating(true);
    const valid = await verifyAppLockPin(localUserId, trimmedPin);
    if (!valid) {
      reportPinError(t("auth.lockPinInvalid"));
      setLockUpdating(false);
      return false;
    }
    setAppLockConfig(false, null);
    clearAppLockPin();
    if (!isAnonymous) {
      const remoteUserId = authStore.userId || user?.user_id;
      if (remoteUserId) {
        await updateRemoteAppLockConfig(supabase, remoteUserId, {
          enabled: false,
          method: null,
          pinHash: null,
        });
      }
    }
    setLockEnabled(false);
    setLockVisible(false);
    toast.success(t("auth.lockDisabled"));
    setPinError(null);
    setPinCode(Array(PIN_LENGTH).fill(""));
    setPinConfirm(Array(PIN_LENGTH).fill(""));
    setLockUpdating(false);
    return true;
  };

  const handleToggleLock = async (nextValue: boolean) => {
    if (lockUpdating) return;
    if (!nextValue) {
      if (!lockEnabled) {
        setLockVisible(false);
        setPinError(null);
        setPinCode(Array(PIN_LENGTH).fill(""));
        setPinConfirm(Array(PIN_LENGTH).fill(""));
      }
      return;
    }
    setLockVisible(true);
    setPinError(null);
  };

  // Example: update theme variant
  const handleSetVariant = async (nextVariant: string) => {
    await updateUserSetting({ theme_variant: nextVariant });
    setVariant(nextVariant as any); // ThemeVariant type
  };

  // Example: update ignoreVoiceVerify
  const handleSetIgnoreVerify = async (value: boolean) => {
    await updateUserSetting({ ignore_voice_verify: value });
  };

  const handleSetUseAI = async (value: boolean) => {
    await updateUserSetting({ use_ai: value });
  };

  return {
    variant,
    setVariant: handleSetVariant,
    isAIModeOn,
    ignoreVoiceVerify,
    useAI,
    setIgnoreVerify: handleSetIgnoreVerify,
    setUseAI: handleSetUseAI,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    updating,
    handleChangePassword,
    lockEnabled,
    lockVisible,
    pinCode,
    setPinCode,
    pinConfirm,
    setPinConfirm,
    pinError,
    setPinError,
    lockUpdating,
    handleSavePin,
    handleToggleLock,
    handleDisableLock
  };
};
