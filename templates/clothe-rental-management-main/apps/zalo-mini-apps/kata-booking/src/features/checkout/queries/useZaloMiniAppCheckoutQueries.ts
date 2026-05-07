import { useMutation } from "@tanstack/react-query";
import { zaloMiniAppCheckoutApiService } from "@/features/checkout/services/zaloMiniAppCheckoutApiService";
import { zaloCheckoutStore } from "@/features/checkout/stores/zaloCheckoutStore";

export function useCreatePaymentOrderMutation(sessionToken: string | null) {
  return useMutation({
    mutationFn: async (draftId: string) => {
      if (!sessionToken) throw new Error("Missing mini app session");
      return zaloMiniAppCheckoutApiService.createPaymentOrder(draftId, sessionToken);
    },
    onSuccess: (response) => {
      zaloCheckoutStore.hydratePaymentOrder(response.paymentOrder);
    },
  });
}

export function useCheckPaymentTransactionMutation(sessionToken: string | null) {
  return useMutation({
    mutationFn: async (externalOrderId: string) => {
      if (!sessionToken) throw new Error("Missing mini app session");
      return zaloMiniAppCheckoutApiService.checkTransaction(externalOrderId, sessionToken);
    },
    onSuccess: (response) => {
      zaloCheckoutStore.hydrateTransaction(response.transaction);
    },
  });
}
