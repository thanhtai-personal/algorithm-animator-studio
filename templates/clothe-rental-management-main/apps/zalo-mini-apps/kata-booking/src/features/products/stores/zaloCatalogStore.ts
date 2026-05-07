import { makeAutoObservable } from "mobx";
import type { ZaloMiniAppProductSummaryDto } from "@/lib/contracts";

class ZaloCatalogStore {
  items: ZaloMiniAppProductSummaryDto[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  hydrateItems(items: ZaloMiniAppProductSummaryDto[]): void {
    this.items = items;
  }
}

export const zaloCatalogStore = new ZaloCatalogStore();
