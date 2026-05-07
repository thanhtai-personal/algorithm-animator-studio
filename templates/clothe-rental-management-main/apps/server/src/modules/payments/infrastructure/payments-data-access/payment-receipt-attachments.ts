import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PaymentAttachmentDto,
  PaymentAttachmentListResponse,
  PreparePaymentReceiptUploadPayload,
  PreparePaymentReceiptUploadResponse,
} from '../../types/payments-domain.type';
import {
  fetchActorBranchAccessIds,
  fetchActorProfile,
  PaymentsDomainError,
  resolveBranchScope,
  sanitizeText,
} from './shared-core';

const RECEIPT_BUCKET = process.env.PAYMENT_RECEIPT_BUCKET ?? 'payment-receipts';
const RECEIPT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const RECEIPT_MAX_FILES_PER_PAYMENT = 3;
const RECEIPT_UPLOAD_TTL_MINUTES = 15;
const RECEIPT_SIGNED_URL_TTL_SECONDS = 10 * 60;
const RECEIPT_ALLOWED_MIME_TYPE_SET = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

interface PaymentReceiptUploadSessionRow {
  id: string;
  branch_id: string;
  bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number | string;
  status: string;
  expires_at: string;
  created_by_profile_id: string | null;
}

interface PaymentAttachmentRow {
  id: string;
  payment_id: string;
  branch_id: string;
  bucket: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number | string;
  original_file_name: string | null;
  created_at: string;
}

interface PaymentBranchRow {
  id: string;
  branch_id: string;
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function sanitizeFileName(value: string): string {
  const sanitized = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
  return sanitized || 'receipt';
}

function normalizeReceiptMimeType(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

function assertValidReceiptFile(payload: {
  mimeType: string;
  sizeBytes: number;
}): void {
  if (!RECEIPT_ALLOWED_MIME_TYPE_SET.has(payload.mimeType)) {
    throw new PaymentsDomainError('INVALID_RECEIPT_UPLOAD', {
      reason: 'unsupported-mime-type',
      mimeType: payload.mimeType,
    });
  }

  if (
    !Number.isFinite(payload.sizeBytes) ||
    payload.sizeBytes <= 0 ||
    payload.sizeBytes > RECEIPT_MAX_FILE_SIZE_BYTES
  ) {
    throw new PaymentsDomainError('INVALID_RECEIPT_UPLOAD', {
      reason: 'invalid-size',
      maxBytes: RECEIPT_MAX_FILE_SIZE_BYTES,
    });
  }
}

function isMissingAttachmentSchemaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const rawCode = 'code' in error ? error.code : null;
  const code = typeof rawCode === 'string' ? rawCode.toUpperCase() : '';
  if (code === '42P01' || code === 'PGRST205') return true;
  const rawMessage = 'message' in error ? error.message : null;
  const message =
    typeof rawMessage === 'string' ? rawMessage.toLowerCase() : '';
  return (
    message.includes('payment_attachments') ||
    message.includes('payment_receipt_upload_sessions')
  );
}

function throwMappedReceiptError(error: unknown): never {
  if (isMissingAttachmentSchemaError(error)) {
    throw new PaymentsDomainError('PAYMENT_ATTACHMENT_SCHEMA_NOT_READY');
  }
  throw error;
}

function resolveSingleBranchId(options: {
  branchScope: string[];
  requestedBranchId: string | null;
  actorDefaultBranchId: string | null;
}): string {
  if (options.requestedBranchId) return options.requestedBranchId;
  if (
    options.actorDefaultBranchId &&
    options.branchScope.includes(options.actorDefaultBranchId)
  ) {
    return options.actorDefaultBranchId;
  }
  const fallbackBranchId = options.branchScope[0] ?? null;
  if (!fallbackBranchId) {
    throw new PaymentsDomainError('MISSING_BRANCH_CONTEXT');
  }
  return fallbackBranchId;
}

async function resolveActorBranchContext(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    requestedBranchId: string | null;
  },
): Promise<{ branchId: string; branchScope: string[] }> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new PaymentsDomainError('FORBIDDEN_PAYMENT_CREATE', {
      reason: 'missing-actor-profile',
    });
  }

  const allowedBranchIds = await fetchActorBranchAccessIds(
    supabase,
    actor.id,
    actor.default_branch_id,
  );
  const branchScope = resolveBranchScope({
    actor,
    allowedBranchIds,
    requestedBranchId: options.requestedBranchId,
  });
  const branchId = resolveSingleBranchId({
    branchScope,
    requestedBranchId: options.requestedBranchId,
    actorDefaultBranchId: actor.default_branch_id,
  });

  return { branchId, branchScope };
}

export async function preparePaymentReceiptUploadForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: PreparePaymentReceiptUploadPayload;
  },
): Promise<PreparePaymentReceiptUploadResponse> {
  const fileName = sanitizeFileName(options.payload.fileName);
  const mimeType = normalizeReceiptMimeType(options.payload.mimeType);
  const sizeBytes = Math.floor(options.payload.sizeBytes);
  assertValidReceiptFile({ mimeType, sizeBytes });

  const requestedBranchId = sanitizeText(options.payload.branchId ?? null);
  const { branchId } = await resolveActorBranchContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId,
  });
  const expiresAt = new Date(
    Date.now() + RECEIPT_UPLOAD_TTL_MINUTES * 60 * 1000,
  ).toISOString();
  const storagePath = `${branchId}/${options.actorProfileId}/${Date.now()}-${randomUUID()}-${fileName}`;

  const { data, error } = await supabase
    .from('payment_receipt_upload_sessions')
    .insert({
      branch_id: branchId,
      bucket: RECEIPT_BUCKET,
      storage_path: storagePath,
      file_name: fileName,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      status: 'PENDING',
      expires_at: expiresAt,
      created_by_profile_id: options.actorProfileId,
    })
    .select('id, branch_id, bucket, storage_path, expires_at')
    .maybeSingle<{
      id: string;
      branch_id: string;
      bucket: string;
      storage_path: string;
      expires_at: string;
    }>();

  if (error) throwMappedReceiptError(error);
  if (!data) throw new PaymentsDomainError('INVALID_RECEIPT_UPLOAD');

  return {
    uploadSessionId: data.id,
    branchId: data.branch_id,
    bucket: data.bucket,
    storagePath: data.storage_path,
    expiresAt: data.expires_at,
  };
}

export async function attachPaymentReceiptUploadSessions(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    paymentId: string;
    branchId: string;
    uploadSessionIds: string[];
  },
): Promise<number> {
  const uniqueIds = Array.from(new Set(options.uploadSessionIds));
  if (uniqueIds.length === 0) return 0;

  const { count: existingCount, error: countError } = await supabase
    .from('payment_attachments')
    .select('id', { count: 'exact', head: true })
    .eq('payment_id', options.paymentId)
    .eq('branch_id', options.branchId)
    .is('deleted_at', null);

  if (countError) throwMappedReceiptError(countError);
  if ((existingCount ?? 0) + uniqueIds.length > RECEIPT_MAX_FILES_PER_PAYMENT) {
    throw new PaymentsDomainError('INVALID_RECEIPT_UPLOAD', {
      reason: 'too-many-files',
      maxFiles: RECEIPT_MAX_FILES_PER_PAYMENT,
    });
  }

  const { data, error } = await supabase
    .from('payment_receipt_upload_sessions')
    .select(
      'id, branch_id, bucket, storage_path, file_name, mime_type, size_bytes, status, expires_at, created_by_profile_id',
    )
    .in('id', uniqueIds)
    .eq('branch_id', options.branchId)
    .eq('created_by_profile_id', options.actorProfileId)
    .returns<PaymentReceiptUploadSessionRow[]>();

  if (error) throwMappedReceiptError(error);
  const sessions = data ?? [];
  if (sessions.length !== uniqueIds.length) {
    throw new PaymentsDomainError('RECEIPT_UPLOAD_SESSION_NOT_FOUND');
  }

  const now = Date.now();
  for (const session of sessions) {
    if (session.status !== 'PENDING') {
      throw new PaymentsDomainError('INVALID_RECEIPT_UPLOAD', {
        reason: 'invalid-session-state',
        uploadSessionId: session.id,
      });
    }
    if (new Date(session.expires_at).getTime() <= now) {
      throw new PaymentsDomainError('RECEIPT_UPLOAD_SESSION_EXPIRED', {
        uploadSessionId: session.id,
      });
    }
  }

  const { error: insertError } = await supabase
    .from('payment_attachments')
    .insert(
      sessions.map((session) => ({
        payment_id: options.paymentId,
        branch_id: options.branchId,
        bucket: session.bucket,
        storage_path: session.storage_path,
        mime_type: session.mime_type,
        size_bytes: toNumber(session.size_bytes),
        original_file_name: session.file_name,
        uploaded_by_profile_id: options.actorProfileId,
      })),
    );

  if (insertError) throwMappedReceiptError(insertError);

  const { error: updateError } = await supabase
    .from('payment_receipt_upload_sessions')
    .update({ status: 'COMPLETED' })
    .in(
      'id',
      sessions.map((session) => session.id),
    );

  if (updateError) throwMappedReceiptError(updateError);
  return sessions.length;
}

export async function fetchPaymentAttachmentCountByPaymentId(
  supabase: SupabaseClient,
  paymentIds: string[],
): Promise<Map<string, number>> {
  if (paymentIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('payment_attachments')
    .select('payment_id')
    .in('payment_id', paymentIds)
    .is('deleted_at', null)
    .returns<Array<{ payment_id: string }>>();

  if (error) {
    if (isMissingAttachmentSchemaError(error)) return new Map();
    throw error;
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.payment_id, (counts.get(row.payment_id) ?? 0) + 1);
  }
  return counts;
}

export async function listPaymentAttachmentsForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    paymentId: string;
  },
): Promise<PaymentAttachmentListResponse> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new PaymentsDomainError('FORBIDDEN_PAYMENT_UPDATE', {
      reason: 'missing-actor-profile',
    });
  }
  const allowedBranchIds = await fetchActorBranchAccessIds(
    supabase,
    actor.id,
    actor.default_branch_id,
  );

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, branch_id')
    .eq('id', options.paymentId)
    .eq('is_delete', false)
    .maybeSingle<PaymentBranchRow>();

  if (paymentError) throw paymentError;
  if (!payment) throw new PaymentsDomainError('PAYMENT_NOT_FOUND');

  const branchScope = resolveBranchScope({
    actor,
    allowedBranchIds,
    requestedBranchId: payment.branch_id,
  });
  if (!branchScope.includes(payment.branch_id)) {
    throw new PaymentsDomainError('FORBIDDEN_BRANCH_SCOPE');
  }

  const { data, error } = await supabase
    .from('payment_attachments')
    .select(
      'id, payment_id, branch_id, bucket, storage_path, mime_type, size_bytes, original_file_name, created_at',
    )
    .eq('payment_id', options.paymentId)
    .eq('branch_id', payment.branch_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .returns<PaymentAttachmentRow[]>();

  if (error) throwMappedReceiptError(error);

  const attachments: PaymentAttachmentDto[] = await Promise.all(
    (data ?? []).map(async (row) => {
      const { data: signed, error: signError } = await supabase.storage
        .from(row.bucket)
        .createSignedUrl(row.storage_path, RECEIPT_SIGNED_URL_TTL_SECONDS);
      if (signError) throw signError;

      return {
        id: row.id,
        paymentId: row.payment_id,
        branchId: row.branch_id,
        mimeType: row.mime_type,
        sizeBytes: toNumber(row.size_bytes),
        originalFileName: row.original_file_name,
        signedUrl: signed.signedUrl,
        expiresInSeconds: RECEIPT_SIGNED_URL_TTL_SECONDS,
        createdAt: row.created_at,
      };
    }),
  );

  return {
    paymentId: options.paymentId,
    attachments,
  };
}
