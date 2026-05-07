import { getSupabaseClientAndUser } from "@/lib/supabase/request";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type SupabaseRequestContext = {
  supabase: SupabaseClient;
  user: User | null;
};

export async function getRequestContext(request: Request): Promise<SupabaseRequestContext> {
  return getSupabaseClientAndUser(request);
}
