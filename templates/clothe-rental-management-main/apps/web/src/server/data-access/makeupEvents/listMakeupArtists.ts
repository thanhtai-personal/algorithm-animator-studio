import type { SupabaseClient } from "@supabase/supabase-js";
import type { MakeupArtistDto } from "@/types/makeupModule";
import { resolveActorContext } from "@/server/data-access/makeupShared";
import { fetchArtistsByBranch } from "./db";
import { mapArtistRowToDto } from "./mappers";

export async function listMakeupArtists(supabase: SupabaseClient, actorProfileId: string): Promise<MakeupArtistDto[]> {
  const context = await resolveActorContext(supabase, { actorProfileId, requestedBranchId: null });
  const rows = await fetchArtistsByBranch(supabase, context.branchId);
  return rows.map((r) => mapArtistRowToDto(r));
}
