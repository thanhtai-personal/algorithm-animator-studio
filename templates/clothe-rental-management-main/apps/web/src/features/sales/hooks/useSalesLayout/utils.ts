import type { AppLocale } from "@/constants/locale";
import type { SalesLayoutCopy } from "./types";

export function isDashboardRole(role: string | null | undefined): boolean {
  if (typeof role !== "string") return false;
  return role.trim().length > 0 && new Set(["owner_admin", "admin", "manager"]).has(role.trim().toLowerCase());
}

export function parseCashInput(raw: string): number | null {
  const parsed = Number(raw.trim().replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

export function mapShiftActionErrorMessage(copy: SalesLayoutCopy, error: unknown): string {
  const raw = error instanceof Error ? error.message : "";
  const code = raw.trim().toUpperCase();

  if (code === "INVALID_CASH_AMOUNT") return copy.shiftInvalidCash;
  if (code === "SHIFT_ALREADY_OPEN") return copy.shiftAlreadyOpen;
  if (code === "SHIFT_ALREADY_CLOSED") return copy.shiftNotFound;
  if (code === "SHIFT_NOT_FOUND") return copy.shiftNotFound;
  if (code === "SHIFT_VARIANCE_NOTE_REQUIRED") return copy.shiftVarianceNoteRequired;
  if (code === "MISSING_BRANCH_CONTEXT" || code === "BRANCH_ACCESS_DENIED") {
    return copy.shiftBranchRequired;
  }

  return raw || copy.shiftActionFailed;
}

export function mapPosPasskeyErrorMessage(copy: SalesLayoutCopy, error: unknown): string {
  const raw = error instanceof Error ? error.message : "";
  const code = raw.trim().toUpperCase();

  if (code === "INVALID_POS_PASSKEY") return copy.posPasskeyInvalid;
  if (code === "POS_PASSKEY_REQUIRED") return copy.posPasskeyRequired;
  if (code === "POS_PASSKEY_COLUMNS_MISSING") return copy.posPasskeyLoadFailed;

  return raw || copy.posPasskeyInvalid;
}

export function formatShiftDateTime(value: string | null, locale: AppLocale): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale === "vi" ? "vi-VN" : "en-US");
}
