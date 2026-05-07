import { makeAutoObservable } from "mobx";
import type { ZaloMiniAppOrderDraftDto } from "@/lib/contracts";

class ZaloMiniAppOrderStore {
  currentDraft: ZaloMiniAppOrderDraftDto | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  hydrateDraft(draft: ZaloMiniAppOrderDraftDto | null): void {
    this.currentDraft = draft;
  }
}

export const zaloMiniAppOrderStore = new ZaloMiniAppOrderStore();
