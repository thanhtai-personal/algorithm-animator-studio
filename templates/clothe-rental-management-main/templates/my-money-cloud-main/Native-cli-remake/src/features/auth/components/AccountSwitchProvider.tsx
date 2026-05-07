import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";

import { ConfirmAnonDataEraseModal } from "@/features/auth/components/ConfirmAnonDataEraseModal";
import { AnonymousSyncProgressOverlay } from "@/features/auth/components/AnonymousSyncProgressOverlay";
import {
  useAccountSwitch,
  type AccountSwitchPendingLogin,
  type AccountSwitchSyncProgress,
} from "@/features/auth/hooks/account/useAccountSwitch";
import { useAuthActions } from "@/features/auth/hooks/login/useAuthActions";

type AccountSwitchContextValue = {
  pendingLogin: AccountSwitchPendingLogin | null;
  syncProgress: AccountSwitchSyncProgress | null;
  confirmErase: () => Promise<void>;
  cancelErase: () => Promise<void>;
};

const AccountSwitchContext = createContext<AccountSwitchContextValue | null>(null);

export function useAccountSwitchContext() {
  const ctx = useContext(AccountSwitchContext);
  if (!ctx) {
    throw new Error("useAccountSwitchContext must be used within AccountSwitchProvider");
  }
  return ctx;
}

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

  const contextValue = useMemo(
    () => ({
      pendingLogin,
      syncProgress,
      confirmErase,
      cancelErase,
    }),
    [pendingLogin, syncProgress, confirmErase, cancelErase]
  );

  return (
    <AccountSwitchContext.Provider value={contextValue}>
      {pendingLogin ? (
        <ConfirmAnonDataEraseModal open onConfirm={confirmErase} onCancel={cancelErase} />
      ) : null}
      {syncProgress ? (
        <AnonymousSyncProgressOverlay open done={syncProgress.done} total={syncProgress.total} />
      ) : null}
      {syncProgress ? null : children}
    </AccountSwitchContext.Provider>
  );
}
