import type { ReturnItemCondition, ReturnItemTargetStatus } from "@/types/ordersDomain";
import type { ReturnItemDraft } from "./types";

export function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseNonNegativeNumber(raw: string): number | null {
  if (!raw.trim()) return 0;
  const parsed = Number(raw.trim().replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function roundMoneyValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

export function defaultTargetStatus(condition: ReturnItemCondition): ReturnItemTargetStatus {
  if (condition === "LOST") return "LOST";
  if (condition === "DAMAGE") return "MAINTENANCE";
  return "LAUNDRY";
}

export function buildDraftFromItemIds(itemIds: string[]): Record<string, ReturnItemDraft> {
  return itemIds.reduce<Record<string, ReturnItemDraft>>((acc, itemId) => {
    acc[itemId] = {
      condition: "OK",
      targetStatus: "LAUNDRY",
      incidentAmount: "0",
      applyToDeposit: true,
      note: "",
    };
    return acc;
  }, {});
}
