import { makeAutoObservable } from "mobx";

export class StorePageStore {
  processing: string | null = null;
  rates: Record<string, number> = { USD: 1 };
  showLoginPrompt = false;
  adPackages: any[] = [];
  aiPackages: any[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  setProcessing(id: string | null) {
    this.processing = id;
  }

  setRates(rates: Record<string, number>) {
    this.rates = rates;
  }

  setShowLoginPrompt(show: boolean) {
    this.showLoginPrompt = show;
  }

  setAdPackages(pkgs: any[]) {
    this.adPackages = pkgs;
  }

  setAiPackages(pkgs: any[]) {
    this.aiPackages = pkgs;
  }
}

export const storePageStore = new StorePageStore();
