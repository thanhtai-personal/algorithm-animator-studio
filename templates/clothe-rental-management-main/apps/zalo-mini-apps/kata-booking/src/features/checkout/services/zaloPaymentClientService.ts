import type { ZaloMiniAppPaymentOrderDto } from "@/lib/contracts";
import { zaloSdkService } from "@/features/platform/services/zaloSdkService";

export const zaloPaymentClientService = {
  async openPayment(order: ZaloMiniAppPaymentOrderDto): Promise<void> {
    await zaloSdkService.openPayment({
      orderId: order.externalOrderId,
      amount: order.amount,
      description: order.description,
      checksum: order.checksum,
    });
  },
};
