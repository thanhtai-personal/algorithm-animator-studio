"use client";

import { makeAutoObservable } from "mobx";

type TabKey = "home" | "stats" | "store" | "settings";

class AppShellStore {
  activeTab: TabKey = "home";
  pendingMic: boolean = false;
  homeListening: boolean = false;
  homeAIMode: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  setActiveTab(tab: TabKey) {
    this.activeTab = tab;
    if (tab !== "home") {
      this.pendingMic = false;
    }
  }

  queueMic() {
    this.pendingMic = true;
    this.activeTab = "home";
  }

  consumePendingMic() {
    this.pendingMic = false;
  }

  setHomeListening(listening: boolean) {
    this.homeListening = listening;
  }

  setHomeAIMode(enabled: boolean) {
    this.homeAIMode = enabled;
  }
}

export const appShellStore = new AppShellStore();
export type { TabKey };
