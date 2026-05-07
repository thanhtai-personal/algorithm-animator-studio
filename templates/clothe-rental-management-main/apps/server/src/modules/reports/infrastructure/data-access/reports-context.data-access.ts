import type { SupabaseClient } from '@supabase/supabase-js';
import {
  BranchRow,
  DEFAULT_BRANCH_TIMEZONE,
  DEFAULT_CURRENCY_CODE,
  ProfileActorRow,
  ProfileBranchAccessRow,
  ReportsContext,
  ReportsDomainError,
  ensureRoleSupported,
  isManagerPlusRole,
  isStaffRole,
  normalizeTimeZoneOrDefault,
  sanitizeText,
} from './reports-common.data-access.utils';

async function fetchActorProfile(
  supabase: SupabaseClient,
  profileId: string,
): Promise<ProfileActorRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, default_branch_id')
    .eq('id', profileId)
    .eq('is_delete', false)
    .eq('is_active', true)
    .maybeSingle<ProfileActorRow>();

  if (error) throw error;
  return data ?? null;
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
  const requestedBranchId = options.requestedBranchId;

  if (isStaffRole(options.actor.role)) {
    const staffBranchId =
      options.actor.default_branch_id ?? options.allowedBranchIds[0] ?? null;

    if (!staffBranchId) {
      throw new ReportsDomainError('MISSING_BRANCH_CONTEXT', {
        reason: 'staff-without-default-branch',
      });
    }

    if (requestedBranchId && requestedBranchId !== staffBranchId) {
      throw new ReportsDomainError('FORBIDDEN_BRANCH_SCOPE', {
        requestedBranchId,
        role: options.actor.role,
      });
    }

    return staffBranchId;
  }

  if (requestedBranchId) {
    if (!options.allowedBranchIds.includes(requestedBranchId)) {
      throw new ReportsDomainError('FORBIDDEN_BRANCH_SCOPE', {
        requestedBranchId,
        role: options.actor.role,
      });
    }

    return requestedBranchId;
  }

  const fallback =
    options.actor.default_branch_id ?? options.allowedBranchIds[0] ?? null;
  if (!fallback) {
    throw new ReportsDomainError('MISSING_BRANCH_CONTEXT', {
      role: options.actor.role,
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
    .select('id, timezone, currency_code')
    .eq('id', branchId)
    .eq('is_delete', false)
    .maybeSingle<BranchRow>();

  if (error) throw error;
  return data ?? null;
}

export async function resolveReportsContext(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    requestedBranchId: string | null;
  },
): Promise<ReportsContext> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new ReportsDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  ensureRoleSupported(actor);

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
  const timezone = normalizeTimeZoneOrDefault(
    branch?.timezone,
    DEFAULT_BRANCH_TIMEZONE,
  );
  const currencyCode =
    sanitizeText(branch?.currency_code) ?? DEFAULT_CURRENCY_CODE;

  return {
    actor,
    branchId,
    timezone,
    currencyCode,
  };
}

export function ensureExportPermission(context: ReportsContext): void {
  if (!isManagerPlusRole(context.actor.role)) {
    throw new ReportsDomainError('FORBIDDEN_REPORT_EXPORT', {
      role: context.actor.role,
    });
  }
}
