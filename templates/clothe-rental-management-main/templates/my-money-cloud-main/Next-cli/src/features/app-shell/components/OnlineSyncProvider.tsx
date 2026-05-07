"use client";

import type { ReactNode } from "react";
import { observer } from "mobx-react-lite";
import { SyncDataDrawer } from "@/features/app-shell/components/SyncDataDrawer";
import { useOfflineQueueSyncGate } from "@/features/app-shell/hooks/useOfflineQueueSyncGate";

export const OnlineSyncProvider = observer(function OnlineSyncProvider({ children }: { children: ReactNode }) {
  const { open, progress, error, status, pauseSync } = useOfflineQueueSyncGate();

  return (
    <>
      <SyncDataDrawer
        open={open}
        onPause={pauseSync}
        progress={progress}
        error={error}
        status={status}
        onClose={() => {}}
        blocking
      />
      {open ? null : children}
    </>
  );
});
