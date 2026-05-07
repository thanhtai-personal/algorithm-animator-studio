// filepath: apps/web/src/server/data-access/calendar/constants.ts
import type { OrderStatus } from "@/types/domainPrimitives";

export const ORDER_STATUS_SET = new Set<OrderStatus>([
  "DRAFT",
  "RESERVED",
  "CONFIRMED",
  "PICKED_UP",
  "RETURNED",
  "DEBT",
  "COMPLETED",
  "CANCELLED",
]);

export const DEFAULT_BRANCH_TIMEZONE = "Asia/Ho_Chi_Minh";
export const DEFAULT_CURRENCY_CODE = "VND";
export const DEFAULT_LAUNDRY_STUCK_THRESHOLD_DAYS = 3;
export const MAX_RANGE_DAYS = 124;

export const SUPPORTED_ROLE_SET = new Set(["owner_admin", "manager", "staff", "accountant"]);

export const ACTIVE_ORDER_EVENT_STATUS_SET = new Set<OrderStatus>([
  "RESERVED",
  "CONFIRMED",
  "PICKED_UP",
  "RETURNED",
  "DEBT",
  "COMPLETED",
]);