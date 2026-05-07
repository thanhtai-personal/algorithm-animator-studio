import type { ZaloMiniAppDraftItemInput } from "@/lib/contracts";
import { zaloMiniAppCartStore } from "@/features/cart/stores/zaloMiniAppCartStore";

export function useZaloMiniAppCart() {
  return {
    items: zaloMiniAppCartStore.items,
    subtotalAmount: zaloMiniAppCartStore.subtotalAmount,
    addItem: (item: ZaloMiniAppDraftItemInput) => zaloMiniAppCartStore.addItem(item),
    removeItem: (productId: string) => zaloMiniAppCartStore.removeItem(productId),
    clear: () => zaloMiniAppCartStore.clear(),
  };
}
