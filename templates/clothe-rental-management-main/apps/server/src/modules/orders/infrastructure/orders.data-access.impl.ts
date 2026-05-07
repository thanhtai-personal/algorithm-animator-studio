import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import {
  ORDER_STATUS_TRANSITIONS,
  ORDER_STATUS_VALUES,
} from '../../shared/domain/domain-primitives.constants';
import {
  computeOrderCogsAmount,
  computeOutstandingDebt,
  computeProfitMetrics,
  computeRecognizedCogs,
  summarizeFinancialPayments,
} from './order-finance.data-access';
import type {
  OrderStatus,
  OrderType,
} from '../../shared/domain/types/domain-primitives.type';
import type {
  AddOrderPaymentPayload,
  AddOrderItemPayload,
  CreateOrderIncidentPayload,
  CreateOrderPayload,
  OrderCancelPayload,
  OrderActivityEntryDto,
  OrderAuditAction,
  OrderAvailabilityConflictDto,
  OrderAvailabilityItemDto,
  OrderAvailabilityResponse,
  OrderDetailDto,
  OrderDiscountType,
  OrderIncidentDto,
  OrderIncidentStatus,
  OrderIncidentType,
  OrderItemDto,
  OrderItemInputPayload,
  OrderMoneySummaryDto,
  OrderPaymentDto,
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderPaymentType,
  OrderPricingMode,
  OrderRentPlanType,
  OrderStatusTransitionPayload,
  OrderSummaryDto,
  OrdersListResponse,
  PickupOrderPayload,
  ProcessOrderReturnPayload,
  ReservationWindowDto,
  ReturnFlowItemPayload,
  ReturnItemCondition,
  ReturnItemTargetStatus,
  UpdateOrderPaymentStatusPayload,
  UpdateOrderItemPricingPayload,
  UpdateOrderPayload,
} from '../types/orders-domain.type';

const ORDER_STATUS_SET = new Set<string>(ORDER_STATUS_VALUES);
const ORDER_TYPE_SET = new Set<OrderType>(['RENTAL', 'SALE']);
const LOCKING_ORDER_STATUS_SET = new Set<OrderStatus>([
  'RESERVED',
  'CONFIRMED',
  'PICKED_UP',
]);
const PRE_PICKUP_MUTABLE_STATUS_SET = new Set<OrderStatus>([
  'DRAFT',
  'RESERVED',
  'CONFIRMED',
]);
const MANAGER_PLUS_ROLE_SET = new Set<string>(['owner_admin', 'manager']);
const OWNER_ADMIN_ROLE_SET = new Set<string>(['owner_admin']);
const AVAILABLE_ITEM_STATUS_SET = new Set<string>(['READY']);
const ORDER_PAYMENT_TYPE_SET = new Set<string>([
  'RENT',
  'DEPOSIT',
  'FEE',
  'REFUND',
]);
const ORDER_PAYMENT_METHOD_SET = new Set<string>(['CASH', 'BANK', 'MOMO']);
const ORDER_PAYMENT_RECEIPT_METHOD_SET = new Set<string>(['CASH', 'BANK']);
const ORDER_PRICING_MODE_SET = new Set<OrderPricingMode>(['STANDARD', 'QUICK']);
const ORDER_PAYMENT_STATUS_SET = new Set<string>(['POSTED', 'VOIDED']);
const ORDER_INCIDENT_TYPE_SET = new Set<string>([
  'LATE',
  'DAMAGE',
  'LOST',
  'CLEANING',
]);
const ORDER_INCIDENT_STATUS_SET = new Set<string>([
  'OPEN',
  'SETTLED',
  'WAIVED',
]);
const DEFAULT_ORDER_AUDIT_WRITE_POINTS = [
  'edit price/discount/deposit',
  'cancel order',
  'refund',
  'mark lost/damaged',
];

type OrdersDomainErrorCode =
  | 'INVALID_DATE_RANGE'
  | 'INVALID_ORDER_STATUS'
  | 'INVALID_PRICING_MODE'
  | 'INVALID_PAYMENT_TYPE'
  | 'INVALID_PAYMENT_METHOD'
  | 'INVALID_PAYMENT_STATUS'
  | 'PAYMENT_RECEIPT_CONFIRM_REQUIRED'
  | 'PAYMENT_RECEIPT_METHOD_INVALID'
  | 'PAYMENT_RECEIPT_AMOUNT_MISMATCH'
  | 'INVALID_INCIDENT_TYPE'
  | 'INVALID_INCIDENT_STATUS'
  | 'ORDER_NOT_FOUND'
  | 'CUSTOMER_NOT_FOUND'
  | 'CUSTOMER_BRANCH_MISMATCH'
  | 'MISSING_BRANCH_CONTEXT'
  | 'ORDER_STATUS_TRANSITION_INVALID'
  | 'ORDER_STATUS_NOT_EDITABLE'
  | 'ORDER_CANCEL_NOT_ALLOWED'
  | 'ORDER_ITEM_MUTATION_NOT_ALLOWED'
  | 'ORDER_REQUIRES_ITEMS_FOR_STATUS'
  | 'ITEM_NOT_FOUND'
  | 'ITEM_ALREADY_IN_ORDER'
  | 'ITEM_UNAVAILABLE'
  | 'RESERVATION_OVERLAP_CONFLICT'
  | 'FORBIDDEN_CONFIRMED_EDIT'
  | 'FORBIDDEN_MANAGER_ACTION'
  | 'PICKUP_NOT_ALLOWED'
  | 'RETURN_NOT_ALLOWED'
  | 'COMPLETE_NOT_ALLOWED'
  | 'PAYMENT_NOT_FOUND'
  | 'PAYMENT_AMOUNT_INVALID'
  | 'PAYMENT_STATUS_TRANSITION_INVALID'
  | 'PAYMENT_OVERPAY_NOT_ALLOWED'
  | 'PAYMENT_REFUND_EXCEEDS_LIMIT'
  | 'INCIDENT_ITEM_REQUIRED'
  | 'INCIDENT_AMOUNT_INVALID'
  | 'RETURN_ITEMS_REQUIRED'
  | 'RETURN_ITEM_NOT_IN_ORDER'
  | 'RETURN_LOST_REQUIRES_INCIDENT'
  | 'FORBIDDEN_PAYMENT_STATUS_UPDATE';

interface OrdersDomainErrorContext {
  [key: string]: unknown;
}

export class OrdersDomainError extends Error {
  readonly code: OrdersDomainErrorCode;
  readonly context: OrdersDomainErrorContext;

  constructor(
    code: OrdersDomainErrorCode,
    context: OrdersDomainErrorContext = {},
  ) {
    super(code);
    this.name = 'OrdersDomainError';
    this.code = code;
    this.context = context;
  }
}

interface ProfileActorRow {
  id: string;
  role: string | null;
  default_branch_id: string | null;
}

interface CustomerRow {
  id: string;
  branch_id: string;
  full_name: string;
  phone: string | null;
}

interface RentalOrderRow {
  id: string;
  branch_id: string;
  order_code: string;
  order_type: string | null;
  customer_id: string;
  status: string;
  start_date: string;
  end_date: string;
  pricing_mode: string | null;
  pickup_time: string | null;
  return_time: string | null;
  confirmed_at: string | null;
  picked_up_at: string | null;
  returned_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  discount_type: string | null;
  discount_value: number | string | null;
  discount_amount: number | string | null;
  rent_amount: number | string | null;
  fees_amount: number | string | null;
  total_amount: number | string | null;
  deposit_amount: number | string | null;
  deposit_applied_amount: number | string | null;
  deposit_refunded_amount: number | string | null;
  note: string | null;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
}

interface RentalOrderItemRow {
  id: string;
  order_id: string;
  item_id: string;
  product_id: string;
  item_code_snapshot: string | null;
  product_name_snapshot: string | null;
  rent_plan_type: string | null;
  rent_plan_days: number | null;
  rent_price: number | string | null;
  deposit_override_amount: number | string | null;
  deposit_effective_amount: number | string | null;
  cogs_snapshot_amount: number | string | null;
  condition_out_note: string | null;
  condition_in_note: string | null;
  created_at: string;
}

interface ItemRow {
  id: string;
  branch_id: string;
  product_id: string;
  item_code: string;
  status: string;
}

interface ProductRow {
  id: string;
  name: string;
  category_id: string | null;
  rent_price_per_day: number | string | null;
  quick_rent_price: number | string | null;
  rent_deposit_amount: number | string | null;
  purchase_price: number | string | null;
}

function normalizeOrderPricingMode(
  value: string | null | undefined,
): OrderPricingMode | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_PRICING_MODE_SET.has(normalized as OrderPricingMode)) {
    return null;
  }
  return normalized as OrderPricingMode;
}

interface CategoryDepositDefaultRow {
  category_id: string;
  default_deposit_amount: number | string | null;
  is_active: boolean;
}

interface ReservationWindowRow {
  id: string;
  order_id: string;
  item_id: string;
  source_order_status: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  released_at: string | null;
  release_reason: string | null;
}

interface PaymentRow {
  id: string;
  branch_id: string;
  order_id: string;
  customer_id: string | null;
  type: string;
  method: string;
  reason: string | null;
  source: string | null;
  status: string;
  note: string | null;
  reference_code: string | null;
  void_reason: string | null;
  voided_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  amount: number | string | null;
  created_at: string;
  updated_at: string;
}

interface IncidentRow {
  id: string;
  branch_id: string;
  order_id: string;
  order_item_id: string | null;
  item_id: string | null;
  customer_id: string | null;
  type: string;
  status: string;
  amount: number | string | null;
  apply_to_deposit: boolean;
  description: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AuditEventRow {
  id: string;
  actor_profile_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  reason: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

interface MaintenanceTaskInsertRow {
  branch_id: string;
  item_id: string;
  order_id: string;
  incident_id: string | null;
  status: 'OPEN';
  priority: 'NORMAL' | 'HIGH';
  issue_type: 'DAMAGE' | 'MAINTENANCE';
  title: string;
  description: string | null;
  created_by: string;
  updated_by: string;
}

interface OrderItemComputationInput {
  rentPrice: number;
  depositEffectiveAmount: number;
  cogsSnapshotAmount: number;
}

function parseNumeric(value: number | string | null | undefined): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

function sanitizeText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeSearchTerm(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.replace(/[,%]/g, ' ').trim();
  return trimmed.length > 0 ? trimmed : null;
}

function uniqueStringValues(
  values: Array<string | null | undefined>,
): string[] {
  const output: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (!value) continue;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    output.push(trimmed);
  }

  return output;
}

function assertValidDateRange(startDate: string, endDate: string): void {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
  ) {
    throw new OrdersDomainError('INVALID_DATE_RANGE', {
      startDate,
      endDate,
      reason: 'invalid-format',
    });
  }

  if (endDate < startDate) {
    throw new OrdersDomainError('INVALID_DATE_RANGE', {
      startDate,
      endDate,
      reason: 'end-before-start',
    });
  }
}

function formatDateToIso(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeToIso(value: Date): string {
  const hour = String(value.getHours()).padStart(2, '0');
  const minute = String(value.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

function addIsoDateDays(startDate: string, days: number): string {
  const base = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) {
    throw new OrdersDomainError('INVALID_DATE_RANGE', {
      startDate,
      reason: 'invalid-start-date-for-pricing-mode',
    });
  }
  base.setDate(base.getDate() + days);
  return formatDateToIso(base);
}

function normalizeOrderStatus(value: string): OrderStatus {
  if (ORDER_STATUS_SET.has(value)) {
    return value as OrderStatus;
  }

  return 'DRAFT';
}

function normalizeOrderType(value: string | null | undefined): OrderType {
  if (value && ORDER_TYPE_SET.has(value as OrderType)) {
    return value as OrderType;
  }

  return 'RENTAL';
}

function normalizeDiscountType(
  value: string | null | undefined,
): OrderDiscountType {
  if (value === 'amount' || value === 'percent') {
    return value;
  }

  return null;
}

function normalizeRentPlanType(
  value: string | null | undefined,
): OrderRentPlanType {
  if (
    value === '1d' ||
    value === '3d' ||
    value === '7d' ||
    value === 'custom'
  ) {
    return value;
  }

  return null;
}

function normalizePaymentType(
  value: string | null | undefined,
): OrderPaymentType | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (ORDER_PAYMENT_TYPE_SET.has(normalized)) {
    return normalized as OrderPaymentType;
  }
  return null;
}

function normalizePaymentMethod(
  value: string | null | undefined,
): OrderPaymentMethod | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (ORDER_PAYMENT_METHOD_SET.has(normalized)) {
    return normalized as OrderPaymentMethod;
  }
  return null;
}

function normalizePaymentStatus(
  value: string | null | undefined,
): OrderPaymentStatus | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (ORDER_PAYMENT_STATUS_SET.has(normalized)) {
    return normalized as OrderPaymentStatus;
  }
  return null;
}

function normalizeIncidentType(
  value: string | null | undefined,
): OrderIncidentType | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (ORDER_INCIDENT_TYPE_SET.has(normalized)) {
    return normalized as OrderIncidentType;
  }
  return null;
}

function normalizeIncidentStatus(
  value: string | null | undefined,
): OrderIncidentStatus | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (ORDER_INCIDENT_STATUS_SET.has(normalized)) {
    return normalized as OrderIncidentStatus;
  }
  return null;
}

function isManagerPlusRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return MANAGER_PLUS_ROLE_SET.has(role);
}

function isOwnerAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return OWNER_ADMIN_ROLE_SET.has(role);
}

function isLockingOrderStatus(status: OrderStatus): boolean {
  return LOCKING_ORDER_STATUS_SET.has(status);
}

function computeDiscountAmount(options: {
  rentAmount: number;
  discountType: OrderDiscountType;
  discountValue: number | null;
}): number {
  const rentAmount = roundMoney(Math.max(0, options.rentAmount));
  if (!options.discountType || options.discountValue === null) {
    return 0;
  }

  const discountValue = Math.max(0, options.discountValue);
  if (options.discountType === 'amount') {
    return roundMoney(Math.min(discountValue, rentAmount));
  }

  const clampedPercent = Math.min(discountValue, 100);
  return roundMoney(Math.min((rentAmount * clampedPercent) / 100, rentAmount));
}

function buildOrderCode(prefix: string = 'ODR'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function isReservationOverlapConflict(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const pgError = error as PostgrestError;
  if (pgError.code === '23P01') return true;

  const details = [pgError.message, pgError.details, pgError.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return details.includes('reservation_windows_item_range_excl');
}

async function fetchActorProfile(
  supabase: SupabaseClient,
  profileId: string,
): Promise<ProfileActorRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, default_branch_id')
    .eq('id', profileId)
    .eq('is_delete', false)
    .eq('is_active', true)
    .maybeSingle<ProfileActorRow>();

  if (error) throw error;
  return data ?? null;
}

async function fetchCustomerById(
  supabase: SupabaseClient,
  customerId: string,
): Promise<CustomerRow | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('id, branch_id, full_name, phone')
    .eq('id', customerId)
    .eq('is_delete', false)
    .maybeSingle<CustomerRow>();

  if (error) throw error;
  return data ?? null;
}

async function fetchCustomersByIds(
  supabase: SupabaseClient,
  customerIds: string[],
): Promise<CustomerRow[]> {
  if (customerIds.length === 0) return [];

  const { data, error } = await supabase
    .from('customers')
    .select('id, branch_id, full_name, phone')
    .in('id', customerIds)
    .eq('is_delete', false)
    .returns<CustomerRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function fetchOrderById(
  supabase: SupabaseClient,
  orderId: string,
): Promise<RentalOrderRow | null> {
  const { data, error } = await supabase
    .from('rental_orders')
    .select(
      [
        'id',
        'branch_id',
        'order_code',
        'order_type',
        'customer_id',
        'status',
        'start_date',
        'end_date',
        'pricing_mode',
        'pickup_time',
        'return_time',
        'confirmed_at',
        'picked_up_at',
        'returned_at',
        'completed_at',
        'cancelled_at',
        'cancel_reason',
        'discount_type',
        'discount_value',
        'discount_amount',
        'rent_amount',
        'fees_amount',
        'total_amount',
        'deposit_amount',
        'deposit_applied_amount',
        'deposit_refunded_amount',
        'note',
        'internal_note',
        'created_at',
        'updated_at',
      ].join(','),
    )
    .eq('id', orderId)
    .eq('is_delete', false)
    .maybeSingle<RentalOrderRow>();

  if (error) throw error;
  return data ?? null;
}

async function fetchOrderItems(
  supabase: SupabaseClient,
  orderId: string,
): Promise<RentalOrderItemRow[]> {
  const { data, error } = await supabase
    .from('rental_order_items')
    .select(
      [
        'id',
        'order_id',
        'item_id',
        'product_id',
        'item_code_snapshot',
        'product_name_snapshot',
        'rent_plan_type',
        'rent_plan_days',
        'rent_price',
        'deposit_override_amount',
        'deposit_effective_amount',
        'cogs_snapshot_amount',
        'condition_out_note',
        'condition_in_note',
        'created_at',
      ].join(','),
    )
    .eq('order_id', orderId)
    .eq('is_delete', false)
    .order('created_at', { ascending: true })
    .returns<RentalOrderItemRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function fetchOrderItemsForOrderIds(
  supabase: SupabaseClient,
  orderIds: string[],
): Promise<
  Array<{
    order_id: string;
    rent_price: number | string | null;
    deposit_effective_amount: number | string | null;
    cogs_snapshot_amount: number | string | null;
  }>
> {
  if (orderIds.length === 0) return [];

  const { data, error } = await supabase
    .from('rental_order_items')
    .select(
      'order_id, rent_price, deposit_effective_amount, cogs_snapshot_amount',
    )
    .in('order_id', orderIds)
    .eq('is_delete', false)
    .returns<
      Array<{
        order_id: string;
        rent_price: number | string | null;
        deposit_effective_amount: number | string | null;
        cogs_snapshot_amount: number | string | null;
      }>
    >();

  if (error) throw error;
  return data ?? [];
}

async function fetchOrderItemById(
  supabase: SupabaseClient,
  orderId: string,
  orderItemId: string,
): Promise<RentalOrderItemRow | null> {
  const { data, error } = await supabase
    .from('rental_order_items')
    .select(
      [
        'id',
        'order_id',
        'item_id',
        'product_id',
        'item_code_snapshot',
        'product_name_snapshot',
        'rent_plan_type',
        'rent_plan_days',
        'rent_price',
        'deposit_override_amount',
        'deposit_effective_amount',
        'cogs_snapshot_amount',
        'condition_out_note',
        'condition_in_note',
        'created_at',
      ].join(','),
    )
    .eq('order_id', orderId)
    .eq('id', orderItemId)
    .eq('is_delete', false)
    .maybeSingle<RentalOrderItemRow>();

  if (error) throw error;
  return data ?? null;
}

async function fetchItemsByIds(
  supabase: SupabaseClient,
  itemIds: string[],
): Promise<ItemRow[]> {
  if (itemIds.length === 0) return [];

  const { data, error } = await supabase
    .from('items')
    .select('id, branch_id, product_id, item_code, status')
    .in('id', itemIds)
    .eq('is_delete', false)
    .returns<ItemRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function fetchProductsByIds(
  supabase: SupabaseClient,
  productIds: string[],
): Promise<ProductRow[]> {
  if (productIds.length === 0) return [];

  const { data, error } = await supabase
    .from('products')
    .select(
      'id, name, category_id, rent_price_per_day, quick_rent_price, rent_deposit_amount, purchase_price',
    )
    .in('id', productIds)
    .eq('is_delete', false)
    .returns<ProductRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function fetchReservationWindowsByOrderId(
  supabase: SupabaseClient,
  orderId: string,
): Promise<ReservationWindowRow[]> {
  const { data, error } = await supabase
    .from('reservation_windows')
    .select(
      'id, order_id, item_id, source_order_status, start_date, end_date, is_active, released_at, release_reason',
    )
    .eq('order_id', orderId)
    .eq('is_delete', false)
    .order('created_at', { ascending: false })
    .returns<ReservationWindowRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function fetchPaymentsByOrderId(
  supabase: SupabaseClient,
  orderId: string,
): Promise<PaymentRow[]> {
  const { data, error } = await supabase
    .from('payments')
    .select(
      'id, branch_id, order_id, customer_id, type, method, amount, reason, source, status, note, reference_code, void_reason, voided_at, created_by, updated_by, created_at, updated_at',
    )
    .eq('order_id', orderId)
    .eq('is_delete', false)
    .order('created_at', { ascending: false })
    .returns<PaymentRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function fetchPaymentsByOrderIds(
  supabase: SupabaseClient,
  orderIds: string[],
): Promise<PaymentRow[]> {
  if (orderIds.length === 0) return [];

  const { data, error } = await supabase
    .from('payments')
    .select(
      'id, branch_id, order_id, customer_id, type, method, amount, reason, source, status, note, reference_code, void_reason, voided_at, created_by, updated_by, created_at, updated_at',
    )
    .in('order_id', orderIds)
    .eq('is_delete', false)
    .returns<PaymentRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function fetchPaymentById(
  supabase: SupabaseClient,
  orderId: string,
  paymentId: string,
): Promise<PaymentRow | null> {
  const { data, error } = await supabase
    .from('payments')
    .select(
      'id, branch_id, order_id, customer_id, type, method, amount, reason, source, status, note, reference_code, void_reason, voided_at, created_by, updated_by, created_at, updated_at',
    )
    .eq('order_id', orderId)
    .eq('id', paymentId)
    .eq('is_delete', false)
    .maybeSingle<PaymentRow>();

  if (error) throw error;
  return data ?? null;
}

async function fetchIncidentsByOrderId(
  supabase: SupabaseClient,
  orderId: string,
): Promise<IncidentRow[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select(
      'id, branch_id, order_id, order_item_id, item_id, customer_id, type, status, amount, apply_to_deposit, description, created_by, updated_by, created_at, updated_at',
    )
    .eq('order_id', orderId)
    .eq('is_delete', false)
    .order('created_at', { ascending: false })
    .returns<IncidentRow[]>();

  if (error) throw error;
  return data ?? [];
}

async function fetchAuditEventsByOrderId(
  supabase: SupabaseClient,
  orderId: string,
): Promise<AuditEventRow[]> {
  const { data, error } = await supabase
    .from('audit_events')
    .select(
      'id, actor_profile_id, entity_type, entity_id, action, reason, before_data, after_data, meta, created_at',
    )
    .eq('entity_type', 'rental_order')
    .eq('entity_id', orderId)
    .eq('is_delete', false)
    .order('created_at', { ascending: false })
    .returns<AuditEventRow[]>();

  if (error) throw error;
  return data ?? [];
}

function computeOrderMoneySummary(options: {
  order: RentalOrderRow;
  orderItems: OrderItemComputationInput[];
  payments: PaymentRow[];
  depositAmountOverride?: number | null;
}): OrderMoneySummaryDto {
  const rentAmount = roundMoney(
    options.orderItems.reduce((sum, row) => sum + row.rentPrice, 0),
  );

  const discountType = normalizeDiscountType(options.order.discount_type);
  const discountValueRaw = parseNumeric(options.order.discount_value);
  const discountValue = discountType ? discountValueRaw : null;
  const discountAmount = computeDiscountAmount({
    rentAmount,
    discountType,
    discountValue,
  });

  const feesAmount = roundMoney(
    Math.max(0, parseNumeric(options.order.fees_amount)),
  );
  const totalAmount = roundMoney(
    Math.max(0, rentAmount - discountAmount + feesAmount),
  );

  const suggestedDepositAmount = roundMoney(
    options.orderItems.reduce(
      (sum, row) => sum + row.depositEffectiveAmount,
      0,
    ),
  );
  const storedDeposit = roundMoney(
    Math.max(0, parseNumeric(options.order.deposit_amount)),
  );
  const depositAmount = roundMoney(
    Math.max(
      0,
      options.depositAmountOverride === undefined ||
        options.depositAmountOverride === null
        ? storedDeposit > 0
          ? storedDeposit
          : suggestedDepositAmount
        : options.depositAmountOverride,
    ),
  );

  const paymentSummary = summarizeFinancialPayments(
    options.payments.map((payment) => ({
      type: payment.type,
      status: payment.status,
      amount: payment.amount,
      reason: payment.reason,
      source: payment.source,
    })),
  );

  const depositPaid = paymentSummary.depositCollectedTotal;
  const rentPaid = paymentSummary.rentCollectedTotal;
  const feePaid = paymentSummary.feeCollectedTotal;
  const refundPaid = paymentSummary.totalRefundAmount;

  const depositAppliedAmount = roundMoney(
    Math.max(0, parseNumeric(options.order.deposit_applied_amount)),
  );
  const depositRefundedAmount = paymentSummary.depositRefundedTotal;
  const orderType = normalizeOrderType(options.order.order_type);
  const orderCogsAmount = computeOrderCogsAmount({
    orderType,
    saleItemCostSnapshots: options.orderItems.map(
      (row) => row.cogsSnapshotAmount,
    ),
  });
  const recognizedCogs = computeRecognizedCogs({
    orderCogsAmount,
    receivableAmount: totalAmount,
    revenueNet: paymentSummary.revenueNet,
  });
  const profitMetrics = computeProfitMetrics({
    revenueNet: paymentSummary.revenueNet,
    cogs: recognizedCogs,
  });

  const refundableDeposit = roundMoney(
    Math.max(0, depositPaid - depositAppliedAmount - depositRefundedAmount),
  );
  const outstandingAmount = computeOutstandingDebt({
    receivableAmount: totalAmount,
    collectedAmount: paymentSummary.receivableCollectedTotal,
  });

  return {
    rentAmount,
    discountAmount,
    feesAmount,
    totalAmount,
    depositAmount,
    depositAppliedAmount,
    depositRefundedAmount,
    depositPaid,
    rentPaid,
    feePaid,
    refundPaid,
    revenueGross: paymentSummary.revenueGross,
    refundEffective: paymentSummary.refundEffective,
    revenueNet: paymentSummary.revenueNet,
    cogs: profitMetrics.cogs,
    grossProfit: profitMetrics.grossProfit,
    profitMargin: profitMetrics.profitMargin,
    depositCollectedTotal: paymentSummary.depositCollectedTotal,
    depositRefundedTotal: paymentSummary.depositRefundedTotal,
    receivableCollectedTotal: paymentSummary.receivableCollectedTotal,
    refundableDeposit,
    outstandingAmount,
  };
}

function mapReservationWindowRow(
  row: ReservationWindowRow,
): ReservationWindowDto {
  return {
    id: row.id,
    orderId: row.order_id,
    itemId: row.item_id,
    sourceOrderStatus: normalizeOrderStatus(row.source_order_status),
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: row.is_active,
    releasedAt: row.released_at,
    releaseReason: row.release_reason,
  };
}

function mapPaymentRow(row: PaymentRow): OrderPaymentDto {
  return {
    id: row.id,
    orderId: row.order_id,
    customerId: row.customer_id,
    type: normalizePaymentType(row.type) ?? 'FEE',
    method: normalizePaymentMethod(row.method) ?? 'CASH',
    amount: roundMoney(parseNumeric(row.amount)),
    status: normalizePaymentStatus(row.status) ?? 'POSTED',
    reason: row.reason,
    source: row.source,
    note: row.note,
    referenceCode: row.reference_code,
    voidReason: row.void_reason,
    voidedAt: row.voided_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapIncidentRow(row: IncidentRow): OrderIncidentDto {
  return {
    id: row.id,
    orderId: row.order_id,
    orderItemId: row.order_item_id,
    itemId: row.item_id,
    customerId: row.customer_id,
    type: normalizeIncidentType(row.type) ?? 'CLEANING',
    status: normalizeIncidentStatus(row.status) ?? 'OPEN',
    amount: roundMoney(parseNumeric(row.amount)),
    applyToDeposit: row.apply_to_deposit,
    description: row.description,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAuditEventRow(row: AuditEventRow): OrderActivityEntryDto {
  return {
    id: row.id,
    actorProfileId: row.actor_profile_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    reason: row.reason,
    beforeData: row.before_data,
    afterData: row.after_data,
    meta: row.meta,
    createdAt: row.created_at,
  };
}

async function mapOrderItemsToDto(
  supabase: SupabaseClient,
  rows: RentalOrderItemRow[],
): Promise<OrderItemDto[]> {
  const itemIds = uniqueStringValues(rows.map((row) => row.item_id));
  const productIds = uniqueStringValues(rows.map((row) => row.product_id));

  const [items, products] = await Promise.all([
    fetchItemsByIds(supabase, itemIds),
    fetchProductsByIds(supabase, productIds),
  ]);

  const itemById = new Map(items.map((entry) => [entry.id, entry]));
  const productById = new Map(products.map((entry) => [entry.id, entry]));

  return rows.map((row) => {
    const item = itemById.get(row.item_id) ?? null;
    const product = productById.get(row.product_id) ?? null;

    return {
      orderItemId: row.id,
      itemId: row.item_id,
      itemCode: row.item_code_snapshot ?? item?.item_code ?? null,
      itemStatus: item?.status ?? null,
      productId: row.product_id,
      productName: row.product_name_snapshot ?? product?.name ?? null,
      variantId: row.product_id,
      variantName: null,
      rentPlanType: normalizeRentPlanType(row.rent_plan_type),
      rentPlanDays: row.rent_plan_days,
      rentPrice: roundMoney(parseNumeric(row.rent_price)),
      depositOverrideAmount:
        row.deposit_override_amount === null
          ? null
          : roundMoney(parseNumeric(row.deposit_override_amount)),
      depositEffectiveAmount:
        row.deposit_effective_amount === null
          ? null
          : roundMoney(parseNumeric(row.deposit_effective_amount)),
      cogsSnapshotAmount:
        row.cogs_snapshot_amount === null
          ? null
          : roundMoney(parseNumeric(row.cogs_snapshot_amount)),
      conditionOutNote: row.condition_out_note,
      conditionInNote: row.condition_in_note,
      createdAt: row.created_at,
    };
  });
}

function mapOrderSummary(options: {
  order: RentalOrderRow;
  customer: CustomerRow;
  itemCount: number;
  money: OrderMoneySummaryDto;
}): OrderSummaryDto {
  return {
    id: options.order.id,
    branchId: options.order.branch_id,
    orderCode: options.order.order_code,
    orderType: normalizeOrderType(options.order.order_type),
    status: normalizeOrderStatus(options.order.status),
    startDate: options.order.start_date,
    endDate: options.order.end_date,
    pricingMode: normalizeOrderPricingMode(options.order.pricing_mode),
    pickupTime: options.order.pickup_time,
    returnTime: options.order.return_time,
    note: options.order.note,
    internalNote: options.order.internal_note,
    cancelReason: options.order.cancel_reason,
    cancelledAt: options.order.cancelled_at,
    customer: {
      customerId: options.customer.id,
      fullName: options.customer.full_name,
      phone: options.customer.phone,
    },
    itemCount: options.itemCount,
    discountType: normalizeDiscountType(options.order.discount_type),
    discountValue:
      options.order.discount_type === null
        ? null
        : roundMoney(parseNumeric(options.order.discount_value)),
    money: options.money,
    createdAt: options.order.created_at,
    updatedAt: options.order.updated_at,
  };
}

function pickRentPriceFromProduct(options: {
  product: ProductRow;
  input: OrderItemInputPayload | UpdateOrderItemPricingPayload;
  pricingMode?: OrderPricingMode | null;
}): number {
  if (
    typeof options.input.rentPrice === 'number' &&
    Number.isFinite(options.input.rentPrice)
  ) {
    return roundMoney(Math.max(0, options.input.rentPrice));
  }

  if (
    options.pricingMode === 'QUICK' &&
    options.input.rentPlanType !== 'custom'
  ) {
    const quickPrice = parseNumeric(options.product.quick_rent_price);
    if (quickPrice !== null && quickPrice > 0) {
      return roundMoney(quickPrice);
    }
  }

  if (
    options.pricingMode === 'STANDARD' &&
    options.input.rentPlanType !== 'custom'
  ) {
    const standardPrice = parseNumeric(options.product.rent_price_per_day);
    return roundMoney(Math.max(0, standardPrice ?? 0));
  }

  const planType = options.input.rentPlanType ?? '1d';
  const planDays =
    typeof options.input.rentPlanDays === 'number' &&
    Number.isFinite(options.input.rentPlanDays)
      ? Math.max(1, Math.floor(options.input.rentPlanDays))
      : null;

  const price1d = parseNumeric(options.product.rent_price_per_day) ?? 0;
  const price3d = 0;
  const price7d = 0;
  const pricePerDay = parseNumeric(options.product.rent_price_per_day) ?? 0;

  if (planType === '1d') {
    return roundMoney(price1d || pricePerDay || 0);
  }

  if (planType === '3d') {
    if (price3d > 0) return roundMoney(price3d);
    if (pricePerDay > 0) return roundMoney(pricePerDay * 3);
    return roundMoney(price1d * 3);
  }

  if (planType === '7d') {
    if (price7d > 0) return roundMoney(price7d);
    if (pricePerDay > 0) return roundMoney(pricePerDay * 7);
    return roundMoney(price1d * 7);
  }

  const resolvedDays = planDays ?? 1;
  if (pricePerDay > 0) {
    return roundMoney(pricePerDay * resolvedDays);
  }

  return roundMoney(price1d * resolvedDays);
}

async function fetchCategoryDepositDefaultAmount(options: {
  supabase: SupabaseClient;
  branchId: string;
  productCategoryId: string | null;
}): Promise<number> {
  if (!options.productCategoryId) return 0;

  const { data, error } = await options.supabase
    .from('category_deposit_defaults')
    .select('category_id, default_deposit_amount, is_active')
    .eq('branch_id', options.branchId)
    .eq('category_id', options.productCategoryId)
    .eq('is_delete', false)
    .eq('is_active', true)
    .maybeSingle<CategoryDepositDefaultRow>();

  if (error) throw error;
  return roundMoney(Math.max(0, parseNumeric(data?.default_deposit_amount)));
}

async function pickDepositEffectiveAmount(options: {
  supabase: SupabaseClient;
  branchId: string;
  productCategoryId: string | null;
  productRentDepositAmount: number | null;
  input: OrderItemInputPayload | UpdateOrderItemPricingPayload;
}): Promise<{
  depositOverrideAmount: number | null;
  depositEffectiveAmount: number;
}> {
  if (
    typeof options.input.depositOverrideAmount === 'number' &&
    Number.isFinite(options.input.depositOverrideAmount)
  ) {
    const override = roundMoney(
      Math.max(0, options.input.depositOverrideAmount),
    );
    return {
      depositOverrideAmount: override,
      depositEffectiveAmount: override,
    };
  }

  if (
    typeof options.productRentDepositAmount === 'number' &&
    Number.isFinite(options.productRentDepositAmount)
  ) {
    const productDefaultDeposit = roundMoney(
      Math.max(0, options.productRentDepositAmount),
    );
    return {
      depositOverrideAmount: null,
      depositEffectiveAmount: productDefaultDeposit,
    };
  }

  const categoryDefaultDeposit = await fetchCategoryDepositDefaultAmount({
    supabase: options.supabase,
    branchId: options.branchId,
    productCategoryId: options.productCategoryId,
  });

  return {
    depositOverrideAmount: null,
    depositEffectiveAmount: categoryDefaultDeposit,
  };
}

async function upsertReservationWindowsForOrder(
  supabase: SupabaseClient,
  options: {
    order: RentalOrderRow;
    itemIds: string[];
    releaseReason: string;
  },
): Promise<void> {
  if (normalizeOrderType(options.order.order_type) !== 'RENTAL') {
    return;
  }

  const status = normalizeOrderStatus(options.order.status);
  const shouldLock = isLockingOrderStatus(status);

  const windows = await fetchReservationWindowsByOrderId(
    supabase,
    options.order.id,
  );
  const activeWindows = windows.filter((entry) => entry.is_active);
  const activeWindowByItemId = new Map(
    activeWindows.map((entry) => [entry.item_id, entry]),
  );

  if (!shouldLock) {
    if (activeWindows.length === 0) return;

    const activeWindowIds = activeWindows.map((entry) => entry.id);
    const { error } = await supabase
      .from('reservation_windows')
      .update({
        is_active: false,
        released_at: new Date().toISOString(),
        release_reason: options.releaseReason,
      })
      .eq('is_delete', false)
      .in('id', activeWindowIds);

    if (error) throw error;
    return;
  }

  const itemIdSet = new Set(options.itemIds);
  const staleWindowIds = activeWindows
    .filter((entry) => !itemIdSet.has(entry.item_id))
    .map((entry) => entry.id);

  if (staleWindowIds.length > 0) {
    const { error: staleError } = await supabase
      .from('reservation_windows')
      .update({
        is_active: false,
        released_at: new Date().toISOString(),
        release_reason: options.releaseReason,
      })
      .eq('is_delete', false)
      .in('id', staleWindowIds);

    if (staleError) throw staleError;
  }

  for (const itemId of options.itemIds) {
    const existing = activeWindowByItemId.get(itemId);

    if (existing) {
      const { error } = await supabase
        .from('reservation_windows')
        .update({
          source_order_status: status,
          start_date: options.order.start_date,
          end_date: options.order.end_date,
          is_active: true,
          released_at: null,
          release_reason: null,
        })
        .eq('id', existing.id)
        .eq('is_delete', false);

      if (error) throw error;
      continue;
    }

    const { error } = await supabase.from('reservation_windows').insert({
      branch_id: options.order.branch_id,
      order_id: options.order.id,
      item_id: itemId,
      source_order_status: status,
      start_date: options.order.start_date,
      end_date: options.order.end_date,
      is_active: true,
      is_delete: false,
    });

    if (error) throw error;
  }
}

async function restoreOrderSnapshot(
  supabase: SupabaseClient,
  options: {
    order: RentalOrderRow;
    actorProfileId: string;
  },
): Promise<void> {
  const snapshot = options.order;

  const { error } = await supabase
    .from('rental_orders')
    .update({
      status: normalizeOrderStatus(snapshot.status),
      order_type: normalizeOrderType(snapshot.order_type),
      start_date: snapshot.start_date,
      end_date: snapshot.end_date,
      pickup_time: snapshot.pickup_time,
      return_time: snapshot.return_time,
      confirmed_at: snapshot.confirmed_at,
      picked_up_at: snapshot.picked_up_at,
      returned_at: snapshot.returned_at,
      completed_at: snapshot.completed_at,
      cancelled_at: snapshot.cancelled_at,
      cancel_reason: snapshot.cancel_reason,
      discount_type: normalizeDiscountType(snapshot.discount_type),
      discount_value:
        snapshot.discount_value === null
          ? null
          : roundMoney(Math.max(0, parseNumeric(snapshot.discount_value))),
      discount_amount: roundMoney(
        Math.max(0, parseNumeric(snapshot.discount_amount)),
      ),
      rent_amount: roundMoney(Math.max(0, parseNumeric(snapshot.rent_amount))),
      fees_amount: roundMoney(Math.max(0, parseNumeric(snapshot.fees_amount))),
      total_amount: roundMoney(
        Math.max(0, parseNumeric(snapshot.total_amount)),
      ),
      deposit_amount: roundMoney(
        Math.max(0, parseNumeric(snapshot.deposit_amount)),
      ),
      deposit_applied_amount: roundMoney(
        Math.max(0, parseNumeric(snapshot.deposit_applied_amount)),
      ),
      deposit_refunded_amount: roundMoney(
        Math.max(0, parseNumeric(snapshot.deposit_refunded_amount)),
      ),
      note: snapshot.note,
      internal_note: snapshot.internal_note,
      updated_by: options.actorProfileId,
    })
    .eq('id', snapshot.id)
    .eq('is_delete', false);

  if (error) throw error;
}

async function rollbackOrderAfterReservationConflict(
  supabase: SupabaseClient,
  options: {
    orderSnapshot: RentalOrderRow;
    actorProfileId: string;
    itemIds: string[];
    releaseReason: string;
  },
): Promise<void> {
  await restoreOrderSnapshot(supabase, {
    order: options.orderSnapshot,
    actorProfileId: options.actorProfileId,
  });

  await upsertReservationWindowsForOrder(supabase, {
    order: options.orderSnapshot,
    itemIds: options.itemIds,
    releaseReason: options.releaseReason,
  });
}

async function writeOrderAuditEvent(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    actorProfileId: string;
    orderId: string;
    action: OrderAuditAction;
    reason?: string | null;
    beforeData?: Record<string, unknown> | null;
    afterData?: Record<string, unknown> | null;
    meta?: Record<string, unknown> | null;
  },
): Promise<void> {
  const { error } = await supabase.from('audit_events').insert({
    branch_id: options.branchId,
    actor_profile_id: options.actorProfileId,
    entity_type: 'rental_order',
    entity_id: options.orderId,
    action: options.action,
    reason: options.reason ?? null,
    before_data: options.beforeData ?? null,
    after_data: options.afterData ?? null,
    meta: options.meta ?? null,
  });

  if (error) throw error;
}

async function recalculateOrderTotalsAndPersist(
  supabase: SupabaseClient,
  options: {
    order: RentalOrderRow;
    depositAmountOverride?: number | null;
  },
): Promise<OrderMoneySummaryDto> {
  const [orderItems, payments] = await Promise.all([
    fetchOrderItems(supabase, options.order.id),
    fetchPaymentsByOrderId(supabase, options.order.id),
  ]);

  const money = computeOrderMoneySummary({
    order: options.order,
    orderItems: orderItems.map((entry) => ({
      rentPrice: roundMoney(parseNumeric(entry.rent_price)),
      depositEffectiveAmount: roundMoney(
        parseNumeric(entry.deposit_effective_amount),
      ),
      cogsSnapshotAmount: roundMoney(parseNumeric(entry.cogs_snapshot_amount)),
    })),
    payments,
    depositAmountOverride:
      options.depositAmountOverride === undefined
        ? undefined
        : roundMoney(Math.max(0, options.depositAmountOverride ?? 0)),
  });

  const { error } = await supabase
    .from('rental_orders')
    .update({
      rent_amount: money.rentAmount,
      discount_amount: money.discountAmount,
      total_amount: money.totalAmount,
      deposit_amount: money.depositAmount,
    })
    .eq('id', options.order.id)
    .eq('is_delete', false);

  if (error) throw error;

  return money;
}

async function computeCurrentMoneySummary(
  supabase: SupabaseClient,
  order: RentalOrderRow,
): Promise<OrderMoneySummaryDto> {
  const [orderItems, payments] = await Promise.all([
    fetchOrderItems(supabase, order.id),
    fetchPaymentsByOrderId(supabase, order.id),
  ]);

  return computeOrderMoneySummary({
    order,
    orderItems: orderItems.map((entry) => ({
      rentPrice: roundMoney(parseNumeric(entry.rent_price)),
      depositEffectiveAmount: roundMoney(
        parseNumeric(entry.deposit_effective_amount),
      ),
      cogsSnapshotAmount: roundMoney(parseNumeric(entry.cogs_snapshot_amount)),
    })),
    payments,
  });
}

async function syncOrderDepositRefundedAmount(
  supabase: SupabaseClient,
  options: {
    order: RentalOrderRow;
    actorProfileId: string;
  },
): Promise<number> {
  const payments = await fetchPaymentsByOrderId(supabase, options.order.id);
  const paymentSummary = summarizeFinancialPayments(
    payments.map((payment) => ({
      type: payment.type,
      status: payment.status,
      amount: payment.amount,
      reason: payment.reason,
      source: payment.source,
    })),
  );

  const nextRefunded = paymentSummary.depositRefundedTotal;
  const currentRefunded = roundMoney(
    Math.max(0, parseNumeric(options.order.deposit_refunded_amount)),
  );

  if (nextRefunded === currentRefunded) {
    return nextRefunded;
  }

  const { error } = await supabase
    .from('rental_orders')
    .update({
      deposit_refunded_amount: nextRefunded,
      updated_by: options.actorProfileId,
    })
    .eq('id', options.order.id)
    .eq('is_delete', false);

  if (error) throw error;
  return nextRefunded;
}

function assertEditableOrderState(options: {
  orderStatus: OrderStatus;
  actorRole: string | null;
}): void {
  if (
    options.orderStatus === 'CONFIRMED' &&
    !isManagerPlusRole(options.actorRole)
  ) {
    throw new OrdersDomainError('FORBIDDEN_CONFIRMED_EDIT');
  }

  if (!PRE_PICKUP_MUTABLE_STATUS_SET.has(options.orderStatus)) {
    throw new OrdersDomainError('ORDER_STATUS_NOT_EDITABLE', {
      status: options.orderStatus,
    });
  }
}

function assertCancelableOrderState(options: {
  orderStatus: OrderStatus;
  orderType: OrderType;
  actorRole: string | null;
}): void {
  if (!isManagerPlusRole(options.actorRole)) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      action: 'cancel',
    });
  }

  const cancellableStatuses =
    options.orderType === 'SALE'
      ? new Set<OrderStatus>(['DRAFT', 'CONFIRMED', 'DEBT', 'COMPLETED'])
      : new Set<OrderStatus>(['DRAFT', 'RESERVED', 'CONFIRMED']);

  if (!cancellableStatuses.has(options.orderStatus)) {
    throw new OrdersDomainError('ORDER_CANCEL_NOT_ALLOWED', {
      status: options.orderStatus,
    });
  }
}

async function voidPostedPaymentsForOrder(
  supabase: SupabaseClient,
  options: {
    order: RentalOrderRow;
    actorProfileId: string;
    reason: string | null;
  },
): Promise<number> {
  const payments = await fetchPaymentsByOrderId(supabase, options.order.id);
  const postedPaymentIds = payments
    .filter((payment) => normalizePaymentStatus(payment.status) === 'POSTED')
    .map((payment) => payment.id);

  if (postedPaymentIds.length === 0) {
    return 0;
  }

  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'VOIDED',
      void_reason: options.reason,
      voided_at: nowIso,
      updated_by: options.actorProfileId,
    })
    .in('id', postedPaymentIds)
    .eq('order_id', options.order.id)
    .eq('is_delete', false);

  if (error) throw error;

  return postedPaymentIds.length;
}

function assertPickupOrderState(
  orderStatus: OrderStatus,
  orderType: OrderType,
): void {
  if (orderType !== 'RENTAL') {
    throw new OrdersDomainError('PICKUP_NOT_ALLOWED', {
      status: orderStatus,
      orderType,
      reason: 'pickup-only-supported-for-rental',
    });
  }

  if (orderStatus !== 'RESERVED' && orderStatus !== 'CONFIRMED') {
    throw new OrdersDomainError('PICKUP_NOT_ALLOWED', {
      status: orderStatus,
      orderType,
      reason: 'invalid-status-for-pickup',
    });
  }
}

function assertReturnOrderState(
  orderStatus: OrderStatus,
  orderType: OrderType,
): void {
  if (orderType !== 'RENTAL') {
    throw new OrdersDomainError('RETURN_NOT_ALLOWED', {
      status: orderStatus,
      orderType,
      reason: 'return-only-supported-for-rental',
    });
  }

  if (orderStatus !== 'PICKED_UP') {
    throw new OrdersDomainError('RETURN_NOT_ALLOWED', {
      status: orderStatus,
      orderType,
      reason: 'invalid-status-for-return',
    });
  }
}

function assertCompletableOrderState(
  orderStatus: OrderStatus,
  orderType: OrderType,
): void {
  const expectedStatus: OrderStatus =
    orderType === 'SALE' ? 'CONFIRMED' : 'RETURNED';

  if (orderStatus !== expectedStatus) {
    throw new OrdersDomainError('COMPLETE_NOT_ALLOWED', {
      status: orderStatus,
      orderType,
      expectedStatus,
      reason: 'invalid-status-for-complete',
    });
  }
}

function getAllowedTargetsByOrderType(
  orderType: OrderType,
  fromStatus: OrderStatus,
): OrderStatus[] {
  if (orderType === 'SALE') {
    if (fromStatus === 'DRAFT') return ['CONFIRMED', 'CANCELLED'];
    if (fromStatus === 'CONFIRMED') return ['DEBT', 'COMPLETED', 'CANCELLED'];
    if (fromStatus === 'DEBT') return ['COMPLETED'];
    return [];
  }

  return ORDER_STATUS_TRANSITIONS[fromStatus] ?? [];
}

function assertDebtSettleOrderState(orderStatus: OrderStatus): void {
  if (orderStatus !== 'DEBT') {
    throw new OrdersDomainError('COMPLETE_NOT_ALLOWED', {
      status: orderStatus,
      reason: 'invalid-status-for-debt-settlement',
    });
  }
}

function resolveReturnTargetStatus(
  condition: ReturnItemCondition,
  preferredTarget: ReturnItemTargetStatus | null,
  laundryTrackingEnabled: boolean,
): ReturnItemTargetStatus {
  if (condition === 'LOST') return 'LOST';

  if (condition === 'DAMAGE') {
    if (preferredTarget === 'DAMAGED') return 'DAMAGED';
    return 'MAINTENANCE';
  }

  if (condition === 'OK' || condition === 'NEED_CLEAN') {
    if (!laundryTrackingEnabled) {
      return 'READY';
    }

    if (preferredTarget === 'READY') return 'READY';
    return 'LAUNDRY';
  }

  return laundryTrackingEnabled ? 'LAUNDRY' : 'READY';
}

function toIsoDateLabel(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function parseIsoDateString(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function diffDaysFloor(startDate: string, endDate: string): number {
  const start = parseIsoDateString(startDate);
  const end = parseIsoDateString(endDate);
  if (!start || !end) return 0;

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay),
  );
}

async function fetchReturnPolicyForBranch(
  supabase: SupabaseClient,
  branchId: string,
): Promise<{
  mode: 'fixed_per_day' | 'percent_per_day';
  value: number;
  laundryTrackingEnabled: boolean;
}> {
  const { data: branchSetting, error: branchError } = await supabase
    .from('branch_settings')
    .select('late_fee_mode, late_fee_value, laundry_tracking_enabled')
    .eq('branch_id', branchId)
    .eq('is_delete', false)
    .maybeSingle<{
      late_fee_mode: string | null;
      late_fee_value: number | string | null;
      laundry_tracking_enabled: boolean | null;
    }>();

  if (branchError) throw branchError;

  const { data: systemSetting, error: systemError } = await supabase
    .from('system_settings')
    .select('late_fee_mode, late_fee_value, laundry_tracking_enabled')
    .eq('is_delete', false)
    .limit(1)
    .maybeSingle<{
      late_fee_mode: string | null;
      late_fee_value: number | string | null;
      laundry_tracking_enabled: boolean | null;
    }>();

  if (systemError) throw systemError;

  const modeCandidate =
    branchSetting?.late_fee_mode ?? systemSetting?.late_fee_mode;
  const valueCandidate =
    branchSetting?.late_fee_value ?? systemSetting?.late_fee_value;

  const mode =
    modeCandidate === 'percent_per_day' ? 'percent_per_day' : 'fixed_per_day';

  return {
    mode,
    value: roundMoney(Math.max(0, parseNumeric(valueCandidate))),
    laundryTrackingEnabled:
      branchSetting?.laundry_tracking_enabled ??
      systemSetting?.laundry_tracking_enabled ??
      true,
  };
}

async function checkItemsAvailability(
  supabase: SupabaseClient,
  options: {
    branchId: string | null;
    itemIds: string[];
    startDate: string;
    endDate: string;
    excludeOrderId?: string | null;
  },
): Promise<OrderAvailabilityResponse> {
  assertValidDateRange(options.startDate, options.endDate);

  const uniqueItemIds = uniqueStringValues(options.itemIds);
  if (uniqueItemIds.length === 0) {
    return {
      startDate: options.startDate,
      endDate: options.endDate,
      items: [],
    };
  }

  const items = await fetchItemsByIds(supabase, uniqueItemIds);
  const itemById = new Map(items.map((entry) => [entry.id, entry]));

  let windowsQuery = supabase
    .from('reservation_windows')
    .select(
      'id, order_id, item_id, source_order_status, start_date, end_date, is_active, released_at, release_reason',
    )
    .eq('is_delete', false)
    .eq('is_active', true)
    .in('item_id', uniqueItemIds)
    .lt('start_date', options.endDate)
    .gt('end_date', options.startDate);

  if (options.excludeOrderId) {
    windowsQuery = windowsQuery.neq('order_id', options.excludeOrderId);
  }

  const { data: windows, error: windowsError } =
    await windowsQuery.returns<ReservationWindowRow[]>();
  if (windowsError) throw windowsError;

  const orderIds = uniqueStringValues(
    (windows ?? []).map((entry) => entry.order_id),
  );
  const { data: ordersForConflict, error: ordersConflictError } = await supabase
    .from('rental_orders')
    .select('id, order_code')
    .in('id', orderIds)
    .eq('is_delete', false)
    .returns<Array<{ id: string; order_code: string }>>();

  if (ordersConflictError) throw ordersConflictError;

  const orderCodeById = new Map(
    (ordersForConflict ?? []).map((entry) => [entry.id, entry.order_code]),
  );

  const conflictsByItemId = new Map<string, OrderAvailabilityConflictDto[]>();
  for (const window of windows ?? []) {
    const bucket = conflictsByItemId.get(window.item_id) ?? [];
    bucket.push({
      reservationWindowId: window.id,
      orderId: window.order_id,
      orderCode: orderCodeById.get(window.order_id) ?? null,
      sourceOrderStatus: normalizeOrderStatus(window.source_order_status),
      startDate: window.start_date,
      endDate: window.end_date,
    });
    conflictsByItemId.set(window.item_id, bucket);
  }

  const resultItems: OrderAvailabilityItemDto[] = uniqueItemIds.map(
    (itemId) => {
      const item = itemById.get(itemId);

      if (!item) {
        return {
          itemId,
          itemCode: itemId,
          itemStatus: 'UNKNOWN',
          isAvailable: false,
          reasons: ['ITEM_NOT_FOUND'],
          conflicts: [],
        };
      }

      const reasons: string[] = [];

      if (options.branchId && item.branch_id !== options.branchId) {
        reasons.push('ITEM_BRANCH_MISMATCH');
      }

      if (!AVAILABLE_ITEM_STATUS_SET.has(item.status)) {
        reasons.push('ITEM_STATUS_NOT_READY');
      }

      const conflicts = conflictsByItemId.get(item.id) ?? [];
      if (conflicts.length > 0) {
        reasons.push('OVERLAP_ACTIVE_RESERVATION');
      }

      return {
        itemId: item.id,
        itemCode: item.item_code,
        itemStatus: item.status,
        isAvailable: reasons.length === 0,
        reasons,
        conflicts,
      };
    },
  );

  return {
    startDate: options.startDate,
    endDate: options.endDate,
    items: resultItems,
  };
}

async function ensureItemsAvailableOrThrow(
  supabase: SupabaseClient,
  options: {
    branchId: string | null;
    itemIds: string[];
    startDate: string;
    endDate: string;
    excludeOrderId?: string | null;
  },
): Promise<void> {
  const availability = await checkItemsAvailability(supabase, options);
  const unavailable = availability.items.filter((entry) => !entry.isAvailable);

  if (unavailable.length > 0) {
    throw new OrdersDomainError('ITEM_UNAVAILABLE', {
      items: unavailable,
      startDate: options.startDate,
      endDate: options.endDate,
    });
  }
}

function deriveTargetStatusForCreate(
  value: string | null | undefined,
  orderType: OrderType,
): OrderStatus {
  if (!value) return orderType === 'RENTAL' ? 'RESERVED' : 'DRAFT';

  if (
    (orderType === 'SALE' && (value === 'DRAFT' || value === 'CONFIRMED')) ||
    (orderType === 'RENTAL' &&
      (value === 'DRAFT' || value === 'RESERVED' || value === 'CONFIRMED'))
  ) {
    return value as OrderStatus;
  }

  const allowed =
    orderType === 'SALE'
      ? (['DRAFT', 'CONFIRMED'] as const)
      : (['DRAFT', 'RESERVED', 'CONFIRMED'] as const);

  throw new OrdersDomainError('INVALID_ORDER_STATUS', {
    status: value,
    orderType,
    allowed,
  });
}

async function mapOrderDetail(
  supabase: SupabaseClient,
  order: RentalOrderRow,
): Promise<OrderDetailDto> {
  const [
    customer,
    orderItems,
    reservationWindows,
    payments,
    incidents,
    activity,
  ] = await Promise.all([
    fetchCustomerById(supabase, order.customer_id),
    fetchOrderItems(supabase, order.id),
    fetchReservationWindowsByOrderId(supabase, order.id),
    fetchPaymentsByOrderId(supabase, order.id),
    fetchIncidentsByOrderId(supabase, order.id),
    fetchAuditEventsByOrderId(supabase, order.id),
  ]);

  if (!customer) {
    throw new OrdersDomainError('CUSTOMER_NOT_FOUND', {
      customerId: order.customer_id,
      orderId: order.id,
    });
  }

  const items = await mapOrderItemsToDto(supabase, orderItems);

  const money = computeOrderMoneySummary({
    order,
    orderItems: items.map((entry) => ({
      rentPrice: entry.rentPrice,
      depositEffectiveAmount: entry.depositEffectiveAmount ?? 0,
      cogsSnapshotAmount: roundMoney(
        Math.max(0, parseNumeric(entry.cogsSnapshotAmount)),
      ),
    })),
    payments,
  });

  const summary = mapOrderSummary({
    order,
    customer,
    itemCount: orderItems.length,
    money,
  });

  return {
    summary,
    items,
    payments: payments.map(mapPaymentRow),
    incidents: incidents.map(mapIncidentRow),
    activity: activity.map(mapAuditEventRow),
    reservationWindows: reservationWindows.map(mapReservationWindowRow),
    auditWritePoints: DEFAULT_ORDER_AUDIT_WRITE_POINTS,
  };
}

async function insertOrderItemInternal(
  supabase: SupabaseClient,
  options: {
    order: RentalOrderRow;
    itemInput: OrderItemInputPayload;
  },
): Promise<void> {
  const itemId = sanitizeText(options.itemInput.itemId);
  if (!itemId) {
    throw new OrdersDomainError('ITEM_NOT_FOUND', { reason: 'empty-item-id' });
  }

  const [itemRows, existingOrderItems] = await Promise.all([
    fetchItemsByIds(supabase, [itemId]),
    fetchOrderItems(supabase, options.order.id),
  ]);

  const item = itemRows[0] ?? null;
  if (!item) {
    throw new OrdersDomainError('ITEM_NOT_FOUND', { itemId });
  }

  if (item.branch_id !== options.order.branch_id) {
    throw new OrdersDomainError('ITEM_UNAVAILABLE', {
      itemId,
      reason: 'branch-mismatch',
    });
  }

  if (existingOrderItems.some((entry) => entry.item_id === item.id)) {
    throw new OrdersDomainError('ITEM_ALREADY_IN_ORDER', {
      itemId: item.id,
      orderId: options.order.id,
    });
  }

  await ensureItemsAvailableOrThrow(supabase, {
    branchId: options.order.branch_id,
    itemIds: [item.id],
    startDate: options.order.start_date,
    endDate: options.order.end_date,
    excludeOrderId: options.order.id,
  });

  const productRows = await fetchProductsByIds(supabase, [item.product_id]);
  const product = productRows[0] ?? null;
  if (!product) {
    throw new OrdersDomainError('ITEM_NOT_FOUND', {
      itemId: item.id,
      reason: 'product-not-found',
    });
  }

  const rentPrice = pickRentPriceFromProduct({
    product,
    input: options.itemInput,
    pricingMode: normalizeOrderPricingMode(options.order.pricing_mode),
  });
  const deposit = await pickDepositEffectiveAmount({
    supabase,
    branchId: options.order.branch_id,
    productCategoryId: product.category_id,
    productRentDepositAmount: parseNumeric(product.rent_deposit_amount),
    input: options.itemInput,
  });

  const resolvedPricingMode = normalizeOrderPricingMode(
    options.order.pricing_mode,
  );
  const defaultRentPlanType = resolvedPricingMode === 'STANDARD' ? '3d' : '1d';
  const rentPlanType = options.itemInput.rentPlanType ?? defaultRentPlanType;
  const rentPlanDays =
    rentPlanType === 'custom'
      ? Math.max(
          1,
          typeof options.itemInput.rentPlanDays === 'number' &&
            Number.isFinite(options.itemInput.rentPlanDays)
            ? Math.floor(options.itemInput.rentPlanDays)
            : 1,
        )
      : null;
  const cogsSnapshotAmount = roundMoney(
    Math.max(0, parseNumeric(product.purchase_price)),
  );

  const { error } = await supabase.from('rental_order_items').insert({
    order_id: options.order.id,
    item_id: item.id,
    product_id: product.id,
    item_code_snapshot: item.item_code,
    product_name_snapshot: product.name,
    rent_plan_type: rentPlanType,
    rent_plan_days: rentPlanDays,
    rent_price: rentPrice,
    deposit_override_amount: deposit.depositOverrideAmount,
    deposit_effective_amount: deposit.depositEffectiveAmount,
    cogs_snapshot_amount: cogsSnapshotAmount,
    is_delete: false,
  });

  if (error) {
    if (isReservationOverlapConflict(error)) {
      throw new OrdersDomainError('RESERVATION_OVERLAP_CONFLICT', {
        orderId: options.order.id,
        itemId: item.id,
      });
    }

    throw error;
  }
}

async function updateItemStatusesForTransition(
  supabase: SupabaseClient,
  options: {
    order: RentalOrderRow;
    toStatus: OrderStatus;
    actorProfileId: string;
    returnItemStatusByItemId?: Map<string, ReturnItemTargetStatus>;
  },
): Promise<void> {
  const orderType = normalizeOrderType(options.order.order_type);
  const shouldSyncSaleItems =
    orderType === 'SALE' &&
    (options.toStatus === 'CONFIRMED' || options.toStatus === 'CANCELLED');
  const shouldSyncRentalItems =
    orderType === 'RENTAL' &&
    (options.toStatus === 'PICKED_UP' || options.toStatus === 'RETURNED');

  if (!shouldSyncSaleItems && !shouldSyncRentalItems) {
    return;
  }

  const orderItems = await fetchOrderItems(supabase, options.order.id);
  if (orderItems.length === 0) return;

  const itemIds = uniqueStringValues(orderItems.map((entry) => entry.item_id));
  const items = await fetchItemsByIds(supabase, itemIds);

  for (const item of items) {
    const targetItemStatus =
      orderType === 'SALE'
        ? options.toStatus === 'CONFIRMED'
          ? 'SOLD'
          : 'READY'
        : options.toStatus === 'PICKED_UP'
          ? 'ON_RENT'
          : (options.returnItemStatusByItemId?.get(item.id) ?? 'LAUNDRY');

    if (item.status === targetItemStatus) {
      continue;
    }

    const { error: updateError } = await supabase
      .from('items')
      .update({
        status: targetItemStatus,
        updated_by: options.actorProfileId,
      })
      .eq('id', item.id)
      .eq('is_delete', false);

    if (updateError) throw updateError;

    const { error: logError } = await supabase.from('item_status_logs').insert({
      branch_id: item.branch_id,
      item_id: item.id,
      order_id: options.order.id,
      from_status: item.status,
      to_status: targetItemStatus,
      reason_code:
        orderType === 'SALE'
          ? options.toStatus === 'CONFIRMED'
            ? 'ORDER_SOLD'
            : 'ORDER_CANCELLED'
          : options.toStatus === 'PICKED_UP'
            ? 'ORDER_PICKED_UP'
            : `ORDER_RETURNED_${targetItemStatus}`,
      reason_note: null,
      actor_profile_id: options.actorProfileId,
      happened_at: new Date().toISOString(),
    });

    if (logError) throw logError;
  }
}

async function insertPaymentRecord(
  supabase: SupabaseClient,
  options: {
    order: RentalOrderRow;
    actorProfileId: string;
    payload: AddOrderPaymentPayload & { status?: OrderPaymentStatus | null };
    context?: Record<string, unknown>;
  },
): Promise<PaymentRow> {
  const errorContext = options.context ?? {};
  const type = normalizePaymentType(options.payload.type);
  if (!type) {
    throw new OrdersDomainError('INVALID_PAYMENT_TYPE', {
      ...errorContext,
      type: options.payload.type,
    });
  }

  const method = normalizePaymentMethod(options.payload.method);
  if (!method) {
    throw new OrdersDomainError('INVALID_PAYMENT_METHOD', {
      ...errorContext,
      method: options.payload.method,
    });
  }

  const status = normalizePaymentStatus(options.payload.status ?? 'POSTED');
  if (!status) {
    throw new OrdersDomainError('INVALID_PAYMENT_STATUS', {
      ...errorContext,
      status: options.payload.status,
    });
  }

  const amount = roundMoney(Math.max(0, parseNumeric(options.payload.amount)));
  if (amount <= 0) {
    throw new OrdersDomainError('PAYMENT_AMOUNT_INVALID', {
      ...errorContext,
      reason: 'payment-amount-must-be-positive',
      amount,
    });
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      branch_id: options.order.branch_id,
      order_id: options.order.id,
      customer_id: options.order.customer_id,
      type,
      method,
      amount,
      reason: sanitizeText(options.payload.reason),
      source: sanitizeText(options.payload.source),
      status,
      note: sanitizeText(options.payload.note),
      reference_code: sanitizeText(options.payload.referenceCode),
      is_delete: false,
      created_by: options.actorProfileId,
      updated_by: options.actorProfileId,
    })
    .select(
      'id, branch_id, order_id, customer_id, type, method, amount, reason, source, status, note, reference_code, void_reason, voided_at, created_by, updated_by, created_at, updated_at',
    )
    .maybeSingle<PaymentRow>();

  if (error) throw error;
  if (!data) {
    throw new Error('PAYMENT_CREATE_FAILED');
  }

  return data;
}

async function insertIncidentRecord(
  supabase: SupabaseClient,
  options: {
    order: RentalOrderRow;
    actorProfileId: string;
    payload: CreateOrderIncidentPayload;
  },
): Promise<IncidentRow> {
  const type = normalizeIncidentType(options.payload.type);
  if (!type) {
    throw new OrdersDomainError('INVALID_INCIDENT_TYPE', {
      type: options.payload.type,
    });
  }

  const amountRaw = parseNumeric(options.payload.amount);
  if (!Number.isFinite(amountRaw) || amountRaw < 0) {
    throw new OrdersDomainError('INCIDENT_AMOUNT_INVALID', {
      amount: options.payload.amount,
    });
  }
  const amount = roundMoney(amountRaw);

  const { data, error } = await supabase
    .from('incidents')
    .insert({
      branch_id: options.order.branch_id,
      order_id: options.order.id,
      order_item_id: sanitizeText(options.payload.orderItemId ?? null),
      item_id: sanitizeText(options.payload.itemId ?? null),
      customer_id: options.order.customer_id,
      type,
      status: 'OPEN',
      amount,
      apply_to_deposit: options.payload.applyToDeposit ?? true,
      description: sanitizeText(options.payload.description),
      is_delete: false,
      created_by: options.actorProfileId,
      updated_by: options.actorProfileId,
    })
    .select(
      'id, branch_id, order_id, order_item_id, item_id, customer_id, type, status, amount, apply_to_deposit, description, created_by, updated_by, created_at, updated_at',
    )
    .maybeSingle<IncidentRow>();

  if (error) throw error;
  if (!data) {
    throw new Error('INCIDENT_CREATE_FAILED');
  }

  return data;
}

async function insertMaintenanceTaskForDamage(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    orderId: string;
    itemId: string;
    incidentId: string | null;
    actorProfileId: string;
    title: string;
    description?: string | null;
  },
): Promise<void> {
  const payload: MaintenanceTaskInsertRow = {
    branch_id: options.branchId,
    item_id: options.itemId,
    order_id: options.orderId,
    incident_id: options.incidentId,
    status: 'OPEN',
    priority: 'HIGH',
    issue_type: 'DAMAGE',
    title: options.title,
    description: sanitizeText(options.description),
    created_by: options.actorProfileId,
    updated_by: options.actorProfileId,
  };

  const { error } = await supabase.from('maintenance_tasks').insert(payload);
  if (error) throw error;
}

export async function checkOrderAvailabilityForAdmin(
  supabase: SupabaseClient,
  options: {
    branchId: string | null;
    itemIds: string[];
    startDate: string;
    endDate: string;
    excludeOrderId?: string | null;
  },
): Promise<OrderAvailabilityResponse> {
  return checkItemsAvailability(supabase, options);
}

export async function listOrdersForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    branchId?: string | null;
    orderTypes?: OrderType[];
    statuses?: OrderStatus[];
    excludeOrderIds?: string[];
    startDate?: string | null;
    endDate?: string | null;
    search?: string | null;
    page: number;
    pageSize: number;
  },
): Promise<OrdersListResponse> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  const resolvedBranchId =
    sanitizeText(options.branchId ?? null) ?? actor.default_branch_id ?? null;
  const normalizedSearch = sanitizeSearchTerm(options.search ?? null);

  const normalizedStatuses = uniqueStringValues(options.statuses ?? [])
    .filter((entry) => ORDER_STATUS_SET.has(entry))
    .map((entry) => entry as OrderStatus);
  const normalizedOrderTypes = uniqueStringValues(options.orderTypes ?? [])
    .map((entry) => entry.toUpperCase())
    .filter((entry) => ORDER_TYPE_SET.has(entry as OrderType))
    .map((entry) => entry as OrderType);
  const normalizedExcludeOrderIds = uniqueStringValues(
    options.excludeOrderIds ?? [],
  );

  const page = Math.max(1, Math.floor(options.page));
  const pageSize = Math.min(80, Math.max(1, Math.floor(options.pageSize)));
  const offset = (page - 1) * pageSize;

  let matchedCustomerIds: string[] = [];
  if (normalizedSearch) {
    let customersQuery = supabase
      .from('customers')
      .select('id')
      .eq('is_delete', false)
      .or(
        `full_name.ilike.%${normalizedSearch}%,phone.ilike.%${normalizedSearch}%`,
      )
      .limit(120);

    if (resolvedBranchId) {
      customersQuery = customersQuery.eq('branch_id', resolvedBranchId);
    }

    const { data: matchedCustomers, error: matchedCustomersError } =
      await customersQuery.returns<Array<{ id: string }>>();

    if (matchedCustomersError) throw matchedCustomersError;
    matchedCustomerIds = uniqueStringValues(
      (matchedCustomers ?? []).map((entry) => entry.id),
    );
  }

  let query = supabase
    .from('rental_orders')
    .select(
      [
        'id',
        'branch_id',
        'order_code',
        'order_type',
        'customer_id',
        'status',
        'start_date',
        'end_date',
        'pricing_mode',
        'pickup_time',
        'return_time',
        'confirmed_at',
        'picked_up_at',
        'returned_at',
        'completed_at',
        'cancelled_at',
        'cancel_reason',
        'discount_type',
        'discount_value',
        'discount_amount',
        'rent_amount',
        'fees_amount',
        'total_amount',
        'deposit_amount',
        'deposit_applied_amount',
        'deposit_refunded_amount',
        'note',
        'internal_note',
        'created_at',
        'updated_at',
      ].join(','),
      { count: 'exact' },
    )
    .eq('is_delete', false)
    .order('updated_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (resolvedBranchId) {
    query = query.eq('branch_id', resolvedBranchId);
  }

  if (normalizedStatuses.length > 0) {
    query = query.in('status', normalizedStatuses);
  }

  if (normalizedOrderTypes.length > 0) {
    query = query.in('order_type', normalizedOrderTypes);
  }

  if (normalizedExcludeOrderIds.length > 0) {
    query = query.not('id', 'in', `(${normalizedExcludeOrderIds.join(',')})`);
  }

  const startDate = sanitizeText(options.startDate ?? null);
  if (startDate) {
    query = query.gte('start_date', startDate);
  }

  const endDate = sanitizeText(options.endDate ?? null);
  if (endDate) {
    query = query.lte('end_date', endDate);
  }

  if (normalizedSearch) {
    if (matchedCustomerIds.length > 0) {
      query = query.or(
        `order_code.ilike.%${normalizedSearch}%,customer_id.in.(${matchedCustomerIds.join(',')})`,
      );
    } else {
      query = query.ilike('order_code', `%${normalizedSearch}%`);
    }
  }

  const {
    data: orderRows,
    error: ordersError,
    count,
  } = await query.returns<RentalOrderRow[]>();
  if (ordersError) throw ordersError;

  const orders = orderRows ?? [];
  if (orders.length === 0) {
    return {
      items: [],
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  const orderIds = uniqueStringValues(orders.map((entry) => entry.id));
  const customerIds = uniqueStringValues(
    orders.map((entry) => entry.customer_id),
  );

  const [customers, itemRows, paymentRows] = await Promise.all([
    fetchCustomersByIds(supabase, customerIds),
    fetchOrderItemsForOrderIds(supabase, orderIds),
    fetchPaymentsByOrderIds(supabase, orderIds),
  ]);

  const customerById = new Map(customers.map((entry) => [entry.id, entry]));

  const itemRowsByOrderId = new Map<
    string,
    Array<{
      rentPrice: number;
      depositEffectiveAmount: number;
      cogsSnapshotAmount: number;
    }>
  >();
  const itemCountByOrderId = new Map<string, number>();

  for (const row of itemRows) {
    const bucket = itemRowsByOrderId.get(row.order_id);
    const normalizedRow = {
      rentPrice: roundMoney(parseNumeric(row.rent_price)),
      depositEffectiveAmount: roundMoney(
        parseNumeric(row.deposit_effective_amount),
      ),
      cogsSnapshotAmount: roundMoney(parseNumeric(row.cogs_snapshot_amount)),
    };

    if (bucket) {
      bucket.push(normalizedRow);
    } else {
      itemRowsByOrderId.set(row.order_id, [normalizedRow]);
    }

    itemCountByOrderId.set(
      row.order_id,
      (itemCountByOrderId.get(row.order_id) ?? 0) + 1,
    );
  }

  const paymentRowsByOrderId = new Map<string, PaymentRow[]>();
  for (const row of paymentRows) {
    const bucket = paymentRowsByOrderId.get(row.order_id);
    if (bucket) {
      bucket.push(row);
    } else {
      paymentRowsByOrderId.set(row.order_id, [row]);
    }
  }

  const items = orders.map((order) => {
    const customer =
      customerById.get(order.customer_id) ??
      ({
        id: order.customer_id,
        branch_id: order.branch_id,
        full_name: 'Unknown customer',
        phone: null,
      } satisfies CustomerRow);

    const money = computeOrderMoneySummary({
      order,
      orderItems: itemRowsByOrderId.get(order.id) ?? [],
      payments: paymentRowsByOrderId.get(order.id) ?? [],
    });

    return mapOrderSummary({
      order,
      customer,
      itemCount: itemCountByOrderId.get(order.id) ?? 0,
      money,
    });
  });

  return {
    items,
    total: count ?? items.length,
    page,
    pageSize,
  };
}

export async function createOrderForAdmin(
  supabase: SupabaseClient,
  actorProfileId: string,
  payload: CreateOrderPayload,
): Promise<OrderDetailDto> {
  const actor = await fetchActorProfile(supabase, actorProfileId);
  if (!actor) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  const orderType = normalizeOrderType(payload.orderType);
  const targetStatus = deriveTargetStatusForCreate(payload.status, orderType);
  const pricingMode =
    orderType === 'RENTAL'
      ? normalizeOrderPricingMode(payload.pricingMode ?? 'STANDARD')
      : null;
  if (orderType === 'RENTAL' && !pricingMode) {
    throw new OrdersDomainError('INVALID_PRICING_MODE', {
      pricingMode: payload.pricingMode ?? null,
    });
  }

  const branchId = sanitizeText(payload.branchId) ?? actor.default_branch_id;
  if (!branchId) {
    throw new OrdersDomainError('MISSING_BRANCH_CONTEXT');
  }

  const customerId = sanitizeText(payload.customerId);
  if (!customerId) {
    throw new OrdersDomainError('CUSTOMER_NOT_FOUND', {
      reason: 'empty-customer-id',
    });
  }

  const customer = await fetchCustomerById(supabase, customerId);
  if (!customer) {
    throw new OrdersDomainError('CUSTOMER_NOT_FOUND', {
      customerId,
    });
  }

  if (customer.branch_id !== branchId) {
    throw new OrdersDomainError('CUSTOMER_BRANCH_MISMATCH', {
      customerId,
      customerBranchId: customer.branch_id,
      branchId,
    });
  }

  const now = new Date();
  const fallbackStartDate = formatDateToIso(now);
  const fallbackTime = formatTimeToIso(now);

  const effectiveStartDate =
    orderType === 'RENTAL'
      ? (sanitizeText(payload.startDate) ?? fallbackStartDate)
      : payload.startDate;
  const effectiveEndDate =
    orderType === 'RENTAL'
      ? addIsoDateDays(effectiveStartDate, pricingMode === 'QUICK' ? 1 : 2)
      : payload.endDate;
  const effectivePickupTime =
    orderType === 'SALE'
      ? null
      : orderType === 'RENTAL'
        ? (sanitizeText(payload.pickupTime) ?? fallbackTime)
        : sanitizeText(payload.pickupTime);
  const effectiveReturnTime =
    orderType === 'SALE'
      ? null
      : orderType === 'RENTAL'
        ? (sanitizeText(payload.returnTime) ?? effectivePickupTime)
        : sanitizeText(payload.returnTime);

  assertValidDateRange(effectiveStartDate, effectiveEndDate);

  const normalizedItems = payload.items ?? [];
  if (targetStatus !== 'DRAFT' && normalizedItems.length === 0) {
    throw new OrdersDomainError('ORDER_REQUIRES_ITEMS_FOR_STATUS', {
      status: targetStatus,
    });
  }

  const discountType = normalizeDiscountType(payload.discountType ?? null);
  const discountValue =
    payload.discountValue === null || payload.discountValue === undefined
      ? null
      : roundMoney(Math.max(0, payload.discountValue));
  const feesAmount = roundMoney(Math.max(0, payload.feesAmount ?? 0));

  let insertedOrder: RentalOrderRow | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const orderCode = buildOrderCode();

    const { data, error } = await supabase
      .from('rental_orders')
      .insert({
        branch_id: branchId,
        order_code: orderCode,
        order_type: orderType,
        customer_id: customer.id,
        status: 'DRAFT',
        start_date: effectiveStartDate,
        end_date: effectiveEndDate,
        pricing_mode: pricingMode,
        pickup_time: effectivePickupTime,
        return_time: effectiveReturnTime,
        discount_type: discountType,
        discount_value: discountValue,
        fees_amount: feesAmount,
        note: sanitizeText(payload.note),
        internal_note: sanitizeText(payload.internalNote),
        created_by: actorProfileId,
        updated_by: actorProfileId,
        is_delete: false,
      })
      .select(
        [
          'id',
          'branch_id',
          'order_code',
          'order_type',
          'customer_id',
          'status',
          'start_date',
          'end_date',
          'pricing_mode',
          'pickup_time',
          'return_time',
          'confirmed_at',
          'picked_up_at',
          'returned_at',
          'completed_at',
          'cancelled_at',
          'cancel_reason',
          'discount_type',
          'discount_value',
          'discount_amount',
          'rent_amount',
          'fees_amount',
          'total_amount',
          'deposit_amount',
          'deposit_applied_amount',
          'deposit_refunded_amount',
          'note',
          'internal_note',
          'created_at',
          'updated_at',
        ].join(','),
      )
      .maybeSingle<RentalOrderRow>();

    if (error) {
      if (error.code === '23505' && attempt < 2) {
        continue;
      }
      throw error;
    }

    insertedOrder = data ?? null;
    if (insertedOrder) break;
  }

  if (!insertedOrder) {
    throw new Error('ORDER_CREATE_FAILED');
  }

  try {
    for (const itemInput of normalizedItems) {
      await insertOrderItemInternal(supabase, {
        order: insertedOrder,
        itemInput,
      });
    }

    await recalculateOrderTotalsAndPersist(supabase, {
      order: insertedOrder,
      depositAmountOverride: payload.depositAmount,
    });

    const initialPayments = payload.payments ?? [];
    if (
      orderType === 'RENTAL' &&
      initialPayments.some((paymentInput) => paymentInput.type !== 'DEPOSIT')
    ) {
      throw new OrdersDomainError('INVALID_PAYMENT_TYPE', {
        reason: 'rental-create-payment-must-be-deposit-only',
        allowed: ['DEPOSIT'],
      });
    }
    const totalCollectedOnCreate = roundMoney(
      initialPayments.reduce((sum, paymentInput) => {
        const status = paymentInput.status ?? 'POSTED';
        if (status !== 'POSTED' || paymentInput.type === 'REFUND') {
          return sum;
        }

        return sum + Math.max(0, paymentInput.amount);
      }, 0),
    );

    const receiptConfirmation = payload.paymentReceiptConfirmation ?? null;
    if (totalCollectedOnCreate > 0) {
      if (!receiptConfirmation?.confirmed) {
        throw new OrdersDomainError('PAYMENT_RECEIPT_CONFIRM_REQUIRED', {
          reason: 'create-order-payment-receipt-confirm-required',
          expectedAmount: totalCollectedOnCreate,
        });
      }

      if (!ORDER_PAYMENT_RECEIPT_METHOD_SET.has(receiptConfirmation.method)) {
        throw new OrdersDomainError('PAYMENT_RECEIPT_METHOD_INVALID', {
          reason: 'create-order-payment-receipt-method-invalid',
          method: receiptConfirmation.method,
        });
      }

      const confirmedAmount = roundMoney(
        Math.max(0, receiptConfirmation.amount),
      );
      if (
        confirmedAmount <= 0 ||
        Math.abs(confirmedAmount - totalCollectedOnCreate) > 0.01
      ) {
        throw new OrdersDomainError('PAYMENT_RECEIPT_AMOUNT_MISMATCH', {
          reason: 'create-order-payment-receipt-amount-mismatch',
          expectedAmount: totalCollectedOnCreate,
          confirmedAmount,
        });
      }
    }

    const receiptMethodOverride =
      totalCollectedOnCreate > 0 ? (receiptConfirmation?.method ?? null) : null;

    for (const [paymentIndex, paymentInput] of initialPayments.entries()) {
      const normalizedStatus = paymentInput.status ?? 'POSTED';
      const shouldApplyReceiptMethod =
        Boolean(receiptMethodOverride) &&
        normalizedStatus === 'POSTED' &&
        paymentInput.type !== 'REFUND';

      await insertPaymentRecord(supabase, {
        order: insertedOrder,
        actorProfileId,
        payload: {
          type: paymentInput.type,
          method: shouldApplyReceiptMethod
            ? (receiptMethodOverride as OrderPaymentMethod)
            : paymentInput.method,
          amount: paymentInput.amount,
          status: normalizedStatus,
          reason: paymentInput.reason ?? undefined,
          source: paymentInput.source ?? 'ORDER_CREATE',
          note: paymentInput.note ?? undefined,
          referenceCode: paymentInput.referenceCode ?? undefined,
        },
        context: {
          reason: 'create-order-initial-payment',
          paymentIndex,
        },
      });
    }

    if (targetStatus !== 'DRAFT') {
      await transitionOrderStatusForAdmin(supabase, {
        actorProfileId,
        orderId: insertedOrder.id,
        payload: {
          toStatus: targetStatus,
          reason: 'INITIAL_CREATE',
        },
      });
    }

    if (orderType === 'SALE' && targetStatus === 'CONFIRMED') {
      const finalizedOrder = await completeOrderForAdmin(supabase, {
        actorProfileId,
        orderId: insertedOrder.id,
      });
      if (!finalizedOrder) {
        throw new OrdersDomainError('ORDER_NOT_FOUND', {
          orderId: insertedOrder.id,
        });
      }
    }

    const finalOrder = await fetchOrderById(supabase, insertedOrder.id);
    if (!finalOrder) {
      throw new OrdersDomainError('ORDER_NOT_FOUND', {
        orderId: insertedOrder.id,
      });
    }

    await writeOrderAuditEvent(supabase, {
      branchId: finalOrder.branch_id,
      actorProfileId,
      orderId: finalOrder.id,
      action: 'ORDER_CREATED',
      afterData: {
        status: finalOrder.status,
        startDate: finalOrder.start_date,
        endDate: finalOrder.end_date,
        pricingMode: normalizeOrderPricingMode(finalOrder.pricing_mode),
        targetStatus,
      },
    });

    return mapOrderDetail(supabase, finalOrder);
  } catch (error) {
    const { error: cleanupError } = await supabase
      .from('rental_orders')
      .update({
        is_delete: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', insertedOrder.id)
      .eq('is_delete', false);

    if (cleanupError) {
      throw cleanupError;
    }

    throw error;
  }
}

export async function getOrderDetailForAdmin(
  supabase: SupabaseClient,
  orderId: string,
): Promise<OrderDetailDto | null> {
  const order = await fetchOrderById(supabase, orderId);
  if (!order) return null;

  return mapOrderDetail(supabase, order);
}

export async function updateOrderForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    orderId: string;
    payload: UpdateOrderPayload;
  },
): Promise<OrderDetailDto | null> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  const order = await fetchOrderById(supabase, options.orderId);
  if (!order) return null;

  const currentStatus = normalizeOrderStatus(order.status);
  const orderType = normalizeOrderType(order.order_type);
  assertEditableOrderState({
    orderStatus: currentStatus,
    actorRole: actor.role,
  });

  const patch: Record<string, unknown> = {
    updated_by: options.actorProfileId,
  };

  let nextStartDate = order.start_date;
  let nextEndDate = order.end_date;

  if (Object.prototype.hasOwnProperty.call(options.payload, 'startDate')) {
    const value = sanitizeText(options.payload.startDate);
    if (value) {
      nextStartDate = value;
      patch.start_date = value;
    }
  }

  if (Object.prototype.hasOwnProperty.call(options.payload, 'endDate')) {
    const value = sanitizeText(options.payload.endDate);
    if (value) {
      nextEndDate = value;
      patch.end_date = value;
    }
  }

  assertValidDateRange(nextStartDate, nextEndDate);

  if (Object.prototype.hasOwnProperty.call(options.payload, 'pickupTime')) {
    patch.pickup_time = sanitizeText(options.payload.pickupTime);
  }

  if (Object.prototype.hasOwnProperty.call(options.payload, 'returnTime')) {
    patch.return_time = sanitizeText(options.payload.returnTime);
  }

  if (Object.prototype.hasOwnProperty.call(options.payload, 'discountType')) {
    patch.discount_type = normalizeDiscountType(
      options.payload.discountType ?? null,
    );
  }

  if (Object.prototype.hasOwnProperty.call(options.payload, 'discountValue')) {
    patch.discount_value =
      options.payload.discountValue === null ||
      options.payload.discountValue === undefined
        ? null
        : roundMoney(Math.max(0, options.payload.discountValue));
  }

  if (Object.prototype.hasOwnProperty.call(options.payload, 'feesAmount')) {
    patch.fees_amount = roundMoney(
      Math.max(0, options.payload.feesAmount ?? 0),
    );
  }

  if (Object.prototype.hasOwnProperty.call(options.payload, 'depositAmount')) {
    patch.deposit_amount = roundMoney(
      Math.max(0, options.payload.depositAmount ?? 0),
    );
  }

  if (Object.prototype.hasOwnProperty.call(options.payload, 'note')) {
    patch.note = sanitizeText(options.payload.note);
  }

  if (Object.prototype.hasOwnProperty.call(options.payload, 'internalNote')) {
    patch.internal_note = sanitizeText(options.payload.internalNote);
  }

  const orderItems = await fetchOrderItems(supabase, order.id);
  const orderItemIds = uniqueStringValues(
    orderItems.map((entry) => entry.item_id),
  );

  if (
    orderType === 'RENTAL' &&
    isLockingOrderStatus(currentStatus) &&
    orderItemIds.length > 0
  ) {
    await ensureItemsAvailableOrThrow(supabase, {
      branchId: order.branch_id,
      itemIds: orderItemIds,
      startDate: nextStartDate,
      endDate: nextEndDate,
      excludeOrderId: order.id,
    });
  }

  const { error: updateError } = await supabase
    .from('rental_orders')
    .update(patch)
    .eq('id', order.id)
    .eq('is_delete', false);

  if (updateError) throw updateError;

  const updatedOrder = await fetchOrderById(supabase, order.id);
  if (!updatedOrder) {
    throw new OrdersDomainError('ORDER_NOT_FOUND', {
      orderId: order.id,
    });
  }

  try {
    if (isLockingOrderStatus(currentStatus)) {
      await upsertReservationWindowsForOrder(supabase, {
        order: updatedOrder,
        itemIds: orderItemIds,
        releaseReason: 'ORDER_UPDATED',
      });
    }
  } catch (error) {
    if (isReservationOverlapConflict(error)) {
      await rollbackOrderAfterReservationConflict(supabase, {
        orderSnapshot: order,
        actorProfileId: options.actorProfileId,
        itemIds: orderItemIds,
        releaseReason: 'ROLLBACK_OVERLAP_CONFLICT',
      });

      throw new OrdersDomainError('RESERVATION_OVERLAP_CONFLICT', {
        orderId: updatedOrder.id,
      });
    }

    throw error;
  }

  const money = await recalculateOrderTotalsAndPersist(supabase, {
    order: updatedOrder,
    depositAmountOverride: Object.prototype.hasOwnProperty.call(
      options.payload,
      'depositAmount',
    )
      ? (options.payload.depositAmount ?? 0)
      : undefined,
  });

  await writeOrderAuditEvent(supabase, {
    branchId: updatedOrder.branch_id,
    actorProfileId: options.actorProfileId,
    orderId: updatedOrder.id,
    action: 'ORDER_UPDATED',
    beforeData: {
      startDate: order.start_date,
      endDate: order.end_date,
      discountType: order.discount_type,
      discountValue: order.discount_value,
      feesAmount: order.fees_amount,
      depositAmount: order.deposit_amount,
    },
    afterData: {
      startDate: updatedOrder.start_date,
      endDate: updatedOrder.end_date,
      discountType: updatedOrder.discount_type,
      discountValue: updatedOrder.discount_value,
      feesAmount: updatedOrder.fees_amount,
      depositAmount: money.depositAmount,
    },
  });

  return mapOrderDetail(supabase, updatedOrder);
}

export async function addOrderItemForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    orderId: string;
    payload: AddOrderItemPayload;
  },
): Promise<OrderDetailDto | null> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  const order = await fetchOrderById(supabase, options.orderId);
  if (!order) return null;

  const status = normalizeOrderStatus(order.status);
  assertEditableOrderState({
    orderStatus: status,
    actorRole: actor.role,
  });

  await insertOrderItemInternal(supabase, {
    order,
    itemInput: options.payload,
  });

  const orderAfterInsert = await fetchOrderById(supabase, order.id);
  if (!orderAfterInsert) {
    throw new OrdersDomainError('ORDER_NOT_FOUND', {
      orderId: order.id,
    });
  }

  const itemsAfterInsert = await fetchOrderItems(supabase, order.id);
  const itemIds = uniqueStringValues(
    itemsAfterInsert.map((entry) => entry.item_id),
  );

  await recalculateOrderTotalsAndPersist(supabase, {
    order: orderAfterInsert,
  });

  try {
    await upsertReservationWindowsForOrder(supabase, {
      order: orderAfterInsert,
      itemIds,
      releaseReason: 'ORDER_ITEMS_CHANGED',
    });
  } catch (error) {
    if (isReservationOverlapConflict(error)) {
      const { error: rollbackItemError } = await supabase
        .from('rental_order_items')
        .update({
          is_delete: true,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', order.id)
        .eq('item_id', options.payload.itemId)
        .eq('is_delete', false);

      if (rollbackItemError) {
        throw rollbackItemError;
      }

      await rollbackOrderAfterReservationConflict(supabase, {
        orderSnapshot: order,
        actorProfileId: options.actorProfileId,
        itemIds: itemIds.filter((entry) => entry !== options.payload.itemId),
        releaseReason: 'ROLLBACK_OVERLAP_CONFLICT',
      });

      throw new OrdersDomainError('RESERVATION_OVERLAP_CONFLICT', {
        orderId: orderAfterInsert.id,
      });
    }

    throw error;
  }

  await writeOrderAuditEvent(supabase, {
    branchId: orderAfterInsert.branch_id,
    actorProfileId: options.actorProfileId,
    orderId: orderAfterInsert.id,
    action: 'ORDER_ITEMS_CHANGED',
    afterData: {
      itemCount: itemIds.length,
      operation: 'add-item',
      itemId: options.payload.itemId,
    },
  });

  return mapOrderDetail(supabase, orderAfterInsert);
}

export async function updateOrderItemPricingForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    orderId: string;
    orderItemId: string;
    payload: UpdateOrderItemPricingPayload;
  },
): Promise<OrderDetailDto | null> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  const order = await fetchOrderById(supabase, options.orderId);
  if (!order) return null;

  const status = normalizeOrderStatus(order.status);
  assertEditableOrderState({
    orderStatus: status,
    actorRole: actor.role,
  });

  const orderItem = await fetchOrderItemById(
    supabase,
    order.id,
    options.orderItemId,
  );
  if (!orderItem) {
    throw new OrdersDomainError('ITEM_NOT_FOUND', {
      orderItemId: options.orderItemId,
    });
  }

  const productRows = await fetchProductsByIds(supabase, [
    orderItem.product_id,
  ]);
  const product = productRows[0] ?? null;
  if (!product) {
    throw new OrdersDomainError('ITEM_NOT_FOUND', {
      orderItemId: options.orderItemId,
      reason: 'product-missing',
    });
  }

  const rentPrice = pickRentPriceFromProduct({
    product,
    input: options.payload,
    pricingMode: normalizeOrderPricingMode(order.pricing_mode),
  });
  const deposit = await pickDepositEffectiveAmount({
    supabase,
    branchId: order.branch_id,
    productCategoryId: product.category_id,
    productRentDepositAmount: parseNumeric(product.rent_deposit_amount),
    input: options.payload,
  });

  const nextRentPlanType =
    options.payload.rentPlanType ??
    normalizeRentPlanType(orderItem.rent_plan_type) ??
    '1d';
  const nextRentPlanDays =
    nextRentPlanType === 'custom'
      ? Math.max(
          1,
          typeof options.payload.rentPlanDays === 'number' &&
            Number.isFinite(options.payload.rentPlanDays)
            ? Math.floor(options.payload.rentPlanDays)
            : (orderItem.rent_plan_days ?? 1),
        )
      : null;

  const { error: updateError } = await supabase
    .from('rental_order_items')
    .update({
      rent_plan_type: nextRentPlanType,
      rent_plan_days: nextRentPlanDays,
      rent_price: rentPrice,
      deposit_override_amount: deposit.depositOverrideAmount,
      deposit_effective_amount: deposit.depositEffectiveAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderItem.id)
    .eq('order_id', order.id)
    .eq('is_delete', false);

  if (updateError) throw updateError;

  await recalculateOrderTotalsAndPersist(supabase, {
    order,
  });

  await writeOrderAuditEvent(supabase, {
    branchId: order.branch_id,
    actorProfileId: options.actorProfileId,
    orderId: order.id,
    action: 'ORDER_PRICE_ADJUSTED',
    beforeData: {
      orderItemId: orderItem.id,
      rentPrice: parseNumeric(orderItem.rent_price),
      depositEffectiveAmount: parseNumeric(orderItem.deposit_effective_amount),
    },
    afterData: {
      orderItemId: orderItem.id,
      rentPrice,
      depositEffectiveAmount: deposit.depositEffectiveAmount,
    },
  });

  const updatedOrder = await fetchOrderById(supabase, order.id);
  if (!updatedOrder) {
    throw new OrdersDomainError('ORDER_NOT_FOUND', {
      orderId: order.id,
    });
  }

  return mapOrderDetail(supabase, updatedOrder);
}

export async function removeOrderItemForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    orderId: string;
    orderItemId: string;
  },
): Promise<OrderDetailDto | null> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  const order = await fetchOrderById(supabase, options.orderId);
  if (!order) return null;

  const status = normalizeOrderStatus(order.status);
  assertEditableOrderState({
    orderStatus: status,
    actorRole: actor.role,
  });

  const orderItem = await fetchOrderItemById(
    supabase,
    order.id,
    options.orderItemId,
  );
  if (!orderItem) {
    throw new OrdersDomainError('ITEM_NOT_FOUND', {
      orderItemId: options.orderItemId,
    });
  }

  const { error: deleteError } = await supabase
    .from('rental_order_items')
    .update({
      is_delete: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderItem.id)
    .eq('order_id', order.id)
    .eq('is_delete', false);

  if (deleteError) throw deleteError;

  const orderAfterDelete = await fetchOrderById(supabase, order.id);
  if (!orderAfterDelete) {
    throw new OrdersDomainError('ORDER_NOT_FOUND', {
      orderId: order.id,
    });
  }

  const orderItemsAfterDelete = await fetchOrderItems(supabase, order.id);
  const remainingItemIds = uniqueStringValues(
    orderItemsAfterDelete.map((entry) => entry.item_id),
  );

  await recalculateOrderTotalsAndPersist(supabase, {
    order: orderAfterDelete,
  });

  try {
    await upsertReservationWindowsForOrder(supabase, {
      order: orderAfterDelete,
      itemIds: remainingItemIds,
      releaseReason: 'ORDER_ITEMS_CHANGED',
    });
  } catch (error) {
    if (isReservationOverlapConflict(error)) {
      throw new OrdersDomainError('RESERVATION_OVERLAP_CONFLICT', {
        orderId: orderAfterDelete.id,
      });
    }

    throw error;
  }

  await writeOrderAuditEvent(supabase, {
    branchId: orderAfterDelete.branch_id,
    actorProfileId: options.actorProfileId,
    orderId: orderAfterDelete.id,
    action: 'ORDER_ITEMS_CHANGED',
    beforeData: {
      itemCount: remainingItemIds.length + 1,
      removedOrderItemId: orderItem.id,
      removedItemId: orderItem.item_id,
    },
    afterData: {
      itemCount: remainingItemIds.length,
    },
  });

  return mapOrderDetail(supabase, orderAfterDelete);
}

interface ResolvedReturnFlowItem {
  orderItem: RentalOrderItemRow;
  condition: ReturnItemCondition;
  note: string | null;
  incidentAmount: number;
  applyToDeposit: boolean;
  targetStatus: ReturnItemTargetStatus;
}

function resolveReturnFlowItem(
  input: ReturnFlowItemPayload,
  orderItemById: Map<string, RentalOrderItemRow>,
  orderItemByItemId: Map<string, RentalOrderItemRow>,
  laundryTrackingEnabled: boolean,
): ResolvedReturnFlowItem {
  const orderItemId = sanitizeText(input.orderItemId ?? null);
  const itemId = sanitizeText(input.itemId ?? null);

  let orderItem: RentalOrderItemRow | null = null;

  if (orderItemId) {
    orderItem = orderItemById.get(orderItemId) ?? null;
  }

  if (itemId) {
    const byItemId = orderItemByItemId.get(itemId) ?? null;
    if (!orderItem) {
      orderItem = byItemId;
    } else if (byItemId && byItemId.id !== orderItem.id) {
      throw new OrdersDomainError('RETURN_ITEM_NOT_IN_ORDER', {
        reason: 'order-item-mismatch',
        orderItemId,
        itemId,
      });
    }
  }

  if (!orderItem) {
    throw new OrdersDomainError('RETURN_ITEM_NOT_IN_ORDER', {
      orderItemId,
      itemId,
    });
  }

  const incidentAmountRaw = parseNumeric(input.incidentAmount ?? 0);
  if (!Number.isFinite(incidentAmountRaw) || incidentAmountRaw < 0) {
    throw new OrdersDomainError('INCIDENT_AMOUNT_INVALID', {
      orderItemId: orderItem.id,
      itemId: orderItem.item_id,
      amount: input.incidentAmount,
    });
  }

  return {
    orderItem,
    condition: input.condition,
    note: sanitizeText(input.note),
    incidentAmount: roundMoney(incidentAmountRaw),
    applyToDeposit: input.applyToDeposit ?? true,
    targetStatus: resolveReturnTargetStatus(
      input.condition,
      input.targetStatus ?? null,
      laundryTrackingEnabled,
    ),
  };
}

export async function pickupOrderForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    orderId: string;
    payload: PickupOrderPayload;
  },
): Promise<OrderDetailDto | null> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  const order = await fetchOrderById(supabase, options.orderId);
  if (!order) return null;

  const fromStatus = normalizeOrderStatus(order.status);
  const orderType = normalizeOrderType(order.order_type);
  assertPickupOrderState(fromStatus, orderType);

  const requireDepositPaid = options.payload.requireDepositPaid ?? true;
  const moneyBeforePickup = await computeCurrentMoneySummary(supabase, order);
  if (requireDepositPaid) {
    if (
      moneyBeforePickup.depositPaid + 0.001 <
      moneyBeforePickup.depositAmount
    ) {
      throw new OrdersDomainError('PICKUP_NOT_ALLOWED', {
        reason: 'deposit-not-fully-paid',
        depositPaid: moneyBeforePickup.depositPaid,
        depositRequired: moneyBeforePickup.depositAmount,
      });
    }
  }

  const rentOutstanding = roundMoney(
    Math.max(0, moneyBeforePickup.rentAmount - moneyBeforePickup.rentPaid),
  );
  const rentalPayment = options.payload.rentalPayment ?? null;
  if (rentOutstanding > 0.001) {
    if (!rentalPayment) {
      throw new OrdersDomainError('PICKUP_NOT_ALLOWED', {
        reason: 'rent-payment-required',
        rentOutstanding,
      });
    }

    if (rentalPayment.type !== 'RENT') {
      throw new OrdersDomainError('INVALID_PAYMENT_TYPE', {
        reason: 'pickup-payment-must-be-rent',
        type: rentalPayment.type,
        allowed: ['RENT'],
      });
    }

    const rentalPaymentAmount = roundMoney(
      Math.max(0, parseNumeric(rentalPayment.amount)),
    );
    if (
      rentalPaymentAmount <= 0 ||
      Math.abs(rentalPaymentAmount - rentOutstanding) > 0.01
    ) {
      throw new OrdersDomainError('PAYMENT_AMOUNT_INVALID', {
        reason: 'pickup-rent-payment-amount-mismatch',
        expectedAmount: rentOutstanding,
        amount: rentalPaymentAmount,
      });
    }

    await insertPaymentRecord(supabase, {
      order,
      actorProfileId: options.actorProfileId,
      payload: {
        ...rentalPayment,
        type: 'RENT',
        amount: rentalPaymentAmount,
        source: rentalPayment.source ?? 'ORDER_PICKUP',
      },
      context: {
        reason: 'pickup-rent-payment',
      },
    });
  }

  return transitionOrderStatusForAdmin(supabase, {
    actorProfileId: options.actorProfileId,
    orderId: order.id,
    payload: {
      toStatus: 'PICKED_UP',
      reason: sanitizeText(options.payload.note),
    },
  });
}

export async function addOrderPaymentForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    orderId: string;
    payload: AddOrderPaymentPayload;
  },
): Promise<OrderDetailDto | null> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  const order = await fetchOrderById(supabase, options.orderId);
  if (!order) return null;

  const paymentType = normalizePaymentType(options.payload.type);
  if (!paymentType) {
    throw new OrdersDomainError('INVALID_PAYMENT_TYPE', {
      type: options.payload.type,
    });
  }

  const amount = roundMoney(parseNumeric(options.payload.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new OrdersDomainError('PAYMENT_AMOUNT_INVALID', {
      amount: options.payload.amount,
    });
  }

  const money = await computeCurrentMoneySummary(supabase, order);
  const orderStatus = normalizeOrderStatus(order.status);

  if (paymentType === 'DEPOSIT') {
    const remainingDeposit = roundMoney(
      Math.max(0, money.depositAmount - money.depositPaid),
    );
    if (amount > remainingDeposit + 0.001) {
      throw new OrdersDomainError('PAYMENT_OVERPAY_NOT_ALLOWED', {
        paymentType,
        amount,
        remainingAllowed: remainingDeposit,
      });
    }
  }

  if (paymentType === 'RENT' || paymentType === 'FEE') {
    const remainingCharge = roundMoney(
      Math.max(0, money.totalAmount - money.rentPaid - money.feePaid),
    );

    if (
      orderStatus === 'DEBT' &&
      remainingCharge > 0.001 &&
      Math.abs(amount - remainingCharge) > 0.001
    ) {
      throw new OrdersDomainError('PAYMENT_AMOUNT_INVALID', {
        paymentType,
        amount,
        expectedAmount: remainingCharge,
        reason: 'debt-collection-requires-full-outstanding-amount',
      });
    }

    if (amount > remainingCharge + 0.001) {
      throw new OrdersDomainError('PAYMENT_OVERPAY_NOT_ALLOWED', {
        paymentType,
        amount,
        remainingAllowed: remainingCharge,
      });
    }
  }

  if (paymentType === 'REFUND') {
    if (amount > money.refundableDeposit + 0.001) {
      throw new OrdersDomainError('PAYMENT_REFUND_EXCEEDS_LIMIT', {
        amount,
        refundableDeposit: money.refundableDeposit,
      });
    }
  }

  const createdPayment = await insertPaymentRecord(supabase, {
    order,
    actorProfileId: options.actorProfileId,
    payload: {
      ...options.payload,
      amount,
      source:
        sanitizeText(options.payload.source) ??
        (paymentType === 'REFUND'
          ? 'ORDER_MANUAL_REFUND'
          : 'ORDER_MANUAL_PAYMENT'),
      reason:
        paymentType === 'REFUND'
          ? (sanitizeText(options.payload.reason) ?? 'MANUAL_ADJUSTMENT_REFUND')
          : options.payload.reason,
    },
  });

  const orderAfterPayment = await fetchOrderById(supabase, order.id);
  if (!orderAfterPayment) {
    throw new OrdersDomainError('ORDER_NOT_FOUND', {
      orderId: order.id,
    });
  }

  if (paymentType === 'REFUND') {
    await syncOrderDepositRefundedAmount(supabase, {
      order: orderAfterPayment,
      actorProfileId: options.actorProfileId,
    });
  }

  const orderAfterSync = await fetchOrderById(supabase, order.id);
  if (!orderAfterSync) {
    throw new OrdersDomainError('ORDER_NOT_FOUND', {
      orderId: order.id,
    });
  }

  await writeOrderAuditEvent(supabase, {
    branchId: orderAfterSync.branch_id,
    actorProfileId: options.actorProfileId,
    orderId: orderAfterSync.id,
    action:
      paymentType === 'REFUND' ? 'ORDER_REFUND_RECORDED' : 'ORDER_UPDATED',
    reason: sanitizeText(options.payload.reason),
    afterData: {
      paymentId: createdPayment.id,
      paymentType,
      paymentMethod: createdPayment.method,
      paymentStatus: createdPayment.status,
      amount,
    },
    meta: {
      event: 'payment-created',
    },
  });

  return mapOrderDetail(supabase, orderAfterSync);
}

export async function updateOrderPaymentStatusForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    orderId: string;
    paymentId: string;
    payload: UpdateOrderPaymentStatusPayload;
  },
): Promise<OrderDetailDto | null> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  if (!isOwnerAdminRole(actor.role)) {
    throw new OrdersDomainError('FORBIDDEN_PAYMENT_STATUS_UPDATE', {
      role: actor.role,
    });
  }

  const order = await fetchOrderById(supabase, options.orderId);
  if (!order) return null;

  const payment = await fetchPaymentById(supabase, order.id, options.paymentId);
  if (!payment) {
    throw new OrdersDomainError('PAYMENT_NOT_FOUND', {
      paymentId: options.paymentId,
      orderId: order.id,
    });
  }

  const currentStatus = normalizePaymentStatus(payment.status);
  const nextStatus = normalizePaymentStatus(options.payload.status);

  if (!nextStatus) {
    throw new OrdersDomainError('INVALID_PAYMENT_STATUS', {
      status: options.payload.status,
    });
  }

  if (!currentStatus) {
    throw new OrdersDomainError('INVALID_PAYMENT_STATUS', {
      status: payment.status,
      paymentId: payment.id,
    });
  }

  if (currentStatus === nextStatus) {
    return mapOrderDetail(supabase, order);
  }

  const isValidTransition =
    (currentStatus === 'POSTED' && nextStatus === 'VOIDED') ||
    (currentStatus === 'VOIDED' && nextStatus === 'POSTED');

  if (!isValidTransition) {
    throw new OrdersDomainError('PAYMENT_STATUS_TRANSITION_INVALID', {
      paymentId: payment.id,
      fromStatus: currentStatus,
      toStatus: nextStatus,
    });
  }

  const nowIso = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: nextStatus,
      void_reason:
        nextStatus === 'VOIDED'
          ? sanitizeText(options.payload.voidReason)
          : null,
      voided_at: nextStatus === 'VOIDED' ? nowIso : null,
      updated_by: options.actorProfileId,
    })
    .eq('id', payment.id)
    .eq('order_id', order.id)
    .eq('is_delete', false);

  if (updateError) throw updateError;

  const orderAfterPaymentUpdate = await fetchOrderById(supabase, order.id);
  if (!orderAfterPaymentUpdate) {
    throw new OrdersDomainError('ORDER_NOT_FOUND', {
      orderId: order.id,
    });
  }

  await syncOrderDepositRefundedAmount(supabase, {
    order: orderAfterPaymentUpdate,
    actorProfileId: options.actorProfileId,
  });

  const orderAfterSync = await fetchOrderById(supabase, order.id);
  if (!orderAfterSync) {
    throw new OrdersDomainError('ORDER_NOT_FOUND', {
      orderId: order.id,
    });
  }

  await writeOrderAuditEvent(supabase, {
    branchId: orderAfterSync.branch_id,
    actorProfileId: options.actorProfileId,
    orderId: orderAfterSync.id,
    action: 'ORDER_UPDATED',
    reason: sanitizeText(options.payload.voidReason),
    beforeData: {
      paymentId: payment.id,
      paymentType: payment.type,
      status: currentStatus,
    },
    afterData: {
      paymentId: payment.id,
      paymentType: payment.type,
      status: nextStatus,
    },
    meta: {
      event: 'payment-status-updated',
    },
  });

  return mapOrderDetail(supabase, orderAfterSync);
}

export async function addOrderIncidentForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    orderId: string;
    payload: CreateOrderIncidentPayload;
  },
): Promise<OrderDetailDto | null> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  const order = await fetchOrderById(supabase, options.orderId);
  if (!order) return null;

  if (normalizeOrderStatus(order.status) === 'CANCELLED') {
    throw new OrdersDomainError('ORDER_STATUS_NOT_EDITABLE', {
      status: order.status,
    });
  }

  const orderItems = await fetchOrderItems(supabase, order.id);
  const orderItemById = new Map(orderItems.map((entry) => [entry.id, entry]));
  const orderItemByItemId = new Map(
    orderItems.map((entry) => [entry.item_id, entry]),
  );

  const payloadOrderItemId = sanitizeText(options.payload.orderItemId ?? null);
  const payloadItemId = sanitizeText(options.payload.itemId ?? null);

  let orderItem = payloadOrderItemId
    ? (orderItemById.get(payloadOrderItemId) ?? null)
    : null;

  if (payloadItemId) {
    const byItem = orderItemByItemId.get(payloadItemId) ?? null;
    if (!orderItem) {
      orderItem = byItem;
    } else if (byItem && byItem.id !== orderItem.id) {
      throw new OrdersDomainError('RETURN_ITEM_NOT_IN_ORDER', {
        reason: 'order-item-mismatch',
        orderItemId: payloadOrderItemId,
        itemId: payloadItemId,
      });
    }
  }

  if (!orderItem) {
    throw new OrdersDomainError('INCIDENT_ITEM_REQUIRED', {
      orderId: order.id,
      orderItemId: payloadOrderItemId,
      itemId: payloadItemId,
    });
  }

  const incident = await insertIncidentRecord(supabase, {
    order,
    actorProfileId: options.actorProfileId,
    payload: {
      ...options.payload,
      orderItemId: orderItem.id,
      itemId: orderItem.item_id,
    },
  });

  const incidentAmount = roundMoney(Math.max(0, parseNumeric(incident.amount)));
  if (incident.apply_to_deposit && incidentAmount > 0) {
    const nextDepositApplied = roundMoney(
      Math.max(0, parseNumeric(order.deposit_applied_amount)) + incidentAmount,
    );
    const { error: updateOrderError } = await supabase
      .from('rental_orders')
      .update({
        deposit_applied_amount: nextDepositApplied,
        updated_by: options.actorProfileId,
      })
      .eq('id', order.id)
      .eq('is_delete', false);

    if (updateOrderError) throw updateOrderError;
  }

  const action: OrderAuditAction =
    incident.type === 'LOST'
      ? 'ORDER_ITEM_LOST_MARKED'
      : incident.type === 'DAMAGE'
        ? 'ORDER_ITEM_DAMAGED_MARKED'
        : 'ORDER_UPDATED';

  await writeOrderAuditEvent(supabase, {
    branchId: order.branch_id,
    actorProfileId: options.actorProfileId,
    orderId: order.id,
    action,
    reason: sanitizeText(options.payload.description),
    afterData: {
      incidentId: incident.id,
      incidentType: incident.type,
      amount: incidentAmount,
      applyToDeposit: incident.apply_to_deposit,
      itemId: orderItem.item_id,
    },
    meta: {
      event: 'incident-created',
    },
  });

  const orderAfterIncident = await fetchOrderById(supabase, order.id);
  if (!orderAfterIncident) {
    throw new OrdersDomainError('ORDER_NOT_FOUND', {
      orderId: order.id,
    });
  }

  return mapOrderDetail(supabase, orderAfterIncident);
}

export async function processOrderReturnForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    orderId: string;
    payload: ProcessOrderReturnPayload;
  },
): Promise<OrderDetailDto | null> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  const order = await fetchOrderById(supabase, options.orderId);
  if (!order) return null;

  const fromStatus = normalizeOrderStatus(order.status);
  const orderType = normalizeOrderType(order.order_type);
  assertReturnOrderState(fromStatus, orderType);

  if (
    !Array.isArray(options.payload.items) ||
    options.payload.items.length === 0
  ) {
    throw new OrdersDomainError('RETURN_ITEMS_REQUIRED', {
      orderId: order.id,
    });
  }

  const orderItems = await fetchOrderItems(supabase, order.id);
  if (orderItems.length === 0) {
    throw new OrdersDomainError('RETURN_ITEMS_REQUIRED', {
      orderId: order.id,
      reason: 'order-has-no-items',
    });
  }

  const orderItemById = new Map(orderItems.map((entry) => [entry.id, entry]));
  const orderItemByItemId = new Map(
    orderItems.map((entry) => [entry.item_id, entry]),
  );
  const returnPolicy = await fetchReturnPolicyForBranch(
    supabase,
    order.branch_id,
  );
  const resolvedReturnItems: ResolvedReturnFlowItem[] = [];
  const seenOrderItemIds = new Set<string>();

  for (const payloadItem of options.payload.items) {
    const resolved = resolveReturnFlowItem(
      payloadItem,
      orderItemById,
      orderItemByItemId,
      returnPolicy.laundryTrackingEnabled,
    );
    if (seenOrderItemIds.has(resolved.orderItem.id)) {
      throw new OrdersDomainError('RETURN_ITEM_NOT_IN_ORDER', {
        reason: 'duplicate-return-item',
        orderItemId: resolved.orderItem.id,
      });
    }
    seenOrderItemIds.add(resolved.orderItem.id);
    resolvedReturnItems.push(resolved);
  }

  if (seenOrderItemIds.size !== orderItems.length) {
    const missingOrderItemIds = orderItems
      .map((entry) => entry.id)
      .filter((entry) => !seenOrderItemIds.has(entry));

    throw new OrdersDomainError('RETURN_ITEMS_REQUIRED', {
      orderId: order.id,
      reason: 'missing-return-checklist-items',
      missingOrderItemIds,
    });
  }

  const returnedDateLabel =
    sanitizeText(options.payload.returnedDate) ?? toIsoDateLabel(new Date());
  if (!parseIsoDateString(returnedDateLabel)) {
    throw new OrdersDomainError('INVALID_DATE_RANGE', {
      returnedDate: returnedDateLabel,
      reason: 'invalid-returned-date',
    });
  }

  const overdueDays = diffDaysFloor(order.end_date, returnedDateLabel);
  const rentBase = roundMoney(
    Math.max(
      0,
      parseNumeric(order.rent_amount) - parseNumeric(order.discount_amount),
    ),
  );

  const lateFee =
    overdueDays <= 0
      ? 0
      : returnPolicy.mode === 'percent_per_day'
        ? roundMoney((rentBase * returnPolicy.value * overdueDays) / 100)
        : roundMoney(returnPolicy.value * overdueDays);

  const customFeesAmountRaw = parseNumeric(
    options.payload.customFeesAmount ?? 0,
  );
  if (!Number.isFinite(customFeesAmountRaw) || customFeesAmountRaw < 0) {
    throw new OrdersDomainError('PAYMENT_AMOUNT_INVALID', {
      customFeesAmount: options.payload.customFeesAmount,
    });
  }
  const customFeesAmount = roundMoney(customFeesAmountRaw);
  const additionalCollectedAmountRaw = parseNumeric(
    options.payload.additionalCollectedAmount ?? 0,
  );
  if (
    !Number.isFinite(additionalCollectedAmountRaw) ||
    additionalCollectedAmountRaw < 0
  ) {
    throw new OrdersDomainError('PAYMENT_AMOUNT_INVALID', {
      additionalCollectedAmount: options.payload.additionalCollectedAmount,
    });
  }
  const additionalCollectedAmount = roundMoney(additionalCollectedAmountRaw);
  const additionalCollectionMethodRaw = normalizePaymentMethod(
    options.payload.additionalCollectionMethod ?? 'CASH',
  );
  if (additionalCollectedAmount > 0 && !additionalCollectionMethodRaw) {
    throw new OrdersDomainError('INVALID_PAYMENT_METHOD', {
      method: options.payload.additionalCollectionMethod,
      reason: 'return-additional-collection-method-invalid',
    });
  }

  const moneyBefore = await computeCurrentMoneySummary(supabase, order);
  const currentDepositApplied = roundMoney(
    Math.max(0, parseNumeric(order.deposit_applied_amount)),
  );
  const currentDepositRefunded = roundMoney(
    Math.max(0, moneyBefore.depositRefundedAmount),
  );
  const refundableDepositBefore = roundMoney(
    Math.max(
      0,
      moneyBefore.depositPaid - currentDepositApplied - currentDepositRefunded,
    ),
  );

  let incidentFeeTotal = 0;
  let depositAppliedIncrease = 0;
  const returnTargetStatusByItemId = new Map<string, ReturnItemTargetStatus>();

  for (const returnItem of resolvedReturnItems) {
    returnTargetStatusByItemId.set(
      returnItem.orderItem.item_id,
      returnItem.targetStatus,
    );

    const { error: noteUpdateError } = await supabase
      .from('rental_order_items')
      .update({
        condition_in_note: returnItem.note,
      })
      .eq('id', returnItem.orderItem.id)
      .eq('order_id', order.id)
      .eq('is_delete', false);

    if (noteUpdateError) throw noteUpdateError;

    const requiresIncident =
      returnItem.condition === 'DAMAGE' ||
      returnItem.condition === 'LOST' ||
      returnItem.incidentAmount > 0;

    if (!requiresIncident) continue;

    const incidentType: OrderIncidentType =
      returnItem.condition === 'LOST'
        ? 'LOST'
        : returnItem.condition === 'DAMAGE'
          ? 'DAMAGE'
          : 'CLEANING';

    if (returnItem.condition === 'LOST' && returnItem.incidentAmount < 0) {
      throw new OrdersDomainError('RETURN_LOST_REQUIRES_INCIDENT', {
        orderItemId: returnItem.orderItem.id,
      });
    }

    const incident = await insertIncidentRecord(supabase, {
      order,
      actorProfileId: options.actorProfileId,
      payload: {
        orderItemId: returnItem.orderItem.id,
        itemId: returnItem.orderItem.item_id,
        type: incidentType,
        amount: returnItem.incidentAmount,
        applyToDeposit: returnItem.applyToDeposit,
        description: returnItem.note,
      },
    });

    incidentFeeTotal = roundMoney(incidentFeeTotal + returnItem.incidentAmount);
    if (returnItem.applyToDeposit) {
      depositAppliedIncrease = roundMoney(
        depositAppliedIncrease + returnItem.incidentAmount,
      );
    }

    if (
      incidentType === 'DAMAGE' &&
      returnItem.targetStatus === 'MAINTENANCE'
    ) {
      await insertMaintenanceTaskForDamage(supabase, {
        branchId: order.branch_id,
        orderId: order.id,
        itemId: returnItem.orderItem.item_id,
        incidentId: incident.id,
        actorProfileId: options.actorProfileId,
        title: `Damage check for ${order.order_code}`,
        description: returnItem.note,
      });
    }
  }

  if (lateFee > 0) {
    await insertIncidentRecord(supabase, {
      order,
      actorProfileId: options.actorProfileId,
      payload: {
        type: 'LATE',
        amount: lateFee,
        applyToDeposit: true,
        description: `Auto late fee (${overdueDays} days overdue)`,
      },
    });

    incidentFeeTotal = roundMoney(incidentFeeTotal + lateFee);
    depositAppliedIncrease = roundMoney(depositAppliedIncrease + lateFee);
  }

  const totalAdditionalFees = roundMoney(incidentFeeTotal + customFeesAmount);
  const existingFeesAmount = roundMoney(
    Math.max(0, parseNumeric(order.fees_amount)),
  );
  const nextFeesAmount = roundMoney(existingFeesAmount + totalAdditionalFees);

  const depositApplicableLimit = roundMoney(
    Math.max(0, moneyBefore.depositPaid - currentDepositRefunded),
  );
  const nextDepositApplied = roundMoney(
    Math.min(
      depositApplicableLimit,
      currentDepositApplied + depositAppliedIncrease + customFeesAmount,
    ),
  );

  const refundableLimitAfterSettlement = roundMoney(
    Math.max(
      0,
      moneyBefore.depositPaid - nextDepositApplied - currentDepositRefunded,
    ),
  );

  const refundAmountRaw =
    options.payload.refundAmount === null ||
    options.payload.refundAmount === undefined
      ? refundableLimitAfterSettlement
      : parseNumeric(options.payload.refundAmount);

  if (!Number.isFinite(refundAmountRaw) || refundAmountRaw < 0) {
    throw new OrdersDomainError('PAYMENT_AMOUNT_INVALID', {
      refundAmount: options.payload.refundAmount,
    });
  }

  const refundAmount = roundMoney(refundAmountRaw);
  if (refundAmount > refundableLimitAfterSettlement + 0.001) {
    throw new OrdersDomainError('PAYMENT_REFUND_EXCEEDS_LIMIT', {
      refundAmount,
      refundableLimit: refundableLimitAfterSettlement,
      refundableDepositBefore,
    });
  }

  const nextDepositRefunded = roundMoney(currentDepositRefunded + refundAmount);

  const { error: orderSettlementUpdateError } = await supabase
    .from('rental_orders')
    .update({
      fees_amount: nextFeesAmount,
      deposit_applied_amount: nextDepositApplied,
      deposit_refunded_amount: nextDepositRefunded,
      updated_by: options.actorProfileId,
    })
    .eq('id', order.id)
    .eq('is_delete', false);

  if (orderSettlementUpdateError) throw orderSettlementUpdateError;

  if (additionalCollectedAmount > 0) {
    const orderAfterSettlement = await fetchOrderById(supabase, order.id);
    if (!orderAfterSettlement) {
      throw new OrdersDomainError('ORDER_NOT_FOUND', {
        orderId: order.id,
      });
    }

    const moneyAfterSettlement = await computeCurrentMoneySummary(
      supabase,
      orderAfterSettlement,
    );
    const outstandingAfterSettlement = roundMoney(
      Math.max(0, moneyAfterSettlement.outstandingAmount),
    );

    if (additionalCollectedAmount > outstandingAfterSettlement + 0.001) {
      throw new OrdersDomainError('PAYMENT_OVERPAY_NOT_ALLOWED', {
        reason: 'return-additional-collection-exceeds-outstanding',
        amount: additionalCollectedAmount,
        remainingAllowed: outstandingAfterSettlement,
      });
    }

    await insertPaymentRecord(supabase, {
      order,
      actorProfileId: options.actorProfileId,
      payload: {
        type: 'RENT',
        method: additionalCollectionMethodRaw ?? 'CASH',
        amount: additionalCollectedAmount,
        reason: 'RETURN_SETTLEMENT_COLLECTION',
        source: 'ORDER_RETURN_SETTLEMENT_COLLECTION',
        note: sanitizeText(options.payload.additionalCollectionNote),
      },
    });
  }

  if (refundAmount > 0) {
    const refundMethod = normalizePaymentMethod(
      options.payload.refundMethod ?? 'CASH',
    );
    if (!refundMethod) {
      throw new OrdersDomainError('INVALID_PAYMENT_METHOD', {
        method: options.payload.refundMethod,
      });
    }

    await insertPaymentRecord(supabase, {
      order,
      actorProfileId: options.actorProfileId,
      payload: {
        type: 'REFUND',
        method: refundMethod,
        amount: refundAmount,
        reason:
          sanitizeText(options.payload.refundReason) ??
          'RETURN_SETTLEMENT_REFUND',
        source: 'ORDER_RETURN_SETTLEMENT',
        note: sanitizeText(options.payload.refundNote),
      },
    });
  }

  const returnedDetail = await transitionOrderStatusForAdmin(supabase, {
    actorProfileId: options.actorProfileId,
    orderId: order.id,
    payload: {
      toStatus: 'RETURNED',
      reason: sanitizeText(options.payload.refundReason),
    },
    allowReturnTransition: true,
    returnItemStatusByItemId: returnTargetStatusByItemId,
  });

  if (!returnedDetail) return null;

  const orderAfterReturned = await fetchOrderById(supabase, order.id);
  if (!orderAfterReturned) {
    throw new OrdersDomainError('ORDER_NOT_FOUND', {
      orderId: order.id,
    });
  }

  await writeOrderAuditEvent(supabase, {
    branchId: orderAfterReturned.branch_id,
    actorProfileId: options.actorProfileId,
    orderId: orderAfterReturned.id,
    action: 'ORDER_UPDATED',
    reason: 'RETURN_SETTLEMENT',
    beforeData: {
      status: fromStatus,
      feesAmount: parseNumeric(order.fees_amount),
      depositAppliedAmount: parseNumeric(order.deposit_applied_amount),
      depositRefundedAmount: parseNumeric(order.deposit_refunded_amount),
    },
    afterData: {
      status: 'RETURNED',
      feesAmount: nextFeesAmount,
      depositAppliedAmount: nextDepositApplied,
      depositRefundedAmount: nextDepositRefunded,
      refundAmount,
      additionalCollectedAmount,
      additionalCollectionMethod:
        additionalCollectedAmount > 0 ? additionalCollectionMethodRaw : null,
    },
    meta: {
      event: 'order-return-processed',
      overdueDays,
      lateFee,
      customFeesAmount,
      incidentFeeTotal,
      additionalCollectedAmount,
    },
  });

  if (!options.payload.completeAfterReturn) {
    return returnedDetail;
  }

  return completeOrderForAdmin(supabase, {
    actorProfileId: options.actorProfileId,
    orderId: order.id,
  });
}

export async function completeOrderForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    orderId: string;
  },
): Promise<OrderDetailDto | null> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  const order = await fetchOrderById(supabase, options.orderId);
  if (!order) return null;

  const status = normalizeOrderStatus(order.status);
  const orderType = normalizeOrderType(order.order_type);
  assertCompletableOrderState(status, orderType);

  const money = await computeCurrentMoneySummary(supabase, order);
  if (money.outstandingAmount > 0.001) {
    return transitionOrderStatusForAdmin(supabase, {
      actorProfileId: options.actorProfileId,
      orderId: order.id,
      payload: {
        toStatus: 'DEBT',
        reason: 'OUTSTANDING_DEBT',
      },
    });
  }

  if (money.refundableDeposit > 0.001) {
    throw new OrdersDomainError('COMPLETE_NOT_ALLOWED', {
      reason: 'refundable-deposit-remaining',
      refundableDeposit: money.refundableDeposit,
    });
  }

  return transitionOrderStatusForAdmin(supabase, {
    actorProfileId: options.actorProfileId,
    orderId: order.id,
    payload: {
      toStatus: 'COMPLETED',
      reason: 'RETURN_SETTLED',
    },
    allowCompletedTransition: true,
  });
}

export async function settleDebtOrderForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    orderId: string;
  },
): Promise<OrderDetailDto | null> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  const order = await fetchOrderById(supabase, options.orderId);
  if (!order) return null;

  const status = normalizeOrderStatus(order.status);
  assertDebtSettleOrderState(status);

  const money = await computeCurrentMoneySummary(supabase, order);
  if (money.outstandingAmount > 0.001) {
    throw new OrdersDomainError('COMPLETE_NOT_ALLOWED', {
      reason: 'debt-outstanding-amount-not-settled',
      outstandingAmount: money.outstandingAmount,
    });
  }

  if (money.refundableDeposit > 0.001) {
    throw new OrdersDomainError('COMPLETE_NOT_ALLOWED', {
      reason: 'debt-refund-pending',
      refundableDeposit: money.refundableDeposit,
    });
  }

  return transitionOrderStatusForAdmin(supabase, {
    actorProfileId: options.actorProfileId,
    orderId: order.id,
    payload: {
      toStatus: 'COMPLETED',
      reason: 'DEBT_SETTLED',
    },
    allowCompletedTransition: true,
  });
}

export async function transitionOrderStatusForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    orderId: string;
    payload: OrderStatusTransitionPayload;
    skipItemStatusSync?: boolean;
    allowReturnTransition?: boolean;
    allowCompletedTransition?: boolean;
    returnItemStatusByItemId?: Map<string, ReturnItemTargetStatus>;
  },
): Promise<OrderDetailDto | null> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  const order = await fetchOrderById(supabase, options.orderId);
  if (!order) return null;

  const fromStatus = normalizeOrderStatus(order.status);
  const orderType = normalizeOrderType(order.order_type);
  const toStatus = normalizeOrderStatus(options.payload.toStatus);

  if (fromStatus === toStatus) {
    return mapOrderDetail(supabase, order);
  }

  const allowedTargets = getAllowedTargetsByOrderType(orderType, fromStatus);
  if (!allowedTargets.includes(toStatus)) {
    throw new OrdersDomainError('ORDER_STATUS_TRANSITION_INVALID', {
      fromStatus,
      toStatus,
      orderType,
    });
  }

  if (toStatus === 'COMPLETED' && !options.allowCompletedTransition) {
    throw new OrdersDomainError('COMPLETE_NOT_ALLOWED', {
      fromStatus,
      toStatus,
      reason: 'use-complete-or-settle-debt-flow',
    });
  }

  if (
    orderType === 'RENTAL' &&
    fromStatus === 'PICKED_UP' &&
    toStatus === 'RETURNED' &&
    !options.allowReturnTransition
  ) {
    throw new OrdersDomainError('RETURN_NOT_ALLOWED', {
      fromStatus,
      toStatus,
      orderType,
      reason: 'use-return-flow-endpoint',
    });
  }

  if (toStatus === 'CANCELLED' && !isManagerPlusRole(actor.role)) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      action: 'cancel',
    });
  }

  const orderItems = await fetchOrderItems(supabase, order.id);
  const requiresItems =
    orderType === 'SALE'
      ? toStatus === 'CONFIRMED'
      : toStatus === 'RESERVED' ||
        toStatus === 'CONFIRMED' ||
        toStatus === 'PICKED_UP';
  if (requiresItems && orderItems.length === 0) {
    throw new OrdersDomainError('ORDER_REQUIRES_ITEMS_FOR_STATUS', {
      status: toStatus,
    });
  }

  const shouldCheckAvailability =
    orderType === 'SALE'
      ? toStatus === 'CONFIRMED'
      : toStatus === 'RESERVED' || toStatus === 'CONFIRMED';
  if (shouldCheckAvailability) {
    await ensureItemsAvailableOrThrow(supabase, {
      branchId: order.branch_id,
      itemIds: uniqueStringValues(orderItems.map((entry) => entry.item_id)),
      startDate: order.start_date,
      endDate: order.end_date,
      excludeOrderId: order.id,
    });
  }

  const patch: Record<string, unknown> = {
    status: toStatus,
    updated_by: options.actorProfileId,
  };

  const nowIso = new Date().toISOString();
  if (toStatus === 'CONFIRMED') {
    patch.confirmed_at = nowIso;
  }

  if (toStatus === 'PICKED_UP') {
    patch.picked_up_at = nowIso;
  }

  if (toStatus === 'RETURNED') {
    patch.returned_at = nowIso;
  }

  if (toStatus === 'COMPLETED') {
    patch.completed_at = nowIso;
  }

  if (toStatus === 'CANCELLED') {
    patch.cancelled_at = nowIso;
    patch.cancel_reason = sanitizeText(options.payload.reason);
  }

  const { error: statusUpdateError } = await supabase
    .from('rental_orders')
    .update(patch)
    .eq('id', order.id)
    .eq('is_delete', false);

  if (statusUpdateError) throw statusUpdateError;

  const orderAfterStatusUpdate = await fetchOrderById(supabase, order.id);
  if (!orderAfterStatusUpdate) {
    throw new OrdersDomainError('ORDER_NOT_FOUND', {
      orderId: order.id,
    });
  }

  try {
    await upsertReservationWindowsForOrder(supabase, {
      order: orderAfterStatusUpdate,
      itemIds: uniqueStringValues(orderItems.map((entry) => entry.item_id)),
      releaseReason:
        toStatus === 'CANCELLED' ? 'ORDER_CANCELLED' : 'ORDER_STATUS_CHANGED',
    });
  } catch (error) {
    if (isReservationOverlapConflict(error)) {
      await rollbackOrderAfterReservationConflict(supabase, {
        orderSnapshot: order,
        actorProfileId: options.actorProfileId,
        itemIds: uniqueStringValues(orderItems.map((entry) => entry.item_id)),
        releaseReason: 'ROLLBACK_OVERLAP_CONFLICT',
      });

      throw new OrdersDomainError('RESERVATION_OVERLAP_CONFLICT', {
        orderId: order.id,
        fromStatus,
        toStatus,
      });
    }

    throw error;
  }

  if (!options.skipItemStatusSync) {
    await updateItemStatusesForTransition(supabase, {
      order: orderAfterStatusUpdate,
      toStatus,
      actorProfileId: options.actorProfileId,
      returnItemStatusByItemId: options.returnItemStatusByItemId,
    });
  }

  await writeOrderAuditEvent(supabase, {
    branchId: orderAfterStatusUpdate.branch_id,
    actorProfileId: options.actorProfileId,
    orderId: orderAfterStatusUpdate.id,
    action:
      toStatus === 'CANCELLED' ? 'ORDER_CANCELLED' : 'ORDER_STATUS_CHANGED',
    reason: sanitizeText(options.payload.reason),
    beforeData: {
      status: fromStatus,
    },
    afterData: {
      status: toStatus,
    },
  });

  return mapOrderDetail(supabase, orderAfterStatusUpdate);
}

export async function cancelOrderForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    orderId: string;
    payload?: OrderCancelPayload;
  },
): Promise<OrderDetailDto | null> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  const order = await fetchOrderById(supabase, options.orderId);
  if (!order) return null;

  const status = normalizeOrderStatus(order.status);
  const orderType = normalizeOrderType(order.order_type);
  assertCancelableOrderState({
    orderStatus: status,
    orderType,
    actorRole: actor.role,
  });

  const refundAmountRaw = parseNumeric(options.payload?.refundAmount ?? 0);
  if (!Number.isFinite(refundAmountRaw) || refundAmountRaw < 0) {
    throw new OrdersDomainError('PAYMENT_AMOUNT_INVALID', {
      refundAmount: options.payload?.refundAmount,
    });
  }

  const refundAmount = roundMoney(refundAmountRaw);
  if (refundAmount > 0) {
    const money = await computeCurrentMoneySummary(supabase, order);
    if (refundAmount > money.refundableDeposit + 0.001) {
      throw new OrdersDomainError('PAYMENT_REFUND_EXCEEDS_LIMIT', {
        refundAmount,
        refundableDeposit: money.refundableDeposit,
      });
    }

    const refundMethod = normalizePaymentMethod(
      options.payload?.refundMethod ?? 'CASH',
    );
    if (!refundMethod) {
      throw new OrdersDomainError('INVALID_PAYMENT_METHOD', {
        method: options.payload?.refundMethod,
      });
    }

    const refundPayment = await insertPaymentRecord(supabase, {
      order,
      actorProfileId: options.actorProfileId,
      payload: {
        type: 'REFUND',
        method: refundMethod,
        amount: refundAmount,
        reason:
          sanitizeText(options.payload?.refundReason) ??
          'ORDER_CANCELLED_REFUND',
        source: 'ORDER_CANCELLED',
        note: sanitizeText(options.payload?.refundNote),
      },
    });

    const orderAfterRefund = await fetchOrderById(supabase, order.id);
    if (!orderAfterRefund) {
      throw new OrdersDomainError('ORDER_NOT_FOUND', {
        orderId: order.id,
      });
    }

    await syncOrderDepositRefundedAmount(supabase, {
      order: orderAfterRefund,
      actorProfileId: options.actorProfileId,
    });

    await writeOrderAuditEvent(supabase, {
      branchId: order.branch_id,
      actorProfileId: options.actorProfileId,
      orderId: order.id,
      action: 'ORDER_REFUND_RECORDED',
      reason: sanitizeText(options.payload?.refundReason),
      afterData: {
        paymentId: refundPayment.id,
        amount: refundAmount,
        method: refundMethod,
      },
      meta: {
        event: 'cancel-order-refund',
      },
    });
  }

  if (orderType === 'SALE') {
    const voidReason =
      sanitizeText(options.payload?.reason) ?? 'SALE_ORDER_SOFT_DELETED';
    const voidedPaymentCount = await voidPostedPaymentsForOrder(supabase, {
      order,
      actorProfileId: options.actorProfileId,
      reason: voidReason,
    });

    if (voidedPaymentCount > 0) {
      const orderAfterVoid = await fetchOrderById(supabase, order.id);
      if (!orderAfterVoid) {
        throw new OrdersDomainError('ORDER_NOT_FOUND', {
          orderId: order.id,
        });
      }

      await syncOrderDepositRefundedAmount(supabase, {
        order: orderAfterVoid,
        actorProfileId: options.actorProfileId,
      });

      await writeOrderAuditEvent(supabase, {
        branchId: order.branch_id,
        actorProfileId: options.actorProfileId,
        orderId: order.id,
        action: 'ORDER_UPDATED',
        reason: voidReason,
        afterData: {
          voidedPaymentCount,
        },
        meta: {
          event: 'sale-order-soft-delete-void-payments',
        },
      });
    }
  }

  return transitionOrderStatusForAdmin(supabase, {
    actorProfileId: options.actorProfileId,
    orderId: order.id,
    payload: {
      toStatus: 'CANCELLED',
      reason: sanitizeText(options.payload?.reason),
    },
  });
}

export async function recordOrderRefundAuditForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    orderId: string;
    reason?: string | null;
    beforeData?: Record<string, unknown> | null;
    afterData?: Record<string, unknown> | null;
    meta?: Record<string, unknown> | null;
  },
): Promise<void> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new OrdersDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  const order = await fetchOrderById(supabase, options.orderId);
  if (!order) {
    throw new OrdersDomainError('ORDER_NOT_FOUND', {
      orderId: options.orderId,
    });
  }

  await writeOrderAuditEvent(supabase, {
    branchId: order.branch_id,
    actorProfileId: options.actorProfileId,
    orderId: order.id,
    action: 'ORDER_REFUND_RECORDED',
    reason: sanitizeText(options.reason),
    beforeData: options.beforeData ?? null,
    afterData: options.afterData ?? null,
    meta: options.meta ?? null,
  });
}
