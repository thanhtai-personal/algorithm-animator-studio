import type { AppLocale } from "@/constants/locale";
import type { SalesProductEntryInitialStatus } from "@/types/salesProductEntry";
import type { SalesProductEntryDraft } from "./types";

export function buildDraftStorageKey(branchId: string | null | undefined): string {
  return `sales:product-entry:draft:${branchId ?? "none"}`;
}

export function parseMoneyInput(value: string): number | null | "invalid" {
  const trimmed = value.replace(/,/g, "").trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return "invalid";
  return parsed;
}

export function parseMultilineValues(value: string): string[] {
  return value
    .split(/\r?\n|,/g)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function uniqueValues(values: string[]): string[] {
  const output: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(value.trim());
  }

  return output;
}

export function parseStoredDraft(raw: string | null): Partial<SalesProductEntryDraft> | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<SalesProductEntryDraft>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function normalizeInitialItemStatusForRole(
  value: SalesProductEntryInitialStatus,
  canEditSensitivePricing: boolean
): SalesProductEntryInitialStatus {
  if (!canEditSensitivePricing && value === "SOLD") {
    return "READY";
  }
  return value;
}

export function resolveSubmitErrorMessage(
  error: unknown,
  fallback: string,
  locale: AppLocale
): string {
  if (!(error instanceof Error)) return fallback;

  if (error.message === "DUPLICATE_PRODUCT_CODE") {
    return locale === "vi" ? "Mã sản phẩm đã tồn tại." : "Product code already exists.";
  }
  if (
    error.message === "DUPLICATE_ITEM_CODE" ||
    error.message === "DUPLICATE_ITEM_CODE_IN_PAYLOAD"
  ) {
    return locale === "vi"
      ? "Mã item đã tồn tại trong chi nhánh."
      : "Item code already exists in this branch.";
  }
  if (error.message === "FORBIDDEN_SENSITIVE_PRICING_FOR_STAFF") {
    return locale === "vi"
      ? "Cần quyền quản lý giá nhập để tạo sản phẩm."
      : "Purchase-price permission is required to create products.";
  }
  if (error.message === "MISSING_REQUIRED_PRODUCT_PRICES") {
    return locale === "vi"
      ? "Giá thuê là bắt buộc."
      : "Rent price is required.";
  }
  if (error.message === "FORBIDDEN_MANAGER_ONLY_ITEM_STATUS") {
    return locale === "vi"
      ? "Chỉ manager trở lên mới có thể tạo item trạng thái Đã bán."
      : "Only manager role and above can create SOLD items.";
  }

  return error.message || fallback;
}
