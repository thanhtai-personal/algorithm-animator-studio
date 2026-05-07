import type { AppLocale } from "@/constants/locale";
import type {
  OrderPaymentMethod,
  ReturnItemCondition,
  ReturnItemTargetStatus,
} from "@/types/ordersDomain";
import type {
  ReturnDepositRefundStatus,
  ReturnOrderStatus,
} from "@/types/returnOrdersDomain";

export interface ReturnOrderModalCopy {
  title: string;
  description: string;
  steps: {
    source: string;
    settlement: string;
    workflow: string;
  };
  source: {
    searchPlaceholder: string;
    empty: string;
    selected: string;
    expectedReturn: string;
    customer: string;
    total: string;
    depositPaid: string;
    refundableDeposit: string;
    outstanding: string;
  };
  settlement: {
    actualReturnDate: string;
    requiredDate: string;
    customFees: string;
    additionalCollectedAmount: string;
    additionalCollectionMethod: string;
    additionalCollectionNote: string;
    outstandingBeforeReturn: string;
    estimatedAdditionalCharge: string;
    estimatedOutstandingAfterReturn: string;
    estimatedHint: string;
    refundAmount: string;
    refundMethod: string;
    refundReason: string;
    refundNote: string;
    itemCondition: string;
    itemTargetStatus: string;
    itemIncident: string;
    itemApplyDeposit: string;
    itemNote: string;
  };
  workflow: {
    returnOrderStatus: string;
    depositRefundStatus: string;
    sourceOrderStatus: string;
    saveDraft: string;
    createOrder: string;
    markCreated: string;
    settle: string;
    complete: string;
    cancel: string;
    blockedByRefund: string;
  };
  actions: {
    close: string;
    back: string;
    next: string;
  };
  messages: {
    invalidNumber: string;
    selectSource: string;
    createSuccess: string;
    settleSuccess: string;
    completeSuccess: string;
    cancelSuccess: string;
    createdSuccess: string;
    failed: string;
  };
}

export interface ReturnItemDraft {
  condition: ReturnItemCondition;
  targetStatus: ReturnItemTargetStatus;
  incidentAmount: string;
  applyToDeposit: boolean;
  note: string;
}

export interface UseReturnOrderModalOptions {
  locale: AppLocale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export type ReturnOrderModalCopyRecord = Record<AppLocale, ReturnOrderModalCopy>;

export type OrderPaymentMethodLabelKeys = Record<OrderPaymentMethod, string>;
export type ReturnItemConditionLabelKeys = Record<ReturnItemCondition, string>;
export type ReturnItemTargetStatusLabelKeys = Record<ReturnItemTargetStatus, string>;
export type ReturnOrderStatusLabelKeys = Record<ReturnOrderStatus, string>;
export type ReturnDepositRefundStatusLabelKeys = Record<ReturnDepositRefundStatus, string>;
