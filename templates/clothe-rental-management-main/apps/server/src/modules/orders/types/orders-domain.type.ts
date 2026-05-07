import type {
  OrderStatus,
  OrderType,
} from '../../shared/domain/types/domain-primitives.type';

export type OrderDiscountType = 'amount' | 'percent' | null;
export type OrderRentPlanType = '1d' | '3d' | '7d' | 'custom' | null;
export type OrderPricingMode = 'STANDARD' | 'QUICK';
export type OrderPaymentType =
  | 'RENT'
  | 'DEPOSIT'
  | 'FEE'
  | 'REFUND'
  | 'EXPENSE';
export type OrderPaymentMethod = 'CASH' | 'BANK' | 'MOMO';
export type OrderPaymentReceiptMethod = Extract<
  OrderPaymentMethod,
  'CASH' | 'BANK'
>;
export type OrderPaymentStatus = 'POSTED' | 'VOIDED';
export type OrderIncidentType = 'LATE' | 'DAMAGE' | 'LOST' | 'CLEANING';
export type OrderIncidentStatus = 'OPEN' | 'SETTLED' | 'WAIVED';
export type ReturnItemCondition = 'OK' | 'NEED_CLEAN' | 'DAMAGE' | 'LOST';
export type ReturnItemTargetStatus =
  | 'READY'
  | 'LAUNDRY'
  | 'MAINTENANCE'
  | 'DAMAGED'
  | 'LOST';

export interface OrderCustomerRefDto {
  customerId: string;
  fullName: string;
  phone: string | null;
}

export interface OrderMoneySummaryDto {
  rentAmount: number;
  discountAmount: number;
  feesAmount: number;
  totalAmount: number;
  depositAmount: number;
  depositAppliedAmount: number;
  depositRefundedAmount: number;
  depositPaid: number;
  rentPaid: number;
  feePaid: number;
  refundPaid: number;
  revenueGross: number;
  refundEffective: number;
  revenueNet: number;
  cogs: number;
  grossProfit: number;
  profitMargin: number;
  depositCollectedTotal: number;
  depositRefundedTotal: number;
  receivableCollectedTotal: number;
  refundableDeposit: number;
  outstandingAmount: number;
}

export interface OrderPaymentDto {
  id: string;
  orderId: string;
  customerId: string | null;
  type: OrderPaymentType;
  method: OrderPaymentMethod;
  amount: number;
  status: OrderPaymentStatus;
  reason: string | null;
  source: string | null;
  note: string | null;
  referenceCode: string | null;
  voidReason: string | null;
  voidedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderIncidentDto {
  id: string;
  orderId: string;
  orderItemId: string | null;
  itemId: string | null;
  customerId: string | null;
  type: OrderIncidentType;
  status: OrderIncidentStatus;
  amount: number;
  applyToDeposit: boolean;
  description: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderActivityEntryDto {
  id: string;
  actorProfileId: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  reason: string | null;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface OrderItemDto {
  orderItemId: string;
  itemId: string;
  itemCode: string | null;
  itemStatus: string | null;
  productId: string;
  productName: string | null;
  variantId: string;
  variantName: string | null;
  rentPlanType: OrderRentPlanType;
  rentPlanDays: number | null;
  rentPrice: number;
  depositOverrideAmount: number | null;
  depositEffectiveAmount: number | null;
  cogsSnapshotAmount: number | null;
  conditionOutNote: string | null;
  conditionInNote: string | null;
  createdAt: string;
}

export interface ReservationWindowDto {
  id: string;
  orderId: string;
  itemId: string;
  sourceOrderStatus: OrderStatus;
  startDate: string;
  endDate: string;
  isActive: boolean;
  releasedAt: string | null;
  releaseReason: string | null;
}

export interface OrderSummaryDto {
  id: string;
  branchId: string;
  orderCode: string;
  orderType: OrderType;
  status: OrderStatus;
  startDate: string;
  endDate: string;
  pricingMode: OrderPricingMode | null;
  pickupTime: string | null;
  returnTime: string | null;
  note: string | null;
  internalNote: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  customer: OrderCustomerRefDto;
  itemCount: number;
  discountType: OrderDiscountType;
  discountValue: number | null;
  money: OrderMoneySummaryDto;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetailDto {
  summary: OrderSummaryDto;
  items: OrderItemDto[];
  payments: OrderPaymentDto[];
  incidents: OrderIncidentDto[];
  activity: OrderActivityEntryDto[];
  reservationWindows: ReservationWindowDto[];
  auditWritePoints: string[];
}

export interface OrderAvailabilityConflictDto {
  reservationWindowId: string;
  orderId: string;
  orderCode: string | null;
  sourceOrderStatus: OrderStatus;
  startDate: string;
  endDate: string;
}

export interface OrderAvailabilityItemDto {
  itemId: string;
  itemCode: string;
  itemStatus: string;
  isAvailable: boolean;
  reasons: string[];
  conflicts: OrderAvailabilityConflictDto[];
}

export interface OrderAvailabilityResponse {
  startDate: string;
  endDate: string;
  items: OrderAvailabilityItemDto[];
}

export interface OrderItemInputPayload {
  itemId: string;
  rentPlanType?: OrderRentPlanType;
  rentPlanDays?: number | null;
  rentPrice?: number | null;
  depositOverrideAmount?: number | null;
}

export interface CreateOrderPayload {
  branchId?: string | null;
  orderType?: OrderType;
  pricingMode?: OrderPricingMode | null;
  customerId: string;
  status?: 'DRAFT' | 'RESERVED' | 'CONFIRMED';
  startDate: string;
  endDate: string;
  pickupTime?: string | null;
  returnTime?: string | null;
  discountType?: OrderDiscountType;
  discountValue?: number | null;
  feesAmount?: number | null;
  depositAmount?: number | null;
  note?: string | null;
  internalNote?: string | null;
  items?: OrderItemInputPayload[];
  payments?: CreateOrderPaymentInputPayload[];
  paymentReceiptConfirmation?: CreateOrderPaymentReceiptConfirmationPayload | null;
}

export interface CreateOrderPaymentInputPayload {
  type: OrderPaymentType;
  method: OrderPaymentMethod;
  amount: number;
  status?: OrderPaymentStatus;
  reason?: string | null;
  source?: string | null;
  note?: string | null;
  referenceCode?: string | null;
}

export interface CreateOrderPaymentReceiptConfirmationPayload {
  confirmed: boolean;
  amount: number;
  method: OrderPaymentReceiptMethod;
  note?: string | null;
}

export interface UpdateOrderPayload {
  startDate?: string;
  endDate?: string;
  pickupTime?: string | null;
  returnTime?: string | null;
  discountType?: OrderDiscountType;
  discountValue?: number | null;
  feesAmount?: number | null;
  depositAmount?: number | null;
  note?: string | null;
  internalNote?: string | null;
}

export type AddOrderItemPayload = OrderItemInputPayload;

export interface UpdateOrderItemPricingPayload {
  rentPlanType?: OrderRentPlanType;
  rentPlanDays?: number | null;
  rentPrice?: number | null;
  depositOverrideAmount?: number | null;
}

export interface OrderStatusTransitionPayload {
  toStatus: OrderStatus;
  reason?: string | null;
}

export interface OrderCancelPayload {
  reason?: string | null;
  refundAmount?: number | null;
  refundMethod?: OrderPaymentMethod | null;
  refundReason?: string | null;
  refundNote?: string | null;
}

export interface AddOrderPaymentPayload {
  type: OrderPaymentType;
  method: OrderPaymentMethod;
  amount: number;
  reason?: string | null;
  source?: string | null;
  note?: string | null;
  referenceCode?: string | null;
}

export interface UpdateOrderPaymentStatusPayload {
  status: OrderPaymentStatus;
  voidReason?: string | null;
}

export interface CreateOrderIncidentPayload {
  orderItemId?: string | null;
  itemId?: string | null;
  type: OrderIncidentType;
  amount: number;
  applyToDeposit?: boolean;
  description?: string | null;
}

export interface PickupOrderPayload {
  note?: string | null;
  requireDepositPaid?: boolean;
  rentalPayment?: AddOrderPaymentPayload | null;
}

export interface ReturnFlowItemPayload {
  orderItemId?: string | null;
  itemId?: string | null;
  condition: ReturnItemCondition;
  note?: string | null;
  incidentAmount?: number | null;
  applyToDeposit?: boolean;
  targetStatus?: ReturnItemTargetStatus | null;
}

export interface ProcessOrderReturnPayload {
  returnedDate?: string | null;
  items: ReturnFlowItemPayload[];
  customFeesAmount?: number | null;
  additionalCollectedAmount?: number | null;
  additionalCollectionMethod?: OrderPaymentMethod | null;
  additionalCollectionNote?: string | null;
  refundAmount?: number | null;
  refundMethod?: OrderPaymentMethod | null;
  refundReason?: string | null;
  refundNote?: string | null;
  completeAfterReturn?: boolean;
}

export interface OrdersListQuery {
  branchId?: string | null;
  orderTypes?: OrderType[];
  statuses?: OrderStatus[];
  startDate?: string | null;
  endDate?: string | null;
  search?: string;
  staffId?: string | null;
  paymentStatus?: string | null;
  page?: number;
  pageSize?: number;
}

export interface OrdersListResponse {
  items: OrderSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OrdersAvailabilityQuery {
  branchId?: string | null;
  itemIds: string[];
  startDate: string;
  endDate: string;
  excludeOrderId?: string | null;
}

export const ORDER_AUDIT_ACTIONS = [
  'ORDER_CREATED',
  'ORDER_UPDATED',
  'ORDER_ITEMS_CHANGED',
  'ORDER_STATUS_CHANGED',
  'ORDER_CANCELLED',
  'ORDER_REFUND_RECORDED',
  'ORDER_PRICE_ADJUSTED',
  'ORDER_DEPOSIT_ADJUSTED',
  'ORDER_ITEM_LOST_MARKED',
  'ORDER_ITEM_DAMAGED_MARKED',
] as const;

export type OrderAuditAction = (typeof ORDER_AUDIT_ACTIONS)[number];
