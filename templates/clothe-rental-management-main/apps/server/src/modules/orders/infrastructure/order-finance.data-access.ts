import type { OrderPaymentType } from '../types/orders-domain.type';

const ORDER_PAYMENT_TYPE_SET = new Set<string>([
  'RENT',
  'DEPOSIT',
  'FEE',
  'REFUND',
  'EXPENSE',
]);
const ORDER_PAYMENT_STATUS_SET = new Set<string>(['POSTED', 'VOIDED']);

export const REVENUE_ELIGIBLE_PAYMENT_TYPES = ['RENT', 'FEE'] as const;
export const FINANCIAL_FORMULA_VERSION =
  'FINANCE_V1_PAYMENT_POSTED_COGS' as const;
export const RENTAL_COGS_FORMULA_CODE = 'RENTAL_COGS_FALLBACK_ZERO' as const;
export const SALE_COGS_FORMULA_CODE = 'SALE_COGS_SNAPSHOT' as const;

const REVENUE_ELIGIBLE_PAYMENT_TYPE_SET = new Set<OrderPaymentType>(
  REVENUE_ELIGIBLE_PAYMENT_TYPES,
);

const RENT_REFUND_SOURCE_ALLOWLIST = new Set<string>([
  'ORDER_RENT_REFUND',
  'ORDER_RENT_ADJUSTMENT',
  'ORDER_FEE_REFUND',
  'ORDER_MANUAL_REVENUE_REFUND',
]);

const DEPOSIT_REFUND_SOURCE_ALLOWLIST = new Set<string>([
  'ORDER_RETURN_SETTLEMENT',
  'ORDER_CANCELLED',
  'ORDER_MANUAL_REFUND',
]);

const RENT_REFUND_REASON_MARKERS = [
  'RENT_REFUND',
  'FEE_REFUND',
  'REVENUE_REFUND',
  'ORDER_RENT_REFUND',
  'ORDER_FEE_REFUND',
];

const DEPOSIT_REFUND_REASON_MARKERS = [
  'DEPOSIT_REFUND',
  'RETURN_SETTLEMENT_REFUND',
  'ORDER_CANCELLED_REFUND',
  'CANCELLED_REFUND',
  'MANUAL_ADJUSTMENT_REFUND',
];
const CASH_OUTFLOW_PAYMENT_TYPE_SET = new Set<OrderPaymentType>([
  'REFUND',
  'EXPENSE',
]);

export type RefundKind = 'RENT_REFUND' | 'DEPOSIT_REFUND';

export interface FinancialPaymentLike {
  type: string | null | undefined;
  status?: string | null | undefined;
  amount: number | string | null | undefined;
  reason?: string | null | undefined;
  source?: string | null | undefined;
}

export interface PaymentFinancialSummary {
  revenueGross: number;
  refundEffective: number;
  revenueNet: number;
  cogs: number;
  grossProfit: number;
  profitMargin: number;
  depositCollectedTotal: number;
  depositRefundedTotal: number;
  totalRefundAmount: number;
  rentCollectedTotal: number;
  feeCollectedTotal: number;
  receivableCollectedTotal: number;
}

export interface RealProfitCashflowSummary {
  inflowTotal: number;
  outflowTotal: number;
  realProfit: number;
}

export interface DebtOrderLike {
  orderId: string;
  totalAmount: number | string | null | undefined;
  status?: string | null | undefined;
}

export interface FinancialPaymentByOrderLike extends FinancialPaymentLike {
  orderId: string;
}

export interface OrderFinancialContextLike {
  orderId: string;
  orderType: string | null | undefined;
  receivableAmount: number | string | null | undefined;
  cogsAmount: number | string | null | undefined;
}

export interface ComputeOrderCogsAmountOptions {
  orderType: string | null | undefined;
  saleItemCostSnapshots: Array<number | string | null | undefined>;
}

function parseNumeric(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

function normalizePaymentType(
  value: string | null | undefined,
): OrderPaymentType | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_PAYMENT_TYPE_SET.has(normalized)) return null;
  return normalized as OrderPaymentType;
}

function normalizePaymentStatus(
  value: string | null | undefined,
): 'POSTED' | 'VOIDED' | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_PAYMENT_STATUS_SET.has(normalized)) return null;
  return normalized as 'POSTED' | 'VOIDED';
}

function normalizeMarker(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().toUpperCase();
}

function includesAnyMarker(value: string, markers: readonly string[]): boolean {
  if (!value) return false;
  for (const marker of markers) {
    if (value.includes(marker)) return true;
  }
  return false;
}

function normalizeOrderType(
  value: string | null | undefined,
): 'RENTAL' | 'SALE' {
  if (!value) return 'RENTAL';
  const normalized = value.trim().toUpperCase();
  return normalized === 'SALE' ? 'SALE' : 'RENTAL';
}

function toOrderContextMap(
  contexts:
    | Map<string, OrderFinancialContextLike>
    | OrderFinancialContextLike[],
): Map<string, OrderFinancialContextLike> {
  if (contexts instanceof Map) {
    return contexts;
  }

  return new Map(contexts.map((entry) => [entry.orderId, entry]));
}

export function computeOrderCogsAmount(
  options: ComputeOrderCogsAmountOptions,
): number {
  const orderType = normalizeOrderType(options.orderType);
  if (orderType !== 'SALE') {
    return 0;
  }

  const total = options.saleItemCostSnapshots.reduce<number>((sum, value) => {
    const parsed = roundMoney(Math.max(0, parseNumeric(value)));
    return roundMoney(sum + parsed);
  }, 0);

  return roundMoney(Math.max(0, total));
}

export function computeRecognizedCogs(options: {
  orderCogsAmount: number;
  receivableAmount: number;
  revenueNet: number;
}): number {
  const orderCogsAmount = roundMoney(Math.max(0, options.orderCogsAmount));
  const receivableAmount = roundMoney(Math.max(0, options.receivableAmount));
  const revenueNet = roundMoney(options.revenueNet);

  if (orderCogsAmount <= 0 || receivableAmount <= 0 || revenueNet === 0) {
    return 0;
  }

  return roundMoney((orderCogsAmount * revenueNet) / receivableAmount);
}

export function computeProfitMetrics(options: {
  revenueNet: number;
  cogs: number;
}): Pick<PaymentFinancialSummary, 'cogs' | 'grossProfit' | 'profitMargin'> {
  const cogs = roundMoney(options.cogs);
  const revenueNet = roundMoney(options.revenueNet);
  const grossProfit = roundMoney(revenueNet - cogs);
  const profitMargin =
    Math.abs(revenueNet) < 0.000001 ? 0 : roundMoney(grossProfit / revenueNet);

  return {
    cogs,
    grossProfit,
    profitMargin,
  };
}

export function isRevenueEligiblePaymentType(
  type: OrderPaymentType | null,
): boolean {
  if (!type) return false;
  return REVENUE_ELIGIBLE_PAYMENT_TYPE_SET.has(type);
}

export function classifyRefundKind(
  payment: Pick<FinancialPaymentLike, 'reason' | 'source'>,
): RefundKind {
  const source = normalizeMarker(payment.source);
  const reason = normalizeMarker(payment.reason);

  if (source && RENT_REFUND_SOURCE_ALLOWLIST.has(source)) {
    return 'RENT_REFUND';
  }

  if (source && DEPOSIT_REFUND_SOURCE_ALLOWLIST.has(source)) {
    if (
      source === 'ORDER_MANUAL_REFUND' &&
      includesAnyMarker(reason, RENT_REFUND_REASON_MARKERS)
    ) {
      return 'RENT_REFUND';
    }
    return 'DEPOSIT_REFUND';
  }

  if (includesAnyMarker(reason, RENT_REFUND_REASON_MARKERS)) {
    return 'RENT_REFUND';
  }

  if (includesAnyMarker(reason, DEPOSIT_REFUND_REASON_MARKERS)) {
    return 'DEPOSIT_REFUND';
  }

  // Keep legacy-safe behavior: unknown refund is treated as deposit refund unless tagged otherwise.
  return 'DEPOSIT_REFUND';
}

export function summarizeFinancialPayments(
  payments: FinancialPaymentLike[],
): PaymentFinancialSummary {
  let revenueGross = 0;
  let refundEffective = 0;
  let depositCollectedTotal = 0;
  let depositRefundedTotal = 0;
  let totalRefundAmount = 0;
  let rentCollectedTotal = 0;
  let feeCollectedTotal = 0;
  let receivableCollectedTotal = 0;

  for (const payment of payments) {
    const normalizedStatus =
      payment.status === undefined
        ? 'POSTED'
        : normalizePaymentStatus(payment.status);
    if (normalizedStatus !== 'POSTED') continue;

    const paymentType = normalizePaymentType(payment.type);
    if (!paymentType) continue;

    const amount = roundMoney(Math.max(0, parseNumeric(payment.amount)));
    if (amount <= 0) continue;

    if (paymentType === 'DEPOSIT') {
      depositCollectedTotal = roundMoney(depositCollectedTotal + amount);
      continue;
    }

    if (paymentType === 'REFUND') {
      totalRefundAmount = roundMoney(totalRefundAmount + amount);
      const refundKind = classifyRefundKind(payment);

      if (refundKind === 'RENT_REFUND') {
        refundEffective = roundMoney(refundEffective + amount);
        receivableCollectedTotal = roundMoney(
          receivableCollectedTotal - amount,
        );
      } else {
        depositRefundedTotal = roundMoney(depositRefundedTotal + amount);
      }
      continue;
    }

    if (isRevenueEligiblePaymentType(paymentType)) {
      revenueGross = roundMoney(revenueGross + amount);
      receivableCollectedTotal = roundMoney(receivableCollectedTotal + amount);

      if (paymentType === 'RENT') {
        rentCollectedTotal = roundMoney(rentCollectedTotal + amount);
      } else if (paymentType === 'FEE') {
        feeCollectedTotal = roundMoney(feeCollectedTotal + amount);
      }
    }
  }

  const revenueNet = roundMoney(revenueGross - refundEffective);
  const profitMetrics = computeProfitMetrics({
    revenueNet,
    cogs: 0,
  });

  return {
    revenueGross,
    refundEffective,
    revenueNet,
    cogs: profitMetrics.cogs,
    grossProfit: profitMetrics.grossProfit,
    profitMargin: profitMetrics.profitMargin,
    depositCollectedTotal,
    depositRefundedTotal,
    totalRefundAmount,
    rentCollectedTotal,
    feeCollectedTotal,
    receivableCollectedTotal: roundMoney(receivableCollectedTotal),
  };
}

export function summarizeRealProfitCashflow(
  payments: FinancialPaymentLike[],
): RealProfitCashflowSummary {
  let inflowTotal = 0;
  let outflowTotal = 0;

  for (const payment of payments) {
    const normalizedStatus =
      payment.status === undefined
        ? 'POSTED'
        : normalizePaymentStatus(payment.status);
    if (normalizedStatus !== 'POSTED') continue;

    const paymentType = normalizePaymentType(payment.type);
    if (!paymentType) continue;

    const amount = roundMoney(Math.max(0, parseNumeric(payment.amount)));
    if (amount <= 0) continue;

    if (CASH_OUTFLOW_PAYMENT_TYPE_SET.has(paymentType)) {
      outflowTotal = roundMoney(outflowTotal + amount);
    } else {
      inflowTotal = roundMoney(inflowTotal + amount);
    }
  }

  return {
    inflowTotal,
    outflowTotal,
    realProfit: roundMoney(inflowTotal - outflowTotal),
  };
}

export function summarizeFinancialPaymentsWithOrderContext(options: {
  payments: FinancialPaymentByOrderLike[];
  orderContexts:
    | Map<string, OrderFinancialContextLike>
    | OrderFinancialContextLike[];
}): PaymentFinancialSummary {
  const paymentSummary = summarizeFinancialPayments(options.payments);
  const contextByOrderId = toOrderContextMap(options.orderContexts);

  let recognizedCogs = 0;

  for (const payment of options.payments) {
    const perPaymentSummary = summarizeFinancialPayments([payment]);
    if (perPaymentSummary.revenueNet === 0) {
      continue;
    }

    const orderContext = contextByOrderId.get(payment.orderId);
    if (!orderContext) {
      continue;
    }

    recognizedCogs = roundMoney(
      recognizedCogs +
        computeRecognizedCogs({
          orderCogsAmount: parseNumeric(orderContext.cogsAmount),
          receivableAmount: parseNumeric(orderContext.receivableAmount),
          revenueNet: perPaymentSummary.revenueNet,
        }),
    );
  }

  const profitMetrics = computeProfitMetrics({
    revenueNet: paymentSummary.revenueNet,
    cogs: recognizedCogs,
  });

  return {
    ...paymentSummary,
    ...profitMetrics,
  };
}

export function computeOutstandingDebt(options: {
  receivableAmount: number;
  collectedAmount: number;
}): number {
  const receivable = roundMoney(Math.max(0, options.receivableAmount));
  const collected = roundMoney(options.collectedAmount);
  return roundMoney(Math.max(0, receivable - collected));
}

export function summarizeOutstandingDebtByOrder(options: {
  orders: DebtOrderLike[];
  payments: FinancialPaymentByOrderLike[];
  excludedOrderStatuses?: string[];
}): number {
  const paymentRowsByOrderId = new Map<string, FinancialPaymentLike[]>();
  for (const payment of options.payments) {
    const bucket = paymentRowsByOrderId.get(payment.orderId);
    if (bucket) {
      bucket.push(payment);
    } else {
      paymentRowsByOrderId.set(payment.orderId, [payment]);
    }
  }

  const excludedStatusSet = new Set(
    (options.excludedOrderStatuses ?? []).map((status) =>
      normalizeMarker(status),
    ),
  );

  let totalOutstandingDebt = 0;

  for (const order of options.orders) {
    const normalizedStatus = normalizeMarker(order.status);
    if (normalizedStatus && excludedStatusSet.has(normalizedStatus)) {
      continue;
    }

    const paymentSummary = summarizeFinancialPayments(
      paymentRowsByOrderId.get(order.orderId) ?? [],
    );

    const outstanding = computeOutstandingDebt({
      receivableAmount: parseNumeric(order.totalAmount),
      collectedAmount: paymentSummary.receivableCollectedTotal,
    });

    totalOutstandingDebt = roundMoney(totalOutstandingDebt + outstanding);
  }

  return totalOutstandingDebt;
}
