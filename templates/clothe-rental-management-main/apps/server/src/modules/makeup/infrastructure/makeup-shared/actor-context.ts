import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_BRANCH_TIMEZONE,
  MakeupDomainError,
  normalizeRole,
  OPERATOR_ROLE_SET,
  sanitizeText,
  type ActorContext,
  type ProfileActorRow,
} from './core';
import { isMissingColumnOrTableError } from './core';

interface ProfileBranchAccessRow {
  branch_id: string;
}

interface BranchRow {
  id: string;
  timezone: string | null;
}

async function fetchActorProfile(
  supabase: SupabaseClient,
  profileId: string,
): Promise<ProfileActorRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, default_branch_id, is_active')
    .eq('id', profileId)
    .eq('is_delete', false)
    .maybeSingle<ProfileActorRow>();

  if (error) throw error;
  if (!data?.is_active) return null;
  return data;
}

async function fetchActorBranchAccessIds(
  supabase: SupabaseClient,
  actorProfileId: string,
  defaultBranchId: string | null,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('profile_branch_access')
    .select('branch_id')
    .eq('profile_id', actorProfileId)
    .eq('is_delete', false)
    .returns<ProfileBranchAccessRow[]>();

  if (error) throw error;

  const allowed = new Set((data ?? []).map((entry) => entry.branch_id));
  if (defaultBranchId) {
    allowed.add(defaultBranchId);
  }

  return Array.from(allowed);
}

function resolveBranchScope(options: {
  actor: ProfileActorRow;
  allowedBranchIds: string[];
  requestedBranchId: string | null;
}): string {
  const role = normalizeRole(options.actor.role);
  const requestedBranchId = options.requestedBranchId;
  const restrictedToDefaultRoles = new Set([
    'staff',
    'accountant',
    'makeup_artist',
    'customer',
  ]);

  if (role && restrictedToDefaultRoles.has(role)) {
    const branchId =
      options.actor.default_branch_id ?? options.allowedBranchIds[0] ?? null;
    if (!branchId) {
      throw new MakeupDomainError('MISSING_BRANCH_CONTEXT', {
        role,
        reason: 'missing-default-branch',
      });
    }

    if (requestedBranchId && requestedBranchId !== branchId) {
      throw new MakeupDomainError('FORBIDDEN_BRANCH_SCOPE', {
        role,
        requestedBranchId,
      });
    }

    return branchId;
  }

  if (requestedBranchId) {
    if (!options.allowedBranchIds.includes(requestedBranchId)) {
      throw new MakeupDomainError('FORBIDDEN_BRANCH_SCOPE', {
        requestedBranchId,
        role,
      });
    }

    return requestedBranchId;
  }

  const fallback =
    options.actor.default_branch_id ?? options.allowedBranchIds[0] ?? null;
  if (!fallback) {
    throw new MakeupDomainError('MISSING_BRANCH_CONTEXT', {
      role,
      reason: 'missing-branch',
    });
  }

  return fallback;
}

async function fetchBranchById(
  supabase: SupabaseClient,
  branchId: string,
): Promise<BranchRow | null> {
  const { data, error } = await supabase
    .from('branches')
    .select('id, timezone')
    .eq('id', branchId)
    .eq('is_delete', false)
    .maybeSingle<BranchRow>();

  if (error) throw error;
  return data ?? null;
}

export async function fetchMakeupModuleEnabled(
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('is_makeup_module_enabled')
    .eq('is_delete', false)
    .limit(1)
    .maybeSingle<{ is_makeup_module_enabled: boolean | null }>();

  if (error) {
    if (isMissingColumnOrTableError(error)) return false;
    throw error;
  }

  return Boolean(data?.is_makeup_module_enabled);
}

export async function resolveActorContext(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    requestedBranchId: string | null;
  },
): Promise<ActorContext> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new MakeupDomainError('FORBIDDEN_ROLE', {
      reason: 'missing-actor-profile',
    });
  }

  const role = normalizeRole(actor.role);
  if (!role || !OPERATOR_ROLE_SET.has(role)) {
    throw new MakeupDomainError('FORBIDDEN_ROLE', {
      role,
    });
  }

  const allowedBranchIds = await fetchActorBranchAccessIds(
    supabase,
    actor.id,
    actor.default_branch_id,
  );
  const branchId = resolveBranchScope({
    actor,
    allowedBranchIds,
    requestedBranchId: options.requestedBranchId,
  });

  const branch = await fetchBranchById(supabase, branchId);
  const timeZone = sanitizeText(branch?.timezone) ?? DEFAULT_BRANCH_TIMEZONE;

  return {
    actor,
    role,
    branchId,
    timeZone,
  };
}

export async function resolveCustomerByProfile(
  supabase: SupabaseClient,
  options: { branchId: string; profileId: string },
): Promise<string | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('id')
    .eq('branch_id', options.branchId)
    .eq('profile_id', options.profileId)
    .eq('is_delete', false)
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (error) throw error;
  return data?.id ?? null;
}

export async function ensureArtistExists(
  supabase: SupabaseClient,
  options:
    | string
    | {
        artistProfileId: string;
        branchId?: string | null;
      },
): Promise<void> {
  const artistProfileId =
    typeof options === 'string' ? options : options.artistProfileId;
  const branchId =
    typeof options === 'string' ? null : sanitizeText(options.branchId);

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, is_active, default_branch_id')
    .eq('id', artistProfileId)
    .eq('is_delete', false)
    .maybeSingle<{
      id: string;
      role: string | null;
      is_active: boolean;
      default_branch_id: string | null;
    }>();

  if (error) throw error;

  if (
    !data ||
    !data.is_active ||
    normalizeRole(data.role) !== 'makeup_artist'
  ) {
    throw new MakeupDomainError('ARTIST_NOT_FOUND', {
      artistProfileId,
    });
  }

  if (!branchId) return;
  if (data.default_branch_id === branchId) return;

  const { data: accessRow, error: accessError } = await supabase
    .from('profile_branch_access')
    .select('branch_id')
    .eq('profile_id', artistProfileId)
    .eq('branch_id', branchId)
    .eq('is_delete', false)
    .maybeSingle<{ branch_id: string }>();

  if (accessError) throw accessError;
  if (!accessRow) {
    throw new MakeupDomainError('FORBIDDEN_BRANCH_SCOPE', {
      artistProfileId,
      branchId,
      reason: 'artist-out-of-branch-scope',
    });
  }
}

export async function ensureCustomerExists(
  supabase: SupabaseClient,
  options: { customerId: string; branchId: string },
): Promise<void> {
  const { data, error } = await supabase
    .from('customers')
    .select('id')
    .eq('id', options.customerId)
    .eq('branch_id', options.branchId)
    .eq('is_delete', false)
    .maybeSingle<{ id: string }>();

  if (error) throw error;
  if (!data) {
    throw new MakeupDomainError('CUSTOMER_NOT_FOUND', {
      customerId: options.customerId,
    });
  }
}
