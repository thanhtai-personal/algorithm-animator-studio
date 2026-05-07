import { parseNonNegativeMoney } from "@/utils/format/money";

export interface MoneyValidationResult {
  isValid: boolean;
  value: number | null;
  error: "empty" | "invalid-number" | "negative-not-allowed" | null;
}

export function validateNonNegativeMoneyInput(
  rawInput: string,
  options?: { allowEmpty?: boolean }
): MoneyValidationResult {
  const parsed = parseNonNegativeMoney(rawInput);

  if (parsed.value === null && !parsed.error) {
    if (options?.allowEmpty ?? true) {
      return {
        isValid: true,
        value: null,
        error: null,
      };
    }

    return {
      isValid: false,
      value: null,
      error: "empty",
    };
  }

  if (parsed.error) {
    return {
      isValid: false,
      value: null,
      error: parsed.error,
    };
  }

  return {
    isValid: true,
    value: parsed.value,
    error: null,
  };
}
