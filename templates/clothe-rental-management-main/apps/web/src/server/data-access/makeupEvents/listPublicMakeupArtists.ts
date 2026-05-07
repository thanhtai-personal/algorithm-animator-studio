import type { SupabaseClient } from "@supabase/supabase-js";
import type { MakeupArtistDto } from "@/types/makeupModule";
import { resolvePublicMakeupBranchId } from "./db";
import { fetchArtistsByBranch } from "./db";
import { mapArtistRowToDto } from "./mappers";

export async function listPublicMakeupArtists(supabase: SupabaseClient, branchTokenOrId?: string): Promise<MakeupArtistDto[]> {
  const branchId = await resolvePublicMakeupBranchId(supabase, branchTokenOrId);
  if (!branchId) return [];
  const rows = await fetchArtistsByBranch(supabase, branchId);
  return rows.map((r) => mapArtistRowToDto(r));
}
