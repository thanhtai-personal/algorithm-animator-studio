import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateMakeupInventoryItemPayload,
  MakeupInventoryItemDto,
  MakeupInventoryQuery,
  MakeupInventoryResponse,
  UpdateMakeupInventoryItemPayload,
} from "@/types/makeupModule";
import {
  ensureArtistExists,
  ensurePackageBelongsToBranch,
  fetchMakeupModuleEnabled,
  fetchPackagesByIds,
  fetchProfileNamesByIds,
  isMissingColumnOrTableError,
  MAKEUP_ADMIN_ROLE_SET,
  MakeupDomainError,
  resolveActorContext,
  sanitizeText,
} from "@/server/data-access/makeupShared";

const INVENTORY_SELECT_FIELDS =
  "id, branch_id, name, category, package_id, artist_profile_id, shopee_url, note, is_active, created_at, updated_at";

interface MakeupInventoryItemRow {
  id: string;
  branch_id: string;
  name: string;
  category: string | null;
  package_id: string;
  artist_profile_id: string;
  shopee_url: string | null;
  note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function normalizeShopeeUrl(value: string | null): string | null {
  if (!value) return null;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new MakeupDomainError("INVALID_SHOPEE_URL", { value });
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    throw new MakeupDomainError("INVALID_SHOPEE_URL", { value });
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== "shopee.vn" && !host.endsWith(".shopee.vn")) {
    throw new MakeupDomainError("INVALID_SHOPEE_URL", { value });
  }

  return parsed.toString();
}

function mapInventoryRowToDto(options: {
  row: MakeupInventoryItemRow;
  artistNameById: Map<string, string | null>;
  packageMetaById: Map<string, { code: string | null; name: string | null }>;
}): MakeupInventoryItemDto {
  return {
    id: options.row.id,
    branchId: options.row.branch_id,
    name: options.row.name,
    category: options.row.category,
    packageId: options.row.package_id,
    packageCode: options.packageMetaById.get(options.row.package_id)?.code ?? null,
    packageName: options.packageMetaById.get(options.row.package_id)?.name ?? null,
    artistProfileId: options.row.artist_profile_id,
    artistName: options.artistNameById.get(options.row.artist_profile_id) ?? null,
    shopeeUrl: options.row.shopee_url,
    note: options.row.note,
    isActive: options.row.is_active,
    createdAt: options.row.created_at,
    updatedAt: options.row.updated_at,
  };
}

async function assertInventoryAccess(
  supabase: SupabaseClient,
  options: { actorProfileId: string; branchId: string | null }
) {
  const context = await resolveActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: options.branchId,
  });

  if (!MAKEUP_ADMIN_ROLE_SET.has(context.role ?? "")) {
    throw new MakeupDomainError("FORBIDDEN_ROLE", { role: context.role });
  }
  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError("MODULE_DISABLED");
  }

  return context;
}

async function fetchInventoryItemById(
  supabase: SupabaseClient,
  options: { itemId: string; branchId: string }
): Promise<MakeupInventoryItemRow | null> {
  const { data, error } = await supabase
    .from("makeup_inventory_items")
    .select(INVENTORY_SELECT_FIELDS)
    .eq("id", options.itemId)
    .eq("branch_id", options.branchId)
    .maybeSingle<MakeupInventoryItemRow>();

  if (error) {
    if (isMissingColumnOrTableError(error)) {
      throw new MakeupDomainError("INVENTORY_ITEM_NOT_FOUND", {
        itemId: options.itemId,
      });
    }
    throw error;
  }

  return data ?? null;
}

export async function listMakeupInventoryItems(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: MakeupInventoryQuery;
  }
): Promise<MakeupInventoryResponse> {
  const context = await assertInventoryAccess(supabase, {
    actorProfileId: options.actorProfileId,
    branchId: sanitizeText(options.query.branchId ?? null),
  });

  let query = supabase
    .from("makeup_inventory_items")
    .select(INVENTORY_SELECT_FIELDS)
    .eq("branch_id", context.branchId)
    .order("is_active", { ascending: false })
    .order("updated_at", { ascending: false });

  const packageId = sanitizeText(options.query.packageId ?? null);
  const artistProfileId = sanitizeText(options.query.artistProfileId ?? null);
  if (packageId) query = query.eq("package_id", packageId);
  if (artistProfileId) query = query.eq("artist_profile_id", artistProfileId);
  if (options.query.isActive === true) query = query.eq("is_active", true);
  if (options.query.isActive === false) query = query.eq("is_active", false);

  const { data, error } = await query.returns<MakeupInventoryItemRow[]>();
  if (error) {
    if (isMissingColumnOrTableError(error)) {
      return {
        branchId: context.branchId,
        items: [],
      };
    }
    throw error;
  }

  const rawRows = data ?? [];
  const search = sanitizeText(options.query.search ?? null)?.toLowerCase();
  const rows =
    search && search.length > 0
      ? rawRows.filter((row) => {
          const haystack = `${row.name} ${row.category ?? ""} ${row.note ?? ""}`.toLowerCase();
          return haystack.includes(search);
        })
      : rawRows;

  const artistIds = Array.from(new Set(rows.map((entry) => entry.artist_profile_id)));
  const packageIds = Array.from(new Set(rows.map((entry) => entry.package_id)));

  const [artistById, packageById] = await Promise.all([
    fetchProfileNamesByIds(supabase, artistIds),
    fetchPackagesByIds(supabase, packageIds),
  ]);

  const artistNameById = new Map<string, string | null>(
    Array.from(artistById.entries()).map(([id, row]) => [id, row.full_name ?? null])
  );
  const packageMetaById = new Map<string, { code: string | null; name: string | null }>(
    Array.from(packageById.entries()).map(([id, row]) => [
      id,
      { code: row.code ?? null, name: row.name ?? null },
    ])
  );

  return {
    branchId: context.branchId,
    items: rows.map((row) =>
      mapInventoryRowToDto({
        row,
        artistNameById,
        packageMetaById,
      })
    ),
  };
}

export async function createMakeupInventoryItem(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: CreateMakeupInventoryItemPayload;
  }
): Promise<MakeupInventoryItemDto> {
  const context = await assertInventoryAccess(supabase, {
    actorProfileId: options.actorProfileId,
    branchId: sanitizeText(options.payload.branchId ?? null),
  });

  const name = sanitizeText(options.payload.name);
  const packageId = sanitizeText(options.payload.packageId);
  const artistProfileId = sanitizeText(options.payload.artistProfileId);
  if (!name || !packageId || !artistProfileId) {
    throw new MakeupDomainError("INVALID_BOOKING_INPUT", {
      fields: ["name", "packageId", "artistProfileId"],
    });
  }

  await Promise.all([
    ensurePackageBelongsToBranch(supabase, {
      packageId,
      branchId: context.branchId,
    }),
    ensureArtistExists(supabase, {
      artistProfileId,
      branchId: context.branchId,
    }),
  ]);

  const shopeeUrl = normalizeShopeeUrl(sanitizeText(options.payload.shopeeUrl ?? null));
  const category = sanitizeText(options.payload.category ?? null);
  const note = sanitizeText(options.payload.note ?? null);

  const { data, error } = await supabase
    .from("makeup_inventory_items")
    .insert({
      branch_id: context.branchId,
      name,
      category,
      package_id: packageId,
      artist_profile_id: artistProfileId,
      shopee_url: shopeeUrl,
      note,
      is_active: options.payload.isActive ?? true,
      created_by: options.actorProfileId,
      updated_by: options.actorProfileId,
    })
    .select(INVENTORY_SELECT_FIELDS)
    .maybeSingle<MakeupInventoryItemRow>();

  if (error) throw error;
  if (!data) {
    throw new MakeupDomainError("INVENTORY_ITEM_NOT_FOUND", { reason: "insert-empty-result" });
  }

  const [artistById, packageById] = await Promise.all([
    fetchProfileNamesByIds(supabase, [artistProfileId]),
    fetchPackagesByIds(supabase, [packageId]),
  ]);

  return mapInventoryRowToDto({
    row: data,
    artistNameById: new Map([[artistProfileId, artistById.get(artistProfileId)?.full_name ?? null]]),
    packageMetaById: new Map([
      [
        packageId,
        {
          code: packageById.get(packageId)?.code ?? null,
          name: packageById.get(packageId)?.name ?? null,
        },
      ],
    ]),
  });
}

export async function updateMakeupInventoryItem(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    itemId: string;
    payload: UpdateMakeupInventoryItemPayload;
  }
): Promise<MakeupInventoryItemDto> {
  const context = await assertInventoryAccess(supabase, {
    actorProfileId: options.actorProfileId,
    branchId: null,
  });

  const existing = await fetchInventoryItemById(supabase, {
    itemId: options.itemId,
    branchId: context.branchId,
  });
  if (!existing) {
    throw new MakeupDomainError("INVENTORY_ITEM_NOT_FOUND", { itemId: options.itemId });
  }

  const patch: Record<string, unknown> = {
    updated_by: options.actorProfileId,
  };

  if (Object.prototype.hasOwnProperty.call(options.payload, "name")) {
    const name = sanitizeText(options.payload.name ?? null);
    if (!name) {
      throw new MakeupDomainError("INVALID_BOOKING_INPUT", { field: "name" });
    }
    patch.name = name;
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "category")) {
    patch.category = sanitizeText(options.payload.category ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "packageId")) {
    const packageId = sanitizeText(options.payload.packageId ?? null);
    if (!packageId) {
      throw new MakeupDomainError("INVALID_BOOKING_INPUT", { field: "packageId" });
    }
    await ensurePackageBelongsToBranch(supabase, {
      packageId,
      branchId: context.branchId,
    });
    patch.package_id = packageId;
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "artistProfileId")) {
    const artistProfileId = sanitizeText(options.payload.artistProfileId ?? null);
    if (!artistProfileId) {
      throw new MakeupDomainError("INVALID_BOOKING_INPUT", { field: "artistProfileId" });
    }
    await ensureArtistExists(supabase, {
      artistProfileId,
      branchId: context.branchId,
    });
    patch.artist_profile_id = artistProfileId;
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "shopeeUrl")) {
    patch.shopee_url = normalizeShopeeUrl(sanitizeText(options.payload.shopeeUrl ?? null));
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "note")) {
    patch.note = sanitizeText(options.payload.note ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "isActive")) {
    patch.is_active = options.payload.isActive;
  }

  const { data, error } = await supabase
    .from("makeup_inventory_items")
    .update(patch)
    .eq("id", options.itemId)
    .eq("branch_id", context.branchId)
    .select(INVENTORY_SELECT_FIELDS)
    .maybeSingle<MakeupInventoryItemRow>();

  if (error) throw error;
  if (!data) {
    throw new MakeupDomainError("INVENTORY_ITEM_NOT_FOUND", { itemId: options.itemId });
  }

  const [artistById, packageById] = await Promise.all([
    fetchProfileNamesByIds(supabase, [data.artist_profile_id]),
    fetchPackagesByIds(supabase, [data.package_id]),
  ]);

  return mapInventoryRowToDto({
    row: data,
    artistNameById: new Map([
      [data.artist_profile_id, artistById.get(data.artist_profile_id)?.full_name ?? null],
    ]),
    packageMetaById: new Map([
      [
        data.package_id,
        {
          code: packageById.get(data.package_id)?.code ?? null,
          name: packageById.get(data.package_id)?.name ?? null,
        },
      ],
    ]),
  });
}
