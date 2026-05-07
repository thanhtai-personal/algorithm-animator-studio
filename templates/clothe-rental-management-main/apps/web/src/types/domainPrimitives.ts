export type ItemStatus =
  | "READY"
  | "RESERVED"
  | "ON_RENT"
  | "LAUNDRY"
  | "MAINTENANCE"
  | "DAMAGED"
  | "LOST"
  | "SOLD"
  | "RETIRED";

export type OrderStatus =
  | "DRAFT"
  | "RESERVED"
  | "CONFIRMED"
  | "PICKED_UP"
  | "RETURNED"
  | "DEBT"
  | "COMPLETED"
  | "CANCELLED";

export type OrderType = "RENTAL" | "SALE";

export type PaymentStatus = "PENDING" | "POSTED" | "VOIDED";

export type PaymentType =
  | "RENT"
  | "DEPOSIT"
  | "FEE"
  | "DEPOSIT_REFUND"
  | "RENT_REFUND";

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "MOMO" | "CARD" | "OTHER";

export type DomainStatusKind = "item" | "order" | "payment";

export interface DateRangeValue {
  startDate: string;
  endDate: string;
}
