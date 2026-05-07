import { useEffect, useMemo } from "react";

import { offlineQueueStore } from "@/store/offlineQueueStore";
import { authStore } from "@/store/authStore";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";
import { useOfflineSync } from "@/features/app-shell/hooks/useOfflineSync";

export function useOfflineQueueSyncGate() {
  const { isOnline } = useOnlineChecker();
  const { syncing, progress, error, status, syncNow, pauseSync } = useOfflineSync();
  const userId = authStore.userId;
  const anonId = authStore.anonId;
  const queueVersion = offlineQueueStore.version;

  const pendingCount = useMemo(
    () => (userId && !anonId ? offlineQueueStore.getCount(userId) : 0),
    [userId, anonId, queueVersion]
  );

  const shouldSync = Boolean(userId && !anonId && isOnline && pendingCount > 0);

  useEffect(() => {
    if (!shouldSync) return;
    if (syncing) return;
    void syncNow();
  }, [shouldSync, syncing, syncNow]);

  const displayProgress = useMemo(() => {
    if (progress.total > 0) return progress;
    if (pendingCount > 0) return { done: 0, total: pendingCount };
    return progress;
  }, [progress, pendingCount]);

  return {
    open: shouldSync || syncing,
    progress: displayProgress,
    error,
    status,
    pauseSync,
  };
}
