import { makeAutoObservable } from "mobx";
import type { PublicSiteBrandingDto } from "@/types/settingsModule";

class BrandingStore {
  private static _instance: BrandingStore | null = null;

  private _publicBranding: PublicSiteBrandingDto | null = null;

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new BrandingStore();
    }

    return this._instance;
  }

  get publicBranding(): PublicSiteBrandingDto | null {
    return this._publicBranding;
  }

  hydratePublicBranding(payload: PublicSiteBrandingDto): void {
    this._publicBranding = payload;
  }

  clear(): void {
    this._publicBranding = null;
  }
}

export const brandingStore = BrandingStore.getInstance();
