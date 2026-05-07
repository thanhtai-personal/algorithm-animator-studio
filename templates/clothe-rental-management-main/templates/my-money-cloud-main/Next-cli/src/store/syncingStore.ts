import { makeAutoObservable } from "mobx";
import storageAdapter from "@/lib/storageAdapter";

class SyncingStore {
  syncing = false;
  paused = false;

  constructor() {
    makeAutoObservable(this);
    // Load initial state from storage (safe fallback when localStorage is blocked)
    const sync = storageAdapter.getItem("syncingStore.syncing");
    const pause = storageAdapter.getItem("syncingStore.paused");
    this.syncing = sync === "true";
    this.paused = pause === "true";
  }

  setSyncing(val: boolean) {
    this.syncing = val;
    storageAdapter.setItem("syncingStore.syncing", val ? "true" : "false");
  }

  setPaused(val: boolean) {
    this.paused = val;
    storageAdapter.setItem("syncingStore.paused", val ? "true" : "false");
  }

  reset() {
    this.syncing = false;
    this.paused = false;
    storageAdapter.removeItem("syncingStore.syncing");
    storageAdapter.removeItem("syncingStore.paused");
  }
}

export const syncingStore = new SyncingStore();
