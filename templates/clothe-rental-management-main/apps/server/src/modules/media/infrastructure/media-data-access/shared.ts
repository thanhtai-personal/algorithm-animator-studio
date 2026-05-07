import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  MediaAssetDto,
  MediaAssetType,
  MediaUsageDto,
} from '../../types/media-library.type';

const MEDIA_ALLOWED_ROLE_SET = new Set(['owner_admin', 'admin', 'manager']);
const MEDIA_TYPE_SET = new Set<MediaAssetType>(['image', 'video']);
export const MEDIA_UPLOAD_SESSION_STATUS_SET = new Set([
  'PENDING',
  'COMPLETED',
  'EXPIRED',
  'CANCELED',
]);

const DEFAULT_MEDIA_STORAGE_LIMIT_BYTES = 9 * 1024 * 1024 * 1024;

function resolveMediaStorageLimitBytes(): number {
  const rawValue = process.env.MEDIA_STORAGE_LIMIT_BYTES?.trim() ?? '';
  if (!rawValue) return DEFAULT_MEDIA_STORAGE_LIMIT_BYTES;

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MEDIA_STORAGE_LIMIT_BYTES;
  }

  return Math.floor(parsed);
}

export const MEDIA_STORAGE_LIMIT_BYTES = resolveMediaStorageLimitBytes();
const MEDIA_WARNING_THRESHOLD_RATIO = 0.9;
export const MEDIA_UPLOAD_SESSION_TTL_MINUTES = 15;
export const MEDIA_STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BUCKET ?? 'product-images';

export interface MediaAssetRow {
  id: string;
  branch_id: string;
  bucket: string;
  storage_path: string;
  public_url: string;
  media_type: string;
  mime_type: string;
  size_bytes: number | string;
  original_file_name: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface MediaUploadSessionRow {
  id: string;
  branch_id: string;
  bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number | string;
  media_type: string;
  status: string;
  expires_at: string;
  created_by_profile_id: string | null;
  created_at: string;
}

interface ProfileActorRow {
  id: string;
  role: string | null;
  default_branch_id: string | null;
  is_active: boolean;
}

interface ProfileBranchAccessRow {
  branch_id: string;
}

type MediaDomainErrorCode =
  | 'FORBIDDEN_MEDIA_ACCESS'
  | 'MISSING_PROFILE_CONTEXT'
  | 'MISSING_BRANCH_CONTEXT'
  | 'BRANCH_ACCESS_DENIED'
  | 'INVALID_MEDIA_TYPE'
  | 'INVALID_FILE_SIZE'
  | 'MEDIA_STORAGE_LIMIT_EXCEEDED'
  | 'MEDIA_UPLOAD_SESSION_NOT_FOUND'
  | 'MEDIA_UPLOAD_SESSION_EXPIRED'
  | 'MEDIA_UPLOAD_SESSION_INVALID_STATE'
  | 'MEDIA_NOT_FOUND'
  | 'MEDIA_DELETE_FAILED'
  | 'MEDIA_SCHEMA_NOT_READY';

interface MediaDomainErrorContext {
  [key: string]: unknown;
}

export class MediaDomainError extends Error {
  readonly code: MediaDomainErrorCode;
  readonly context: MediaDomainErrorContext;

  constructor(
    code: MediaDomainErrorCode,
    context: MediaDomainErrorContext = {},
  ) {
    super(code);
    this.name = 'MediaDomainError';
    this.code = code;
    this.context = context;
  }
}

export interface MediaActorContext {
  profile: ProfileActorRow;
  role: string;
  allowedBranchIds: string[];
}

function toErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  if (!('code' in error)) return '';
  return String((error as { code?: string }).code ?? '').toUpperCase();
}

function toErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  if (!('message' in error)) return '';
  return String((error as { message?: string }).message ?? '');
}

function toErrorDetails(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  if (!('details' in error)) return '';
  return String((error as { details?: string }).details ?? '');
}

export function isMissingMediaSchemaError(error: unknown): boolean {
  const code = toErrorCode(error);
  if (code === '42P01' || code === 'PGRST205') return true;

  const message =
    `${toErrorMessage(error)} ${toErrorDetails(error)}`.toLowerCase();
  if (
    message.includes('schema cache') &&
    message.includes('media_upload_sessions')
  ) {
    return true;
  }
  if (message.includes('schema cache') && message.includes('media_assets')) {
    return true;
  }

  return (
    (message.includes('media_assets') ||
      message.includes('media_upload_sessions')) &&
    message.includes('does not exist')
  );
}

function isPermissionDeniedError(error: unknown): boolean {
  const code = toErrorCode(error);
  if (code === '42501') return true;

  const message =
    `${toErrorMessage(error)} ${toErrorDetails(error)}`.toLowerCase();
  return message.includes('permission denied');
}

export function throwMappedDataAccessError(error: unknown): never {
  if (isMissingMediaSchemaError(error)) {
    throw new MediaDomainError('MEDIA_SCHEMA_NOT_READY');
  }

  if (isPermissionDeniedError(error)) {
    throw new MediaDomainError('FORBIDDEN_MEDIA_ACCESS');
  }

  const code = toErrorCode(error);
  const message = toErrorMessage(error).trim();
  if (message.length > 0) {
    throw new Error(code ? `${code}: ${message}` : message);
  }

  throw new Error('Media data access failed');
}

function normalizeRole(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'admin') return 'owner_admin';
  return normalized;
}

export function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function normalizeMimeType(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? 'application/octet-stream';
}

function sanitizeFileName(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
}

export function buildMediaUsage(input: {
  usedBytes: number;
  reservedBytes: number;
  limitBytes?: number;
}): MediaUsageDto {
  const limitBytes = Math.max(
    0,
    Math.floor(input.limitBytes ?? MEDIA_STORAGE_LIMIT_BYTES),
  );
  const usedBytes = Math.max(0, Math.floor(input.usedBytes));
  const reservedBytes = Math.max(0, Math.floor(input.reservedBytes));
  const occupied = usedBytes + reservedBytes;
  const remainingBytes = Math.max(0, limitBytes - occupied);
  const usageRatio = limitBytes > 0 ? Math.min(1, occupied / limitBytes) : 1;

  return {
    usedBytes,
    reservedBytes,
    limitBytes,
    remainingBytes,
    usageRatio,
    isFull: remainingBytes <= 0,
    warning: usageRatio >= MEDIA_WARNING_THRESHOLD_RATIO,
  };
}

export function mapMediaAssetRow(row: MediaAssetRow): MediaAssetDto {
  return {
    id: row.id,
    branchId: row.branch_id,
    bucket: row.bucket,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    mediaType: row.media_type === 'video' ? 'video' : 'image',
    mimeType: row.mime_type,
    sizeBytes: toNumber(row.size_bytes),
    originalFileName: row.original_file_name,
    createdAt: row.created_at,
  };
}

export function ensureMediaType(
  value: string | null | undefined,
): MediaAssetType {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (MEDIA_TYPE_SET.has(normalized as MediaAssetType)) {
    return normalized as MediaAssetType;
  }

  throw new MediaDomainError('INVALID_MEDIA_TYPE', {
    value,
  });
}

export function ensureBranchAccess(
  context: MediaActorContext,
  branchId: string,
): void {
  if (!branchId) {
    throw new MediaDomainError('MISSING_BRANCH_CONTEXT');
  }

  if (context.role === 'owner_admin') {
    return;
  }

  if (!context.allowedBranchIds.includes(branchId)) {
    throw new MediaDomainError('BRANCH_ACCESS_DENIED', {
      branchId,
    });
  }
}

export async function resolveActorContext(
  supabase: SupabaseClient,
  actorProfileId: string,
): Promise<MediaActorContext> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, default_branch_id, is_active')
    .eq('id', actorProfileId)
    .eq('is_delete', false)
    .maybeSingle<ProfileActorRow>();

  if (profileError) {
    throwMappedDataAccessError(profileError);
  }

  if (!profile || !profile.is_active) {
    throw new MediaDomainError('MISSING_PROFILE_CONTEXT');
  }

  const role = normalizeRole(profile.role);
  if (!role || !MEDIA_ALLOWED_ROLE_SET.has(role)) {
    throw new MediaDomainError('FORBIDDEN_MEDIA_ACCESS');
  }

  const { data: branchRows, error: branchError } = await supabase
    .from('profile_branch_access')
    .select('branch_id')
    .eq('profile_id', actorProfileId)
    .eq('is_delete', false)
    .returns<ProfileBranchAccessRow[]>();

  if (branchError) {
    throwMappedDataAccessError(branchError);
  }

  const allowedBranchIds = (branchRows ?? [])
    .map((entry) => entry.branch_id)
    .filter(
      (value): value is string =>
        typeof value === 'string' && value.trim().length > 0,
    );

  return {
    profile,
    role,
    allowedBranchIds,
  };
}

export async function resolveTargetBranchId(
  supabase: SupabaseClient,
  context: MediaActorContext,
  requestedBranchId: string | null | undefined,
): Promise<string> {
  const trimmedRequested = requestedBranchId?.trim() ?? '';

  if (trimmedRequested) {
    ensureBranchAccess(context, trimmedRequested);
    return trimmedRequested;
  }

  const defaultBranchId = context.profile.default_branch_id?.trim() ?? '';
  if (defaultBranchId) {
    ensureBranchAccess(context, defaultBranchId);
    return defaultBranchId;
  }

  if (context.allowedBranchIds.length > 0) {
    return context.allowedBranchIds[0];
  }

  if (context.role === 'owner_admin') {
    const { data, error } = await supabase
      .from('branches')
      .select('id')
      .eq('is_delete', false)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .returns<Array<{ id: string }>>();

    if (error) {
      throwMappedDataAccessError(error);
    }

    const branchId = data?.[0]?.id ?? null;
    if (branchId) return branchId;
  }

  throw new MediaDomainError('MISSING_BRANCH_CONTEXT');
}

async function expirePendingUploadSessions(
  supabase: SupabaseClient,
  branchId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('media_upload_sessions')
    .update({ status: 'EXPIRED' })
    .eq('branch_id', branchId)
    .eq('is_delete', false)
    .eq('status', 'PENDING')
    .lt('expires_at', now);

  if (error && !isMissingMediaSchemaError(error)) {
    throwMappedDataAccessError(error);
  }
}

export async function resolveBranchMediaUsage(
  supabase: SupabaseClient,
  branchId: string,
): Promise<MediaUsageDto> {
  await expirePendingUploadSessions(supabase, branchId);

  const [usedResult, reservedResult] = await Promise.all([
    supabase
      .from('media_assets')
      .select('size_bytes')
      .eq('branch_id', branchId)
      .eq('is_delete', false)
      .is('deleted_at', null)
      .returns<Array<Pick<MediaAssetRow, 'size_bytes'>>>(),
    supabase
      .from('media_upload_sessions')
      .select('size_bytes')
      .eq('branch_id', branchId)
      .eq('is_delete', false)
      .eq('status', 'PENDING')
      .gt('expires_at', new Date().toISOString())
      .returns<Array<Pick<MediaUploadSessionRow, 'size_bytes'>>>(),
  ]);

  if (usedResult.error || reservedResult.error) {
    const error = usedResult.error ?? reservedResult.error;
    throwMappedDataAccessError(error);
  }

  const usedBytes = (usedResult.data ?? []).reduce(
    (sum, row) => sum + toNumber(row.size_bytes),
    0,
  );
  const reservedBytes = (reservedResult.data ?? []).reduce(
    (sum, row) => sum + toNumber(row.size_bytes),
    0,
  );

  return buildMediaUsage({
    usedBytes,
    reservedBytes,
    limitBytes: MEDIA_STORAGE_LIMIT_BYTES,
  });
}

export function buildStoragePath(options: {
  branchId: string;
  mediaType: MediaAssetType;
  originalFileName: string;
}): string {
  const timestamp = Date.now();
  const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const safeName = sanitizeFileName(
    options.originalFileName || `${options.mediaType}-asset`,
  );
  return `media/${options.branchId}/${options.mediaType}/${datePrefix}/${timestamp}-${crypto.randomUUID()}-${safeName}`;
}
