import { parseNonNegativeMoney } from "@/utils/format/money";

export function parseMoneyFieldValue(value: string): number | null {
  const parsed = parseNonNegativeMoney(value);
  return parsed.error ? null : parsed.value;
}

export function stringifyMoneyFieldValue(value: number | null): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}
