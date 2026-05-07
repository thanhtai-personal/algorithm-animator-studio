import { validateDateRange } from "@/utils/validation/dateRange";
import type { OrderType } from "@/types/domainPrimitives";
import type {
  CreateOrderPayload,
  OrderPricingMode,
  OrderRentPlanType,
} from "@/types/ordersDomain";

export type CreateOrderContractStatus = NonNullable<CreateOrderPayload["status"]>;
export type RentalOrderRentPlanType = Exclude<OrderRentPlanType, null>;

const CREATE_ORDER_ALLOWED_STATUS_BY_TYPE: Record<
  OrderType,
  readonly CreateOrderContractStatus[]
> = {
  RENTAL: ["DRAFT", "RESERVED", "CONFIRMED"],
  SALE: ["DRAFT", "CONFIRMED"],
};

export type CreateOrderContractValidationError =
  | "branch-required"
  | "customer-required"
  | "pricing-mode-required"
  | "date-invalid"
  | "status-invalid"
  | "item-required";

export interface CreateOrderContractValidationResult {
  isValid: boolean;
  error: CreateOrderContractValidationError | null;
}

export interface CreateOrderContractValidationInput {
  branchId?: string | null;
  customerId?: string | null;
  orderType?: OrderType | null;
  pricingMode?: OrderPricingMode | null;
  status?: CreateOrderContractStatus | null;
  startDate: string;
  endDate: string;
  itemCount: number;
}

export interface BuildCreateOrderPayloadInput {
  branchId?: string | null;
  orderType?: OrderType | null;
  pricingMode?: OrderPricingMode | null;
  status?: CreateOrderContractStatus | null;
  customerId: string;
  startDate: string;
  endDate: string;
  pickupTime?: string | null;
  returnTime?: string | null;
  discountType?: CreateOrderPayload["discountType"];
  discountValue?: number | null;
  feesAmount?: number | null;
  depositAmount?: number | null;
  note?: string | null;
  internalNote?: string | null;
  items?: CreateOrderPayload["items"];
  payments?: CreateOrderPayload["payments"];
  paymentReceiptConfirmation?: CreateOrderPayload["paymentReceiptConfirmation"];
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeNonNegativeNumber(value: number | null | undefined): number | null {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, value);
}

function normalizeCreateOrderPayments(
  payments: CreateOrderPayload["payments"] | undefined
): CreateOrderPayload["payments"] {
  if (!payments || payments.length === 0) {
    return undefined;
  }

  const normalized: NonNullable<CreateOrderPayload["payments"]> = [];
  for (const entry of payments) {
    if (!entry) {
      continue;
    }

    const amount = normalizeNonNegativeNumber(entry.amount);
    if (amount === null || amount <= 0) {
      continue;
    }

    normalized.push({
      type: entry.type,
      method: entry.method,
      amount,
      status: entry.status ?? undefined,
      reason: normalizeNullableText(entry.reason),
      source: normalizeNullableText(entry.source),
      note: normalizeNullableText(entry.note),
      referenceCode: normalizeNullableText(entry.referenceCode),
    });
  }

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeCreateOrderPaymentReceiptConfirmation(
  value: CreateOrderPayload["paymentReceiptConfirmation"] | undefined
): CreateOrderPayload["paymentReceiptConfirmation"] {
  if (!value) {
    return undefined;
  }

  const amount = normalizeNonNegativeNumber(value.amount);
  const method = value.method === "BANK" ? "BANK" : value.method === "CASH" ? "CASH" : null;
  if (amount === null || amount <= 0 || !method || value.confirmed !== true) {
    return undefined;
  }

  return {
    confirmed: true,
    amount,
    method,
    note: normalizeNullableText(value.note),
  };
}

export function resolveRentPlanTypeFromDays(days: number): RentalOrderRentPlanType {
  if (days === 1) return "1d";
  if (days === 3) return "3d";
  if (days === 7) return "7d";
  return "custom";
}

export function validateCreateOrderContractInput(
  input: CreateOrderContractValidationInput
): CreateOrderContractValidationResult {
  const orderType = input.orderType ?? "RENTAL";
  const status = input.status ?? "DRAFT";
  const itemCount = Number.isFinite(input.itemCount) ? Math.max(0, input.itemCount) : 0;

  if (!normalizeNullableText(input.branchId)) {
    return {
      isValid: false,
      error: "branch-required",
    };
  }

  if (!normalizeNullableText(input.customerId)) {
    return {
      isValid: false,
      error: "customer-required",
    };
  }

  if (orderType === "RENTAL" && !input.pricingMode) {
    return {
      isValid: false,
      error: "pricing-mode-required",
    };
  }

  const dateValidation = validateDateRange(
    {
      startDate: input.startDate,
      endDate: input.endDate,
    },
    { allowSameDay: false }
  );
  if (!dateValidation.isValid) {
    return {
      isValid: false,
      error: "date-invalid",
    };
  }

  const allowedStatuses = CREATE_ORDER_ALLOWED_STATUS_BY_TYPE[orderType];
  if (!allowedStatuses.includes(status)) {
    return {
      isValid: false,
      error: "status-invalid",
    };
  }

  if (status !== "DRAFT" && itemCount === 0) {
    return {
      isValid: false,
      error: "item-required",
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

export function buildCreateOrderPayload(input: BuildCreateOrderPayloadInput): CreateOrderPayload {
  const orderType = input.orderType ?? "RENTAL";
  const status = input.status ?? "DRAFT";
  const normalizedBranchId = normalizeNullableText(input.branchId);
  const normalizedDepositAmount = normalizeNonNegativeNumber(input.depositAmount);

  return {
    branchId: normalizedBranchId,
    orderType,
    pricingMode: orderType === "RENTAL" ? (input.pricingMode ?? "STANDARD") : null,
    customerId: input.customerId,
    status,
    startDate: input.startDate,
    endDate: input.endDate,
    pickupTime: orderType === "SALE" ? null : normalizeNullableText(input.pickupTime),
    returnTime: orderType === "SALE" ? null : normalizeNullableText(input.returnTime),
    discountType: input.discountType ?? null,
    discountValue: normalizeNonNegativeNumber(input.discountValue),
    feesAmount: normalizeNonNegativeNumber(input.feesAmount),
    depositAmount: orderType === "SALE" ? null : normalizedDepositAmount,
    note: normalizeNullableText(input.note),
    internalNote: normalizeNullableText(input.internalNote),
    items: input.items,
    payments: normalizeCreateOrderPayments(input.payments),
    paymentReceiptConfirmation: normalizeCreateOrderPaymentReceiptConfirmation(
      input.paymentReceiptConfirmation
    ),
  };
}
