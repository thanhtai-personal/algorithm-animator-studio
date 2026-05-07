import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import { AppConfigService } from '../../../common/config/app-config.service';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import {
  createCustomerForAdmin,
  CustomersDomainError,
  searchCustomersTypeaheadForAdmin,
} from '../../customers/infrastructure/customers.data-access';
import { listMakeupEvents } from '../../makeup/infrastructure/makeupEvents';
import { getMakeupModuleMetricsByBranchAndDay } from '../../makeup/infrastructure/makeupStats';
import type { MakeupEventsResponse } from '../../makeup/types/makeup-module.type';
import {
  fetchMakeupModuleEnabled,
  MakeupDomainError,
  resolveActorContext,
  sanitizeText as sanitizeMakeupText,
} from '../../makeup/infrastructure/makeupShared';
import {
  computeOrderCogsAmount,
  computeProfitMetrics,
  FINANCIAL_FORMULA_VERSION,
  summarizeFinancialPayments,
  summarizeRealProfitCashflow,
  summarizeOutstandingDebtByOrder,
} from '../../orders/infrastructure/order-finance.data-access';
import {
  createOrderForAdmin,
  OrdersDomainError,
  pickupOrderForAdmin,
} from '../../orders/infrastructure/orders.data-access';
import type {
  CreateOrderPayload,
  CreateOrderPaymentInputPayload,
  CreateOrderPaymentReceiptConfirmationPayload,
  OrderItemInputPayload,
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderPaymentType,
  OrderRentPlanType,
} from '../../orders/types/orders-domain.type';
import {
  getSalesProductDetailForActor,
  listProductsForSalesActor,
  SalesProductsDomainError,
} from '../../products/infrastructure/products.data-access';
import {
  getRevenueReportForAdmin,
  ReportsDomainError,
} from '../../reports/infrastructure/reports.data-access';
import type { RevenueReportGranularity } from '../../reports/types/reports-module.type';
import { MiniAppService } from '../mini-app.service';

const ORDER_TYPE_SET = new Set(['RENTAL', 'SALE']);
const ORDER_STATUS_SET = new Set(['DRAFT', 'RESERVED', 'CONFIRMED']);
const ORDER_PRICING_MODE_SET = new Set(['STANDARD', 'QUICK']);
const ORDER_PAYMENT_TYPE_SET = new Set<OrderPaymentType>([
  'RENT',
  'DEPOSIT',
  'FEE',
  'REFUND',
]);
const ORDER_PAYMENT_METHOD_SET = new Set<OrderPaymentMethod>([
  'CASH',
  'BANK',
  'MOMO',
]);
const ORDER_PAYMENT_STATUS_SET = new Set<OrderPaymentStatus>([
  'POSTED',
  'VOIDED',
]);
const ORDER_PAYMENT_RECEIPT_METHOD_SET = new Set<
  Extract<OrderPaymentMethod, 'CASH' | 'BANK'>
>(['CASH', 'BANK']);
const ORDER_RENT_PLAN_TYPE_SET = new Set<OrderRentPlanType>([
  '1d',
  '3d',
  '7d',
  'custom',
]);
const REVENUE_GRANULARITY_SET = new Set<RevenueReportGranularity>([
  'day',
  'month',
  'year',
]);

const DEFAULT_PRODUCT_PAGE_SIZE = 12;
const MAX_PRODUCT_PAGE_SIZE = 24;
const DEFAULT_CUSTOMER_LIMIT = 8;
const MAX_CUSTOMER_LIMIT = 12;
const PRODUCT_SEARCH_FALLBACK_PAGE_SIZE = 200;
const ZALO_SALE_GUEST_CUSTOMER_NAME = 'Khách lẻ';
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const DEFAULT_BRANCH_TIMEZONE = 'Asia/Ho_Chi_Minh';
const DEFAULT_CURRENCY_CODE = 'VND';

const ALLOWED_MINI_APP_CALENDAR_ROLE_SET = new Set([
  'owner_admin',
  'manager',
  'makeup_artist',
]);

interface ZaloMiniAppCreateOrderDraftPayload {
  branchId?: string;
  customerId?: string | null;
  items: ZaloMiniAppDraftItemInput[];
  discountAmount?: number;
  surchargeAmount?: number;
  note?: string | null;
}

interface ZaloMiniAppDraftItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  name: string | null;
}

interface ZaloMiniAppOrderDraftRow {
  id: string;
  branch_id: string;
  identity_id: string | null;
  customer_id: string | null;
  status: 'DRAFT' | 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED';
  currency_code: string;
  subtotal_amount: number | string | null;
  discount_amount: number | string | null;
  surcharge_amount: number | string | null;
  total_amount: number | string | null;
  items_json: unknown;
  note: string | null;
  created_at: string;
  updated_at: string;
}

interface ZaloMiniAppOrderDraftDto {
  id: string;
  branchId: string;
  identityId: string | null;
  customerId: string | null;
  status: 'DRAFT' | 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED';
  currencyCode: string;
  subtotalAmount: number;
  discountAmount: number;
  surchargeAmount: number;
  totalAmount: number;
  itemsJson: ZaloMiniAppDraftItemInput[];
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ZaloMiniAppPaymentTransactionRow {
  id: string;
  draft_id: string;
  external_order_id: string;
  transaction_id: string | null;
  amount: number | string | null;
  currency_code: string;
  status: 'CREATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  callback_payload_json: unknown;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ZaloMiniAppPaymentTransactionDto {
  id: string;
  draftId: string;
  externalOrderId: string;
  transactionId: string | null;
  amount: number;
  currencyCode: string;
  status: 'CREATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  callbackPayloadJson: unknown;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ZaloMiniAppCreatePaymentOrderPayload {
  draftId: string;
  appId: string;
}

interface ZaloMiniAppPaymentCallbackPayload {
  externalOrderId: string;
  transactionId?: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  amount?: number;
  eventId?: string | null;
}

interface ZaloMiniAppWebhookPayload {
  eventId: string;
  eventType: string;
  timestamp?: string | null;
  data?: Record<string, unknown>;
}

interface DashboardModuleMetricDto {
  module: 'ALL_MODULES' | 'RENTAL_SALE_MODULE' | 'MAKEUP_MODULE';
  revenue: number;
  profit: number;
  orderCount: number;
}

interface DashboardKpiDto {
  branchId: string;
  timezone: string;
  currencyCode: string;
  today: string;
  revenueToday: number;
  revenueGrossToday: number;
  refundEffectiveToday: number;
  cogsToday: number;
  grossProfitToday: number;
  profitMarginToday: number;
  salesProfitToday: number;
  realProfitToday: number;
  realInflowToday: number;
  realOutflowToday: number;
  depositCollectedToday: number;
  depositRefundedToday: number;
  initialCapitalInflowTotal: number;
  initialCapitalOutflowTotal: number;
  initialCapitalNetTotal: number;
  importOrderExpenseTotal: number;
  outstandingDebtTotal: number;
  financialFormulaVersion: string;
  soldItemsTotal: number;
  ordersOnRent: number;
  dueToday: number;
  overdue: number;
  itemsInLaundry: number;
  moduleMetrics: DashboardModuleMetricDto[];
}

interface PaymentCapitalImportRow {
  type: string | null;
  amount: number | string | null;
  is_initial_capital?: boolean | null;
  is_import_order?: boolean | null;
}

interface DashboardOrderRowDto {
  orderId: string;
  orderCode: string;
  customerName: string;
  customerPhone: string | null;
  status: string;
  startDate: string;
  endDate: string;
  updatedAt: string;
}

interface DashboardActivityRowDto {
  id: string;
  createdAt: string;
  actorProfileId: string | null;
  actorName: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  reason: string | null;
}

interface DashboardOverviewResponse {
  kpi: DashboardKpiDto;
  dueTodayOrders: DashboardOrderRowDto[];
  overdueOrders: DashboardOrderRowDto[];
  recentActivities: DashboardActivityRowDto[];
}

interface UploadedAudioFile {
  buffer: Buffer;
  size: number;
  mimetype?: string;
  originalname?: string;
}

function parseString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseInteger(
  value: string | null,
  fallback: number,
  max: number,
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function parseDateString(value: unknown): string | null {
  const normalized = parseString(value);
  if (!normalized || !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  return normalized;
}

function parseNumeric(value: number | string | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isMissingOptionalPaymentFlagColumnsError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const row = error as Record<string, unknown>;
  const code = typeof row.code === 'string' ? row.code : '';
  const message = typeof row.message === 'string' ? row.message : '';
  const details = typeof row.details === 'string' ? row.details : '';
  const hint = typeof row.hint === 'string' ? row.hint : '';
  const combined = `${message} ${details} ${hint}`.toLowerCase();
  const missingOptionalColumns =
    combined.includes('payments.is_initial_capital') ||
    combined.includes('payments.is_import_order') ||
    combined.includes('column is_initial_capital') ||
    combined.includes('column is_import_order');

  if (!missingOptionalColumns) return false;
  if (code === '42703' || code === 'PGRST204') return true;
  return (
    combined.includes('does not exist') ||
    combined.includes('schema cache') ||
    combined.includes('could not find')
  );
}

async function fetchInitialCapitalAndImportOrderTotals(
  supabase: SupabaseClient,
  branchId: string,
): Promise<{
  initialCapitalInflowTotal: number;
  initialCapitalOutflowTotal: number;
  initialCapitalNetTotal: number;
  importOrderExpenseTotal: number;
}> {
  const { data, error } = await supabase
    .from('payments')
    .select('type, amount, is_initial_capital, is_import_order')
    .eq('branch_id', branchId)
    .eq('is_delete', false)
    .eq('status', 'POSTED')
    .returns<PaymentCapitalImportRow[]>();

  if (error) {
    if (isMissingOptionalPaymentFlagColumnsError(error)) {
      return {
        initialCapitalInflowTotal: 0,
        initialCapitalOutflowTotal: 0,
        initialCapitalNetTotal: 0,
        importOrderExpenseTotal: 0,
      };
    }
    throw error;
  }

  let initialCapitalInflowTotal = 0;
  let initialCapitalOutflowTotal = 0;
  let importOrderExpenseTotal = 0;

  for (const payment of data ?? []) {
    const amount = roundMoney(Math.max(0, parseNumeric(payment.amount)));
    if (amount <= 0) continue;

    const type = parseString(payment.type)?.toUpperCase() ?? '';
    const isOutflow = type === 'EXPENSE' || type === 'REFUND';

    if (payment.is_initial_capital === true) {
      if (isOutflow) {
        initialCapitalOutflowTotal = roundMoney(
          initialCapitalOutflowTotal + amount,
        );
      } else {
        initialCapitalInflowTotal = roundMoney(
          initialCapitalInflowTotal + amount,
        );
      }
    }

    if (payment.is_import_order === true) {
      importOrderExpenseTotal = roundMoney(importOrderExpenseTotal + amount);
    }
  }

  return {
    initialCapitalInflowTotal,
    initialCapitalOutflowTotal,
    initialCapitalNetTotal: roundMoney(
      initialCapitalInflowTotal - initialCapitalOutflowTotal,
    ),
    importOrderExpenseTotal,
  };
}

function sanitizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function matchesNormalizedProductSearch(
  product: {
    name: string;
    productCode: string;
    material: string | null;
  },
  normalizedSearch: string,
): boolean {
  if (!normalizedSearch) return true;
  const normalizedName = sanitizeSearchText(product.name);
  const normalizedCode = sanitizeSearchText(product.productCode);
  const normalizedMaterial = sanitizeSearchText(product.material ?? '');
  return (
    normalizedName.includes(normalizedSearch) ||
    normalizedCode.includes(normalizedSearch) ||
    normalizedMaterial.includes(normalizedSearch)
  );
}

function readSearchParams(request: Request): URLSearchParams {
  const url = request.originalUrl ?? request.url ?? '/';
  return new URL(url, 'http://localhost').searchParams;
}

function parseCreateCustomerPayload(value: unknown): {
  branchId?: string | null;
  fullName: string;
  phone: string;
} | null {
  const record = parseRecord(value);
  if (!record) return null;
  const fullName = parseString(record.fullName);
  const phone = parseString(record.phone);
  if (!fullName || !phone) return null;

  return {
    branchId: parseString(record.branchId),
    fullName,
    phone,
  };
}

function mapCustomerDetailToTypeahead(detail: {
  customer: {
    id: string;
    branchId: string;
    fullName: string;
    phone: string | null;
    phoneNormalized: string | null;
    isActive: boolean;
    tags: Array<{
      id: string;
      branchId: string;
      code: string;
      name: string;
      color: string | null;
      isSystem: boolean;
      warnOnOrderCreate: boolean;
      blockOrderCreate: boolean;
      isActive: boolean;
    }>;
  };
}) {
  const tags = detail.customer.tags;
  return {
    id: detail.customer.id,
    branchId: detail.customer.branchId,
    fullName: detail.customer.fullName,
    phone: detail.customer.phone,
    phoneNormalized: detail.customer.phoneNormalized,
    isActive: detail.customer.isActive,
    tags,
    warnOnOrderCreate: tags.some((tag) => tag.warnOnOrderCreate),
    blockOrderCreate: tags.some((tag) => tag.blockOrderCreate),
    isVip: tags.some((tag) => tag.code.toLowerCase().includes('vip')),
    isBlacklist: tags.some((tag) =>
      tag.code.toLowerCase().includes('blacklist'),
    ),
  };
}

function parseOrderItemInput(value: unknown): OrderItemInputPayload | null {
  const record = parseRecord(value);
  if (!record) return null;

  const itemId = parseString(record.itemId);
  if (!itemId) return null;

  const payload: OrderItemInputPayload = { itemId };
  const rentPlanType = parseString(record.rentPlanType);
  if (rentPlanType) {
    if (!ORDER_RENT_PLAN_TYPE_SET.has(rentPlanType as OrderRentPlanType)) {
      return null;
    }
    payload.rentPlanType = rentPlanType as OrderRentPlanType;
  }

  if (Object.prototype.hasOwnProperty.call(record, 'rentPlanDays')) {
    const rentPlanDays = parseNumber(record.rentPlanDays);
    if (rentPlanDays === null || rentPlanDays < 1) return null;
    payload.rentPlanDays = Math.floor(rentPlanDays);
  }

  if (Object.prototype.hasOwnProperty.call(record, 'rentPrice')) {
    const rentPrice = parseNumber(record.rentPrice);
    if (rentPrice === null || rentPrice < 0) return null;
    payload.rentPrice = rentPrice;
  }

  if (Object.prototype.hasOwnProperty.call(record, 'depositOverrideAmount')) {
    const depositOverrideAmount = parseNumber(record.depositOverrideAmount);
    if (depositOverrideAmount === null || depositOverrideAmount < 0)
      return null;
    payload.depositOverrideAmount = depositOverrideAmount;
  }

  return payload;
}

function parseCreateOrderPaymentInput(
  value: unknown,
): CreateOrderPaymentInputPayload | null {
  const record = parseRecord(value);
  if (!record) return null;

  const type = parseString(record.type)?.toUpperCase() as
    | OrderPaymentType
    | undefined;
  const method = parseString(record.method)?.toUpperCase() as
    | OrderPaymentMethod
    | undefined;
  const amount = parseNumber(record.amount);

  if (
    !type ||
    !ORDER_PAYMENT_TYPE_SET.has(type) ||
    !method ||
    !ORDER_PAYMENT_METHOD_SET.has(method) ||
    amount === null ||
    amount <= 0
  ) {
    return null;
  }

  const payload: CreateOrderPaymentInputPayload = { type, method, amount };

  const status = parseString(record.status)?.toUpperCase() as
    | OrderPaymentStatus
    | undefined;
  if (status) {
    if (!ORDER_PAYMENT_STATUS_SET.has(status)) return null;
    payload.status = status;
  }

  payload.reason =
    record.reason === undefined ? undefined : parseString(record.reason);
  payload.source =
    record.source === undefined ? undefined : parseString(record.source);
  payload.note =
    record.note === undefined ? undefined : parseString(record.note);
  payload.referenceCode =
    record.referenceCode === undefined
      ? undefined
      : parseString(record.referenceCode);

  return payload;
}

function parseReceiptConfirmation(
  value: unknown,
): CreateOrderPaymentReceiptConfirmationPayload | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const record = parseRecord(value);
  if (!record) return null;
  if (record.confirmed !== true) return null;

  const amount = parseNumber(record.amount);
  const methodRaw = parseString(record.method)?.toUpperCase();
  if (
    amount === null ||
    amount <= 0 ||
    !methodRaw ||
    !ORDER_PAYMENT_RECEIPT_METHOD_SET.has(
      methodRaw as Extract<OrderPaymentMethod, 'CASH' | 'BANK'>,
    )
  ) {
    return null;
  }

  return {
    confirmed: true,
    amount,
    method: methodRaw as Extract<OrderPaymentMethod, 'CASH' | 'BANK'>,
    note: record.note === undefined ? undefined : parseString(record.note),
  };
}

type ParsedCreateOrderPayload = Omit<CreateOrderPayload, 'customerId'> & {
  orderType: 'RENTAL' | 'SALE';
  customerId?: string | null;
};

function parseCreateOrderPayload(
  value: unknown,
): ParsedCreateOrderPayload | null {
  const record = parseRecord(value);
  if (!record) return null;

  const customerId = parseString(record.customerId);
  const startDate = parseDateString(record.startDate);
  const endDate = parseDateString(record.endDate);
  const orderType = parseString(record.orderType)?.toUpperCase();
  const pricingMode = parseString(record.pricingMode)?.toUpperCase() ?? null;

  if (!startDate || !endDate || !orderType || !ORDER_TYPE_SET.has(orderType)) {
    return null;
  }
  if (
    orderType === 'RENTAL' &&
    pricingMode &&
    !ORDER_PRICING_MODE_SET.has(pricingMode)
  ) {
    return null;
  }
  if (
    orderType === 'SALE' &&
    pricingMode &&
    !ORDER_PRICING_MODE_SET.has(pricingMode)
  ) {
    return null;
  }

  const payload: ParsedCreateOrderPayload = {
    branchId: parseString(record.branchId),
    customerId,
    orderType: orderType as ParsedCreateOrderPayload['orderType'],
    pricingMode:
      orderType === 'RENTAL'
        ? ((pricingMode ?? 'STANDARD') as CreateOrderPayload['pricingMode'])
        : null,
    startDate,
    endDate,
    pickupTime:
      record.pickupTime === undefined
        ? undefined
        : parseString(record.pickupTime),
    returnTime:
      record.returnTime === undefined
        ? undefined
        : parseString(record.returnTime),
    note: record.note === undefined ? undefined : parseString(record.note),
    internalNote:
      record.internalNote === undefined
        ? undefined
        : parseString(record.internalNote),
  };

  if (Object.prototype.hasOwnProperty.call(record, 'status')) {
    const status = parseString(record.status)?.toUpperCase();
    if (!status || !ORDER_STATUS_SET.has(status)) return null;
    payload.status = status as CreateOrderPayload['status'];
  }

  if (Object.prototype.hasOwnProperty.call(record, 'discountType')) {
    const discountType = record.discountType;
    if (
      discountType !== null &&
      discountType !== 'amount' &&
      discountType !== 'percent'
    ) {
      return null;
    }
    payload.discountType = discountType as CreateOrderPayload['discountType'];
  }

  if (Object.prototype.hasOwnProperty.call(record, 'discountValue')) {
    const discountValue = parseNumber(record.discountValue);
    if (discountValue === null || discountValue < 0) return null;
    payload.discountValue = discountValue;
  }

  if (Object.prototype.hasOwnProperty.call(record, 'feesAmount')) {
    const feesAmount = parseNumber(record.feesAmount);
    if (feesAmount === null || feesAmount < 0) return null;
    payload.feesAmount = feesAmount;
  }

  if (Object.prototype.hasOwnProperty.call(record, 'depositAmount')) {
    const depositAmount = parseNumber(record.depositAmount);
    if (depositAmount === null || depositAmount < 0) return null;
    payload.depositAmount = depositAmount;
  }

  if (Object.prototype.hasOwnProperty.call(record, 'items')) {
    if (!Array.isArray(record.items)) return null;
    const items = record.items
      .map((entry) => parseOrderItemInput(entry))
      .filter((entry): entry is OrderItemInputPayload => Boolean(entry));
    if (items.length !== record.items.length) return null;
    payload.items = items;
  }

  if (Object.prototype.hasOwnProperty.call(record, 'payments')) {
    if (!Array.isArray(record.payments)) return null;
    const payments = record.payments
      .map((entry) => parseCreateOrderPaymentInput(entry))
      .filter((entry): entry is CreateOrderPaymentInputPayload =>
        Boolean(entry),
      );
    if (payments.length !== record.payments.length) return null;
    payload.payments = payments;
  }

  const paymentReceiptConfirmation = parseReceiptConfirmation(
    record.paymentReceiptConfirmation,
  );
  if (paymentReceiptConfirmation === null) return null;
  payload.paymentReceiptConfirmation = paymentReceiptConfirmation;

  return payload;
}

function parseCreateOrderDraftPayload(
  value: unknown,
): ZaloMiniAppCreateOrderDraftPayload | null {
  const record = parseRecord(value);
  if (!record) return null;

  const branchId =
    record.branchId === undefined || record.branchId === null
      ? null
      : parseString(record.branchId);
  if (record.branchId !== undefined && record.branchId !== null && !branchId) {
    return null;
  }

  if (!Array.isArray(record.items)) return null;
  const items: ZaloMiniAppDraftItemInput[] = [];

  for (const entry of record.items) {
    const item = parseRecord(entry);
    if (!item) continue;

    const productId = parseString(item.productId);
    const quantity = Math.max(
      1,
      Math.floor(parseNumeric(item.quantity as number)),
    );
    const unitPrice = Math.max(0, parseNumeric(item.unitPrice as number));
    const name = parseString(item.name);
    if (!productId) continue;
    items.push({ productId, quantity, unitPrice, name });
  }

  if (items.length === 0) return null;

  return {
    branchId: branchId ?? undefined,
    customerId: parseString(record.customerId),
    items,
    discountAmount: Math.max(0, parseNumeric(record.discountAmount as number)),
    surchargeAmount: Math.max(
      0,
      parseNumeric(record.surchargeAmount as number),
    ),
    note: parseString(record.note),
  };
}

function parseCreatePaymentOrderPayload(
  value: unknown,
): ZaloMiniAppCreatePaymentOrderPayload | null {
  const record = parseRecord(value);
  if (!record) return null;
  const draftId = parseString(record.draftId);
  const appId = parseString(record.appId);
  if (!draftId || !appId) return null;
  return { draftId, appId };
}

function parsePaymentCallbackPayload(
  value: unknown,
): ZaloMiniAppPaymentCallbackPayload | null {
  const record = parseRecord(value);
  if (!record) return null;

  const externalOrderId = parseString(record.externalOrderId);
  const status = parseString(record.status)?.toUpperCase();
  if (!externalOrderId) return null;
  if (
    status !== 'PENDING' &&
    status !== 'SUCCESS' &&
    status !== 'FAILED' &&
    status !== 'CANCELLED'
  ) {
    return null;
  }

  return {
    externalOrderId,
    transactionId: parseString(record.transactionId),
    status,
    amount: parseNumeric(record.amount as number),
    eventId: parseString(record.eventId),
  };
}

function parseWebhookPayload(value: unknown): ZaloMiniAppWebhookPayload | null {
  const record = parseRecord(value);
  if (!record) return null;

  const eventId = parseString(record.eventId);
  const eventType = parseString(record.eventType);
  if (!eventId || !eventType) return null;

  return {
    eventId,
    eventType,
    timestamp: parseString(record.timestamp),
    data: parseRecord(record.data) ?? undefined,
  };
}

function parseOptionalLanguage(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  const [baseLanguage] = normalized.split('-');
  if (!baseLanguage) return null;
  return /^[a-z]{2,3}$/i.test(baseLanguage) ? baseLanguage.toLowerCase() : null;
}

function parseSignatureHeader(request: Request): string | null {
  const value =
    request.headers['x-zalo-signature'] ??
    (request.headers['X-ZALO-SIGNATURE'] as string | undefined);
  if (Array.isArray(value)) return parseString(value[0]);
  return parseString(value);
}

function readRawBody(request: Request, fallbackPayload: unknown): string {
  const rawBody = (request as Request & { rawBody?: Buffer }).rawBody;
  if (Buffer.isBuffer(rawBody) && rawBody.length > 0) {
    return rawBody.toString('utf8');
  }

  try {
    return JSON.stringify(fallbackPayload ?? {});
  } catch {
    return '{}';
  }
}

function createSignature(rawBody: string, secret: string): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

function verifySignature(
  rawBody: string,
  signature: string | null,
  secret: string | null,
): boolean {
  if (!signature || !secret) return false;

  const expected = createSignature(rawBody, secret);
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(signature, 'utf8');
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function mapCallbackStatusToDraftStatus(
  status: ZaloMiniAppPaymentCallbackPayload['status'],
): 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' {
  if (status === 'SUCCESS') return 'PAID';
  if (status === 'CANCELLED' || status === 'FAILED') return 'CANCELLED';
  return 'PENDING_PAYMENT';
}

function resolveZaloUserId(payload: ZaloMiniAppWebhookPayload): string | null {
  const data = payload.data ?? {};
  return (
    parseString(data.zaloUserId) ??
    parseString(data.userId) ??
    parseString(data.user_id)
  );
}

function isRevokeConsentEvent(eventType: string): boolean {
  const normalized = eventType.trim().toLowerCase();
  return (
    normalized === 'user.revoke_consent' ||
    normalized === 'revoke-consent' ||
    normalized === 'user_revoke_consent'
  );
}

function mapOrderDraftRow(
  row: ZaloMiniAppOrderDraftRow,
): ZaloMiniAppOrderDraftDto {
  return {
    id: row.id,
    branchId: row.branch_id,
    identityId: parseString(row.identity_id),
    customerId: parseString(row.customer_id),
    status: row.status,
    currencyCode: row.currency_code,
    subtotalAmount: parseNumeric(row.subtotal_amount),
    discountAmount: parseNumeric(row.discount_amount),
    surchargeAmount: parseNumeric(row.surcharge_amount),
    totalAmount: parseNumeric(row.total_amount),
    itemsJson: Array.isArray(row.items_json)
      ? (row.items_json as ZaloMiniAppDraftItemInput[])
      : [],
    note: parseString(row.note),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPaymentTransactionRow(
  row: ZaloMiniAppPaymentTransactionRow,
): ZaloMiniAppPaymentTransactionDto {
  return {
    id: row.id,
    draftId: row.draft_id,
    externalOrderId: row.external_order_id,
    transactionId: row.transaction_id,
    amount: parseNumeric(row.amount),
    currencyCode: row.currency_code,
    status: row.status,
    callbackPayloadJson: row.callback_payload_json,
    lastCheckedAt: row.last_checked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function calculateDraftSubtotal(items: ZaloMiniAppDraftItemInput[]): number {
  let subtotal = 0;
  for (const item of items) {
    const quantity = Math.max(1, Math.floor(parseNumeric(item.quantity)));
    const unitPrice = Math.max(0, parseNumeric(item.unitPrice));
    subtotal += quantity * unitPrice;
  }
  return subtotal;
}

function toIsoDateInTimeZone(value: string | Date, timeZone: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime()))
    return new Date().toISOString().slice(0, 10);

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

@Injectable()
export class MiniAppExtensionsService {
  constructor(
    private readonly config: AppConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly miniAppService: MiniAppService,
  ) {}

  async getMakeupAccess(request: Request): Promise<unknown> {
    try {
      const identity =
        await this.miniAppService.resolveMiniAppSessionIdentityFromRequest(
          request,
        );
      const actorProfileId = sanitizeMakeupText(identity.profileId);
      if (!actorProfileId) {
        throw new MakeupDomainError('FORBIDDEN_ROLE', {
          reason: 'mini-app-identity-missing-profile-id',
        });
      }

      const supabase = this.supabaseService.createServiceRoleClient();
      const moduleEnabled = await fetchMakeupModuleEnabled(supabase);
      if (!moduleEnabled) {
        throw new MakeupDomainError('MODULE_DISABLED', {
          source: 'mini-app-calendar',
        });
      }

      const context = await resolveActorContext(supabase, {
        actorProfileId,
        requestedBranchId: null,
      });
      if (
        !context.role ||
        !ALLOWED_MINI_APP_CALENDAR_ROLE_SET.has(context.role)
      ) {
        throw new MakeupDomainError('FORBIDDEN_ROLE', {
          role: context.role,
          reason: 'mini-app-calendar-role-denied',
        });
      }

      return {
        access: {
          profileId: actorProfileId,
          role: context.role,
          branchId: context.branchId,
          timeZone: context.timeZone,
          displayName: sanitizeMakeupText(identity.displayName),
        },
      };
    } catch (error) {
      this.throwMakeupError(error);
    }
  }

  async getMakeupEvents(request: Request): Promise<MakeupEventsResponse> {
    try {
      const searchParams = readSearchParams(request);
      const requestedBranchId = sanitizeMakeupText(
        searchParams.get('branchId'),
      );
      const startDate = this.parseOptionalQueryDate(searchParams, 'startDate');
      const endDate = this.parseOptionalQueryDate(searchParams, 'endDate');
      const artistProfileId = sanitizeMakeupText(
        searchParams.get('artistProfileId'),
      );

      const identity =
        await this.miniAppService.resolveMiniAppSessionIdentityFromRequest(
          request,
        );
      const actorProfileId = sanitizeMakeupText(identity.profileId);
      if (!actorProfileId) {
        throw new MakeupDomainError('FORBIDDEN_ROLE', {
          reason: 'mini-app-identity-missing-profile-id',
        });
      }

      const supabase = this.supabaseService.createServiceRoleClient();
      const payload = await listMakeupEvents(supabase, {
        actorProfileId,
        query: {
          branchId: requestedBranchId,
          startDate,
          endDate,
          artistProfileId,
        },
      });
      return payload;
    } catch (error) {
      this.throwMakeupError(error);
    }
  }

  async getOrderDraft(request: Request): Promise<unknown> {
    try {
      await this.miniAppService.resolveMiniAppSessionIdentityFromRequest(
        request,
      );
      const draftId = parseString(readSearchParams(request).get('draftId'));
      if (!draftId) {
        throw new BadRequestException({ error: 'Missing draftId' });
      }

      const supabase = this.supabaseService.createServiceRoleClient();
      const draft = await this.getOrderDraftById(supabase, draftId);
      if (!draft) {
        throw new NotFoundException({
          error: 'DRAFT_NOT_FOUND',
          context: { draftId },
        });
      }

      return { draft };
    } catch (error) {
      this.miniAppService.rethrowMiniAppError(error);
    }
  }

  async postOrderDraft(request: Request, body: unknown): Promise<unknown> {
    try {
      const payload = parseCreateOrderDraftPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      const identity =
        await this.miniAppService.resolveMiniAppSessionIdentityFromRequest(
          request,
        );
      const supabase = this.supabaseService.createServiceRoleClient();
      await this.miniAppService.assertMiniAppEnabledForClient(supabase);

      const branchId = await this.resolveDraftBranchId(
        supabase,
        payload.branchId,
      );
      const draft = await this.createOrderDraft(supabase, {
        branchId,
        identityId: identity.id,
        customerId: payload.customerId ?? null,
        items: payload.items,
        discountAmount: payload.discountAmount ?? 0,
        surchargeAmount: payload.surchargeAmount ?? 0,
        note: payload.note ?? null,
      });

      return { draft };
    } catch (error) {
      this.miniAppService.rethrowMiniAppError(error);
    }
  }

  async postCreatePaymentOrder(
    request: Request,
    body: unknown,
  ): Promise<unknown> {
    try {
      await this.miniAppService.resolveMiniAppSessionIdentityFromRequest(
        request,
      );
      const payload = parseCreatePaymentOrderPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      const supabase = this.supabaseService.createServiceRoleClient();
      await this.miniAppService.assertMiniAppEnabledForClient(supabase);
      const draft = await this.getOrderDraftById(supabase, payload.draftId);
      if (!draft) {
        throw new NotFoundException({
          error: 'DRAFT_NOT_FOUND',
          context: { draftId: payload.draftId },
        });
      }

      if (draft.status === 'PAID') {
        return {
          paymentOrder: {
            draftId: draft.id,
            externalOrderId: `paid_${draft.id}`,
            amount: draft.totalAmount,
            currencyCode: draft.currencyCode,
            checksum: null,
            appId: payload.appId,
            description: `Draft ${draft.id} already paid`,
          },
        };
      }

      const externalOrderId = `zma_${Date.now()}_${randomUUID().slice(0, 8)}`;
      await this.createPaymentTransaction(supabase, {
        draftId: draft.id,
        externalOrderId,
        amount: draft.totalAmount,
        currencyCode: draft.currencyCode,
        status: 'CREATED',
      });
      await this.updateOrderDraftStatus(supabase, {
        draftId: draft.id,
        status: 'PENDING_PAYMENT',
      });

      const checksumBase = `${externalOrderId}|${draft.totalAmount}|${draft.currencyCode}`;
      const checksum = this.config.miniAppAppSecret
        ? createSignature(checksumBase, this.config.miniAppAppSecret)
        : null;

      return {
        paymentOrder: {
          draftId: draft.id,
          externalOrderId,
          amount: draft.totalAmount,
          currencyCode: draft.currencyCode,
          checksum,
          appId: payload.appId,
          description: `Thanh toan don nhap ${draft.id}`,
        },
      };
    } catch (error) {
      this.miniAppService.rethrowMiniAppError(error);
    }
  }

  async getPaymentTransaction(
    request: Request,
    externalOrderId: string | null,
  ): Promise<unknown> {
    try {
      await this.miniAppService.resolveMiniAppSessionIdentityFromRequest(
        request,
      );
      if (!externalOrderId) {
        throw new BadRequestException({ error: 'Missing externalOrderId' });
      }

      const supabase = this.supabaseService.createServiceRoleClient();
      const transaction = await this.getPaymentTransactionByExternalOrderId(
        supabase,
        externalOrderId,
      );
      if (!transaction) {
        throw new NotFoundException({
          error: 'PAYMENT_NOT_FOUND',
          context: { externalOrderId },
        });
      }

      await this.updatePaymentTransactionByExternalOrderId(supabase, {
        externalOrderId,
        status: transaction.status,
        lastCheckedAt: new Date().toISOString(),
      });

      return { transaction };
    } catch (error) {
      this.miniAppService.rethrowMiniAppError(error);
    }
  }

  async postPaymentCallback(request: Request, body: unknown): Promise<unknown> {
    try {
      const rawBody = readRawBody(request, body);
      const signature = parseSignatureHeader(request);
      if (
        !verifySignature(rawBody, signature, this.config.miniAppWebhookSecret)
      ) {
        throw new BadRequestException({ error: 'INVALID_SIGNATURE' });
      }

      const payload = parsePaymentCallbackPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      const supabase = this.supabaseService.createServiceRoleClient();
      const existing = await this.getPaymentTransactionByExternalOrderId(
        supabase,
        payload.externalOrderId,
      );
      if (!existing) {
        throw new NotFoundException({
          error: 'PAYMENT_NOT_FOUND',
          context: { externalOrderId: payload.externalOrderId },
        });
      }

      if (
        existing.status === 'SUCCESS' &&
        existing.transactionId &&
        existing.transactionId === payload.transactionId
      ) {
        return { ok: true, duplicate: true };
      }

      const transaction = await this.updatePaymentTransactionByExternalOrderId(
        supabase,
        {
          externalOrderId: payload.externalOrderId,
          transactionId: payload.transactionId ?? null,
          status: payload.status,
          callbackPayloadJson: payload,
          lastCheckedAt: new Date().toISOString(),
        },
      );

      await this.updateOrderDraftStatus(supabase, {
        draftId: transaction.draftId,
        status: mapCallbackStatusToDraftStatus(payload.status),
      });

      return { ok: true, transaction };
    } catch (error) {
      this.miniAppService.rethrowMiniAppError(error);
    }
  }

  async getRentalCustomers(request: Request): Promise<unknown> {
    try {
      const searchParams = readSearchParams(request);
      const requestedBranchId = parseString(searchParams.get('branchId'));
      const { access } = await this.miniAppService.getRentalAccess(
        request,
        'order',
        requestedBranchId,
      );

      const search = parseString(searchParams.get('search'));
      if (!search) {
        return { items: [] };
      }

      const limit = parseInteger(
        searchParams.get('limit'),
        DEFAULT_CUSTOMER_LIMIT,
        MAX_CUSTOMER_LIMIT,
      );
      const payload = await searchCustomersTypeaheadForAdmin(
        this.supabaseService.createServiceRoleClient(),
        {
          branchId: access.branchId,
          search,
          limit,
        },
      );

      return payload;
    } catch (error) {
      this.throwRentalError(error);
    }
  }

  async postRentalCustomer(request: Request, body: unknown): Promise<unknown> {
    try {
      const payload = parseCreateCustomerPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'INVALID_PAYLOAD' });
      }

      const { access } = await this.miniAppService.getRentalAccess(
        request,
        'order',
        payload.branchId ?? null,
      );

      const serviceRole = this.supabaseService.createServiceRoleClient();
      const detail = await createCustomerForAdmin(
        serviceRole,
        access.profileId,
        {
          branchId: access.branchId,
          fullName: payload.fullName,
          phone: payload.phone,
          tagIds: [],
          isActive: true,
        },
        serviceRole,
      );

      return {
        customer: mapCustomerDetailToTypeahead(detail),
      };
    } catch (error) {
      this.throwRentalError(error);
    }
  }

  async getRentalProducts(request: Request): Promise<unknown> {
    try {
      const searchParams = readSearchParams(request);
      const requestedBranchId = parseString(searchParams.get('branchId'));
      const { access } = await this.miniAppService.getRentalAccess(
        request,
        'order',
        requestedBranchId,
      );

      const page = parseInteger(searchParams.get('page'), 1, 50);
      const pageSize = parseInteger(
        searchParams.get('pageSize'),
        DEFAULT_PRODUCT_PAGE_SIZE,
        MAX_PRODUCT_PAGE_SIZE,
      );
      const search = parseString(searchParams.get('search'));
      const serviceRole = this.supabaseService.createServiceRoleClient();

      if (!search) {
        return listProductsForSalesActor(serviceRole, {
          actorProfileId: access.profileId,
          query: {
            branchId: access.branchId,
            page,
            pageSize,
            hasReadyItems: true,
          },
        });
      }

      const normalizedSearch = sanitizeSearchText(search);
      if (!normalizedSearch.length) {
        return {
          items: [],
          total: 0,
          page,
          pageSize,
          categories: [],
          tags: [],
        };
      }

      const firstPage = await listProductsForSalesActor(serviceRole, {
        actorProfileId: access.profileId,
        query: {
          branchId: access.branchId,
          page: 1,
          pageSize: PRODUCT_SEARCH_FALLBACK_PAGE_SIZE,
          hasReadyItems: true,
        },
      });

      const totalPages = Math.max(
        1,
        Math.ceil(firstPage.total / PRODUCT_SEARCH_FALLBACK_PAGE_SIZE),
      );
      const allItems = [...firstPage.items];

      for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
        const pagePayload = await listProductsForSalesActor(serviceRole, {
          actorProfileId: access.profileId,
          query: {
            branchId: access.branchId,
            page: currentPage,
            pageSize: PRODUCT_SEARCH_FALLBACK_PAGE_SIZE,
            hasReadyItems: true,
          },
        });
        allItems.push(...pagePayload.items);
      }

      const filteredItems = allItems.filter((item) =>
        matchesNormalizedProductSearch(
          {
            name: item.name,
            productCode: item.productCode,
            material: item.material,
          },
          normalizedSearch,
        ),
      );

      const offset = (page - 1) * pageSize;
      return {
        items: filteredItems.slice(offset, offset + pageSize),
        total: filteredItems.length,
        page,
        pageSize,
        categories: firstPage.categories,
        tags: firstPage.tags,
      };
    } catch (error) {
      this.throwRentalError(error);
    }
  }

  async getRentalProductDetail(
    request: Request,
    productId: string,
  ): Promise<unknown> {
    try {
      const searchParams = readSearchParams(request);
      const requestedBranchId = parseString(searchParams.get('branchId'));
      const { access } = await this.miniAppService.getRentalAccess(
        request,
        'order',
        requestedBranchId,
      );

      const detail = await getSalesProductDetailForActor(
        this.supabaseService.createServiceRoleClient(),
        {
          actorProfileId: access.profileId,
          branchId: access.branchId,
          productId,
        },
      );
      if (!detail) {
        throw new NotFoundException({ error: 'PRODUCT_NOT_FOUND' });
      }
      return detail;
    } catch (error) {
      this.throwRentalError(error);
    }
  }

  async postRentalOrderCreate(
    request: Request,
    body: unknown,
  ): Promise<unknown> {
    try {
      const payload = parseCreateOrderPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'INVALID_PAYLOAD' });
      }

      const { access } = await this.miniAppService.getRentalAccess(
        request,
        'order',
        payload.branchId ?? null,
      );
      const serviceRole = this.supabaseService.createServiceRoleClient();
      const customerId = await this.resolveCustomerIdForMiniAppOrder({
        supabase: serviceRole,
        profileId: access.profileId,
        branchId: access.branchId,
        orderType: payload.orderType,
        customerId: payload.customerId,
      });

      const shouldAutoPickup = payload.orderType === 'RENTAL';
      let order = await createOrderForAdmin(serviceRole, access.profileId, {
        ...payload,
        customerId,
        branchId: access.branchId,
        status:
          payload.status ?? (shouldAutoPickup ? 'CONFIRMED' : payload.status),
      });

      if (shouldAutoPickup && order.summary.status === 'CONFIRMED') {
        try {
          const pickedUpOrder = await pickupOrderForAdmin(serviceRole, {
            actorProfileId: access.profileId,
            orderId: order.summary.id,
            payload: {
              requireDepositPaid: true,
              note: 'ZALO_MINI_APP_AUTO_PICKUP',
            },
          });

          if (!pickedUpOrder) {
            throw new NotFoundException({ error: 'ORDER_NOT_FOUND' });
          }
          order = pickedUpOrder;
        } catch (error) {
          if (
            error instanceof OrdersDomainError &&
            error.code === 'PICKUP_NOT_ALLOWED' &&
            error.context.reason === 'deposit-not-fully-paid'
          ) {
            // Keep CONFIRMED when deposit is not fully collected.
          } else {
            throw error;
          }
        }
      }

      return { access, order };
    } catch (error) {
      this.throwRentalError(error);
    }
  }

  async getRentalRevenue(request: Request): Promise<unknown> {
    try {
      const searchParams = readSearchParams(request);
      const requestedBranchId = parseString(searchParams.get('branchId'));
      const { access } = await this.miniAppService.getRentalAccess(
        request,
        'revenue',
        requestedBranchId,
      );

      const granularity =
        parseString(searchParams.get('granularity'))?.toLowerCase() ?? 'day';
      if (
        !REVENUE_GRANULARITY_SET.has(granularity as RevenueReportGranularity)
      ) {
        throw new BadRequestException({ error: 'INVALID_GRANULARITY' });
      }

      const startDateRaw = searchParams.get('startDate');
      const endDateRaw = searchParams.get('endDate');
      const startDate = startDateRaw ? parseDateString(startDateRaw) : null;
      const endDate = endDateRaw ? parseDateString(endDateRaw) : null;
      if ((startDateRaw && !startDate) || (endDateRaw && !endDate)) {
        throw new BadRequestException({ error: 'INVALID_DATE_RANGE' });
      }

      const report = await getRevenueReportForAdmin(
        this.supabaseService.createServiceRoleClient(),
        {
          actorProfileId: access.profileId,
          query: {
            branchId: access.branchId,
            startDate,
            endDate,
            granularity: granularity as RevenueReportGranularity,
          },
        },
      );

      return { access, report };
    } catch (error) {
      this.throwRentalError(error);
    }
  }

  async getRentalDashboardOverview(
    request: Request,
  ): Promise<DashboardOverviewResponse> {
    try {
      const searchParams = readSearchParams(request);
      const requestedBranchId = parseString(searchParams.get('branchId'));
      const { access } = await this.miniAppService.getRentalAccess(
        request,
        'revenue',
        requestedBranchId,
      );

      const supabase = this.supabaseService.createServiceRoleClient();
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('id, timezone, currency_code')
        .eq('id', access.branchId)
        .eq('is_delete', false)
        .maybeSingle<{
          id: string;
          timezone: string | null;
          currency_code: string | null;
        }>();
      if (branchError) throw branchError;

      const timezone = parseString(branch?.timezone) ?? DEFAULT_BRANCH_TIMEZONE;
      const currencyCode =
        parseString(branch?.currency_code) ?? DEFAULT_CURRENCY_CODE;
      const today = toIsoDateInTimeZone(new Date(), timezone);

      const revenueToday = await getRevenueReportForAdmin(supabase, {
        actorProfileId: access.profileId,
        query: {
          branchId: access.branchId,
          startDate: today,
          endDate: today,
          granularity: 'day',
        },
      });

      const { data: itemsRows, error: itemsError } = await supabase
        .from('items')
        .select('status')
        .eq('branch_id', access.branchId)
        .eq('is_delete', false)
        .returns<Array<{ status: string }>>();
      if (itemsError) throw itemsError;

      let soldItemsTotal = 0;
      let itemsInLaundry = 0;
      for (const item of itemsRows ?? []) {
        const status = (item.status ?? '').toUpperCase();
        if (status === 'SOLD') soldItemsTotal += 1;
        if (status === 'LAUNDRY') itemsInLaundry += 1;
      }

      const { data: orderRows, error: orderError } = await supabase
        .from('rental_orders')
        .select(
          'id, order_code, customer_id, status, start_date, end_date, updated_at, total_amount',
        )
        .eq('branch_id', access.branchId)
        .eq('is_delete', false)
        .in('status', ['DRAFT', 'RESERVED', 'CONFIRMED', 'PICKED_UP', 'DEBT'])
        .order('updated_at', { ascending: false })
        .returns<
          Array<{
            id: string;
            order_code: string;
            customer_id: string;
            status: string;
            start_date: string;
            end_date: string;
            updated_at: string;
            total_amount: number | string | null;
          }>
        >();
      if (orderError) throw orderError;

      const customerIds = Array.from(
        new Set((orderRows ?? []).map((row) => row.customer_id)),
      );
      let customersById = new Map<
        string,
        { full_name: string | null; phone: string | null }
      >();
      if (customerIds.length > 0) {
        const { data: customerRows, error: customerError } = await supabase
          .from('customers')
          .select('id, full_name, phone')
          .in('id', customerIds)
          .eq('is_delete', false)
          .returns<
            Array<{
              id: string;
              full_name: string | null;
              phone: string | null;
            }>
          >();
        if (customerError) throw customerError;
        customersById = new Map(
          (customerRows ?? []).map((row) => [
            row.id,
            { full_name: row.full_name, phone: row.phone },
          ]),
        );
      }

      const dueTodayStatuses = new Set([
        'DRAFT',
        'RESERVED',
        'CONFIRMED',
        'PICKED_UP',
      ]);
      const dueTodayOrders: DashboardOrderRowDto[] = [];
      const overdueOrders: DashboardOrderRowDto[] = [];
      let ordersOnRent = 0;

      for (const order of orderRows ?? []) {
        const status = (order.status ?? '').toUpperCase();
        if (status === 'PICKED_UP') {
          ordersOnRent += 1;
        }
        if (!dueTodayStatuses.has(status) && status !== 'DEBT') {
          continue;
        }

        const customer = customersById.get(order.customer_id);
        const dto: DashboardOrderRowDto = {
          orderId: order.id,
          orderCode: order.order_code,
          customerName: parseString(customer?.full_name) ?? 'Unknown',
          customerPhone: parseString(customer?.phone),
          status,
          startDate: order.start_date,
          endDate: order.end_date,
          updatedAt: order.updated_at,
        };

        if (order.end_date === today && dueTodayStatuses.has(status)) {
          dueTodayOrders.push(dto);
        }
        if (
          order.end_date < today &&
          status !== 'COMPLETED' &&
          status !== 'CANCELLED'
        ) {
          overdueOrders.push(dto);
        }
      }

      const { data: debtRows, error: debtError } = await supabase
        .from('rental_orders')
        .select('id, status, total_amount')
        .eq('branch_id', access.branchId)
        .eq('is_delete', false)
        .in('status', ['DEBT'])
        .returns<
          Array<{
            id: string;
            status: string;
            total_amount: number | string | null;
          }>
        >();
      if (debtError) throw debtError;

      const debtOrderIds = (debtRows ?? []).map((row) => row.id);
      let debtPayments: Array<{
        order_id: string;
        type: string | null;
        status: string | null;
        amount: number | string | null;
        reason: string | null;
        source: string | null;
      }> = [];
      if (debtOrderIds.length > 0) {
        const { data: paymentRows, error: paymentError } = await supabase
          .from('payments')
          .select('order_id, type, status, amount, reason, source')
          .in('order_id', debtOrderIds)
          .eq('is_delete', false)
          .eq('status', 'POSTED')
          .returns<
            Array<{
              order_id: string;
              type: string | null;
              status: string | null;
              amount: number | string | null;
              reason: string | null;
              source: string | null;
            }>
          >();
        if (paymentError) throw paymentError;
        debtPayments = paymentRows ?? [];
      }

      const outstandingDebtTotal = summarizeOutstandingDebtByOrder({
        orders: (debtRows ?? []).map((row) => ({
          orderId: row.id,
          totalAmount: parseNumeric(row.total_amount),
          status: row.status,
        })),
        payments: debtPayments.map((payment) => ({
          orderId: payment.order_id,
          type: payment.type,
          status: payment.status,
          amount: payment.amount,
          reason: payment.reason,
          source: payment.source,
        })),
      });

      const { data: auditRows, error: auditError } = await supabase
        .from('audit_events')
        .select(
          'id, actor_profile_id, entity_type, entity_id, action, reason, created_at',
        )
        .eq('branch_id', access.branchId)
        .eq('is_delete', false)
        .order('created_at', { ascending: false })
        .limit(20)
        .returns<
          Array<{
            id: string;
            actor_profile_id: string | null;
            entity_type: string;
            entity_id: string | null;
            action: string;
            reason: string | null;
            created_at: string;
          }>
        >();
      if (auditError) throw auditError;

      const actorProfileIds = Array.from(
        new Set(
          (auditRows ?? [])
            .map((row) => parseString(row.actor_profile_id))
            .filter((value): value is string => Boolean(value)),
        ),
      );
      let actorNames = new Map<string, string | null>();
      if (actorProfileIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', actorProfileIds)
          .eq('is_delete', false)
          .returns<Array<{ id: string; full_name: string | null }>>();
        if (profileError) throw profileError;
        actorNames = new Map(
          (profileRows ?? []).map((row) => [
            row.id,
            parseString(row.full_name),
          ]),
        );
      }

      const recentActivities: DashboardActivityRowDto[] = (auditRows ?? []).map(
        (row) => ({
          id: row.id,
          createdAt: row.created_at,
          actorProfileId: parseString(row.actor_profile_id),
          actorName: parseString(row.actor_profile_id)
            ? (actorNames.get(row.actor_profile_id as string) ?? null)
            : null,
          entityType: row.entity_type,
          entityId: row.entity_id,
          action: row.action,
          reason: row.reason,
        }),
      );

      const paymentSummary = summarizeFinancialPayments(
        (debtPayments ?? []).map((payment) => ({
          type: payment.type,
          status: payment.status,
          amount: payment.amount,
          reason: payment.reason,
          source: payment.source,
        })),
      );

      const cashflow = summarizeRealProfitCashflow(
        (debtPayments ?? []).map((payment) => ({
          type: payment.type,
          status: payment.status,
          amount: payment.amount,
          reason: payment.reason,
          source: payment.source,
        })),
      );

      const cogsToday = computeOrderCogsAmount({
        orderType: 'RENTAL',
        saleItemCostSnapshots: [],
      });

      const profitMetrics = computeProfitMetrics({
        revenueNet: revenueToday.kpi.revenueNet,
        cogs: revenueToday.kpi.cogs ?? cogsToday,
      });

      const makeupMetrics = await this.fetchMakeupModuleMetricsSafe(supabase, {
        branchId: access.branchId,
        day: today,
      });
      const initialCapitalAndImportTotals =
        await fetchInitialCapitalAndImportOrderTotals(
          supabase,
          access.branchId,
        );

      const kpi: DashboardKpiDto = {
        branchId: access.branchId,
        timezone,
        currencyCode,
        today,
        revenueToday: revenueToday.kpi.revenueNet,
        revenueGrossToday: revenueToday.kpi.revenueGross,
        refundEffectiveToday: revenueToday.kpi.refundEffective,
        cogsToday: revenueToday.kpi.cogs,
        grossProfitToday: revenueToday.kpi.grossProfit,
        profitMarginToday: revenueToday.kpi.profitMargin,
        salesProfitToday: revenueToday.kpi.salesProfit,
        realProfitToday: revenueToday.kpi.realProfit,
        realInflowToday: revenueToday.kpi.cashInflow,
        realOutflowToday: revenueToday.kpi.cashOutflow,
        depositCollectedToday: revenueToday.kpi.depositCollectedTotal,
        depositRefundedToday: revenueToday.kpi.depositRefundedTotal,
        initialCapitalInflowTotal:
          initialCapitalAndImportTotals.initialCapitalInflowTotal,
        initialCapitalOutflowTotal:
          initialCapitalAndImportTotals.initialCapitalOutflowTotal,
        initialCapitalNetTotal:
          initialCapitalAndImportTotals.initialCapitalNetTotal,
        importOrderExpenseTotal:
          initialCapitalAndImportTotals.importOrderExpenseTotal,
        outstandingDebtTotal,
        financialFormulaVersion: FINANCIAL_FORMULA_VERSION,
        soldItemsTotal,
        ordersOnRent,
        dueToday: dueTodayOrders.length,
        overdue: overdueOrders.length,
        itemsInLaundry,
        moduleMetrics: [
          {
            module: 'ALL_MODULES',
            revenue: revenueToday.kpi.revenueNet + makeupMetrics.revenue,
            profit: revenueToday.kpi.grossProfit + makeupMetrics.profit,
            orderCount:
              dueTodayOrders.length +
              overdueOrders.length +
              makeupMetrics.orderCount,
          },
          {
            module: 'RENTAL_SALE_MODULE',
            revenue: revenueToday.kpi.revenueNet,
            profit: profitMetrics.grossProfit,
            orderCount: dueTodayOrders.length + overdueOrders.length,
          },
          {
            module: 'MAKEUP_MODULE',
            revenue: makeupMetrics.revenue,
            profit: makeupMetrics.profit,
            orderCount: makeupMetrics.orderCount,
          },
        ],
      };

      const fallbackKpi = kpi;
      return {
        kpi: {
          ...fallbackKpi,
          depositCollectedToday:
            fallbackKpi.depositCollectedToday ||
            paymentSummary.depositCollectedTotal,
          depositRefundedToday:
            fallbackKpi.depositRefundedToday ||
            paymentSummary.depositRefundedTotal,
          realInflowToday: fallbackKpi.realInflowToday || cashflow.inflowTotal,
          realOutflowToday:
            fallbackKpi.realOutflowToday || cashflow.outflowTotal,
          realProfitToday: fallbackKpi.realProfitToday || cashflow.realProfit,
        },
        dueTodayOrders,
        overdueOrders,
        recentActivities,
      };
    } catch (error) {
      this.throwRentalError(error);
    }
  }

  async postWebhook(request: Request, body: unknown): Promise<unknown> {
    try {
      const rawBody = readRawBody(request, body);
      const payload = parseWebhookPayload(body);
      if (!payload) {
        throw new BadRequestException({ error: 'Invalid payload' });
      }

      const signatureValid = verifySignature(
        rawBody,
        parseSignatureHeader(request),
        this.config.miniAppWebhookSecret,
      );
      const supabase = this.supabaseService.createServiceRoleClient();

      const loggedEvent = await this.createOrGetWebhookEvent(supabase, {
        eventId: payload.eventId,
        eventType: payload.eventType,
        payloadJson: payload,
        signatureValid,
      });

      if (!signatureValid) {
        await this.markWebhookEventProcessed(supabase, {
          eventId: payload.eventId,
          status: 'REJECTED',
          processError: 'invalid-signature',
        });
        throw new BadRequestException({
          error: 'INVALID_SIGNATURE',
          context: { eventId: payload.eventId },
        });
      }

      if (loggedEvent.process_status === 'PROCESSED') {
        return { ok: true, duplicate: true };
      }

      if (isRevokeConsentEvent(payload.eventType)) {
        const zaloUserId = resolveZaloUserId(payload);
        if (zaloUserId) {
          await this.revokeIdentityByZaloUserId(supabase, zaloUserId);
        }
      }

      await this.markWebhookEventProcessed(supabase, {
        eventId: payload.eventId,
        status: 'PROCESSED',
      });

      return { ok: true };
    } catch (error) {
      this.miniAppService.rethrowMiniAppError(error);
    }
  }

  async postVoiceTranscription(
    request: Request,
    file: UploadedAudioFile | undefined,
    languageValue: string | null | undefined,
  ): Promise<{ transcript: string }> {
    try {
      await this.miniAppService.resolveMiniAppSessionIdentityFromRequest(
        request,
      );

      if (!file) {
        throw new BadRequestException({
          error: 'AUDIO_FILE_REQUIRED',
          message: 'Audio file is required.',
        });
      }

      if (file.size <= 0) {
        throw new BadRequestException({
          error: 'AUDIO_FILE_EMPTY',
          message: 'Audio file is empty.',
        });
      }

      if (file.size > MAX_AUDIO_BYTES) {
        throw new UnprocessableEntityException({
          error: 'AUDIO_FILE_TOO_LARGE',
          message: 'Audio file exceeds the allowed size limit.',
        });
      }

      const apiKey =
        parseString(process.env.VOICE_TRANSCRIPTION_API_KEY) ??
        parseString(process.env.OPENAI_API_KEY);
      if (!apiKey) {
        throw new ConflictException({
          error: 'VOICE_TRANSCRIPTION_UNAVAILABLE',
          message:
            'Voice transcription provider is not configured. Set VOICE_TRANSCRIPTION_API_KEY or OPENAI_API_KEY.',
        });
      }

      const apiBaseUrl =
        parseString(process.env.VOICE_TRANSCRIPTION_API_BASE_URL) ??
        'https://api.openai.com/v1';
      const model =
        parseString(process.env.VOICE_TRANSCRIPTION_MODEL) ??
        'gpt-4o-mini-transcribe';
      const prompt = parseString(process.env.VOICE_TRANSCRIPTION_PROMPT);

      const upstreamBody = new FormData();
      const blob = new Blob([new Uint8Array(file.buffer)], {
        type: file.mimetype ?? 'application/octet-stream',
      });
      upstreamBody.append(
        'file',
        blob,
        parseString(file.originalname) ?? 'voice-input.webm',
      );
      upstreamBody.append('model', model);
      const language = parseOptionalLanguage(languageValue ?? null);
      if (language) {
        upstreamBody.append('language', language);
      }
      if (prompt) {
        upstreamBody.append('prompt', prompt);
      }

      let upstreamResponse: Response;
      try {
        upstreamResponse = await fetch(`${apiBaseUrl}/audio/transcriptions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: upstreamBody,
          signal: AbortSignal.timeout(45_000),
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'TimeoutError') {
          throw new InternalServerErrorException({
            error: 'VOICE_TRANSCRIPTION_TIMEOUT',
            message: 'Voice transcription timed out.',
          });
        }
        throw new InternalServerErrorException({
          error: 'VOICE_TRANSCRIPTION_UPSTREAM_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Voice transcription upstream request failed.',
        });
      }

      const rawText = await upstreamResponse.text();
      let payload: unknown = null;
      if (rawText) {
        try {
          payload = JSON.parse(rawText) as unknown;
        } catch {
          payload = rawText;
        }
      }

      if (!upstreamResponse.ok) {
        const message =
          typeof payload === 'object' &&
          payload !== null &&
          'error' in payload &&
          typeof (payload as { error?: { message?: string } }).error
            ?.message === 'string'
            ? (payload as { error: { message: string } }).error.message
            : rawText ||
              `Voice transcription failed (${upstreamResponse.status}).`;
        throw new InternalServerErrorException({
          error: 'VOICE_TRANSCRIPTION_UPSTREAM_ERROR',
          message,
        });
      }

      const transcript =
        typeof payload === 'object' &&
        payload !== null &&
        'text' in payload &&
        typeof (payload as { text?: string }).text === 'string'
          ? (payload as { text: string }).text.trim()
          : typeof payload === 'string'
            ? payload.trim()
            : '';

      if (!transcript) {
        throw new UnprocessableEntityException({
          error: 'VOICE_TRANSCRIPTION_EMPTY',
          message: 'No speech detected.',
        });
      }

      return { transcript };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof UnprocessableEntityException
      ) {
        throw error;
      }
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      this.miniAppService.rethrowMiniAppError(error);
    }
  }

  private parseOptionalQueryDate(
    searchParams: URLSearchParams,
    key: string,
  ): string | null {
    const rawValue = searchParams.get(key);
    if (rawValue === null) return null;
    const parsed = parseDateString(rawValue);
    if (!parsed) {
      throw new MakeupDomainError('INVALID_DATE', {
        field: key,
        value: rawValue,
      });
    }
    return parsed;
  }

  private throwMakeupError(error: unknown): never {
    if (error instanceof MakeupDomainError) {
      const payload =
        Object.keys(error.context ?? {}).length > 0
          ? { error: error.code, context: error.context }
          : { error: error.code };

      if (
        error.code === 'MODULE_DISABLED' ||
        error.code === 'FORBIDDEN_ROLE' ||
        error.code === 'FORBIDDEN_BRANCH_SCOPE' ||
        error.code === 'FORBIDDEN_ARTIST_SCOPE'
      ) {
        throw new ForbiddenException(payload);
      }

      if (error.code === 'MISSING_BRANCH_CONTEXT') {
        throw new UnprocessableEntityException(payload);
      }

      if (
        error.code === 'INVALID_DATE' ||
        error.code === 'INVALID_DATE_RANGE'
      ) {
        throw new BadRequestException(payload);
      }

      throw new BadRequestException(payload);
    }

    this.miniAppService.rethrowMiniAppError(error);
  }

  private throwRentalError(error: unknown): never {
    if (error instanceof SalesProductsDomainError) {
      const payload = { error: error.code, context: error.context };
      if (error.code === 'PRODUCT_NOT_FOUND') {
        throw new NotFoundException(payload);
      }
      if (error.code === 'MISSING_BRANCH_CONTEXT') {
        throw new UnprocessableEntityException(payload);
      }
      if (error.code.startsWith('FORBIDDEN') || error.code.endsWith('DENIED')) {
        throw new ForbiddenException(payload);
      }
      throw new BadRequestException(payload);
    }

    if (error instanceof CustomersDomainError) {
      const payload = { error: error.code, context: error.context };
      if (
        error.code === 'BRANCH_REQUIRED' ||
        error.code === 'PHONE_REQUIRED' ||
        error.code === 'CUSTOMER_NAME_REQUIRED' ||
        error.code === 'INVALID_PHONE'
      ) {
        throw new BadRequestException(payload);
      }
      if (error.code === 'DUPLICATE_PHONE') {
        throw new ConflictException(payload);
      }
      throw new InternalServerErrorException(payload);
    }

    if (
      error instanceof OrdersDomainError ||
      error instanceof ReportsDomainError
    ) {
      const payload = {
        error: error.code,
        context: (error as { context: Record<string, unknown> }).context,
      };
      if (
        (error as { code: string }).code === 'FORBIDDEN_MANAGER_ACTION' ||
        (error as { code: string }).code === 'FORBIDDEN_BRANCH_SCOPE'
      ) {
        throw new ForbiddenException(payload);
      }
      if (
        (error as { code: string }).code === 'CUSTOMER_NOT_FOUND' ||
        (error as { code: string }).code === 'ORDER_NOT_FOUND'
      ) {
        throw new NotFoundException(payload);
      }
      if ((error as { code: string }).code === 'MISSING_BRANCH_CONTEXT') {
        throw new UnprocessableEntityException(payload);
      }
      throw new BadRequestException(payload);
    }

    this.miniAppService.rethrowRentalError(error);
  }

  private async fetchMakeupModuleMetricsSafe(
    supabase: SupabaseClient,
    options: { branchId: string; day: string },
  ): Promise<{ revenue: number; profit: number; orderCount: number }> {
    try {
      return await getMakeupModuleMetricsByBranchAndDay(supabase, options);
    } catch {
      return { revenue: 0, profit: 0, orderCount: 0 };
    }
  }

  private async resolveCustomerIdForMiniAppOrder(options: {
    supabase: SupabaseClient;
    profileId: string;
    branchId: string;
    orderType: 'RENTAL' | 'SALE';
    customerId?: string | null;
  }): Promise<string> {
    const explicitCustomerId = parseString(options.customerId);
    if (explicitCustomerId) return explicitCustomerId;

    if (options.orderType !== 'SALE') {
      throw new OrdersDomainError('CUSTOMER_NOT_FOUND', {
        reason: 'empty-customer-id',
      });
    }

    const { data: guest, error: guestError } = await options.supabase
      .from('customers')
      .select('id')
      .eq('branch_id', options.branchId)
      .eq('is_delete', false)
      .ilike('full_name', ZALO_SALE_GUEST_CUSTOMER_NAME)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();
    if (guestError) throw guestError;
    if (guest?.id) return guest.id;

    const { data: created, error: createError } = await options.supabase
      .from('customers')
      .insert({
        branch_id: options.branchId,
        full_name: ZALO_SALE_GUEST_CUSTOMER_NAME,
        phone: null,
        phone_normalized: null,
        note: 'AUTO_CREATED_ZALO_SALE_GUEST',
        is_active: true,
        is_delete: false,
        created_by: options.profileId,
        updated_by: options.profileId,
      })
      .select('id')
      .maybeSingle<{ id: string }>();
    if (createError) throw createError;

    if (!created?.id) {
      throw new OrdersDomainError('CUSTOMER_NOT_FOUND', {
        reason: 'auto-create-sale-guest-customer-failed',
      });
    }

    return created.id;
  }

  private async resolveDraftBranchId(
    supabase: SupabaseClient,
    requestedBranchId: string | null | undefined,
  ): Promise<string> {
    const normalized = parseString(requestedBranchId);
    if (normalized) return normalized;

    const { data, error } = await supabase
      .from('branches')
      .select('id')
      .eq('is_delete', false)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle<{ id: string }>();
    if (error) throw error;

    const branchId = parseString(data?.id);
    if (!branchId) {
      throw new BadRequestException({
        error: 'INVALID_PAYLOAD',
        context: { reason: 'missing-branch-id' },
      });
    }
    return branchId;
  }

  private async createOrderDraft(
    supabase: SupabaseClient,
    options: {
      branchId: string;
      identityId: string;
      customerId: string | null;
      items: ZaloMiniAppDraftItemInput[];
      discountAmount: number;
      surchargeAmount: number;
      note: string | null;
    },
  ): Promise<ZaloMiniAppOrderDraftDto> {
    const subtotalAmount = calculateDraftSubtotal(options.items);
    const discountAmount = Math.max(0, parseNumeric(options.discountAmount));
    const surchargeAmount = Math.max(0, parseNumeric(options.surchargeAmount));
    const totalAmount = Math.max(
      0,
      subtotalAmount - discountAmount + surchargeAmount,
    );

    const { data, error } = await supabase
      .from('zalo_mini_app_order_drafts')
      .insert({
        branch_id: options.branchId,
        identity_id: options.identityId,
        customer_id: options.customerId,
        status: 'DRAFT',
        currency_code: 'VND',
        subtotal_amount: subtotalAmount,
        discount_amount: discountAmount,
        surcharge_amount: surchargeAmount,
        total_amount: totalAmount,
        items_json: options.items,
        note: options.note,
        is_delete: false,
      })
      .select(
        'id, branch_id, identity_id, customer_id, status, currency_code, subtotal_amount, discount_amount, surcharge_amount, total_amount, items_json, note, created_at, updated_at',
      )
      .maybeSingle<ZaloMiniAppOrderDraftRow>();

    if (error) throw error;
    if (!data) {
      throw new BadRequestException({
        error: 'INVALID_PAYLOAD',
        context: { reason: 'create-draft-empty' },
      });
    }
    return mapOrderDraftRow(data);
  }

  private async getOrderDraftById(
    supabase: SupabaseClient,
    draftId: string,
  ): Promise<ZaloMiniAppOrderDraftDto | null> {
    const { data, error } = await supabase
      .from('zalo_mini_app_order_drafts')
      .select(
        'id, branch_id, identity_id, customer_id, status, currency_code, subtotal_amount, discount_amount, surcharge_amount, total_amount, items_json, note, created_at, updated_at',
      )
      .eq('id', draftId)
      .eq('is_delete', false)
      .maybeSingle<ZaloMiniAppOrderDraftRow>();
    if (error) throw error;
    if (!data) return null;
    return mapOrderDraftRow(data);
  }

  private async updateOrderDraftStatus(
    supabase: SupabaseClient,
    options: {
      draftId: string;
      status: 'DRAFT' | 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED';
    },
  ): Promise<void> {
    const { error } = await supabase
      .from('zalo_mini_app_order_drafts')
      .update({ status: options.status })
      .eq('id', options.draftId)
      .eq('is_delete', false);
    if (error) throw error;
  }

  private async createPaymentTransaction(
    supabase: SupabaseClient,
    options: {
      draftId: string;
      externalOrderId: string;
      amount: number;
      currencyCode?: string;
      status?: 'CREATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
    },
  ): Promise<ZaloMiniAppPaymentTransactionDto> {
    const { data, error } = await supabase
      .from('zalo_mini_app_payment_transactions')
      .insert({
        draft_id: options.draftId,
        external_order_id: options.externalOrderId,
        amount: options.amount,
        currency_code: options.currencyCode ?? 'VND',
        status: options.status ?? 'CREATED',
        is_delete: false,
      })
      .select(
        'id, draft_id, external_order_id, transaction_id, amount, currency_code, status, callback_payload_json, last_checked_at, created_at, updated_at',
      )
      .maybeSingle<ZaloMiniAppPaymentTransactionRow>();

    if (error) throw error;
    if (!data) {
      throw new BadRequestException({
        error: 'INVALID_PAYLOAD',
        context: { reason: 'create-payment-transaction-empty' },
      });
    }
    return mapPaymentTransactionRow(data);
  }

  private async getPaymentTransactionByExternalOrderId(
    supabase: SupabaseClient,
    externalOrderId: string,
  ): Promise<ZaloMiniAppPaymentTransactionDto | null> {
    const { data, error } = await supabase
      .from('zalo_mini_app_payment_transactions')
      .select(
        'id, draft_id, external_order_id, transaction_id, amount, currency_code, status, callback_payload_json, last_checked_at, created_at, updated_at',
      )
      .eq('external_order_id', externalOrderId)
      .eq('is_delete', false)
      .maybeSingle<ZaloMiniAppPaymentTransactionRow>();
    if (error) throw error;
    if (!data) return null;
    return mapPaymentTransactionRow(data);
  }

  private async updatePaymentTransactionByExternalOrderId(
    supabase: SupabaseClient,
    options: {
      externalOrderId: string;
      transactionId?: string | null;
      status: 'CREATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
      callbackPayloadJson?: unknown;
      lastCheckedAt?: string | null;
    },
  ): Promise<ZaloMiniAppPaymentTransactionDto> {
    const payload: {
      transaction_id?: string | null;
      status: 'CREATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
      callback_payload_json?: unknown;
      last_checked_at?: string | null;
    } = { status: options.status };

    if (options.transactionId !== undefined) {
      payload.transaction_id = options.transactionId;
    }
    if (options.callbackPayloadJson !== undefined) {
      payload.callback_payload_json = options.callbackPayloadJson;
    }
    if (options.lastCheckedAt !== undefined) {
      payload.last_checked_at = options.lastCheckedAt;
    }

    const { data, error } = await supabase
      .from('zalo_mini_app_payment_transactions')
      .update(payload)
      .eq('external_order_id', options.externalOrderId)
      .eq('is_delete', false)
      .select(
        'id, draft_id, external_order_id, transaction_id, amount, currency_code, status, callback_payload_json, last_checked_at, created_at, updated_at',
      )
      .maybeSingle<ZaloMiniAppPaymentTransactionRow>();

    if (error) throw error;
    if (!data) {
      throw new NotFoundException({
        error: 'PAYMENT_NOT_FOUND',
        context: { externalOrderId: options.externalOrderId },
      });
    }
    return mapPaymentTransactionRow(data);
  }

  private async createOrGetWebhookEvent(
    supabase: SupabaseClient,
    options: {
      eventId: string;
      eventType: string;
      payloadJson: unknown;
      signatureValid: boolean;
    },
  ): Promise<{
    process_status: 'RECEIVED' | 'PROCESSED' | 'REJECTED' | 'FAILED';
  }> {
    type WebhookRow = {
      process_status: 'RECEIVED' | 'PROCESSED' | 'REJECTED' | 'FAILED';
    };

    const { data, error } = await supabase
      .from('zalo_mini_app_webhook_events')
      .insert({
        event_id: options.eventId,
        event_type: options.eventType,
        payload_json: options.payloadJson,
        signature_valid: options.signatureValid,
        process_status: options.signatureValid ? 'RECEIVED' : 'REJECTED',
        process_error: options.signatureValid ? null : 'invalid-signature',
        processed_at: options.signatureValid ? null : new Date().toISOString(),
        is_delete: false,
      })
      .select('process_status')
      .maybeSingle<WebhookRow>();
    if (!error && data) return data;

    if (error?.code === '23505') {
      const { data: existing, error: existingError } = await supabase
        .from('zalo_mini_app_webhook_events')
        .select('process_status')
        .eq('event_id', options.eventId)
        .eq('is_delete', false)
        .maybeSingle<WebhookRow>();
      if (existingError) throw existingError;
      if (!existing) {
        throw new ConflictException({
          error: 'EVENT_ALREADY_PROCESSED',
          context: { eventId: options.eventId },
        });
      }
      return existing;
    }

    if (error) throw error;
    throw new BadRequestException({
      error: 'INVALID_PAYLOAD',
      context: {
        reason: 'create-webhook-event-empty',
        eventId: options.eventId,
      },
    });
  }

  private async markWebhookEventProcessed(
    supabase: SupabaseClient,
    options: {
      eventId: string;
      status: 'PROCESSED' | 'FAILED' | 'REJECTED';
      processError?: string | null;
    },
  ): Promise<void> {
    const { error } = await supabase
      .from('zalo_mini_app_webhook_events')
      .update({
        process_status: options.status,
        process_error: options.processError ?? null,
        processed_at: new Date().toISOString(),
      })
      .eq('event_id', options.eventId)
      .eq('is_delete', false);
    if (error) throw error;
  }

  private async revokeIdentityByZaloUserId(
    supabase: SupabaseClient,
    zaloUserId: string,
  ): Promise<void> {
    const nowIso = new Date().toISOString();
    const { data: identityRows, error: fetchError } = await supabase
      .from('zalo_mini_app_identities')
      .select('id')
      .eq('zalo_user_id', zaloUserId)
      .eq('is_delete', false)
      .returns<Array<{ id: string }>>();
    if (fetchError) throw fetchError;

    const identityIds = (identityRows ?? []).map((entry) => entry.id);
    const { error: identityError } = await supabase
      .from('zalo_mini_app_identities')
      .update({ consent_revoked_at: nowIso, updated_at: nowIso })
      .eq('zalo_user_id', zaloUserId)
      .eq('is_delete', false);
    if (identityError) throw identityError;

    if (identityIds.length === 0) return;
    const { error: sessionError } = await supabase
      .from('zalo_mini_app_sessions')
      .update({ revoked_at: nowIso, updated_at: nowIso })
      .in('identity_id', identityIds)
      .eq('is_delete', false)
      .is('revoked_at', null);
    if (sessionError) throw sessionError;
  }
}
