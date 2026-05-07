import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";

import type { AnonymousSyncState, UserSettings } from "@/types/userSettings";
import { ensureAppLockPinOwner } from "@/lib/appLock";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { authStore } from "@/store/authStore";
import { categoryStore } from "@/store/categoryStore";
import { transactionStore } from "@/store/transactionStore";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { fetchUserSettingsFromApi } from "@/features/profile/services/userSettingsService";
import { categoryService } from "@/features/categories/services/categoryService";
import { transactionService } from "@/features/transactions/services/transactionService";
import { updateUserSettings } from "@/features/app-shell/services/user";
import { buildSettingsUpdates, mergeUserSettings } from "@/features/auth/utils/userSettingsSync";
import { runBatched } from "@/features/auth/utils/runBatched";
import { createUserBackup } from "@/features/auth/services/userBackupService";
import { toast } from "@/hooks/use-toast";

const SYNC_BATCH_SIZE = 6;
const SYNC_RETRY_DELAY_MS = 2000;

type PendingLogin = {
  userId: string;
  settings: UserSettings | null;
};

type SyncProgress = {
  done: number;
  total: number;
};

export type AccountSwitchPendingLogin = PendingLogin;
export type AccountSwitchSyncProgress = SyncProgress;

export function useAccountSwitch() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [pendingLogin, setPendingLogin] = useState<PendingLogin | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [switchUserId, setSwitchUserId] = useState<string | null>(null);
  const pendingLoginRef = useRef<PendingLogin | null>(null);
  const switchUserIdRef = useRef<string | null>(null);
  const processingRef = useRef(false);
  const progressUpdateRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startSwitchRef = useRef<(userId: string) => Promise<void> | void>(() => {});

  const setPendingLoginState = useCallback((value: PendingLogin | null) => {
    pendingLoginRef.current = value;
    setPendingLogin(value);
  }, []);

  const setSwitchUserIdState = useCallback((value: string | null) => {
    switchUserIdRef.current = value;
    setSwitchUserId(value);
  }, []);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const scheduleRetry = useCallback(
    (userId: string) => {
      clearRetryTimer();
      retryTimerRef.current = setTimeout(() => {
        if (!authStore.anonId) return;
        if (processingRef.current || pendingLoginRef.current) return;
        if (switchUserIdRef.current !== userId) return;
        const run = startSwitchRef.current;
        if (run) {
          void run(userId);
        }
      }, SYNC_RETRY_DELAY_MS);
    },
    [clearRetryTimer]
  );

  const updateSyncProgress = useCallback((done: number, total: number, force = false) => {
    const now = Date.now();
    if (force || done === total || now - progressUpdateRef.current >= 120) {
      progressUpdateRef.current = now;
      setSyncProgress({ done, total });
    }
  }, []);

  const persistSyncState = useCallback(async (state: AnonymousSyncState | null) => {
    try {
      await updateUserSettings({ anon_sync_state: state });
    } catch (error) {
      // anon_sync_state is optional; avoid blocking sync if backend doesn't support it.
    }
  }, []);

  const normalizeSyncState = useCallback(
    (
      state: AnonymousSyncState | null | undefined,
      totals: { totalCategories: number; totalTransactions: number; settingsTotal: number }
    ): AnonymousSyncState => {
      const now = new Date().toISOString();
      if (!state || state.status !== "syncing") {
        const settingsSynced = totals.settingsTotal === 0;
        return {
          status: "syncing",
          phase: settingsSynced ? "categories" : "settings",
          settingsTotal: totals.settingsTotal,
          settingsSynced,
          categoryIndex: 0,
          transactionIndex: 0,
          totalCategories: totals.totalCategories,
          totalTransactions: totals.totalTransactions,
          updatedAt: now,
        };
      }

      const categoryIndex = Math.min(Math.max(state.categoryIndex ?? 0, 0), totals.totalCategories);
      const transactionIndex = Math.min(Math.max(state.transactionIndex ?? 0, 0), totals.totalTransactions);
      const settingsTotal = typeof state.settingsTotal === "number" ? state.settingsTotal : totals.settingsTotal;
      const settingsSynced = Boolean(state.settingsSynced) || settingsTotal === 0;

      return {
        status: "syncing",
        phase: state.phase ?? (settingsSynced ? "categories" : "settings"),
        settingsTotal,
        settingsSynced,
        categoryIndex,
        transactionIndex,
        totalCategories: totals.totalCategories,
        totalTransactions: totals.totalTransactions,
        updatedAt: state.updatedAt ?? now,
      };
    },
    []
  );

  const syncStateProgress = useCallback(
    (state: AnonymousSyncState) => {
      const done = (state.settingsSynced ? state.settingsTotal : 0) + state.categoryIndex + state.transactionIndex;
      const total = state.settingsTotal + state.totalCategories + state.totalTransactions;
      updateSyncProgress(done, total, true);
    },
    [updateSyncProgress]
  );

  const loadRemoteData = useCallback(async () => {
    const categories = await categoryService.list();
    categoryStore.write(categories);
    const now = new Date();
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const transactions = await transactionService.listByRange({ start: lastYear, end: now });
    transactionStore.write(transactions);
  }, []);

  const syncLocalData = useCallback(
    async (
      userId: string,
      settings: UserSettings | null,
      categories: typeof categoryStore.categories,
      transactions: typeof transactionStore.transactions,
      remoteState: AnonymousSyncState | null | undefined
    ) => {
      const settingsUpdates = buildSettingsUpdates(settings);
      const settingsTotal = Object.keys(settingsUpdates).length > 0 ? 1 : 0;
      const totals = {
        totalCategories: categories.length,
        totalTransactions: transactions.length,
        settingsTotal,
      };
      if (settingsTotal + totals.totalCategories + totals.totalTransactions === 0) return;

      let syncState = normalizeSyncState(remoteState, totals);
      syncStateProgress(syncState);
      await persistSyncState(syncState);

      let completed = false;
      try {
        if (!syncState.settingsSynced && settingsTotal > 0) {
          await updateUserSettings(settingsUpdates);
          syncState = {
            ...syncState,
            settingsSynced: true,
            phase: "categories",
            updatedAt: new Date().toISOString(),
          };
          await persistSyncState(syncState);
          syncStateProgress(syncState);
        }

        if (syncState.categoryIndex < totals.totalCategories) {
          const startIndex = syncState.categoryIndex;
          const pendingCategories = categories.slice(startIndex);
          await runBatched(
            pendingCategories,
            SYNC_BATCH_SIZE,
            async (category) => {
              await categoryService.create({
                user_id: userId,
                name: category.name,
                icon: category.icon ?? undefined,
                color: category.color ?? undefined,
              });
            },
            async (count) => {
              syncState = {
                ...syncState,
                phase: "categories",
                categoryIndex: Math.min(syncState.categoryIndex + count, totals.totalCategories),
                updatedAt: new Date().toISOString(),
              };
              syncStateProgress(syncState);
              await persistSyncState(syncState);
            }
          );
        }

        if (syncState.transactionIndex < totals.totalTransactions) {
          syncState = { ...syncState, phase: "transactions" };
          await persistSyncState(syncState);
          const startIndex = syncState.transactionIndex;
          const pendingTransactions = transactions.slice(startIndex);
          await runBatched(
            pendingTransactions,
            SYNC_BATCH_SIZE,
            async (transaction) => {
              await transactionService.create({
                input: {
                  user_id: userId,
                  amount: transaction.amount,
                  description: transaction.description,
                  categoryId: transaction.categoryId,
                  type: transaction.type,
                  date: transaction.date,
                },
              });
            },
            async (count) => {
              syncState = {
                ...syncState,
                phase: "transactions",
                transactionIndex: Math.min(syncState.transactionIndex + count, totals.totalTransactions),
                updatedAt: new Date().toISOString(),
              };
              syncStateProgress(syncState);
              await persistSyncState(syncState);
            }
          );
        }

        syncState = {
          ...syncState,
          status: "completed",
          phase: "done",
          categoryIndex: totals.totalCategories,
          transactionIndex: totals.totalTransactions,
          updatedAt: new Date().toISOString(),
        };
        await persistSyncState(syncState);
        syncStateProgress(syncState);
        completed = true;
      } finally {
        if (completed) {
          progressUpdateRef.current = 0;
          setSyncProgress(null);
        }
      }
    },
    [buildSettingsUpdates, normalizeSyncState, persistSyncState, syncStateProgress]
  );

  const finalizeExistingUser = useCallback(
    async (userId: string, remoteSettings: UserSettings | null) => {
      clearRetryTimer();
      const anonId = authStore.anonId;
      if (anonId) {
        ensureAppLockPinOwner(anonId);
        offlineQueueStore.clear(anonId);
        categoryStore.clearForUser(anonId);
        transactionStore.clearForUser(anonId);
      }

      const mergedSettings = mergeUserSettings(userId, null, remoteSettings);
      authStore.setUserSession(userId, mergedSettings);
      await loadRemoteData();
      authStore.clearAnonymousSession();
      setSwitchUserIdState(null);
      router.replace("/(tabs)");
    },
    [clearRetryTimer, loadRemoteData, mergeUserSettings, router, setSwitchUserIdState]
  );

  const finalizeNewUser = useCallback(
    async (userId: string, remoteSettings: UserSettings | null) => {
      const anonId = authStore.anonId;
      categoryStore.load();
      transactionStore.load();
      const localCategories = categoryStore.categories;
      const localTransactions = transactionStore.transactions;
      const anonSettings = authStore.userSettings;
      const mergedSettings = mergeUserSettings(userId, anonSettings, remoteSettings);

      const syncAlreadyDone = remoteSettings?.anon_sync_state?.status === "completed";
      const settingsUpdates = buildSettingsUpdates(mergedSettings);
      const totalItems =
        (Object.keys(settingsUpdates).length > 0 ? 1 : 0) +
        localCategories.length +
        localTransactions.length;

      if (!syncAlreadyDone && totalItems > 0) {
        try {
          await syncLocalData(userId, mergedSettings, localCategories, localTransactions, remoteSettings?.anon_sync_state);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Sync failed";
          toast.error(message);
          scheduleRetry(userId);
          return;
        }
      } else {
        setSyncProgress(null);
      }

      let anonKeyPersisted = false;
      if (anonId) {
        try {
          await updateUserSettings({ anon_key: anonId });
          anonKeyPersisted = true;
        } catch {
          // Ignore anon_key update failures to avoid blocking the login flow.
        }
        try {
          const device = Platform.OS;
          const serializedTransactions = localTransactions.map((tx) => ({
            ...tx,
            date: tx.date instanceof Date ? tx.date.toISOString() : tx.date,
            createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
          }));
          await createUserBackup({
            device,
            data: {
              anon_id: anonId,
              settings: anonSettings,
              categories: localCategories,
              transactions: serializedTransactions,
            },
          });
        } catch {
          // Backup failures should not block switching to the new account.
        }
      }

      authStore.setUserSession(
        userId,
        {
          ...mergedSettings,
          ...(anonId && anonKeyPersisted ? { anon_key: anonId } : {}),
          anon_sync_state: null,
        }
      );
      const categoriesForUser = localCategories.map((category) => ({
        ...category,
        user_id: userId,
        anon_key: null,
      }));
      categoryStore.write(categoriesForUser);
      transactionStore.write(localTransactions);
      if (anonId) {
        ensureAppLockPinOwner(anonId);
        offlineQueueStore.clear(anonId);
      }
      authStore.clearAnonymousSession();
      try {
        await persistSyncState(null);
      } catch {
        // Ignore clearing sync state failures.
      }
      setSwitchUserIdState(null);
      router.replace("/(tabs)");
    },
    [
      buildSettingsUpdates,
      createUserBackup,
      ensureAppLockPinOwner,
      mergeUserSettings,
      persistSyncState,
      router,
      scheduleRetry,
      setSwitchUserIdState,
      syncLocalData,
      updateUserSettings,
    ]
  );

  const startSwitch = useCallback(
    async (userId: string) => {
      if (!authStore.anonId) return;
      if (!authStore.userId || authStore.userId !== userId) {
        setSwitchUserIdState(null);
        clearRetryTimer();
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        authStore.clearPendingUserId();
        setSwitchUserIdState(null);
        clearRetryTimer();
        return;
      }
      if (processingRef.current || pendingLoginRef.current) return;
      clearRetryTimer();
      processingRef.current = true;
      try {
        const remoteSettings = await fetchUserSettingsFromApi().catch(() => null);
        if (!remoteSettings) {
          toast.error("Failed to fetch user settings");
          scheduleRetry(userId);
          return;
        }
        const remoteSyncStatus = remoteSettings.anon_sync_state?.status;
        if (remoteSyncStatus === "syncing" || remoteSyncStatus === "completed") {
          await finalizeNewUser(userId, remoteSettings);
          return;
        }
        const hasRemoteCurrency = Boolean(remoteSettings.currency);
        if (hasRemoteCurrency) {
          setSyncProgress(null);
          setPendingLoginState({ userId, settings: remoteSettings });
          return;
        }
        await finalizeNewUser(userId, remoteSettings);
      } finally {
        processingRef.current = false;
      }
    },
    [clearRetryTimer, finalizeNewUser, scheduleRetry, setPendingLoginState, setSwitchUserIdState, supabase.auth]
  );

  useEffect(() => {
    startSwitchRef.current = startSwitch;
  }, [startSwitch]);

  useEffect(() => {
    if (switchUserId) return;
    if (!authStore.anonId) return;
    if (!authStore.userId) return;
    setSwitchUserIdState(authStore.userId);
  }, [switchUserId, setSwitchUserIdState]);

  useEffect(() => {
    if (!switchUserId) return;
    if (!authStore.anonId) return;
    if (processingRef.current || pendingLoginRef.current) return;
    void startSwitch(switchUserId);
  }, [startSwitch, switchUserId]);

  useEffect(() => () => clearRetryTimer(), [clearRetryTimer]);

  const handleSession = useCallback(
    async (sessionUserId: string) => {
      if (!authStore.anonId) return false;
      if (switchUserIdRef.current === sessionUserId) return false;
      authStore.setPendingUserId(sessionUserId);
      setSwitchUserIdState(sessionUserId);
      return true;
    },
    [setSwitchUserIdState]
  );

  const confirmErase = useCallback(async () => {
    const pending = pendingLoginRef.current;
    if (!pending) return;
    setPendingLoginState(null);
    clearRetryTimer();
    await finalizeExistingUser(pending.userId, pending.settings);
  }, [clearRetryTimer, finalizeExistingUser, setPendingLoginState]);

  const cancelErase = useCallback(async () => {
    if (!pendingLoginRef.current) return;
    setPendingLoginState(null);
    setSwitchUserIdState(null);
    clearRetryTimer();
    authStore.clearPendingUserId();
    await supabase.auth.signOut();
  }, [clearRetryTimer, setPendingLoginState, setSwitchUserIdState, supabase.auth]);

  return {
    pendingLogin,
    syncProgress,
    handleSession,
    confirmErase,
    cancelErase,
  };
}
