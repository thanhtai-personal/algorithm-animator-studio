import type {
  OrderPaymentMethod,
  ReturnFlowItemPayload,
} from '../../orders/types/orders-domain.type';
import type {
  OrderSummaryDto,
  OrderDetailDto,
} from '../../orders/types/orders-domain.type';

export const RETURN_ORDER_STATUS_VALUES = [
  'DRAFT',
  'CREATED',
  'RETURN_SETTLED',
  'COMPLETED',
  'CANCELLED',
] as const;

export type ReturnOrderStatus = (typeof RETURN_ORDER_STATUS_VALUES)[number];

export const RETURN_DEPOSIT_REFUND_STATUS_VALUES = [
  'PENDING',
  'REFUNDED',
  'NOT_REQUIRED',
] as const;

export type ReturnDepositRefundStatus =
  (typeof RETURN_DEPOSIT_REFUND_STATUS_VALUES)[number];

export interface ReturnOrderSummaryDto {
  id: string;
  branchId: string;
  returnCode: string;
  sourceRentalOrderId: string;
  sourceRentalOrderCode: string;
  sourceRentalOrderStatus: string;
  status: ReturnOrderStatus;
  depositRefundStatus: ReturnDepositRefundStatus;
  actualReturnDate: string;
  expectedReturnDate: string | null;
  totalAmount: number;
  depositCollectedAmount: number;
  depositRefundedAmount: number;
  outstandingAmount: number;
  note: string | null;
  internalNote: string | null;
  settledAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnOrderDetailDto {
  summary: ReturnOrderSummaryDto;
  sourceOrder: OrderDetailDto;
}

export interface ReturnOrderSourceItemDto {
  orderId: string;
  orderCode: string;
  orderStatus: string;
  customerName: string;
  customerPhone: string | null;
  itemCount: number;
  startDate: string;
  expectedReturnDate: string;
  totalAmount: number;
  depositPaid: number;
  refundableDeposit: number;
  outstandingAmount: number;
}

export interface ReturnOrderSourcesResponse {
  items: ReturnOrderSourceItemDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReturnOrderSourcesQuery {
  branchId?: string | null;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateReturnOrderPayload {
  sourceRentalOrderId: string;
  actualReturnDate: string;
  note?: string | null;
  internalNote?: string | null;
  status?: Extract<ReturnOrderStatus, 'DRAFT' | 'CREATED'>;
}

export interface TransitionReturnOrderStatusPayload {
  toStatus: Extract<ReturnOrderStatus, 'CREATED' | 'CANCELLED'>;
  reason?: string | null;
}

export interface SettleReturnOrderPayload {
  actualReturnDate?: string | null;
  items: ReturnFlowItemPayload[];
  customFeesAmount?: number | null;
  additionalCollectedAmount?: number | null;
  additionalCollectionMethod?: OrderPaymentMethod | null;
  additionalCollectionNote?: string | null;
  refundAmount?: number | null;
  refundMethod?: OrderPaymentMethod | null;
  refundReason?: string | null;
  refundNote?: string | null;
}

export interface ReturnOrderListItemDto {
  summary: ReturnOrderSummaryDto;
  sourceSummary: OrderSummaryDto;
}
