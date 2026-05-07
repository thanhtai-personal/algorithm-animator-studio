import { makeAutoObservable } from "mobx";
import { isAdFree } from "@/lib/devicePurchases";

class AdStore {
  isAdFree = false;

  constructor() {
    makeAutoObservable(this);
  }

  refresh() {
    this.isAdFree = isAdFree();
  }
}

export const adStore = new AdStore();
