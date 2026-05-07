import type { MakeupSessionSlot, MakeupEventStatus } from "@/types/makeupModule";

export const DEFAULT_BRANCH_TIMEZONE = "Asia/Ho_Chi_Minh";
export const SESSION_SLOT_SET = new Set<MakeupSessionSlot>([
  "MORNING",
  "AFTERNOON",
  "EVENING",
]);
export const EVENT_STATUS_SET = new Set<MakeupEventStatus>([
  "BOOKED",
  "COMPLETED",
  "CANCELLED",
]);
export const DEFAULT_EVENT_DURATION_MINUTES = 80;
export const MANAGER_ROLE_SET = new Set(["owner_admin", "manager"]);
export const OPERATOR_ROLE_SET = new Set([
  "owner_admin",
  "manager",
  "staff",
  "accountant",
  "makeup_artist",
  "customer",
]);
export const PACKAGE_EDITOR_ROLE_SET = new Set([
  "owner_admin",
  "manager",
  "makeup_artist",
]);
export const MAKEUP_ADMIN_ROLE_SET = new Set(["owner_admin", "manager", "staff"]);
