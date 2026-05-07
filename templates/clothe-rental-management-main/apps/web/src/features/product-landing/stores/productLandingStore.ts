import { makeAutoObservable } from "mobx";
import type { ShowroomProductCardDto } from "@/types/productsCatalog";
import type { PublicShowroomPageConfigDto } from "@/types/settingsModule";

class ProductLandingStore {
  private static _instance: ProductLandingStore | null = null;

  private _config: PublicShowroomPageConfigDto | null = null;
  private _featuredProducts: ShowroomProductCardDto[] = [];

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new ProductLandingStore();
    }

    return this._instance;
  }

  get config(): PublicShowroomPageConfigDto | null {
    return this._config;
  }

  get featuredProducts(): ShowroomProductCardDto[] {
    return this._featuredProducts;
  }

  hydrateConfig(payload: PublicShowroomPageConfigDto | null): void {
    this._config = payload;
  }

  hydrateFeaturedProducts(payload: ShowroomProductCardDto[]): void {
    this._featuredProducts = payload;
  }

  clear(): void {
    this._config = null;
    this._featuredProducts = [];
  }
}

export const productLandingStore = ProductLandingStore.getInstance();
