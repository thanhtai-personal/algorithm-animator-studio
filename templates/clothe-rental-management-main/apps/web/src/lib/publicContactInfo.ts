export interface PublicContactInfo {
  hotline: string | null;
  storeAddress: string | null;
  email: string | null;
}

export const EMPTY_PUBLIC_CONTACT_INFO: PublicContactInfo = {
  hotline: null,
  storeAddress: null,
  email: null,
};

function parseObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readFirst(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (source[key] !== undefined) {
      return source[key];
    }
  }
  return undefined;
}

export function parsePublicContactInfo(value: unknown): PublicContactInfo {
  const root = parseObject(value);
  const nested = parseObject(root.contactInfo);
  const source = Object.keys(nested).length > 0 ? nested : root;

  return {
    hotline: normalizeText(
      readFirst(source, ["hotline", "hotlinePhone", "phone", "phoneNumber"])
    ),
    storeAddress: normalizeText(
      readFirst(source, ["storeAddress", "address", "shopAddress"])
    ),
    email: normalizeText(
      readFirst(source, ["email", "contactEmail", "emailAddress", "mail"])
    ),
  };
}

export function hasAnyPublicContactInfo(info: PublicContactInfo): boolean {
  return Boolean(info.hotline || info.storeAddress || info.email);
}

export function toPublicContactInfoPayload(
  info: PublicContactInfo
): Partial<Record<"hotline" | "storeAddress" | "email", string>> | null {
  const payload: Partial<Record<"hotline" | "storeAddress" | "email", string>> = {};
  if (info.hotline) {
    payload.hotline = info.hotline;
  }
  if (info.storeAddress) {
    payload.storeAddress = info.storeAddress;
  }
  if (info.email) {
    payload.email = info.email;
  }
  return Object.keys(payload).length > 0 ? payload : null;
}
