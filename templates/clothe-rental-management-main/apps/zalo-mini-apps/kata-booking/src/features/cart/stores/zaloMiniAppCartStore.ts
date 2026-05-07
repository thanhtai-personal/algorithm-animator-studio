import { makeAutoObservable } from "mobx";
import type { ZaloMiniAppDraftItemInput } from "@/lib/contracts";

class ZaloMiniAppCartStore {
  items: ZaloMiniAppDraftItemInput[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  addItem(item: ZaloMiniAppDraftItemInput): void {
    const existing = this.items.find((entry) => entry.productId === item.productId);
    if (!existing) {
      this.items = [
        ...this.items,
        {
          ...item,
          quantity: Math.max(1, Math.floor(item.quantity)),
          unitPrice: Math.max(0, item.unitPrice),
        },
      ];
      return;
    }

    existing.quantity = Math.max(1, Math.floor(existing.quantity + item.quantity));
  }

  removeItem(productId: string): void {
    this.items = this.items.filter((entry) => entry.productId !== productId);
  }

  clear(): void {
    this.items = [];
  }

  get subtotalAmount(): number {
    return this.items.reduce(
      (sum, entry) => sum + Math.max(1, entry.quantity) * Math.max(0, entry.unitPrice),
      0
    );
  }
}

export const zaloMiniAppCartStore = new ZaloMiniAppCartStore();
