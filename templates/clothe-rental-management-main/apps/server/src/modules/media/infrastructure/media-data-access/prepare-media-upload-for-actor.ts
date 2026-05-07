import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PrepareMediaUploadPayload,
  PrepareMediaUploadResponse,
} from '../../types/media-library.type';
import {
  buildMediaUsage,
  buildStoragePath,
  ensureMediaType,
  MEDIA_STORAGE_BUCKET,
  MEDIA_UPLOAD_SESSION_TTL_MINUTES,
  type MediaUploadSessionRow,
  MediaDomainError,
  normalizeMimeType,
  resolveActorContext,
  resolveBranchMediaUsage,
  resolveTargetBranchId,
  throwMappedDataAccessError,
} from './shared';

export async function prepareMediaUploadForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: PrepareMediaUploadPayload;
  },
): Promise<PrepareMediaUploadResponse> {
  const context = await resolveActorContext(supabase, options.actorProfileId);
  const mediaType = ensureMediaType(options.payload.mediaType);
  const branchId = await resolveTargetBranchId(
    supabase,
    context,
    options.payload.branchId ?? null,
  );

  const fileName = options.payload.fileName?.trim() ?? '';
  const sizeBytes = Math.floor(options.payload.sizeBytes ?? 0);

  if (!fileName) {
    throw new MediaDomainError('INVALID_FILE_SIZE', {
      reason: 'fileName_required',
    });
  }

  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw new MediaDomainError('INVALID_FILE_SIZE', {
      sizeBytes: options.payload.sizeBytes,
    });
  }

  const usage = await resolveBranchMediaUsage(supabase, branchId);
  if (usage.usedBytes + usage.reservedBytes + sizeBytes > usage.limitBytes) {
    throw new MediaDomainError('MEDIA_STORAGE_LIMIT_EXCEEDED', {
      limitBytes: usage.limitBytes,
      usedBytes: usage.usedBytes,
      reservedBytes: usage.reservedBytes,
      fileSizeBytes: sizeBytes,
    });
  }

  const storagePath = buildStoragePath({
    branchId,
    mediaType,
    originalFileName: fileName,
  });

  const expiresAt = new Date(
    Date.now() + MEDIA_UPLOAD_SESSION_TTL_MINUTES * 60_000,
  ).toISOString();

  const { data: inserted, error } = await supabase
    .from('media_upload_sessions')
    .insert({
      branch_id: branchId,
      bucket: MEDIA_STORAGE_BUCKET,
      storage_path: storagePath,
      file_name: fileName,
      mime_type: normalizeMimeType(options.payload.mimeType),
      size_bytes: sizeBytes,
      media_type: mediaType,
      status: 'PENDING',
      expires_at: expiresAt,
      created_by_profile_id: context.profile.id,
      is_delete: false,
    })
    .select('id, branch_id, bucket, storage_path, media_type')
    .single<
      Pick<
        MediaUploadSessionRow,
        'id' | 'branch_id' | 'bucket' | 'storage_path' | 'media_type'
      >
    >();

  if (error || !inserted) {
    throwMappedDataAccessError(error);
  }

  return {
    uploadSessionId: inserted.id,
    branchId: inserted.branch_id,
    bucket: inserted.bucket,
    storagePath: inserted.storage_path,
    mediaType: inserted.media_type === 'video' ? 'video' : 'image',
    usage: buildMediaUsage({
      usedBytes: usage.usedBytes,
      reservedBytes: usage.reservedBytes + sizeBytes,
      limitBytes: usage.limitBytes,
    }),
  };
}
