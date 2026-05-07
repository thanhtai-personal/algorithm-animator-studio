import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  MediaListQuery,
  MediaListResponse,
} from '../../types/media-library.type';
import {
  ensureMediaType,
  mapMediaAssetRow,
  type MediaAssetRow,
  resolveActorContext,
  resolveBranchMediaUsage,
  resolveTargetBranchId,
  throwMappedDataAccessError,
} from './shared';

export async function listMediaAssetsForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: MediaListQuery;
  },
): Promise<MediaListResponse> {
  const context = await resolveActorContext(supabase, options.actorProfileId);
  const branchId = await resolveTargetBranchId(
    supabase,
    context,
    options.query.branchId ?? null,
  );

  const page = Math.max(1, Math.floor(options.query.page ?? 1));
  const pageSize = Math.min(
    60,
    Math.max(1, Math.floor(options.query.pageSize ?? 24)),
  );
  const mediaType = options.query.mediaType ?? null;
  const search = options.query.search?.trim() ?? '';

  if (mediaType) {
    ensureMediaType(mediaType);
  }

  let queryBuilder = supabase
    .from('media_assets')
    .select(
      'id, branch_id, bucket, storage_path, public_url, media_type, mime_type, size_bytes, original_file_name, created_at, deleted_at',
      { count: 'exact' },
    )
    .eq('branch_id', branchId)
    .eq('is_delete', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (mediaType) {
    queryBuilder = queryBuilder.eq('media_type', mediaType);
  }

  if (search) {
    const escaped = search
      .replace(/,/g, ' ')
      .replace(/%/g, '')
      .replace(/_/g, '');
    queryBuilder = queryBuilder.or(
      `original_file_name.ilike.%${escaped}%,storage_path.ilike.%${escaped}%`,
    );
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await queryBuilder
    .range(from, to)
    .returns<MediaAssetRow[]>();

  if (error) {
    throwMappedDataAccessError(error);
  }

  const usage = await resolveBranchMediaUsage(supabase, branchId);

  return {
    branchId,
    items: (data ?? []).map(mapMediaAssetRow),
    total: count ?? 0,
    page,
    pageSize,
    usage,
  };
}
