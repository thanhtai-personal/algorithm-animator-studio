import type { ReactNode } from "react";
import { observer } from "mobx-react-lite";

import { useOfflineQueueSyncGate } from "@/features/app-shell/hooks/useOfflineQueueSyncGate";
import { SyncOverlay } from "@/features/app-shell/components/SyncOverlay";

export const OnlineSyncProvider = observer(function OnlineSyncProvider({ children }: { children: ReactNode }) {
  const { open, progress, error, status, pauseSync } = useOfflineQueueSyncGate();

  return (
    <>
      <SyncOverlay open={open} progress={progress} error={error} status={status} onPause={pauseSync} />
      {children}
    </>
  );
});
