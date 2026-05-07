import { requestJson } from "@/lib/httpClient";
import type {
  ZaloMiniAppPaymentOrderDto,
  ZaloMiniAppPaymentTransactionDto,
} from "@/lib/contracts";

interface CreatePaymentOrderResponse {
  paymentOrder: ZaloMiniAppPaymentOrderDto;
}

interface CheckTransactionResponse {
  transaction: ZaloMiniAppPaymentTransactionDto;
}

function resolveMiniAppAppId(): string {
  const fromVite = import.meta.env.VITE_ZALO_APP_ID as string | undefined;
  if (typeof fromVite === "string" && fromVite.trim().length > 0) {
    return fromVite.trim();
  }

  const fromAppId = import.meta.env.APP_ID as string | undefined;
  if (typeof fromAppId === "string" && fromAppId.trim().length > 0) {
    return fromAppId.trim();
  }

  throw new Error("Missing VITE_ZALO_APP_ID (or APP_ID) for Zalo payment order.");
}

export const zaloMiniAppCheckoutApiService = {
  createPaymentOrder(draftId: string, sessionToken: string): Promise<CreatePaymentOrderResponse> {
    return requestJson<CreatePaymentOrderResponse>("/api/v1/payments/mini-app/create-order", {
      method: "POST",
      body: { draftId, appId: resolveMiniAppAppId() },
      sessionToken,
    });
  },

  checkTransaction(
    externalOrderId: string,
    sessionToken: string
  ): Promise<CheckTransactionResponse> {
    const query = new URLSearchParams({ externalOrderId });
    return requestJson<CheckTransactionResponse>(
      `/api/v1/payments/mini-app/check-transaction?${query.toString()}`,
      { sessionToken }
    );
  },
};
