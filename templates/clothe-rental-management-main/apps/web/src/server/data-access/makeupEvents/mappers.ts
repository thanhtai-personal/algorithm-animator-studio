import type { SupabaseClient } from "@supabase/supabase-js";
import type { MakeupEventRow, MakeupPackageRow, ProfileNameRow, CustomerRow } from "@/server/data-access/makeupShared";
import type { MakeupArtistDto } from "@/types/makeupModule";
import type { MakeupArtistRow } from "./db";
import { fetchProfileNamesByIds, fetchCustomersByIds, fetchPackagesByIds } from "@/server/data-access/makeupShared";
import { mapEventRowToDto } from "@/server/data-access/makeupShared";

export async function mapSingleEvent(
  supabase: SupabaseClient,
  row: MakeupEventRow,
  timeZone?: string
) {
  const [artistById, customerById, packageById] = await Promise.all([
    fetchProfileNamesByIds(
      supabase,
      row.artist_profile_id ? [row.artist_profile_id] : []
    ),
    fetchCustomersByIds(supabase, row.customer_id ? [row.customer_id] : []),
    fetchPackagesByIds(supabase, row.package_id ? [row.package_id] : []),
  ]);

  return mapEventRowToDto({
    row,
    artistById,
    customerById,
    packageById,
    timeZone,
  });
}

export function mapArtistRowToDto(row: MakeupArtistRow): MakeupArtistDto {
  return {
    profileId: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    isActive: row.is_active,
    defaultBranchId: row.default_branch_id,
    branchIds: row.branchIds,
  };
}
