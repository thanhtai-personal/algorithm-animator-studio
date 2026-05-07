export interface PhoneValidationOptions {
  allowEmpty?: boolean;
}

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string | null;
  error: 'empty' | 'invalid-phone' | null;
}

function normalizePhone(rawValue: string): string {
  return rawValue.replace(/[^0-9+]/g, '').trim();
}

export function validatePhoneNumber(
  rawValue: string,
  options?: PhoneValidationOptions,
): PhoneValidationResult {
  const normalized = normalizePhone(rawValue);

  if (!normalized) {
    if (options?.allowEmpty) {
      return { isValid: true, normalized: null, error: null };
    }

    return { isValid: false, normalized: null, error: 'empty' };
  }

  if (/^0\d{9}$/.test(normalized)) {
    return {
      isValid: true,
      normalized: `+84${normalized.slice(1)}`,
      error: null,
    };
  }

  if (/^84\d{9}$/.test(normalized)) {
    return {
      isValid: true,
      normalized: `+${normalized}`,
      error: null,
    };
  }

  if (/^\+84\d{9}$/.test(normalized)) {
    return {
      isValid: true,
      normalized,
      error: null,
    };
  }

  return {
    isValid: false,
    normalized: null,
    error: 'invalid-phone',
  };
}
