export type PublicSocialLinkKey = "facebook" | "tiktok" | "zalo" | "telegram";

export interface PublicSocialLinks {
  facebook: string | null;
  tiktok: string | null;
  zalo: string | null;
  telegram: string | null;
}

export const PUBLIC_SOCIAL_LINK_KEYS: PublicSocialLinkKey[] = [
  "facebook",
  "tiktok",
  "zalo",
  "telegram",
];

export const EMPTY_PUBLIC_SOCIAL_LINKS: PublicSocialLinks = {
  facebook: null,
  tiktok: null,
  zalo: null,
  telegram: null,
};

function parseObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function readCandidate(
  source: Record<string, unknown>,
  key: PublicSocialLinkKey
): unknown {
  const direct = source[key];
  if (direct !== undefined) return direct;
  return source[`${key}Url`];
}

function normalizeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let normalized = trimmed;
  if (/^\/\//.test(normalized)) {
    normalized = `https:${normalized}`;
  } else if (
    !/^https?:\/\//i.test(normalized) &&
    /^(www\.|[a-z0-9-]+(\.[a-z0-9-]+)+)/i.test(normalized)
  ) {
    normalized = `https://${normalized}`;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function parsePublicSocialLinks(value: unknown): PublicSocialLinks {
  const root = parseObject(value);
  const nested = parseObject(root.socialLinks);
  const source = Object.keys(nested).length > 0 ? nested : root;

  return {
    facebook: normalizeExternalUrl(readCandidate(source, "facebook")),
    tiktok: normalizeExternalUrl(readCandidate(source, "tiktok")),
    zalo: normalizeExternalUrl(readCandidate(source, "zalo")),
    telegram: normalizeExternalUrl(readCandidate(source, "telegram")),
  };
}

export function hasAnyPublicSocialLinks(links: PublicSocialLinks): boolean {
  return PUBLIC_SOCIAL_LINK_KEYS.some((key) => Boolean(links[key]));
}

export function toPublicSocialLinksPayload(
  links: PublicSocialLinks
): Partial<Record<PublicSocialLinkKey, string>> | null {
  const payload: Partial<Record<PublicSocialLinkKey, string>> = {};

  for (const key of PUBLIC_SOCIAL_LINK_KEYS) {
    const value = links[key];
    if (value) {
      payload[key] = value;
    }
  }

  return Object.keys(payload).length > 0 ? payload : null;
}

