
import { useEffect } from "react";
import storageAdapter from "@/lib/storageAdapter";
import { authStore } from "@/store/authStore";
import { categoryStore } from "@/store/categoryStore";
import { transactionStore } from "@/store/transactionStore";
import { uiStore } from "@/store/uiStore";
import { adStore } from "@/features/ads/stores/adStore";
import { appLockStore } from "@/features/auth/stores/AppLockStore";

export function useLocalStoreBootstrap() {
  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      try {
        if ("hydrate" in storageAdapter) {
          await storageAdapter.hydrate();
        }
        if (!mounted) return;
        authStore.load();
        categoryStore.load();
        transactionStore.load();
        appLockStore.refreshFromStorage();
        adStore.refresh();
      } finally {
        uiStore.loading = false;
      }
    };
    void bootstrap();
    return () => {
      mounted = false;
    };
  }, []);
}
