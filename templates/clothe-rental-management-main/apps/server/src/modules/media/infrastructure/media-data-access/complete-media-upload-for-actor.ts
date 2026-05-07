import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CompleteMediaUploadPayload,
  CompleteMediaUploadResponse,
} from '../../types/media-library.type';
import {
  ensureBranchAccess,
  isMissingMediaSchemaError,
  mapMediaAssetRow,
  MEDIA_UPLOAD_SESSION_STATUS_SET,
  type MediaAssetRow,
  type MediaUploadSessionRow,
  MediaDomainError,
  normalizeMimeType,
  resolveActorContext,
  resolveBranchMediaUsage,
  throwMappedDataAccessError,
  toNumber,
} from './shared';

export async function completeMediaUploadForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: CompleteMediaUploadPayload;
  },
): Promise<CompleteMediaUploadResponse> {
  const context = await resolveActorContext(supabase, options.actorProfileId);
  const uploadSessionId = options.payload.uploadSessionId?.trim() ?? '';

  if (!uploadSessionId) {
    throw new MediaDomainError('MEDIA_UPLOAD_SESSION_NOT_FOUND');
  }

  const { data: session, error: sessionError } = await supabase
    .from('media_upload_sessions')
    .select(
      'id, branch_id, bucket, storage_path, file_name, mime_type, size_bytes, media_type, status, expires_at, created_by_profile_id, created_at',
    )
    .eq('id', uploadSessionId)
    .eq('is_delete', false)
    .maybeSingle<MediaUploadSessionRow>();

  if (sessionError) {
    throwMappedDataAccessError(sessionError);
  }

  if (!session) {
    throw new MediaDomainError('MEDIA_UPLOAD_SESSION_NOT_FOUND');
  }

  ensureBranchAccess(context, session.branch_id);

  const status = session.status.trim().toUpperCase();
  if (!MEDIA_UPLOAD_SESSION_STATUS_SET.has(status)) {
    throw new MediaDomainError('MEDIA_UPLOAD_SESSION_INVALID_STATE', {
      status: session.status,
    });
  }

  if (status !== 'PENDING') {
    const { data: existingAsset } = await supabase
      .from('media_assets')
      .select(
        'id, branch_id, bucket, storage_path, public_url, media_type, mime_type, size_bytes, original_file_name, created_at, deleted_at',
      )
      .eq('branch_id', session.branch_id)
      .eq('is_delete', false)
      .eq('bucket', session.bucket)
      .eq('storage_path', session.storage_path)
      .is('deleted_at', null)
      .maybeSingle<MediaAssetRow>();

    if (existingAsset) {
      return {
        asset: mapMediaAssetRow(existingAsset),
        usage: await resolveBranchMediaUsage(supabase, session.branch_id),
      };
    }

    throw new MediaDomainError('MEDIA_UPLOAD_SESSION_INVALID_STATE', {
      status,
    });
  }

  const expiresAt = new Date(session.expires_at).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    const { error: updateError } = await supabase
      .from('media_upload_sessions')
      .update({ status: 'EXPIRED' })
      .eq('id', session.id)
      .eq('is_delete', false)
      .eq('status', 'PENDING');

    if (updateError && !isMissingMediaSchemaError(updateError)) {
      throwMappedDataAccessError(updateError);
    }

    throw new MediaDomainError('MEDIA_UPLOAD_SESSION_EXPIRED', {
      uploadSessionId: session.id,
    });
  }

  const { data: existingAsset, error: existingAssetError } = await supabase
    .from('media_assets')
    .select(
      'id, branch_id, bucket, storage_path, public_url, media_type, mime_type, size_bytes, original_file_name, created_at, deleted_at',
    )
    .eq('branch_id', session.branch_id)
    .eq('is_delete', false)
    .eq('bucket', session.bucket)
    .eq('storage_path', session.storage_path)
    .is('deleted_at', null)
    .maybeSingle<MediaAssetRow>();

  if (existingAssetError) {
    throwMappedDataAccessError(existingAssetError);
  }

  if (existingAsset) {
    await supabase
      .from('media_upload_sessions')
      .update({ status: 'COMPLETED' })
      .eq('id', session.id)
      .eq('is_delete', false)
      .eq('status', 'PENDING');

    return {
      asset: mapMediaAssetRow(existingAsset),
      usage: await resolveBranchMediaUsage(supabase, session.branch_id),
    };
  }

  const { data: publicUrlData } = supabase.storage
    .from(session.bucket)
    .getPublicUrl(session.storage_path);

  const publicUrl = publicUrlData.publicUrl ?? '';

  const { data: inserted, error: insertError } = await supabase
    .from('media_assets')
    .insert({
      branch_id: session.branch_id,
      bucket: session.bucket,
      storage_path: session.storage_path,
      public_url: publicUrl,
      media_type: session.media_type,
      mime_type: normalizeMimeType(session.mime_type),
      size_bytes: toNumber(session.size_bytes),
      original_file_name: session.file_name,
      uploaded_by_profile_id: context.profile.id,
      is_delete: false,
    })
    .select(
      'id, branch_id, bucket, storage_path, public_url, media_type, mime_type, size_bytes, original_file_name, created_at, deleted_at',
    )
    .single<MediaAssetRow>();

  if (insertError || !inserted) {
    throwMappedDataAccessError(insertError);
  }

  const { error: updateError } = await supabase
    .from('media_upload_sessions')
    .update({ status: 'COMPLETED' })
    .eq('id', session.id)
    .eq('is_delete', false)
    .eq('status', 'PENDING');

  if (updateError && !isMissingMediaSchemaError(updateError)) {
    throwMappedDataAccessError(updateError);
  }

  return {
    asset: mapMediaAssetRow(inserted),
    usage: await resolveBranchMediaUsage(supabase, session.branch_id),
  };
}
