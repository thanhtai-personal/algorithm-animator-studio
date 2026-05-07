import { useState } from "react";
import { useZaloMiniAppCart } from "@/features/cart/hooks/useZaloMiniAppCart";
import { zaloMiniAppAuthStore } from "@/features/auth/stores/zaloMiniAppAuthStore";
import {
  useCreateOrderDraftMutation,
  useOrderDraftDetailQuery,
} from "@/features/orders/queries/useZaloMiniAppOrderDraftQueries";
import { zaloMiniAppOrderStore } from "@/features/orders/stores/zaloMiniAppOrderStore";

export function useZaloMiniAppOrderDraft() {
  const cart = useZaloMiniAppCart();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const createDraftMutation = useCreateOrderDraftMutation(zaloMiniAppAuthStore.sessionToken);
  const draftQuery = useOrderDraftDetailQuery(draftId, zaloMiniAppAuthStore.sessionToken);

  const createDraftFromCart = async () => {
    if (cart.items.length === 0) {
      throw new Error("Gio hang dang trong");
    }

    const response = await createDraftMutation.mutateAsync({
      items: cart.items,
      note,
    });

    setDraftId(response.draft.id);
    return response.draft;
  };

  return {
    note,
    setNote,
    createDraftFromCart,
    isSubmitting: createDraftMutation.isPending,
    currentDraft: zaloMiniAppOrderStore.currentDraft,
    draftQuery,
  };
}
