import { SupabaseClient } from "@supabase/supabase-js";
import { AuditEventRow } from "../interfaces";

export async function fetchRecentAuditEvents(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    limit: number;
  },
): Promise<AuditEventRow[]> {
  const { data, error } = await supabase
    .from("audit_events")
    .select(
      "id, actor_profile_id, entity_type, entity_id, action, reason, created_at",
    )
    .eq("branch_id", options.branchId)
    .order("created_at", { ascending: false })
    .limit(options.limit)
    .returns<AuditEventRow[]>();

  if (error) throw error;
  return data ?? [];
}