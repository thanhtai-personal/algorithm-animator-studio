import type { OrderPaymentMethod, OrderPaymentType } from "@/types/ordersDomain";

export const PAYMENTS_FEATURE_KEY = "payments";

export const PAYMENTS_DEFAULT_PAGE_SIZE = 20;

export const PAYMENTS_FILTER_TYPES: OrderPaymentType[] = [
  "RENT",
  "DEPOSIT",
  "FEE",
  "REFUND",
  "EXPENSE",
];

export const PAYMENTS_FILTER_METHODS: OrderPaymentMethod[] = [
  "CASH",
  "BANK",
  "MOMO",
];
