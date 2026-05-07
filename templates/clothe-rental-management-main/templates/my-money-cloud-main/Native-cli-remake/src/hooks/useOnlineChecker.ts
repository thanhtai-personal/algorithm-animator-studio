import { useEffect, useState } from "react";
import * as Network from "expo-network";
import { syncingStore } from "@/store/syncingStore";

export function useOnlineChecker() {
  const [isOnline, setIsOnline] = useState(true);

  const resolveOnline = (state?: Network.NetworkState) => {
    if (syncingStore.syncing) return false;
    if (!state) return true;
    if (typeof state.isInternetReachable === "boolean") return state.isInternetReachable;
    if (typeof state.isConnected === "boolean") return state.isConnected;
    return true;
  };

  useEffect(() => {
    let mounted = true;

    const updateStatus = (state?: Network.NetworkState) => {
      if (!mounted) return;
      setIsOnline(resolveOnline(state));
    };

    void Network.getNetworkStateAsync()
      .then(updateStatus)
      .catch(() => updateStatus());

    const subscription = Network.addNetworkStateListener(updateStatus);
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return { isOnline };
}
