import { useEffect, useState } from "react";
import { syncingStore } from "@/store/syncingStore";

export function useOnlineChecker() {
  const [isOnline, setIsOnline] = useState(true);

  const updateStatus = () => {
    if (syncingStore.syncing) {
      setIsOnline(false);
    } else {
      setIsOnline(navigator.onLine);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    // MobX reaction for syncingStore.syncing
    const interval = setInterval(updateStatus, 300);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
      clearInterval(interval);
    };
  }, []);

  return { isOnline };
}
