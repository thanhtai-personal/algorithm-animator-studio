import type { SupabaseClient } from '@supabase/supabase-js';
import {
  PROCUREMENT_ROLLBACK_ROLE_SET,
  PROCUREMENT_ROLE_SET,
} from './procurement.constants';
import { ProcurementDomainError } from './procurement.domain-error';
import {
  sanitizeText,
  normalizeRole,
  buildReceiptDateCode,
} from './procurement.common';
import type {
  ProcurementActorContext,
  ProfileActorRow,
  ProfileBranchAccessRow,
  ProfileNameRow,
} from './procurement.internal-types';

export async function fetchActorProfile(
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

export async function fetchActorBranchAccessIds(
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

export function resolveSingleBranchScope(options: {
  actor: ProfileActorRow;
  role: string;
  allowedBranchIds: string[];
  requestedBranchId: string | null;
}): string {
  const requestedBranchId = options.requestedBranchId;

  if (options.role === 'staff') {
    const staffBranchId =
      options.actor.default_branch_id ?? options.allowedBranchIds[0] ?? null;
    if (!staffBranchId) {
      throw new ProcurementDomainError('MISSING_BRANCH_CONTEXT', {
        reason: 'staff-without-default-branch',
      });
    }

    if (requestedBranchId && requestedBranchId !== staffBranchId) {
      throw new ProcurementDomainError('FORBIDDEN_BRANCH_SCOPE', {
        requestedBranchId,
        role: options.role,
      });
    }

    return staffBranchId;
  }

  if (requestedBranchId) {
    if (!options.allowedBranchIds.includes(requestedBranchId)) {
      throw new ProcurementDomainError('FORBIDDEN_BRANCH_SCOPE', {
        requestedBranchId,
        role: options.role,
      });
    }

    return requestedBranchId;
  }

  const fallback =
    options.actor.default_branch_id ?? options.allowedBranchIds[0] ?? null;
  if (!fallback) {
    throw new ProcurementDomainError('MISSING_BRANCH_CONTEXT', {
      role: options.role,
    });
  }

  return fallback;
}

export async function resolveProcurementActorContext(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    requestedBranchId: string | null;
  },
): Promise<ProcurementActorContext> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new ProcurementDomainError('FORBIDDEN_PROCUREMENT_ACCESS', {
      reason: 'missing-profile',
    });
  }

  const role = normalizeRole(actor.role);
  if (!role || !PROCUREMENT_ROLE_SET.has(role)) {
    throw new ProcurementDomainError('FORBIDDEN_PROCUREMENT_ACCESS', {
      role,
    });
  }

  const allowedBranchIds = await fetchActorBranchAccessIds(
    supabase,
    actor.id,
    actor.default_branch_id,
  );

  const branchId = resolveSingleBranchScope({
    actor,
    role,
    allowedBranchIds,
    requestedBranchId: options.requestedBranchId,
  });

  return {
    actor,
    role,
    branchId,
  };
}

export function assertProcurementRollbackRole(role: string): void {
  if (PROCUREMENT_ROLLBACK_ROLE_SET.has(role)) return;

  throw new ProcurementDomainError('FORBIDDEN_PROCUREMENT_ROLLBACK', {
    role,
  });
}

export async function fetchProfileNamesByIds(
  supabase: SupabaseClient,
  profileIds: string[],
): Promise<Map<string, string | null>> {
  const normalizedIds = Array.from(new Set(profileIds.filter(Boolean)));
  if (normalizedIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', normalizedIds)
    .eq('is_delete', false)
    .returns<ProfileNameRow[]>();

  if (error) throw error;
  return new Map(
    (data ?? []).map((row) => [row.id, sanitizeText(row.full_name)]),
  );
}

export async function generateReceiptCode(
  supabase: SupabaseClient,
  branchId: string,
): Promise<string> {
  const now = new Date();
  const dateCode = buildReceiptDateCode(now);

  const fromIso = `${dateCode.slice(0, 4)}-${dateCode.slice(4, 6)}-${dateCode.slice(6, 8)}T00:00:00.000Z`;
  const toDate = new Date(fromIso);
  toDate.setUTCDate(toDate.getUTCDate() + 1);

  const { count, error } = await supabase
    .from('procurement_receipts')
    .select('id', { count: 'exact', head: true })
    .eq('branch_id', branchId)
    .eq('is_delete', false)
    .gte('created_at', fromIso)
    .lt('created_at', toDate.toISOString());

  if (error) throw error;

  const sequence = String((count ?? 0) + 1).padStart(4, '0');
  return `PN${dateCode}-${sequence}`;
}
