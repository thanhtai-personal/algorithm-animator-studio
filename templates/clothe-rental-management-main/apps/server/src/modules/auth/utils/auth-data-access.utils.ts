import {
  PROFILE_LOCALE_SET,
  PROFILE_ROLE_SET,
} from '../constants/auth-data-access.constants';
import type {
  AuthAdminUserMetadata,
  PhoneProfileCandidateRow,
} from '../types/auth-data-access.type';

export function sanitizeText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizePhone(rawValue: string): string {
  return rawValue.replace(/[^0-9+]/g, '').trim();
}

export function validatePhoneNumber(
  rawValue: string,
  options?: { allowEmpty?: boolean },
): { isValid: boolean; normalized: string | null } {
  const normalized = normalizePhone(rawValue);
  if (!normalized) {
    return { isValid: Boolean(options?.allowEmpty), normalized: null };
  }
  if (/^0\d{9}$/.test(normalized)) {
    return { isValid: true, normalized: `+84${normalized.slice(1)}` };
  }
  if (/^84\d{9}$/.test(normalized)) {
    return { isValid: true, normalized: `+${normalized}` };
  }
  if (/^\+84\d{9}$/.test(normalized)) {
    return { isValid: true, normalized };
  }
  return { isValid: false, normalized: null };
}

export function buildPhoneCandidates(normalizedPhone: string): string[] {
  const candidates = new Set<string>([normalizedPhone]);
  if (normalizedPhone.startsWith('+')) {
    candidates.add(normalizedPhone.slice(1));
  }
  if (normalizedPhone.startsWith('+84') && normalizedPhone.length > 3) {
    candidates.add(`0${normalizedPhone.slice(3)}`);
  }
  return Array.from(candidates);
}

export function isActiveCustomerRole(
  row: PhoneProfileCandidateRow | null,
): row is PhoneProfileCandidateRow {
  if (!row) return false;
  const normalizedRole =
    typeof row.role === 'string' ? row.role.trim().toLowerCase() : '';
  return normalizedRole === 'customer' && (row.is_active ?? true);
}

export function toMetadataRecord(value: unknown): AuthAdminUserMetadata | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as AuthAdminUserMetadata;
}

export function normalizeProfileRole(value: unknown): string {
  const normalized =
    typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (normalized === 'admin' || normalized === 'owner_admin') {
    return 'customer';
  }
  if (PROFILE_ROLE_SET.has(normalized)) return normalized;
  return 'customer';
}

export function normalizeProfileLocale(value: unknown): 'vi' | 'en' {
  const normalized =
    typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (PROFILE_LOCALE_SET.has(normalized)) {
    return normalized as 'vi' | 'en';
  }
  return 'vi';
}

export function appendWarning(
  current: string | null,
  next: string | null | undefined,
): string | null {
  if (!next) return current;
  if (!current) return next;
  return `${current}; ${next}`;
}
