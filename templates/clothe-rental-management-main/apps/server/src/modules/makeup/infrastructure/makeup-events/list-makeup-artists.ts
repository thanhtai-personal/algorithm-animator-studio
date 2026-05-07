import {
  fetchMakeupModuleEnabled,
  MANAGER_ROLE_SET,
  MakeupDomainError,
  resolveActorContext,
  sanitizeText,
} from './shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MakeupArtistDto } from '../../types/makeup-module.type';

export async function listMakeupArtists(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    branchId?: string | null;
  },
): Promise<{ branchId: string; items: MakeupArtistDto[] }> {
  const context = await resolveActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.branchId ?? null),
  });
  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError('MODULE_DISABLED');
  }

  if (!MANAGER_ROLE_SET.has(context.role ?? '')) {
    throw new MakeupDomainError('FORBIDDEN_ROLE', { role: context.role });
  }

  const { data: accessRows, error: accessError } = await supabase
    .from('profile_branch_access')
    .select('profile_id, branch_id')
    .eq('branch_id', context.branchId)
    .eq('is_delete', false)
    .returns<Array<{ profile_id: string; branch_id: string }>>();

  if (accessError) throw accessError;

  const profileIds = Array.from(
    new Set((accessRows ?? []).map((row) => row.profile_id)),
  );
  if (profileIds.length === 0) {
    return { branchId: context.branchId, items: [] };
  }

  const { data: profileRows, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, is_active, default_branch_id')
    .in('id', profileIds)
    .eq('role', 'makeup_artist')
    .eq('is_delete', false)
    .returns<
      Array<{
        id: string;
        full_name: string | null;
        email: string | null;
        phone: string | null;
        is_active: boolean;
        default_branch_id: string | null;
      }>
    >();

  if (profileError) throw profileError;

  const branchIdsByProfile = new Map<string, string[]>();
  for (const row of accessRows ?? []) {
    const bucket = branchIdsByProfile.get(row.profile_id);
    if (bucket) {
      bucket.push(row.branch_id);
    } else {
      branchIdsByProfile.set(row.profile_id, [row.branch_id]);
    }
  }

  return {
    branchId: context.branchId,
    items: (profileRows ?? []).map((row) => ({
      profileId: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      isActive: row.is_active,
      defaultBranchId: row.default_branch_id,
      branchIds: branchIdsByProfile.get(row.id) ?? [],
    })),
  };
}
