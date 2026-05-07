import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export function getServerClient(): SupabaseClient {
  return createSupabaseServerClient();
}
