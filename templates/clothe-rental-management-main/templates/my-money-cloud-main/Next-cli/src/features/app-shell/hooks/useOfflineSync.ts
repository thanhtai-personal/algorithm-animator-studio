"use client";

import { useState, useCallback } from "react";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { syncingStore } from "@/store/syncingStore";
import { categoryService } from "@/features/categories/services/categoryService";
import { transactionService } from "@/features/transactions/services/transactionService";
import { authStore } from "@/store/authStore";
import { updateUserSettings } from "@/features/app-shell/services/user";

const MAX_RETRIES = 3;

export function useOfflineSync() {
  const [syncing, setSyncing] = useState(syncingStore.syncing);
    const [paused, setPaused] = useState(syncingStore.paused);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const syncNow = useCallback(async () => {
    setSyncing(true);
    syncingStore.setSyncing(true);
    syncingStore.setPaused(false);
    setError(null);
    setStatus("");
    let total = offlineQueueStore.getCount();
    setProgress({ done: 0, total });
    let done = 0;
    let processed = 0;
    while (offlineQueueStore.getCount() > 0) {
      if (syncingStore.paused) {
        // Pause: syncing remains true, just break loop
        setStatus("Đã tạm dừng đồng bộ, bạn đang ở chế độ offline");
        break;
      }
      const op = offlineQueueStore.dequeue();
      if (!op) break;
      let success = false;
      let attempts = 0;
      while (!success && attempts < MAX_RETRIES) {
        try {
          if (op.entity === "category") {
            setStatus(`Đồng bộ category (${op.action})`);
            if (op.action === "create") {
              const { name, icon, color } = op.payload;
              await categoryService.create({
                name: name || "Unnamed",
                icon: icon ?? undefined,
                color: color ?? undefined,
              });
            }
            if (op.action === "update") {
              const { id, updates } = op.payload;
              await categoryService.update(id, {
                name: updates.name || "",
                icon: updates.icon ?? undefined,
                color: updates.color ?? undefined,
              });
            }
            if (op.action === "delete") await categoryService.remove(op.payload.id);
          }
          if (op.entity === "transaction") {
            setStatus(`Đồng bộ transaction (${op.action})`);
            if (op.action === "create") {
              const tx = op.payload;
              await transactionService.create({
                input: {
                  ...tx,
                  date: new Date(tx.date),
                },
              });
            }
            if (op.action === "update") {
              const { id, updates } = op.payload;
              await transactionService.update({
                id,
                updates: {
                  ...updates,
                  date: updates.date ? new Date(updates.date) : undefined,
                },
              });
            }
            if (op.action === "delete") await transactionService.remove({ id: op.payload.id });
          }
          if (op.entity === "settings" && op.action === "update") {
            setStatus("Đồng bộ user settings");
            const updated = await updateUserSettings(op.payload.updates);
            authStore.upsert(updated);
          }
          success = true;
        } catch (err) {
          attempts++;
          if (attempts >= MAX_RETRIES) {
            offlineQueueStore.enqueue(op);
            setError("Sync failed. Please try again.");
            setSyncing(false);
              syncingStore.setSyncing(false);
            setProgress({ done, total });
            setStatus("");
            return;
          }
        }
      }
      processed++;
      if (success) {
        done++;
        setProgress({ done, total });
      }
    }
    setSyncing(false);
    syncingStore.setSyncing(false);
    setStatus("");
  }, []);

  const pauseSync = useCallback(() => {
    setPaused(true);
    syncingStore.setPaused(true);
    setSyncing(false);
    syncingStore.setSyncing(false);
    setStatus("");
  }, []);

  return {
    syncing,
    progress,
    error,
    syncNow,
    status,
    paused,
    pauseSync,
  };
}
