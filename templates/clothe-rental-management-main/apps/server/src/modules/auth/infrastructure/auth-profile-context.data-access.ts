import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import type {
  ApiAuthUserProfilePayload,
  ApiProfileBranchAccessRow,
  ApiProfileBranchAccessSourceRow,
  ApiProfileRow,
  AuthAdminUserForProfileSync,
} from '../types/auth-data-access.type';
import { AuthAdminUserForProfileSyncToProfileUpsertMapper } from '../mappers/AuthAdminUserForProfileSyncToProfileUpsert.mapper';
import { ApiProfileBranchAccessSourceRowToApiProfileBranchAccessRowMapper } from '../mappers/ApiProfileBranchAccessSourceRowToApiProfileBranchAccessRow.mapper';
import { ApiProfileRowToApiAuthUserProfilePayloadMapper } from '../mappers/ApiProfileRowToApiAuthUserProfilePayload.mapper';
import {
  appendWarning,
  toMetadataRecord,
} from '../utils/auth-data-access.utils';

const authUserToProfileUpsertMapper =
  new AuthAdminUserForProfileSyncToProfileUpsertMapper();
const profileRowToPayloadMapper =
  new ApiProfileRowToApiAuthUserProfilePayloadMapper();
const branchAccessRowMapper =
  new ApiProfileBranchAccessSourceRowToApiProfileBranchAccessRowMapper();

type BranchIdentityRow = {
  id: string;
  name: string | null;
  code: string | null;
  shop_domain: string | null;
};

type LegacyBranchIdentityRow = Omit<BranchIdentityRow, 'shop_domain'>;

function sanitizeBranchId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isOwnerAdminRole(value: string | null | undefined): boolean {
  if (typeof value !== 'string') return false;
  return value.trim().toLowerCase() === 'owner_admin';
}

function sanitizeText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeBranchDomain(
  value: string | null | undefined,
): string | null {
  const text = sanitizeText(value);
  if (!text) return null;

  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized.length > 0 ? normalized : null;
}

function resolveEffectiveBranchDomain(row: BranchIdentityRow): string {
  return (
    normalizeBranchDomain(row.shop_domain) ??
    normalizeBranchDomain(row.name) ??
    normalizeBranchDomain(row.code) ??
    row.id
  );
}

function toBranchIdentityRowLegacy(
  row: LegacyBranchIdentityRow,
): BranchIdentityRow {
  return {
    ...row,
    shop_domain: null,
  };
}

function isMissingBranchShopDomainColumnError(
  code: string | null | undefined,
): boolean {
  return (code ?? '').toUpperCase() === '42703';
}

function toPostgrestError(value: unknown): PostgrestError | null {
  if (!value || typeof value !== 'object') return null;

  const source = value as Record<string, unknown>;
  const code = typeof source.code === 'string' ? source.code : null;
  const message = typeof source.message === 'string' ? source.message : null;
  const details = typeof source.details === 'string' ? source.details : '';
  const hint = typeof source.hint === 'string' ? source.hint : '';
  if (!code || !message) return null;

  return {
    name: 'PostgrestError',
    code,
    message,
    details,
    hint,
  };
}

async function fetchBranchIdentityRows(options: {
  supabase: SupabaseClient;
  branchIds?: string[];
  orderByCode?: boolean;
}): Promise<BranchIdentityRow[]> {
  const { supabase, branchIds, orderByCode } = options;

  let withShopDomainQuery = supabase
    .from('branches')
    .select('id, name, code, shop_domain')
    .eq('is_delete', false);
  if (branchIds && branchIds.length > 0) {
    withShopDomainQuery = withShopDomainQuery.in('id', branchIds);
  }
  if (orderByCode) {
    withShopDomainQuery = withShopDomainQuery.order('code', {
      ascending: true,
    });
  }

  const withShopDomainResult =
    await withShopDomainQuery.returns<BranchIdentityRow[]>();
  if (!withShopDomainResult.error) {
    return withShopDomainResult.data ?? [];
  }

  if (!isMissingBranchShopDomainColumnError(withShopDomainResult.error.code)) {
    throw withShopDomainResult.error;
  }

  let legacyQuery = supabase
    .from('branches')
    .select('id, name, code')
    .eq('is_delete', false);
  if (branchIds && branchIds.length > 0) {
    legacyQuery = legacyQuery.in('id', branchIds);
  }
  if (orderByCode) {
    legacyQuery = legacyQuery.order('code', { ascending: true });
  }

  const legacyResult = await legacyQuery.returns<LegacyBranchIdentityRow[]>();
  if (legacyResult.error) throw legacyResult.error;

  return (legacyResult.data ?? []).map(toBranchIdentityRowLegacy);
}

export async function upsertProfileFromAuthUser(
  serviceRoleClient: SupabaseClient,
  authUser: AuthAdminUserForProfileSync,
): Promise<void> {
  const profilePayload = authUserToProfileUpsertMapper.map(authUser);

  const { error } = await serviceRoleClient
    .from('profiles')
    .upsert(profilePayload, {
      onConflict: 'id',
    });
  if (error) throw error;
}

export async function ensureProfileByUserId(
  supabaseService: SupabaseService,
  userId: string,
): Promise<string | null> {
  let serviceRoleClient: SupabaseClient;
  try {
    serviceRoleClient = supabaseService.createServiceRoleClient();
  } catch (error) {
    return error instanceof Error
      ? error.message
      : 'Missing service role config';
  }

  const { data, error } =
    await serviceRoleClient.auth.admin.getUserById(userId);
  if (error) return error.message;

  const authUser = data.user;
  if (!authUser?.id) {
    return 'Auth user missing for profile bootstrap';
  }

  try {
    await upsertProfileFromAuthUser(serviceRoleClient, {
      id: authUser.id,
      email: authUser.email ?? null,
      phone: authUser.phone ?? null,
      app_metadata: toMetadataRecord(authUser.app_metadata),
      user_metadata: toMetadataRecord(authUser.user_metadata),
    });
    return null;
  } catch (upsertError) {
    return upsertError instanceof Error
      ? upsertError.message
      : 'Failed to upsert profile';
  }
}

export async function fetchCurrentUserProfileContext(options: {
  supabase: SupabaseClient;
  userId: string;
  supabaseService: SupabaseService;
}): Promise<{
  profile: ApiAuthUserProfilePayload | null;
  branchAccess: ApiProfileBranchAccessRow[];
  warning: string | null;
}> {
  const { supabase, userId, supabaseService } = options;
  const fetchProfileRow = () =>
    supabase
      .from('profiles')
      .select(
        'id, full_name, email, phone, role, default_branch_id, locale, is_active',
      )
      .eq('id', userId)
      .eq('is_delete', false)
      .maybeSingle<ApiProfileRow>();

  let warning: string | null = null;
  let { data: profileRow, error: profileError } = await fetchProfileRow();

  if (profileError) {
    if (supabaseService.isSkippableProfileQueryError(profileError)) {
      return {
        profile: null,
        branchAccess: [],
        warning: profileError.message,
      };
    }
    throw profileError;
  }

  if (!profileRow) {
    warning = appendWarning(
      warning,
      await ensureProfileByUserId(supabaseService, userId),
    );
    const profileRetry = await fetchProfileRow();
    profileRow = profileRetry.data ?? null;
    profileError = profileRetry.error;

    if (profileError) {
      if (supabaseService.isSkippableProfileQueryError(profileError)) {
        return {
          profile: null,
          branchAccess: [],
          warning: appendWarning(warning, profileError.message),
        };
      }
      throw profileError;
    }
  }

  if (!profileRow) {
    return { profile: null, branchAccess: [], warning };
  }

  const profilePayload = profileRowToPayloadMapper.map({ userId, profileRow });
  if (isOwnerAdminRole(profileRow.role)) {
    let activeBranches: BranchIdentityRow[] = [];
    try {
      activeBranches = (
        await fetchBranchIdentityRows({
          supabase,
          orderByCode: true,
        })
      ).filter((row) => typeof row.id === 'string' && row.id.length > 0);
    } catch (branchError) {
      const postgrestError = toPostgrestError(branchError);
      if (
        postgrestError &&
        supabaseService.isSkippableProfileQueryError(postgrestError)
      ) {
        return {
          profile: profilePayload,
          branchAccess: [],
          warning: appendWarning(warning, postgrestError.message),
        };
      }
      throw branchError;
    }

    const profileDefaultBranchId = sanitizeBranchId(
      profilePayload.default_branch_id,
    );
    const resolvedDefaultBranchId =
      (profileDefaultBranchId &&
      activeBranches.some((row) => row.id === profileDefaultBranchId)
        ? profileDefaultBranchId
        : null) ??
      activeBranches[0]?.id ??
      null;

    profilePayload.default_branch_id = resolvedDefaultBranchId;
    profilePayload.branch_id = resolvedDefaultBranchId;

    return {
      profile: profilePayload,
      branchAccess: activeBranches.map((row) => ({
        branch_id: row.id,
        is_default: row.id === resolvedDefaultBranchId,
        branch_name: row.name ?? null,
        branch_domain: resolveEffectiveBranchDomain(row),
        shop_domain: normalizeBranchDomain(row.shop_domain),
      })),
      warning,
    };
  }

  const { data: branchAccessRows, error: branchAccessError } = await supabase
    .from('profile_branch_access')
    .select('branch_id, is_default')
    .eq('profile_id', userId)
    .eq('is_delete', false)
    .returns<ApiProfileBranchAccessSourceRow[]>();

  if (branchAccessError) {
    if (supabaseService.isSkippableProfileQueryError(branchAccessError)) {
      return {
        profile: profileRowToPayloadMapper.map({ userId, profileRow }),
        branchAccess: [],
        warning: appendWarning(warning, branchAccessError.message),
      };
    }
    throw branchAccessError;
  }

  const normalizedBranchRows = branchAccessRows ?? [];
  const branchIds = Array.from(
    new Set(
      normalizedBranchRows
        .map((row) => row.branch_id)
        .filter(
          (branchId): branchId is string =>
            typeof branchId === 'string' && branchId.length > 0,
        ),
    ),
  );

  let branchMetaById = new Map<
    string,
    {
      name: string | null;
      branchDomain: string | null;
      shopDomain: string | null;
    }
  >();
  let branchValidationReady = false;
  if (branchIds.length > 0) {
    try {
      const branchRows = await fetchBranchIdentityRows({
        supabase,
        branchIds,
      });
      branchValidationReady = true;
      branchMetaById = new Map(
        (branchRows ?? [])
          .filter((row) => typeof row.id === 'string')
          .map((row) => [
            row.id,
            {
              name: row.name ?? null,
              branchDomain: resolveEffectiveBranchDomain(row),
              shopDomain: normalizeBranchDomain(row.shop_domain),
            },
          ]),
      );
    } catch (branchError) {
      const postgrestError = toPostgrestError(branchError);
      if (
        postgrestError &&
        supabaseService.isSkippableProfileQueryError(postgrestError)
      ) {
        warning = appendWarning(warning, postgrestError.message);
      } else {
        throw branchError;
      }
    }
  }

  const activeBranchRows = branchValidationReady
    ? normalizedBranchRows.filter((row) => branchMetaById.has(row.branch_id))
    : normalizedBranchRows;

  if (branchValidationReady) {
    const profileDefaultBranchId = sanitizeBranchId(
      profilePayload.default_branch_id,
    );
    const defaultAccessBranchId =
      activeBranchRows.find((row) => Boolean(row.is_default))?.branch_id ??
      null;
    const firstAccessBranchId = activeBranchRows[0]?.branch_id ?? null;
    const resolvedDefaultBranchId =
      (profileDefaultBranchId && branchMetaById.has(profileDefaultBranchId)
        ? profileDefaultBranchId
        : null) ??
      defaultAccessBranchId ??
      firstAccessBranchId;

    profilePayload.default_branch_id = resolvedDefaultBranchId;
    profilePayload.branch_id = resolvedDefaultBranchId;
  }

  const branchAccess = branchAccessRowMapper.maps(
    activeBranchRows.map((row) => ({
      row,
      branchMetaById,
    })),
  );

  return {
    profile: profilePayload,
    branchAccess,
    warning,
  };
}
