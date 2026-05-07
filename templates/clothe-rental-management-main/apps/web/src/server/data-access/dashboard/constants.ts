import { OrderStatus } from "@/types/domainPrimitives";

export const MANAGER_PLUS_ROLE_SET = new Set<string>(["owner_admin", "manager"]);
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
export const DEFAULT_CURRENCY = "VND";

export const DUE_TODAY_STATUSES: OrderStatus[] = [
  "DRAFT",
  "RESERVED",
  "CONFIRMED",
  "PICKED_UP",
];