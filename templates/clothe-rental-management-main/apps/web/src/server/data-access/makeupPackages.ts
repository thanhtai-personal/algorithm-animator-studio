import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateMakeupPackagePayload,
  MakeupPackagesQuery,
  MakeupPackagesResponse,
  UpdateMakeupPackagePayload,
} from "@/types/makeupModule";
import {
  fetchMakeupModuleEnabled,
  isMissingColumnOrTableError,
  mapPackageRowToDto,
  MANAGER_ROLE_SET,
  MakeupDomainError,
  type MakeupPackageRow,
  PACKAGE_EDITOR_ROLE_SET,
  resolveActorContext,
  sanitizeText,
  validateNonNegativeNumber,
} from "@/server/data-access/makeupShared";

export async function listMakeupPackages(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: MakeupPackagesQuery;
  }
): Promise<MakeupPackagesResponse> {
  const context = await resolveActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });
  const moduleEnabled = await fetchMakeupModuleEnabled(supabase);
  if (!moduleEnabled) {
    throw new MakeupDomainError("MODULE_DISABLED");
  }

  let query = supabase
    .from("makeup_packages")
    .select(
      "id, branch_id, code, name, description, duration_minutes, price_amount, cost_amount, is_active, created_by, updated_by, updated_at"
    )
    .eq("branch_id", context.branchId)
    .order("code", { ascending: true });

  if (options.query.activeOnly) {
    query = query.eq("is_active", true);
  }

  const result = await query.returns<MakeupPackageRow[]>();

  if (result.error) {
    if (isMissingColumnOrTableError(result.error)) {
      return {
        branchId: context.branchId,
        moduleEnabled,
        items: [],
      };
    }
    throw result.error;
  }

  return {
    branchId: context.branchId,
    moduleEnabled,
    items: await Promise.all((result.data ?? []).map(mapPackageRowToDto)),
  };
}

export async function createMakeupPackage(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: CreateMakeupPackagePayload;
  }
) {
  const context = await resolveActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.payload.branchId ?? null),
  });

  if (!PACKAGE_EDITOR_ROLE_SET.has(context.role ?? "")) {
    throw new MakeupDomainError("FORBIDDEN_ROLE", {
      role: context.role,
    });
  }

  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError("MODULE_DISABLED");
  }

  const code = sanitizeText(options.payload.code)?.toUpperCase() ?? null;
  const name = sanitizeText(options.payload.name);
  if (!code || !name) {
    throw new MakeupDomainError("PACKAGE_NOT_FOUND", {
      reason: "missing-code-or-name",
    });
  }

  if (!Number.isFinite(options.payload.durationMinutes) || options.payload.durationMinutes <= 0) {
    throw new MakeupDomainError("INVALID_DURATION_MINUTES", {
      durationMinutes: options.payload.durationMinutes,
    });
  }

  const { data, error } = await supabase
    .from("makeup_packages")
    .insert({
      branch_id: context.branchId,
      code,
      name,
      description: sanitizeText(options.payload.description ?? null),
      duration_minutes: Math.floor(options.payload.durationMinutes),
      price_amount: validateNonNegativeNumber(options.payload.priceAmount, "priceAmount"),
      cost_amount: validateNonNegativeNumber(options.payload.costAmount, "costAmount"),
      is_active: options.payload.isActive ?? true,
      created_by: options.actorProfileId,
      updated_by: options.actorProfileId,
    })
    .select(
      "id, branch_id, code, name, description, duration_minutes, price_amount, cost_amount, is_active, created_by, updated_by, updated_at"
    )
    .maybeSingle<MakeupPackageRow>();

  if (error) {
    if (isMissingColumnOrTableError(error)) {
      throw new MakeupDomainError("PACKAGE_TABLE_UNAVAILABLE");
    }
    if (String((error as { code?: string }).code ?? "") === "23505") {
      throw new MakeupDomainError("PACKAGE_CODE_DUPLICATE", { code });
    }
    throw error;
  }

  if (!data) {
    throw new MakeupDomainError("PACKAGE_NOT_FOUND");
  }

  return mapPackageRowToDto(data);
}

export async function updateMakeupPackage(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    packageId: string;
    payload: UpdateMakeupPackagePayload;
  }
) {
  const context = await resolveActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: null,
  });

  if (!PACKAGE_EDITOR_ROLE_SET.has(context.role ?? "")) {
    throw new MakeupDomainError("FORBIDDEN_ROLE", {
      role: context.role,
    });
  }

  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError("MODULE_DISABLED");
  }

  const { data: current, error: currentError } = await supabase
    .from("makeup_packages")
    .select(
      "id, branch_id, code, name, description, duration_minutes, price_amount, cost_amount, is_active, created_by, updated_by, updated_at"
    )
    .eq("id", options.packageId)
    .maybeSingle<MakeupPackageRow>();

  if (currentError) {
    if (isMissingColumnOrTableError(currentError)) {
      throw new MakeupDomainError("PACKAGE_TABLE_UNAVAILABLE");
    }
    throw currentError;
  }

  if (!current) {
    throw new MakeupDomainError("PACKAGE_NOT_FOUND", {
      packageId: options.packageId,
    });
  }

  if (current.branch_id !== context.branchId && !MANAGER_ROLE_SET.has(context.role ?? "")) {
    throw new MakeupDomainError("FORBIDDEN_BRANCH_SCOPE", {
      packageId: options.packageId,
    });
  }

  const patch: Record<string, unknown> = {
    updated_by: options.actorProfileId,
  };

  if (options.payload.code !== undefined) {
    const code = sanitizeText(options.payload.code)?.toUpperCase() ?? null;
    if (!code) {
      throw new MakeupDomainError("PACKAGE_NOT_FOUND", {
        reason: "missing-code",
      });
    }
    patch.code = code;
  }

  if (options.payload.name !== undefined) {
    const name = sanitizeText(options.payload.name);
    if (!name) {
      throw new MakeupDomainError("PACKAGE_NOT_FOUND", {
        reason: "missing-name",
      });
    }
    patch.name = name;
  }

  if (options.payload.description !== undefined) {
    patch.description = sanitizeText(options.payload.description ?? null);
  }

  if (options.payload.durationMinutes !== undefined) {
    if (!Number.isFinite(options.payload.durationMinutes) || options.payload.durationMinutes <= 0) {
      throw new MakeupDomainError("INVALID_DURATION_MINUTES", {
        durationMinutes: options.payload.durationMinutes,
      });
    }
    patch.duration_minutes = Math.floor(options.payload.durationMinutes);
  }

  if (options.payload.priceAmount !== undefined) {
    patch.price_amount = validateNonNegativeNumber(options.payload.priceAmount, "priceAmount");
  }

  if (options.payload.costAmount !== undefined) {
    patch.cost_amount = validateNonNegativeNumber(options.payload.costAmount, "costAmount");
  }

  if (options.payload.isActive !== undefined) {
    patch.is_active = Boolean(options.payload.isActive);
  }

  const { data, error } = await supabase
    .from("makeup_packages")
    .update(patch)
    .eq("id", options.packageId)
    .select(
      "id, branch_id, code, name, description, duration_minutes, price_amount, cost_amount, is_active, created_by, updated_by, updated_at"
    )
    .maybeSingle<MakeupPackageRow>();

  if (error) {
    if (String((error as { code?: string }).code ?? "") === "23505") {
      throw new MakeupDomainError("PACKAGE_CODE_DUPLICATE", {
        packageId: options.packageId,
      });
    }
    throw error;
  }

  if (!data) {
    throw new MakeupDomainError("PACKAGE_NOT_FOUND", {
      packageId: options.packageId,
    });
  }

  return mapPackageRowToDto(data);
}
