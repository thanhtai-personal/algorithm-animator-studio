import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceRoleClient } from '../../../../common/supabase/service-role-client.util';
import type { DeleteMediaResponse } from '../../types/media-library.type';
import {
  ensureBranchAccess,
  type MediaAssetRow,
  MediaDomainError,
  resolveActorContext,
  resolveBranchMediaUsage,
  throwMappedDataAccessError,
} from './shared';

export async function deleteMediaAssetForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    mediaAssetId: string;
  },
): Promise<DeleteMediaResponse> {
  const context = await resolveActorContext(supabase, options.actorProfileId);
  const mediaAssetId = options.mediaAssetId.trim();

  if (!mediaAssetId) {
    throw new MediaDomainError('MEDIA_NOT_FOUND');
  }

  const { data: asset, error: assetError } = await supabase
    .from('media_assets')
    .select(
      'id, branch_id, bucket, storage_path, public_url, media_type, mime_type, size_bytes, original_file_name, created_at, deleted_at',
    )
    .eq('id', mediaAssetId)
    .eq('is_delete', false)
    .is('deleted_at', null)
    .maybeSingle<MediaAssetRow>();

  if (assetError) {
    throwMappedDataAccessError(assetError);
  }

  if (!asset) {
    throw new MediaDomainError('MEDIA_NOT_FOUND');
  }

  ensureBranchAccess(context, asset.branch_id);

  let storageClient: SupabaseClient = supabase;
  try {
    storageClient = createServiceRoleClient();
  } catch {
    // Fallback to user client in environments without service role key.
    storageClient = supabase;
  }

  const { error: storageDeleteError } = await storageClient.storage
    .from(asset.bucket)
    .remove([asset.storage_path]);

  if (storageDeleteError) {
    throw new MediaDomainError('MEDIA_DELETE_FAILED', {
      message: storageDeleteError.message,
      storagePath: asset.storage_path,
    });
  }

  const { error: softDeleteError } = await supabase
    .from('media_assets')
    .update({
      deleted_at: new Date().toISOString(),
      is_delete: true,
    })
    .eq('id', asset.id)
    .eq('is_delete', false)
    .is('deleted_at', null);

  if (softDeleteError) {
    throwMappedDataAccessError(softDeleteError);
  }

  const usage = await resolveBranchMediaUsage(supabase, asset.branch_id);

  return {
    success: true,
    usage,
  };
}
