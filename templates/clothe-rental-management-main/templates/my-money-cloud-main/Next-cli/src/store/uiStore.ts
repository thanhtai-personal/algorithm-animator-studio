"use client";

import { makeAutoObservable } from "mobx";
import storageAdapter from "@/lib/storageAdapter";

class UIStore {

  private static _instance: UIStore | null = null;
  private _loading: boolean = true;

  private constructor() {
    makeAutoObservable(this);
  }
  static getInstance(): UIStore {
    if (!UIStore._instance) {
      UIStore._instance = new UIStore();
    }
    return UIStore._instance;
  }

  get loading(): boolean {
    return this._loading;
  }

  set loading(value: boolean) {
    this._loading = value;
  }
}

export const uiStore = UIStore.getInstance();