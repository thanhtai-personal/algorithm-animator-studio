import {
  fetchMakeupModuleEnabled,
  MakeupDomainError,
  resolvePublicMakeupBranchId,
} from './shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MakeupArtistDto } from '../../types/makeup-module.type';

export async function listPublicMakeupArtists(
  supabase: SupabaseClient,
  options: {
    branchId?: string | null;
  },
): Promise<{ branchId: string; items: MakeupArtistDto[] }> {
  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError('MODULE_DISABLED');
  }

  const branchId = await resolvePublicMakeupBranchId(
    supabase,
    options.branchId,
  );
  if (!branchId) {
    throw new MakeupDomainError('MISSING_BRANCH_CONTEXT', {
      reason: 'missing-default-public-branch',
    });
  }

  const { data: accessRows, error: accessError } = await supabase
    .from('profile_branch_access')
    .select('profile_id, branch_id')
    .eq('branch_id', branchId)
    .eq('is_delete', false)
    .returns<Array<{ profile_id: string; branch_id: string }>>();

  if (accessError) throw accessError;

  const profileIds = Array.from(
    new Set((accessRows ?? []).map((row) => row.profile_id)),
  );
  if (profileIds.length === 0) {
    return { branchId, items: [] };
  }

  const { data: profileRows, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, is_active, default_branch_id')
    .in('id', profileIds)
    .eq('role', 'makeup_artist')
    .eq('is_delete', false)
    .eq('is_active', true)
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

  const items = (profileRows ?? [])
    .map((row) => ({
      profileId: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      isActive: row.is_active,
      defaultBranchId: row.default_branch_id,
      branchIds: branchIdsByProfile.get(row.id) ?? [],
    }))
    .sort((left, right) => {
      const leftLabel =
        left.fullName?.trim().toLowerCase() ?? left.profileId.toLowerCase();
      const rightLabel =
        right.fullName?.trim().toLowerCase() ?? right.profileId.toLowerCase();
      return leftLabel.localeCompare(rightLabel);
    });

  return {
    branchId,
    items,
  };
}
