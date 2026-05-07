
import { makeAutoObservable } from "mobx";
import storageAdapter from "@/lib/storageAdapter";

class VersionStore {

  private static _instance: VersionStore | null = null;
  private constructor() {
    makeAutoObservable(this);
  }
  static getInstance(): VersionStore {
    if (!VersionStore._instance) {
      VersionStore._instance = new VersionStore();
    }
    return VersionStore._instance;
  }

  get version(): string {
    return storageAdapter.readStoredVersion();
  }

  set version(version: string) {
    storageAdapter.writeStoredVersion(version);
  }
}

export const versionStore = VersionStore.getInstance();