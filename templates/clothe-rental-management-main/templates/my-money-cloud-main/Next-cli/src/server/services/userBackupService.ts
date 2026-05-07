import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createUserBackup } from "@/server/data-access/userBackups";

function createSupabaseWithAuth(token?: string): SupabaseClient {
  if (token && SUPABASE_URL && SUPABASE_ANON_KEY) {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  }
  return createSupabaseServerClient();
}

async function getAuthUser() {
  const authHeader = (await headers()).get("authorization") || "";
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;
  const supabase = createSupabaseWithAuth(bearerToken || undefined);

  if (bearerToken) {
    const { data, error } = await supabase.auth.getUser(bearerToken);
    if (data?.user) {
      return { supabase, user: data.user } as const;
    }
    if (error && error.message !== "Auth session missing!" && error.message !== "Invalid token") {
      return { supabase, user: null, error } as const;
    }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { supabase, user: user ?? null, error } as const;
}

export async function handleCreateUserBackup(request: NextRequest) {
  const { supabase, user, error } = await getAuthUser();
  if (!user) {
    const message = error?.message || "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const body = await request.json();
  if (!body?.data) {
    return NextResponse.json({ error: "Missing backup data" }, { status: 400 });
  }

  const { data, error: insertError } = await createUserBackup(supabase, user.id, {
    device: body.device,
    data: body.data,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ backup: data });
}
