import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { readJsonBodyAsRecord } from '../../../common/http/request-body.util';
import { getAuthenticatedSupabaseClient } from '../../../common/supabase/request-authenticated-client.util';

import {
  ORDER_STATUS_VALUES,
  ORDER_TYPE_VALUES,
} from '../../shared/domain/domain-primitives.constants';
import {
  addOrderIncidentForAdmin,
  addOrderPaymentForAdmin,
  addOrderItemForAdmin,
  cancelOrderForAdmin,
  checkOrderAvailabilityForAdmin,
  completeOrderForAdmin,
  createOrderForAdmin,
  getOrderDetailForAdmin,
  listOrdersForAdmin,
  OrdersDomainError,
  pickupOrderForAdmin,
  processOrderReturnForAdmin,
  removeOrderItemForAdmin,
  settleDebtOrderForAdmin,
  transitionOrderStatusForAdmin,
  updateOrderPaymentStatusForAdmin,
  updateOrderForAdmin,
  updateOrderItemPricingForAdmin,
} from '../infrastructure/orders.data-access';
import {
  notifyOrderPaymentException,
  notifyOrderStatusChanged,
  runNotificationSideEffect,
} from '../infrastructure/orders.notification-side-effects';
import type {
  OrderStatus,
  OrderType,
} from '../../shared/domain/types/domain-primitives.type';
import type {
  AddOrderPaymentPayload,
  CreateOrderIncidentPayload,
  CreateOrderPayload,
  OrderCancelPayload,
  OrderDiscountType,
  OrderIncidentType,
  OrderItemInputPayload,
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderPaymentType,
  OrderPricingMode,
  OrderRentPlanType,
  OrderStatusTransitionPayload,
  PickupOrderPayload,
  ProcessOrderReturnPayload,
  ReturnFlowItemPayload,
  ReturnItemCondition,
  ReturnItemTargetStatus,
  UpdateOrderPaymentStatusPayload,
  UpdateOrderItemPricingPayload,
  UpdateOrderPayload,
} from '../types/orders-domain.type';

const ORDER_STATUS_SET = new Set<string>(ORDER_STATUS_VALUES);
const ORDER_TYPE_SET = new Set<string>(ORDER_TYPE_VALUES);
const ORDER_PAYMENT_TYPE_SET = new Set<string>([
  'RENT',
  'DEPOSIT',
  'FEE',
  'REFUND',
]);
const ORDER_PAYMENT_METHOD_SET = new Set<string>(['CASH', 'BANK', 'MOMO']);
const ORDER_PAYMENT_STATUS_SET = new Set<string>(['POSTED', 'VOIDED']);
const ORDER_PRICING_MODE_SET = new Set<string>(['STANDARD', 'QUICK']);
const CREATE_ORDER_PAYMENT_TYPE_ALIAS_MAP: Record<string, OrderPaymentType> = {
  DEPOSIT_REFUND: 'REFUND',
  RENT_REFUND: 'REFUND',
};
const CREATE_ORDER_PAYMENT_METHOD_ALIAS_MAP: Record<
  string,
  OrderPaymentMethod
> = {
  BANK_TRANSFER: 'BANK',
};
const CREATE_ORDER_PAYMENT_STATUS_ALIAS_MAP: Record<
  string,
  OrderPaymentStatus
> = {
  PENDING: 'POSTED',
};
const ORDER_INCIDENT_TYPE_SET = new Set<string>([
  'LATE',
  'DAMAGE',
  'LOST',
  'CLEANING',
]);
const RETURN_ITEM_CONDITION_SET = new Set<string>([
  'OK',
  'NEED_CLEAN',
  'DAMAGE',
  'LOST',
]);
const RETURN_ITEM_TARGET_STATUS_SET = new Set<string>([
  'READY',
  'LAUNDRY',
  'MAINTENANCE',
  'DAMAGED',
  'LOST',
]);
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 80;

export interface OrdersApiResult {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
  isRaw?: boolean;
}

function jsonResult(
  body: unknown,
  init?: { status?: number },
): OrdersApiResult {
  return {
    status: init?.status ?? 200,
    body,
  };
}

function getSearchParams(request: Request): URLSearchParams {
  const origin = 'http://localhost';
  const sourceUrl =
    (typeof request.originalUrl === 'string' && request.originalUrl) ||
    request.url ||
    '/';
  return new URL(sourceUrl, origin).searchParams;
}

function parseString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDateString(value: unknown): string | null {
  const text = parseString(value);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return text;
}

function parseOrderStatus(
  value: string | null | undefined,
): OrderStatus | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_STATUS_SET.has(normalized)) {
    return null;
  }

  return normalized as OrderStatus;
}

function parseOrderType(value: unknown): OrderType | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_TYPE_SET.has(normalized)) return null;
  return normalized as OrderType;
}

function parseOrderPricingMode(value: unknown): OrderPricingMode | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_PRICING_MODE_SET.has(normalized)) return null;
  return normalized as OrderPricingMode;
}

function parseInteger(
  value: string | null | undefined,
  fallback: number,
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseNumeric(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return null;
}

function parseOrderPaymentType(value: unknown): OrderPaymentType | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_PAYMENT_TYPE_SET.has(normalized)) return null;
  return normalized as OrderPaymentType;
}

function parseOrderPaymentMethod(value: unknown): OrderPaymentMethod | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_PAYMENT_METHOD_SET.has(normalized)) return null;
  return normalized as OrderPaymentMethod;
}

function parseOrderPaymentStatus(value: unknown): OrderPaymentStatus | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_PAYMENT_STATUS_SET.has(normalized)) return null;
  return normalized as OrderPaymentStatus;
}

function parseCreateOrderPaymentType(value: unknown): OrderPaymentType | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (ORDER_PAYMENT_TYPE_SET.has(normalized)) {
    return normalized as OrderPaymentType;
  }

  return CREATE_ORDER_PAYMENT_TYPE_ALIAS_MAP[normalized] ?? null;
}

function parseCreateOrderPaymentMethod(
  value: unknown,
): OrderPaymentMethod | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (ORDER_PAYMENT_METHOD_SET.has(normalized)) {
    return normalized as OrderPaymentMethod;
  }

  return CREATE_ORDER_PAYMENT_METHOD_ALIAS_MAP[normalized] ?? null;
}

function parseCreateOrderPaymentStatus(
  value: unknown,
): OrderPaymentStatus | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (ORDER_PAYMENT_STATUS_SET.has(normalized)) {
    return normalized as OrderPaymentStatus;
  }

  return CREATE_ORDER_PAYMENT_STATUS_ALIAS_MAP[normalized] ?? null;
}

function parseCreateOrderPaymentReceiptConfirmation(
  value: unknown,
): CreateOrderPayload['paymentReceiptConfirmation'] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  const confirmed = parseBoolean(record.confirmed);
  const amount = parseNumeric(record.amount);
  const method = parseString(record.method)?.toUpperCase() ?? null;
  if (
    confirmed !== true ||
    amount === null ||
    amount <= 0 ||
    (method !== 'CASH' && method !== 'BANK')
  ) {
    return null;
  }

  return {
    confirmed: true,
    amount,
    method,
    note: record.note === undefined ? undefined : parseString(record.note),
  };
}

function parseOrderIncidentType(value: unknown): OrderIncidentType | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_INCIDENT_TYPE_SET.has(normalized)) return null;
  return normalized as OrderIncidentType;
}

function parseReturnItemCondition(value: unknown): ReturnItemCondition | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!RETURN_ITEM_CONDITION_SET.has(normalized)) return null;
  return normalized as ReturnItemCondition;
}

function parseReturnItemTargetStatus(
  value: unknown,
): ReturnItemTargetStatus | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!RETURN_ITEM_TARGET_STATUS_SET.has(normalized)) return null;
  return normalized as ReturnItemTargetStatus;
}

function parseDiscountType(value: unknown): OrderDiscountType | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (value === 'amount' || value === 'percent') {
    return value;
  }
  return undefined;
}

function parseRentPlanType(value: unknown): OrderRentPlanType | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  if (
    value === '1d' ||
    value === '3d' ||
    value === '7d' ||
    value === 'custom'
  ) {
    return value;
  }

  return undefined;
}

function parseOrderItemInput(value: unknown): OrderItemInputPayload | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const itemId = parseString(record.itemId);
  if (!itemId) return null;

  const rentPlanType = parseRentPlanType(record.rentPlanType);
  if (record.rentPlanType !== undefined && rentPlanType === undefined) {
    return null;
  }

  const rentPlanDays =
    record.rentPlanDays === undefined
      ? null
      : parseNumeric(record.rentPlanDays);

  if (
    record.rentPlanDays !== undefined &&
    (rentPlanDays === null ||
      !Number.isInteger(rentPlanDays) ||
      rentPlanDays <= 0)
  ) {
    return null;
  }

  const rentPrice =
    record.rentPrice === undefined ? null : parseNumeric(record.rentPrice);
  if (record.rentPrice !== undefined && (rentPrice === null || rentPrice < 0)) {
    return null;
  }

  const depositOverrideAmount =
    record.depositOverrideAmount === undefined
      ? null
      : parseNumeric(record.depositOverrideAmount);
  if (
    record.depositOverrideAmount !== undefined &&
    (depositOverrideAmount === null || depositOverrideAmount < 0)
  ) {
    return null;
  }

  return {
    itemId,
    rentPlanType,
    rentPlanDays: rentPlanDays ?? undefined,
    rentPrice: rentPrice ?? undefined,
    depositOverrideAmount: depositOverrideAmount ?? undefined,
  };
}

type CreateOrderPayloadParseErrorCode =
  | 'INVALID_PAYMENT_TYPE'
  | 'INVALID_PAYMENT_METHOD'
  | 'INVALID_PAYMENT_STATUS'
  | 'PAYMENT_AMOUNT_INVALID'
  | 'INVALID_DISCOUNT_VALUE'
  | 'INVALID_FEES_AMOUNT'
  | 'INVALID_DEPOSIT_AMOUNT';

interface CreateOrderPayloadParseResult {
  payload: CreateOrderPayload | null;
  errorCode?: CreateOrderPayloadParseErrorCode;
  errorContext?: Record<string, unknown>;
}

function parseCreateOrderPaymentInput(
  value: unknown,
  paymentIndex: number,
): {
  payment: NonNullable<CreateOrderPayload['payments']>[number] | null;
  errorCode?: CreateOrderPayloadParseErrorCode;
  errorContext?: Record<string, unknown>;
} {
  if (!value || typeof value !== 'object') {
    return { payment: null };
  }

  const record = value as Record<string, unknown>;
  const amount = parseNumeric(record.amount);
  if (amount === null) {
    // Ignore empty payment drafts so create-order is not blocked by placeholder entries.
    return { payment: null };
  }

  if (amount <= 0) {
    return {
      payment: null,
      errorCode: 'PAYMENT_AMOUNT_INVALID',
      errorContext: {
        reason: 'create-order-payment-amount-must-be-positive',
        paymentIndex,
        amount: record.amount,
      },
    };
  }

  const type = parseCreateOrderPaymentType(record.type);
  if (!type) {
    return {
      payment: null,
      errorCode: 'INVALID_PAYMENT_TYPE',
      errorContext: {
        reason: 'create-order-payment-type-invalid',
        paymentIndex,
        type: record.type,
      },
    };
  }

  const method = parseCreateOrderPaymentMethod(record.method);
  if (!method) {
    return {
      payment: null,
      errorCode: 'INVALID_PAYMENT_METHOD',
      errorContext: {
        reason: 'create-order-payment-method-invalid',
        paymentIndex,
        method: record.method,
      },
    };
  }

  const statusRaw = record.status;
  let status: OrderPaymentStatus | undefined;
  if (statusRaw !== undefined && statusRaw !== null && statusRaw !== '') {
    const normalizedStatus = parseCreateOrderPaymentStatus(statusRaw);
    if (!normalizedStatus) {
      return {
        payment: null,
        errorCode: 'INVALID_PAYMENT_STATUS',
        errorContext: {
          reason: 'create-order-payment-status-invalid',
          paymentIndex,
          status: statusRaw,
        },
      };
    }

    status = normalizedStatus;
  }

  return {
    payment: {
      type,
      method,
      amount,
      status,
      reason:
        record.reason === undefined ? undefined : parseString(record.reason),
      source:
        record.source === undefined ? undefined : parseString(record.source),
      note: record.note === undefined ? undefined : parseString(record.note),
      referenceCode:
        record.referenceCode === undefined
          ? undefined
          : parseString(record.referenceCode),
    },
  };
}

function parseCreateNullableNonNegativeNumber(
  body: Record<string, unknown>,
  field: 'discountValue' | 'feesAmount' | 'depositAmount',
  errorCode:
    | 'INVALID_DISCOUNT_VALUE'
    | 'INVALID_FEES_AMOUNT'
    | 'INVALID_DEPOSIT_AMOUNT',
): {
  value: number | null;
  errorCode?: CreateOrderPayloadParseErrorCode;
  errorContext?: Record<string, unknown>;
} {
  if (!Object.prototype.hasOwnProperty.call(body, field)) {
    return { value: null };
  }

  const rawValue = body[field];
  if (rawValue === null) {
    return { value: null };
  }

  const parsedValue = parseNumeric(rawValue);
  if (parsedValue === null || parsedValue < 0) {
    return {
      value: null,
      errorCode,
      errorContext: {
        reason: `create-order-${field}-invalid`,
        field,
        value: rawValue,
      },
    };
  }

  return { value: parsedValue };
}

function parseCreateOrderPayload(
  body: Record<string, unknown>,
): CreateOrderPayloadParseResult {
  const orderType =
    body.orderType === undefined ? 'RENTAL' : parseOrderType(body.orderType);
  if (!orderType) {
    return { payload: null };
  }

  const customerId = parseString(body.customerId);
  const startDate = parseDateString(body.startDate);
  const endDate = parseDateString(body.endDate);
  const pricingMode = parseOrderPricingMode(body.pricingMode);

  if (!customerId || !startDate || !endDate) {
    return { payload: null };
  }

  if (
    orderType === 'RENTAL' &&
    body.pricingMode !== undefined &&
    !pricingMode
  ) {
    return { payload: null };
  }

  if (
    orderType === 'SALE' &&
    body.pricingMode !== undefined &&
    body.pricingMode !== null &&
    !pricingMode
  ) {
    return { payload: null };
  }

  const status = parseString(body.status);
  const isSaleStatusAllowed =
    !status || status === 'DRAFT' || status === 'CONFIRMED';
  const isRentalStatusAllowed =
    !status ||
    status === 'DRAFT' ||
    status === 'RESERVED' ||
    status === 'CONFIRMED';
  if (
    (orderType === 'SALE' && !isSaleStatusAllowed) ||
    (orderType === 'RENTAL' && !isRentalStatusAllowed)
  ) {
    return { payload: null };
  }

  const discountType = parseDiscountType(body.discountType);
  if (body.discountType !== undefined && discountType === undefined) {
    return { payload: null };
  }

  const discountValueParse = parseCreateNullableNonNegativeNumber(
    body,
    'discountValue',
    'INVALID_DISCOUNT_VALUE',
  );
  if (discountValueParse.errorCode) {
    return {
      payload: null,
      errorCode: discountValueParse.errorCode,
      errorContext: discountValueParse.errorContext,
    };
  }
  const discountValue = discountValueParse.value;

  const feesAmountParse = parseCreateNullableNonNegativeNumber(
    body,
    'feesAmount',
    'INVALID_FEES_AMOUNT',
  );
  if (feesAmountParse.errorCode) {
    return {
      payload: null,
      errorCode: feesAmountParse.errorCode,
      errorContext: feesAmountParse.errorContext,
    };
  }
  const feesAmount = feesAmountParse.value;

  const depositAmountParse = parseCreateNullableNonNegativeNumber(
    body,
    'depositAmount',
    'INVALID_DEPOSIT_AMOUNT',
  );
  if (depositAmountParse.errorCode) {
    return {
      payload: null,
      errorCode: depositAmountParse.errorCode,
      errorContext: depositAmountParse.errorContext,
    };
  }
  const depositAmount = depositAmountParse.value;

  let items: OrderItemInputPayload[] | undefined;
  if (body.items !== undefined) {
    if (!Array.isArray(body.items)) return { payload: null };

    items = [];
    for (const entry of body.items) {
      const parsedItem = parseOrderItemInput(entry);
      if (!parsedItem) return { payload: null };
      items.push(parsedItem);
    }
  }

  let payments: NonNullable<CreateOrderPayload['payments']> | undefined;
  if (body.payments !== undefined) {
    if (!Array.isArray(body.payments)) {
      return {
        payload: null,
        errorCode: 'PAYMENT_AMOUNT_INVALID',
        errorContext: {
          reason: 'create-order-payments-must-be-array',
        },
      };
    }

    payments = [];
    for (const [index, entry] of body.payments.entries()) {
      const parsed = parseCreateOrderPaymentInput(entry, index);
      if (parsed.errorCode) {
        return {
          payload: null,
          errorCode: parsed.errorCode,
          errorContext: parsed.errorContext,
        };
      }

      if (parsed.payment) {
        payments.push(parsed.payment);
      }
    }
  }

  const paymentReceiptConfirmation = parseCreateOrderPaymentReceiptConfirmation(
    body.paymentReceiptConfirmation,
  );
  if (
    body.paymentReceiptConfirmation !== undefined &&
    paymentReceiptConfirmation === null
  ) {
    return { payload: null };
  }

  return {
    payload: {
      branchId: parseString(body.branchId),
      orderType,
      pricingMode: orderType === 'RENTAL' ? (pricingMode ?? 'STANDARD') : null,
      customerId,
      status: (status as CreateOrderPayload['status']) ?? undefined,
      startDate,
      endDate,
      pickupTime:
        body.pickupTime === undefined
          ? undefined
          : parseString(body.pickupTime),
      returnTime:
        body.returnTime === undefined
          ? undefined
          : parseString(body.returnTime),
      discountType,
      discountValue,
      feesAmount,
      depositAmount,
      note: body.note === undefined ? undefined : parseString(body.note),
      internalNote:
        body.internalNote === undefined
          ? undefined
          : parseString(body.internalNote),
      items,
      payments: payments && payments.length > 0 ? payments : undefined,
      paymentReceiptConfirmation,
    },
  };
}

function parseUpdateOrderPayload(
  body: Record<string, unknown>,
): UpdateOrderPayload | null {
  const payload: UpdateOrderPayload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'startDate')) {
    const startDate = parseDateString(body.startDate);
    if (!startDate) return null;
    payload.startDate = startDate;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'endDate')) {
    const endDate = parseDateString(body.endDate);
    if (!endDate) return null;
    payload.endDate = endDate;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'pickupTime')) {
    payload.pickupTime = parseString(body.pickupTime);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'returnTime')) {
    payload.returnTime = parseString(body.returnTime);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'discountType')) {
    const discountType = parseDiscountType(body.discountType);
    if (discountType === undefined) return null;
    payload.discountType = discountType;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'discountValue')) {
    const discountValue = parseNumeric(body.discountValue);
    if (discountValue === null || discountValue < 0) return null;
    payload.discountValue = discountValue;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'feesAmount')) {
    const feesAmount = parseNumeric(body.feesAmount);
    if (feesAmount === null || feesAmount < 0) return null;
    payload.feesAmount = feesAmount;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'depositAmount')) {
    const depositAmount = parseNumeric(body.depositAmount);
    if (depositAmount === null || depositAmount < 0) return null;
    payload.depositAmount = depositAmount;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'note')) {
    payload.note = parseString(body.note);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'internalNote')) {
    payload.internalNote = parseString(body.internalNote);
  }

  if (Object.keys(payload).length === 0) {
    return null;
  }

  return payload;
}

function parseTransitionPayload(
  body: Record<string, unknown>,
): OrderStatusTransitionPayload | null {
  const toStatus = parseString(body.toStatus);
  if (
    !toStatus ||
    (toStatus !== 'DRAFT' &&
      toStatus !== 'RESERVED' &&
      toStatus !== 'CONFIRMED' &&
      toStatus !== 'PICKED_UP' &&
      toStatus !== 'RETURNED' &&
      toStatus !== 'DEBT' &&
      toStatus !== 'COMPLETED' &&
      toStatus !== 'CANCELLED')
  ) {
    return null;
  }

  return {
    toStatus,
    reason: parseString(body.reason),
  };
}

function parseCancelPayload(
  body: Record<string, unknown>,
): OrderCancelPayload | null {
  const refundAmount =
    body.refundAmount === undefined ? null : parseNumeric(body.refundAmount);
  const refundMethod =
    body.refundMethod === undefined
      ? undefined
      : body.refundMethod === null || body.refundMethod === ''
        ? null
        : parseOrderPaymentMethod(body.refundMethod);

  if (
    body.refundAmount !== undefined &&
    (refundAmount === null || refundAmount < 0)
  ) {
    return null;
  }

  if (
    body.refundMethod !== undefined &&
    refundMethod === null &&
    body.refundMethod !== null &&
    body.refundMethod !== ''
  ) {
    return null;
  }

  return {
    reason: parseString(body.reason),
    refundAmount: body.refundAmount === undefined ? undefined : refundAmount,
    refundMethod,
    refundReason:
      body.refundReason === undefined
        ? undefined
        : parseString(body.refundReason),
    refundNote:
      body.refundNote === undefined ? undefined : parseString(body.refundNote),
  };
}

function parseAddOrderPaymentPayload(
  body: Record<string, unknown>,
): AddOrderPaymentPayload | null {
  const type = parseOrderPaymentType(body.type);
  const method = parseOrderPaymentMethod(body.method);
  const amount = parseNumeric(body.amount);

  if (!type || !method || amount === null || amount <= 0) {
    return null;
  }

  return {
    type,
    method,
    amount,
    reason: body.reason === undefined ? undefined : parseString(body.reason),
    source: body.source === undefined ? undefined : parseString(body.source),
    note: body.note === undefined ? undefined : parseString(body.note),
    referenceCode:
      body.referenceCode === undefined
        ? undefined
        : parseString(body.referenceCode),
  };
}

function parseUpdateOrderPaymentStatusPayload(
  body: Record<string, unknown>,
): UpdateOrderPaymentStatusPayload | null {
  const status = parseOrderPaymentStatus(body.status);
  if (!status) return null;

  return {
    status,
    voidReason:
      body.voidReason === undefined ? undefined : parseString(body.voidReason),
  };
}

function parseCreateOrderIncidentPayload(
  body: Record<string, unknown>,
): CreateOrderIncidentPayload | null {
  const type = parseOrderIncidentType(body.type);
  const amount = parseNumeric(body.amount);

  if (!type || amount === null || amount < 0) {
    return null;
  }

  const applyToDepositRaw =
    body.applyToDeposit === undefined
      ? undefined
      : parseBoolean(body.applyToDeposit);
  if (body.applyToDeposit !== undefined && applyToDepositRaw === null) {
    return null;
  }

  return {
    orderItemId:
      body.orderItemId === undefined
        ? undefined
        : parseString(body.orderItemId),
    itemId: body.itemId === undefined ? undefined : parseString(body.itemId),
    type,
    amount,
    applyToDeposit: applyToDepositRaw ?? undefined,
    description:
      body.description === undefined
        ? undefined
        : parseString(body.description),
  };
}

function parsePickupOrderPayload(
  body: Record<string, unknown>,
): PickupOrderPayload | null {
  const requireDepositPaidRaw =
    body.requireDepositPaid === undefined
      ? undefined
      : parseBoolean(body.requireDepositPaid);
  if (body.requireDepositPaid !== undefined && requireDepositPaidRaw === null) {
    return null;
  }

  let rentalPayment: PickupOrderPayload['rentalPayment'] | undefined;
  if (body.rentalPayment !== undefined && body.rentalPayment !== null) {
    const parsed = parseAddOrderPaymentPayload(
      body.rentalPayment as Record<string, unknown>,
    );
    if (!parsed) return null;
    rentalPayment = parsed;
  }

  return {
    note: body.note === undefined ? undefined : parseString(body.note),
    requireDepositPaid: requireDepositPaidRaw ?? undefined,
    rentalPayment,
  };
}

function parseReturnFlowItemPayload(
  value: unknown,
): ReturnFlowItemPayload | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;

  const condition = parseReturnItemCondition(record.condition);
  if (!condition) return null;

  const incidentAmount =
    record.incidentAmount === undefined
      ? null
      : parseNumeric(record.incidentAmount);
  if (
    record.incidentAmount !== undefined &&
    (incidentAmount === null || incidentAmount < 0)
  ) {
    return null;
  }

  const applyToDepositRaw =
    record.applyToDeposit === undefined
      ? undefined
      : parseBoolean(record.applyToDeposit);
  if (record.applyToDeposit !== undefined && applyToDepositRaw === null) {
    return null;
  }

  const targetStatus = parseReturnItemTargetStatus(record.targetStatus);
  if (
    record.targetStatus !== undefined &&
    record.targetStatus !== null &&
    record.targetStatus !== '' &&
    targetStatus === null
  ) {
    return null;
  }

  return {
    orderItemId:
      record.orderItemId === undefined
        ? undefined
        : parseString(record.orderItemId),
    itemId:
      record.itemId === undefined ? undefined : parseString(record.itemId),
    condition,
    note: record.note === undefined ? undefined : parseString(record.note),
    incidentAmount:
      record.incidentAmount === undefined ? undefined : incidentAmount,
    applyToDeposit: applyToDepositRaw ?? undefined,
    targetStatus: targetStatus ?? undefined,
  };
}

function parseProcessOrderReturnPayload(
  body: Record<string, unknown>,
): ProcessOrderReturnPayload | null {
  if (!Array.isArray(body.items)) return null;

  const items: ReturnFlowItemPayload[] = [];
  for (const value of body.items) {
    const parsedItem = parseReturnFlowItemPayload(value);
    if (!parsedItem) return null;
    items.push(parsedItem);
  }

  if (items.length === 0) return null;

  const customFeesAmount =
    body.customFeesAmount === undefined
      ? null
      : parseNumeric(body.customFeesAmount);
  if (
    body.customFeesAmount !== undefined &&
    body.customFeesAmount !== null &&
    (customFeesAmount === null || customFeesAmount < 0)
  ) {
    return null;
  }

  const additionalCollectedAmount =
    body.additionalCollectedAmount === undefined
      ? null
      : parseNumeric(body.additionalCollectedAmount);
  if (
    body.additionalCollectedAmount !== undefined &&
    body.additionalCollectedAmount !== null &&
    (additionalCollectedAmount === null || additionalCollectedAmount < 0)
  ) {
    return null;
  }

  const additionalCollectionMethod =
    body.additionalCollectionMethod === undefined
      ? undefined
      : body.additionalCollectionMethod === null ||
          body.additionalCollectionMethod === ''
        ? null
        : parseOrderPaymentMethod(body.additionalCollectionMethod);
  if (
    body.additionalCollectionMethod !== undefined &&
    body.additionalCollectionMethod !== null &&
    body.additionalCollectionMethod !== '' &&
    !additionalCollectionMethod
  ) {
    return null;
  }

  const refundAmount =
    body.refundAmount === undefined ? null : parseNumeric(body.refundAmount);
  if (
    body.refundAmount !== undefined &&
    body.refundAmount !== null &&
    (refundAmount === null || refundAmount < 0)
  ) {
    return null;
  }

  const refundMethod =
    body.refundMethod === undefined
      ? undefined
      : body.refundMethod === null || body.refundMethod === ''
        ? null
        : parseOrderPaymentMethod(body.refundMethod);

  if (
    body.refundMethod !== undefined &&
    body.refundMethod !== null &&
    body.refundMethod !== '' &&
    !refundMethod
  ) {
    return null;
  }

  const completeAfterReturnRaw =
    body.completeAfterReturn === undefined
      ? undefined
      : parseBoolean(body.completeAfterReturn);
  if (
    body.completeAfterReturn !== undefined &&
    completeAfterReturnRaw === null
  ) {
    return null;
  }

  const returnedDate =
    body.returnedDate === undefined
      ? undefined
      : parseDateString(body.returnedDate);
  if (body.returnedDate !== undefined && returnedDate === null) {
    return null;
  }

  return {
    returnedDate,
    items,
    customFeesAmount:
      body.customFeesAmount === undefined ? undefined : customFeesAmount,
    additionalCollectedAmount:
      body.additionalCollectedAmount === undefined
        ? undefined
        : additionalCollectedAmount,
    additionalCollectionMethod:
      additionalCollectionMethod === undefined
        ? undefined
        : additionalCollectionMethod,
    additionalCollectionNote:
      body.additionalCollectionNote === undefined
        ? undefined
        : parseString(body.additionalCollectionNote),
    refundAmount: body.refundAmount === undefined ? undefined : refundAmount,
    refundMethod: refundMethod ?? undefined,
    refundReason:
      body.refundReason === undefined
        ? undefined
        : parseString(body.refundReason),
    refundNote:
      body.refundNote === undefined ? undefined : parseString(body.refundNote),
    completeAfterReturn: completeAfterReturnRaw ?? undefined,
  };
}

function parseUpdateOrderItemPricingPayload(
  body: Record<string, unknown>,
): UpdateOrderItemPricingPayload | null {
  const payload: UpdateOrderItemPricingPayload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'rentPlanType')) {
    const rentPlanType = parseRentPlanType(body.rentPlanType);
    if (rentPlanType === undefined) return null;
    payload.rentPlanType = rentPlanType;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'rentPlanDays')) {
    const rentPlanDays = parseNumeric(body.rentPlanDays);
    if (
      rentPlanDays === null ||
      !Number.isInteger(rentPlanDays) ||
      rentPlanDays <= 0
    ) {
      return null;
    }

    payload.rentPlanDays = rentPlanDays;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'rentPrice')) {
    const rentPrice = parseNumeric(body.rentPrice);
    if (rentPrice === null || rentPrice < 0) return null;
    payload.rentPrice = rentPrice;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'depositOverrideAmount')) {
    const depositOverrideAmount = parseNumeric(body.depositOverrideAmount);
    if (depositOverrideAmount === null || depositOverrideAmount < 0) {
      return null;
    }

    payload.depositOverrideAmount = depositOverrideAmount;
  }

  if (Object.keys(payload).length === 0) {
    return null;
  }

  return payload;
}

async function getAuthedClient(request: Request) {
  const { supabase, userId } = await getAuthenticatedSupabaseClient(request);
  return {
    supabase,
    profileId: userId,
  };
}

function unauthorizedResponse() {
  return jsonResult({ error: 'Unauthorized' }, { status: 401 });
}

function mapDomainError(error: unknown): OrdersApiResult {
  if (error instanceof OrdersDomainError) {
    const withContext =
      Object.keys(error.context ?? {}).length > 0
        ? { error: error.code, context: error.context }
        : { error: error.code };

    if (
      error.code === 'INVALID_DATE_RANGE' ||
      error.code === 'INVALID_ORDER_STATUS' ||
      error.code === 'INVALID_PRICING_MODE' ||
      error.code === 'INVALID_PAYMENT_TYPE' ||
      error.code === 'INVALID_PAYMENT_METHOD' ||
      error.code === 'INVALID_PAYMENT_STATUS' ||
      error.code === 'PAYMENT_RECEIPT_CONFIRM_REQUIRED' ||
      error.code === 'PAYMENT_RECEIPT_METHOD_INVALID' ||
      error.code === 'PAYMENT_RECEIPT_AMOUNT_MISMATCH' ||
      error.code === 'INVALID_INCIDENT_TYPE' ||
      error.code === 'INVALID_INCIDENT_STATUS' ||
      error.code === 'ORDER_STATUS_TRANSITION_INVALID' ||
      error.code === 'ORDER_REQUIRES_ITEMS_FOR_STATUS' ||
      error.code === 'MISSING_BRANCH_CONTEXT' ||
      error.code === 'CUSTOMER_BRANCH_MISMATCH' ||
      error.code === 'PAYMENT_AMOUNT_INVALID' ||
      error.code === 'INCIDENT_AMOUNT_INVALID' ||
      error.code === 'RETURN_ITEMS_REQUIRED' ||
      error.code === 'RETURN_ITEM_NOT_IN_ORDER' ||
      error.code === 'RETURN_LOST_REQUIRES_INCIDENT' ||
      error.code === 'INCIDENT_ITEM_REQUIRED'
    ) {
      return jsonResult(withContext, { status: 400 });
    }

    if (
      error.code === 'ORDER_NOT_FOUND' ||
      error.code === 'CUSTOMER_NOT_FOUND' ||
      error.code === 'ITEM_NOT_FOUND' ||
      error.code === 'PAYMENT_NOT_FOUND'
    ) {
      return jsonResult(withContext, { status: 404 });
    }

    if (
      error.code === 'FORBIDDEN_CONFIRMED_EDIT' ||
      error.code === 'FORBIDDEN_MANAGER_ACTION' ||
      error.code === 'FORBIDDEN_PAYMENT_STATUS_UPDATE'
    ) {
      return jsonResult(withContext, { status: 403 });
    }

    if (
      error.code === 'ORDER_STATUS_NOT_EDITABLE' ||
      error.code === 'ORDER_CANCEL_NOT_ALLOWED' ||
      error.code === 'ORDER_ITEM_MUTATION_NOT_ALLOWED' ||
      error.code === 'ITEM_ALREADY_IN_ORDER' ||
      error.code === 'ITEM_UNAVAILABLE' ||
      error.code === 'RESERVATION_OVERLAP_CONFLICT' ||
      error.code === 'PAYMENT_STATUS_TRANSITION_INVALID' ||
      error.code === 'PAYMENT_OVERPAY_NOT_ALLOWED' ||
      error.code === 'PAYMENT_REFUND_EXCEEDS_LIMIT' ||
      error.code === 'PICKUP_NOT_ALLOWED' ||
      error.code === 'RETURN_NOT_ALLOWED' ||
      error.code === 'COMPLETE_NOT_ALLOWED'
    ) {
      return jsonResult(withContext, { status: 409 });
    }

    return jsonResult(withContext, { status: 400 });
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  return jsonResult({ error: message }, { status: 500 });
}

function parseItemIdsFromQuery(searchParams: URLSearchParams): string[] {
  const byParam = searchParams
    .getAll('itemId')
    .map((value) => value.trim())
    .filter(Boolean);

  const byList = (searchParams.get('itemIds') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set([...byParam, ...byList]));
}

function parseStatusesFromQuery(
  searchParams: URLSearchParams,
): OrderStatus[] | null {
  const byParam = searchParams
    .getAll('status')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  const byList = (searchParams.get('statuses') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const allValues = Array.from(new Set([...byParam, ...byList]));
  const parsed: OrderStatus[] = [];

  for (const value of allValues) {
    const status = parseOrderStatus(value);
    if (!status) return null;
    parsed.push(status);
  }

  return parsed;
}

function parseOrderTypesFromQuery(
  searchParams: URLSearchParams,
): OrderType[] | null {
  const byParam = searchParams
    .getAll('orderType')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  const byList = (searchParams.get('orderTypes') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const allValues = Array.from(new Set([...byParam, ...byList]));
  const parsed: OrderType[] = [];

  for (const value of allValues) {
    const orderType = parseOrderType(value);
    if (!orderType) return null;
    parsed.push(orderType);
  }

  return parsed;
}

export async function handleGetOrders(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = getSearchParams(request);

    const page = parseInteger(searchParams.get('page'), 1);
    const pageSize = Math.min(
      parseInteger(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    );

    const statuses = parseStatusesFromQuery(searchParams);
    if (statuses === null) {
      return jsonResult({ error: 'Invalid status filter' }, { status: 400 });
    }
    const orderTypes = parseOrderTypesFromQuery(searchParams);
    if (orderTypes === null) {
      return jsonResult({ error: 'Invalid orderType filter' }, { status: 400 });
    }

    const startDateRaw = searchParams.get('startDate');
    const endDateRaw = searchParams.get('endDate');
    const startDate = startDateRaw ? parseDateString(startDateRaw) : null;
    const endDate = endDateRaw ? parseDateString(endDateRaw) : null;

    if ((startDateRaw && !startDate) || (endDateRaw && !endDate)) {
      return jsonResult(
        { error: 'startDate/endDate must use YYYY-MM-DD format' },
        { status: 400 },
      );
    }

    const result = await listOrdersForAdmin(supabase, {
      actorProfileId: profileId,
      branchId: parseString(searchParams.get('branchId')),
      orderTypes,
      statuses,
      startDate,
      endDate,
      search: parseString(searchParams.get('search')),
      page,
      pageSize,
    });

    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleGetOrderAvailability(request: Request) {
  try {
    const { supabase } = await getAuthedClient(request);
    const searchParams = getSearchParams(request);

    const itemIds = parseItemIdsFromQuery(searchParams);
    const startDate = parseDateString(searchParams.get('startDate'));
    const endDate = parseDateString(searchParams.get('endDate'));

    if (itemIds.length === 0 || !startDate || !endDate) {
      return jsonResult(
        { error: 'itemIds/startDate/endDate are required' },
        { status: 400 },
      );
    }

    const result = await checkOrderAvailabilityForAdmin(supabase, {
      branchId: parseString(searchParams.get('branchId')),
      itemIds,
      startDate,
      endDate,
      excludeOrderId: parseString(searchParams.get('excludeOrderId')),
    });

    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleCreateOrder(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBodyAsRecord(request);

    const parsedCreatePayload = parseCreateOrderPayload(body);
    if (!parsedCreatePayload.payload) {
      if (parsedCreatePayload.errorCode) {
        return jsonResult(
          {
            error: parsedCreatePayload.errorCode,
            context: parsedCreatePayload.errorContext,
          },
          { status: 400 },
        );
      }

      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const detail = await createOrderForAdmin(
      supabase,
      profileId,
      parsedCreatePayload.payload,
    );
    return jsonResult(detail, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleGetOrderDetail(request: Request, orderId: string) {
  try {
    const { supabase } = await getAuthedClient(request);

    const detail = await getOrderDetailForAdmin(supabase, orderId);
    if (!detail) {
      return jsonResult({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
    }

    return jsonResult(detail);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePatchOrder(request: Request, orderId: string) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBodyAsRecord(request);

    const payload = parseUpdateOrderPayload(body);
    if (!payload) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const detail = await updateOrderForAdmin(supabase, {
      actorProfileId: profileId,
      orderId,
      payload,
    });

    if (!detail) {
      return jsonResult({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
    }

    return jsonResult(detail);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePatchOrderStatus(
  request: Request,
  orderId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBodyAsRecord(request);

    const payload = parseTransitionPayload(body);
    if (!payload) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const detail = await transitionOrderStatusForAdmin(supabase, {
      actorProfileId: profileId,
      orderId,
      payload,
    });

    if (!detail) {
      return jsonResult({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
    }

    await runNotificationSideEffect(async () => {
      await notifyOrderStatusChanged({
        branchId: detail.summary.branchId,
        orderId: detail.summary.id,
        orderCode: detail.summary.orderCode,
        status: detail.summary.status,
        updatedAt: detail.summary.updatedAt,
        actorProfileId: profileId,
        reason: payload.reason ?? null,
      });
    });

    return jsonResult(detail);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePickupOrder(request: Request, orderId: string) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBodyAsRecord(request);

    const payload = parsePickupOrderPayload(body);
    if (!payload) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const detail = await pickupOrderForAdmin(supabase, {
      actorProfileId: profileId,
      orderId,
      payload,
    });

    if (!detail) {
      return jsonResult({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
    }

    await runNotificationSideEffect(async () => {
      await notifyOrderStatusChanged({
        branchId: detail.summary.branchId,
        orderId: detail.summary.id,
        orderCode: detail.summary.orderCode,
        status: detail.summary.status,
        updatedAt: detail.summary.updatedAt,
        actorProfileId: profileId,
        reason: payload.note ?? null,
      });
    });

    return jsonResult(detail);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleProcessOrderReturn(
  request: Request,
  orderId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBodyAsRecord(request);

    const payload = parseProcessOrderReturnPayload(body);
    if (!payload) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const detail = await processOrderReturnForAdmin(supabase, {
      actorProfileId: profileId,
      orderId,
      payload,
    });

    if (!detail) {
      return jsonResult({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
    }

    await runNotificationSideEffect(async () => {
      await notifyOrderStatusChanged({
        branchId: detail.summary.branchId,
        orderId: detail.summary.id,
        orderCode: detail.summary.orderCode,
        status: detail.summary.status,
        updatedAt: detail.summary.updatedAt,
        actorProfileId: profileId,
      });
    });

    return jsonResult(detail);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleCompleteOrder(request: Request, orderId: string) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);

    const detail = await completeOrderForAdmin(supabase, {
      actorProfileId: profileId,
      orderId,
    });

    if (!detail) {
      return jsonResult({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
    }

    return jsonResult(detail);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleSettleOrderDebt(request: Request, orderId: string) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);

    const detail = await settleDebtOrderForAdmin(supabase, {
      actorProfileId: profileId,
      orderId,
    });

    if (!detail) {
      return jsonResult({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
    }

    return jsonResult(detail);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleAddOrderPayment(request: Request, orderId: string) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBodyAsRecord(request);

    const payload = parseAddOrderPaymentPayload(body);
    if (!payload) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const detail = await addOrderPaymentForAdmin(supabase, {
      actorProfileId: profileId,
      orderId,
      payload,
    });

    if (!detail) {
      return jsonResult({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
    }

    return jsonResult(detail, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePatchOrderPaymentStatus(
  request: Request,
  orderId: string,
  paymentId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBodyAsRecord(request);

    const payload = parseUpdateOrderPaymentStatusPayload(body);
    if (!payload) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const detail = await updateOrderPaymentStatusForAdmin(supabase, {
      actorProfileId: profileId,
      orderId,
      paymentId,
      payload,
    });

    if (!detail) {
      return jsonResult({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
    }

    await runNotificationSideEffect(async () => {
      const payment = detail.payments.find((entry) => entry.id === paymentId);
      if (!payment) return;

      await notifyOrderPaymentException({
        branchId: detail.summary.branchId,
        orderCode: detail.summary.orderCode,
        payment,
        actorProfileId: profileId,
      });
    });

    return jsonResult(detail);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleAddOrderIncident(
  request: Request,
  orderId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBodyAsRecord(request);

    const payload = parseCreateOrderIncidentPayload(body);
    if (!payload) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const detail = await addOrderIncidentForAdmin(supabase, {
      actorProfileId: profileId,
      orderId,
      payload,
    });

    if (!detail) {
      return jsonResult({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
    }

    return jsonResult(detail, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleCancelOrder(request: Request, orderId: string) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBodyAsRecord(request);

    const payload = parseCancelPayload(body);
    if (!payload) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const detail = await cancelOrderForAdmin(supabase, {
      actorProfileId: profileId,
      orderId,
      payload,
    });

    if (!detail) {
      return jsonResult({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
    }

    await runNotificationSideEffect(async () => {
      await notifyOrderStatusChanged({
        branchId: detail.summary.branchId,
        orderId: detail.summary.id,
        orderCode: detail.summary.orderCode,
        status: detail.summary.status,
        updatedAt: detail.summary.updatedAt,
        actorProfileId: profileId,
        reason: payload.reason ?? null,
      });
    });

    return jsonResult(detail);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleAddOrderItem(request: Request, orderId: string) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBodyAsRecord(request);

    const payload = parseOrderItemInput(body);
    if (!payload) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const detail = await addOrderItemForAdmin(supabase, {
      actorProfileId: profileId,
      orderId,
      payload,
    });

    if (!detail) {
      return jsonResult({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
    }

    return jsonResult(detail);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePatchOrderItemPricing(
  request: Request,
  orderId: string,
  orderItemId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBodyAsRecord(request);

    const payload = parseUpdateOrderItemPricingPayload(body);
    if (!payload) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const detail = await updateOrderItemPricingForAdmin(supabase, {
      actorProfileId: profileId,
      orderId,
      orderItemId,
      payload,
    });

    if (!detail) {
      return jsonResult({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
    }

    return jsonResult(detail);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleDeleteOrderItem(
  request: Request,
  orderId: string,
  orderItemId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const detail = await removeOrderItemForAdmin(supabase, {
      actorProfileId: profileId,
      orderId,
      orderItemId,
    });

    if (!detail) {
      return jsonResult({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
    }

    return jsonResult(detail);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

@Injectable()
export class OrdersService {
  getOrders(request: Request): Promise<OrdersApiResult> {
    return handleGetOrders(request);
  }

  getOrderAvailability(request: Request): Promise<OrdersApiResult> {
    return handleGetOrderAvailability(request);
  }

  createOrder(request: Request): Promise<OrdersApiResult> {
    return handleCreateOrder(request);
  }

  getOrderDetail(request: Request, orderId: string): Promise<OrdersApiResult> {
    return handleGetOrderDetail(request, orderId);
  }

  patchOrder(request: Request, orderId: string): Promise<OrdersApiResult> {
    return handlePatchOrder(request, orderId);
  }

  patchOrderStatus(
    request: Request,
    orderId: string,
  ): Promise<OrdersApiResult> {
    return handlePatchOrderStatus(request, orderId);
  }

  pickupOrder(request: Request, orderId: string): Promise<OrdersApiResult> {
    return handlePickupOrder(request, orderId);
  }

  processOrderReturn(
    request: Request,
    orderId: string,
  ): Promise<OrdersApiResult> {
    return handleProcessOrderReturn(request, orderId);
  }

  completeOrder(request: Request, orderId: string): Promise<OrdersApiResult> {
    return handleCompleteOrder(request, orderId);
  }

  settleOrderDebt(request: Request, orderId: string): Promise<OrdersApiResult> {
    return handleSettleOrderDebt(request, orderId);
  }

  addOrderPayment(request: Request, orderId: string): Promise<OrdersApiResult> {
    return handleAddOrderPayment(request, orderId);
  }

  patchOrderPaymentStatus(
    request: Request,
    orderId: string,
    paymentId: string,
  ): Promise<OrdersApiResult> {
    return handlePatchOrderPaymentStatus(request, orderId, paymentId);
  }

  addOrderIncident(
    request: Request,
    orderId: string,
  ): Promise<OrdersApiResult> {
    return handleAddOrderIncident(request, orderId);
  }

  cancelOrder(request: Request, orderId: string): Promise<OrdersApiResult> {
    return handleCancelOrder(request, orderId);
  }

  addOrderItem(request: Request, orderId: string): Promise<OrdersApiResult> {
    return handleAddOrderItem(request, orderId);
  }

  patchOrderItemPricing(
    request: Request,
    orderId: string,
    orderItemId: string,
  ): Promise<OrdersApiResult> {
    return handlePatchOrderItemPricing(request, orderId, orderItemId);
  }

  deleteOrderItem(
    request: Request,
    orderId: string,
    orderItemId: string,
  ): Promise<OrdersApiResult> {
    return handleDeleteOrderItem(request, orderId, orderItemId);
  }
}
