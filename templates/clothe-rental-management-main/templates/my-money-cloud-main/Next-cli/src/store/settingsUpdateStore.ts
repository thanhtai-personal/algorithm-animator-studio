import { makeAutoObservable } from "mobx";

class SettingsUpdateStore {
  updatingCount = 0;

  constructor() {
    makeAutoObservable(this);
  }

  start() {
    this.updatingCount += 1;
  }

  end() {
    this.updatingCount = Math.max(0, this.updatingCount - 1);
  }

  get updating() {
    return this.updatingCount > 0;
  }
}

export const settingsUpdateStore = new SettingsUpdateStore();
