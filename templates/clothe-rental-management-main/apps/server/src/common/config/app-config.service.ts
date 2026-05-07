import { Injectable } from '@nestjs/common';

const PROD_API_BASE_URL = 'https://kata-center-api.vercel.app';
const DEFAULT_DEV_PORT = 3056;

function sanitizeText(value: string | undefined | null): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function normalizePathSegment(
  value: string | undefined,
  fallback: string,
): string {
  const raw = sanitizeText(value);
  if (!raw) return fallback;
  const normalized = raw.replace(/^\/+/, '').replace(/\/+$/, '');
  return normalized.length > 0 ? normalized : fallback;
}

function isPrivateIpv4Host(hostname: string): boolean {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return false;

  const octets = hostname.split('.').map((entry) => Number(entry));
  if (octets.some((entry) => entry < 0 || entry > 255)) return false;

  const [first, second] = octets;
  if (first === 10) return true;
  if (first === 127) return true;
  if (first === 192 && second === 168) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  return false;
}

function isLocalHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1'
  ) {
    return true;
  }
  return isPrivateIpv4Host(normalized);
}

function normalizeCorsOriginEntry(value: string): string | null {
  const raw = sanitizeText(value);
  if (!raw) return null;
  if (raw === '*') return raw;

  const collapsedScheme = raw.replace(/^(https?:\/\/)+/i, (matchedPrefix) => {
    return matchedPrefix.toLowerCase().includes('https://')
      ? 'https://'
      : 'http://';
  });

  let candidate = collapsedScheme;
  if (!/^https?:\/\//i.test(candidate)) {
    const hostCandidate = candidate.split('/')[0]?.split(':')[0] ?? '';
    const protocol = isLocalHostname(hostCandidate) ? 'http://' : 'https://';
    candidate = `${protocol}${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname) return null;
    const port = parsed.port ? `:${parsed.port}` : '';
    return `${parsed.protocol}//${hostname}${port}`;
  } catch {
    return null;
  }
}

function parseCorsAllowedOrigins(value: string | undefined | null): string[] {
  if (!value) return [];
  const normalizedOrigins = value
    .split(',')
    .map((entry) => normalizeCorsOriginEntry(entry))
    .filter((entry): entry is string => Boolean(entry));

  return Array.from(new Set(normalizedOrigins));
}

@Injectable()
export class AppConfigService {
  readonly nodeEnv = sanitizeText(process.env.NODE_ENV) ?? 'development';
  readonly isProduction = this.nodeEnv === 'production';
  readonly port = parseInteger(process.env.PORT, DEFAULT_DEV_PORT);
  readonly apiPrefix = 'api';
  readonly apiVersion = '1';

  readonly supabaseUrl =
    sanitizeText(process.env.SUPABASE_URL) ??
    sanitizeText(process.env.NEXT_PUBLIC_SUPABASE_URL);
  readonly supabaseAnonKey =
    sanitizeText(process.env.SUPABASE_ANON_KEY) ??
    sanitizeText(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  readonly supabaseServiceRoleKey = sanitizeText(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  private readonly explicitNestApiBaseUrl =
    sanitizeText(process.env.NEST_API_BASE_URL) ??
    sanitizeText(process.env.ZALO_MINI_APP_API_BASE_URL);
  readonly nestApiBaseUrl =
    this.explicitNestApiBaseUrl ??
    (this.isProduction ? PROD_API_BASE_URL : `http://localhost:${this.port}`);

  readonly miniAppAppSecret = sanitizeText(
    process.env.ZALO_MINI_APP_APP_SECRET,
  );
  readonly miniAppWebhookSecret =
    sanitizeText(process.env.ZALO_MINI_APP_WEBHOOK_SECRET) ??
    this.miniAppAppSecret;
  readonly miniAppDebug =
    process.env.ZALO_MINI_APP_DEBUG === '1' ||
    process.env.NODE_ENV !== 'production';
  readonly miniAppDevProfileId = sanitizeText(
    process.env.ZALO_MINI_APP_DEV_PROFILE_ID,
  );

  readonly corsAllowedOrigins = parseCorsAllowedOrigins(
    process.env.CORS_ALLOWED_ORIGINS,
  );
  readonly swaggerEnabled = parseBoolean(
    process.env.SWAGGER_ENABLED,
    !this.isProduction,
  );
  readonly swaggerPath = normalizePathSegment(
    process.env.SWAGGER_PATH,
    `${this.apiPrefix}/docs`,
  );
  readonly swaggerJsonPath = normalizePathSegment(
    process.env.SWAGGER_JSON_PATH,
    `${this.apiPrefix}/docs-json`,
  );

  assertRequiredSupabaseEnv(): void {
    if (!this.supabaseUrl) {
      throw new Error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
    }
    if (!this.supabaseAnonKey) {
      throw new Error(
        'Missing SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)',
      );
    }
    if (!this.supabaseServiceRoleKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    }
  }

  assertRequiredApiBaseEnv(): void {
    if (!this.nestApiBaseUrl) {
      throw new Error('Missing NEST_API_BASE_URL');
    }
    if (this.isProduction && !this.explicitNestApiBaseUrl) {
      throw new Error(
        'Missing NEST_API_BASE_URL (or ZALO_MINI_APP_API_BASE_URL) in production',
      );
    }
  }

  assertRequiredRuntimeEnv(): void {
    this.assertRequiredSupabaseEnv();
    this.assertRequiredApiBaseEnv();
    if (this.isProduction && this.corsAllowedOrigins.length === 0) {
      throw new Error('Missing CORS_ALLOWED_ORIGINS in production');
    }
    if (this.isProduction && this.corsAllowedOrigins.includes('*')) {
      throw new Error('CORS_ALLOWED_ORIGINS cannot include "*" in production');
    }
  }
}
