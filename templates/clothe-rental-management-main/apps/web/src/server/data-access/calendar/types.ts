// filepath: apps/web/src/server/data-access/calendar/types.ts
import type { OrderStatus } from "@/types/domainPrimitives";

export type CalendarDomainErrorCode =
  | "MISSING_BRANCH_CONTEXT"
  | "FORBIDDEN_BRANCH_SCOPE"
  | "FORBIDDEN_MANAGER_ACTION"
  | "INVALID_DATE_RANGE"
  | "DATE_RANGE_TOO_LARGE";

export interface CalendarDomainErrorContext {
  [key: string]: unknown;
}

export interface ProfileActorRow {
  id: string;
  role: string | null;
  default_branch_id: string | null;
}

export interface ProfileBranchAccessRow {
  branch_id: string;
}

export interface BranchRow {
  id: string;
  timezone: string | null;
  currency_code: string | null;
}

export interface BranchSettingRow {
  laundry_stuck_threshold_days: number | null;
}

export interface OrderRow {
  id: string;
  order_code: string;
  customer_id: string;
  status: string;
  start_date: string;
  end_date: string;
  updated_at: string;
}

export interface CustomerRow {
  id: string;
  full_name: string | null;
  phone: string | null;
}

export interface ItemRow {
  id: string;
  item_code: string;
  status: string;
  updated_at: string;
}

export interface ResolvedOrder {
  orderId: string;
  orderCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  status: OrderStatus;
  startDate: string;
  endDate: string;
  updatedAt: string;
}