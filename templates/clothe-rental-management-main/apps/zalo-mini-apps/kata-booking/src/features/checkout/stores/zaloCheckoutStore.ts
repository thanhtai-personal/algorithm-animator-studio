import { makeAutoObservable } from "mobx";
import type {
  ZaloMiniAppPaymentOrderDto,
  ZaloMiniAppPaymentTransactionDto,
} from "@/lib/contracts";

class ZaloCheckoutStore {
  paymentOrder: ZaloMiniAppPaymentOrderDto | null = null;
  transaction: ZaloMiniAppPaymentTransactionDto | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  hydratePaymentOrder(order: ZaloMiniAppPaymentOrderDto | null): void {
    this.paymentOrder = order;
  }

  hydrateTransaction(transaction: ZaloMiniAppPaymentTransactionDto | null): void {
    this.transaction = transaction;
  }
}

export const zaloCheckoutStore = new ZaloCheckoutStore();
