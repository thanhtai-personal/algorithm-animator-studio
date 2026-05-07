import { getSupabaseAuthHeaders } from "@/lib/supabase/client";

export type UserBackupInput = {
  device?: string | null;
  data: Record<string, unknown>;
};

export async function createUserBackup(input: UserBackupInput) {
  const authHeaders = await getSupabaseAuthHeaders();
  const response = await fetch("/api/user/backups", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to create user backup");
  }

  return response.json();
}
