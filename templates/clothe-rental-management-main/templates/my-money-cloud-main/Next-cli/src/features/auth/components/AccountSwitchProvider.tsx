"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ConfirmAnonDataEraseDialog } from "@/features/auth/components/ConfirmAnonDataEraseDialog";
import { AnonymousSyncProgressOverlay } from "@/features/auth/components/AnonymousSyncProgressOverlay";
import { useAccountSwitch } from "@/features/auth/hooks/account/useAccountSwitch";
import { useAuthActions } from "@/features/auth/hooks/login/useAuthActions";

export function AccountSwitchProvider({ children }: { children: ReactNode }) {
  const { pendingLogin, syncProgress, handleSession, confirmErase, cancelErase } = useAccountSwitch();
  const { bootstrapSession } = useAuthActions();
  const unsubscribeRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const unsubscribe = await bootstrapSession(handleSession);
      if (!active) {
        unsubscribe();
        return;
      }
      unsubscribeRef.current = unsubscribe;
    };
    void run();
    return () => {
      active = false;
      unsubscribeRef.current?.();
    };
  }, [bootstrapSession, handleSession]);

  return (
    <>
      {pendingLogin ? (
        <ConfirmAnonDataEraseDialog open onConfirm={confirmErase} onCancel={cancelErase} />
      ) : null}
      {syncProgress ? <AnonymousSyncProgressOverlay open done={syncProgress.done} total={syncProgress.total} /> : null}
      {syncProgress ? null : children}
    </>
  );
}
