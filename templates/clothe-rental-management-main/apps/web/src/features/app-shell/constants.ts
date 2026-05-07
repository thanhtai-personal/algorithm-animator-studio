export const RESET_VERSION_KEY = "spendsmart:forceResetVersion";
export const ZERO_VERSION = "0.0.0";

export const DASHBOARD_NAV_ITEMS = [
  { key: "dashboard", segment: "dashboard" },
  { key: "orders", segment: "orders" },
  { key: "inventory", segment: "inventory" },
  { key: "products", segment: "products" },
  { key: "procurement", segment: "procurement" },
  { key: "media", segment: "media" },
  { key: "categories", segment: "categories" },
  { key: "customers", segment: "customers" },
  { key: "shifts", segment: "shifts" },
  { key: "payments", segment: "payments" },
  { key: "calendar", segment: "calendar" },
  { key: "makeup", segment: "makeup" },
  { key: "reports", segment: "reports" },
  { key: "settings", segment: "settings" },
] as const;

export type DashboardNavKey = (typeof DASHBOARD_NAV_ITEMS)[number]["key"];
export type DashboardModuleSegment = Exclude<DashboardNavKey, "dashboard">;
