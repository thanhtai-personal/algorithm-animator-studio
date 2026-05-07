import { useState } from "react";
import { zaloMiniAppAuthStore } from "@/features/auth/stores/zaloMiniAppAuthStore";
import { useZaloMiniAppOrderDraft } from "@/features/orders/hooks/useZaloMiniAppOrderDraft";
import {
  useCheckPaymentTransactionMutation,
  useCreatePaymentOrderMutation,
} from "@/features/checkout/queries/useZaloMiniAppCheckoutQueries";
import { zaloPaymentClientService } from "@/features/checkout/services/zaloPaymentClientService";
import { zaloCheckoutStore } from "@/features/checkout/stores/zaloCheckoutStore";

export function useZaloMiniAppCheckout() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const orderDraft = useZaloMiniAppOrderDraft();

  const createPaymentOrderMutation = useCreatePaymentOrderMutation(
    zaloMiniAppAuthStore.sessionToken
  );
  const checkTransactionMutation = useCheckPaymentTransactionMutation(
    zaloMiniAppAuthStore.sessionToken
  );

  const checkout = async () => {
    setErrorMessage(null);

    try {
      let draft = orderDraft.currentDraft;
      if (!draft) {
        draft = await orderDraft.createDraftFromCart();
      }

      const paymentOrderResponse = await createPaymentOrderMutation.mutateAsync(draft.id);
      const paymentOrder = paymentOrderResponse.paymentOrder;

      await zaloPaymentClientService.openPayment(paymentOrder);

      const transactionResponse = await checkTransactionMutation.mutateAsync(
        paymentOrder.externalOrderId
      );

      return transactionResponse.transaction;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Thanh toan that bai";
      setErrorMessage(message);
      throw error;
    }
  };

  return {
    orderDraft,
    paymentOrder: zaloCheckoutStore.paymentOrder,
    transaction: zaloCheckoutStore.transaction,
    checkout,
    errorMessage,
    isProcessing:
      orderDraft.isSubmitting ||
      createPaymentOrderMutation.isPending ||
      checkTransactionMutation.isPending,
  };
}
