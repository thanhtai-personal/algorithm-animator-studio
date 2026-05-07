import type { Request } from 'express';

function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return header.split(';').reduce<Record<string, string>>((acc, part) => {
    const [name, ...valueParts] = part.trim().split('=');
    if (!name) return acc;
    try {
      acc[name] = decodeURIComponent(valueParts.join('='));
    } catch {
      acc[name] = valueParts.join('=');
    }
    return acc;
  }, {});
}

function sanitizeText(value: string | undefined | null): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getProjectRefFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname;
    return hostname.split('.')[0] ?? null;
  } catch {
    return null;
  }
}

function getBearerToken(request: Request): string | null {
  const authHeader =
    request.headers.authorization ??
    (request.headers.Authorization as string | undefined);
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return sanitizeText(token);
}

function getSupabaseAccessTokenFromCookie(
  request: Request,
  supabaseUrl: string | null,
): string | null {
  const projectRef = getProjectRefFromUrl(supabaseUrl);
  if (!projectRef) return null;

  const cookies = parseCookieHeader(request.headers.cookie);
  const baseName = `sb-${projectRef}-auth-token`;
  let raw = cookies[baseName];

  if (!raw) {
    const chunkEntries = Object.entries(cookies)
      .filter(([name]) => name.startsWith(`${baseName}.`))
      .sort(([a], [b]) => {
        const aIndex = Number(a.replace(`${baseName}.`, ''));
        const bIndex = Number(b.replace(`${baseName}.`, ''));
        return aIndex - bIndex;
      });
    if (chunkEntries.length) {
      raw = chunkEntries.map(([, value]) => value).join('');
    }
  }

  if (!raw) return null;

  const encoded = raw.startsWith('base64-') ? raw.slice('base64-'.length) : raw;
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const session = JSON.parse(decoded) as { access_token?: string };
    return sanitizeText(session.access_token);
  } catch {
    return null;
  }
}

export function getAccessTokenFromRequest(
  request: Request,
  supabaseUrl: string | null,
): string | null {
  return (
    getBearerToken(request) ??
    getSupabaseAccessTokenFromCookie(request, supabaseUrl)
  );
}
