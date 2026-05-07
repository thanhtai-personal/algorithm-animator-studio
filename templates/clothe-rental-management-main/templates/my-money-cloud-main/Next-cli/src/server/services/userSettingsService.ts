import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getUserSettings, upsertUserSettings } from "@/server/data-access/userSettings";
import {
  getUserSecuritySettings,
  upsertUserSecuritySettings,
  type UserSecuritySettings,
} from "@/server/data-access/userSecuritySettings";

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

export async function handleGetUserSettings() {
  const { supabase, user, error } = await getAuthUser();
  if (!user) {
    const message = error?.message || "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  // Fetch user_settings
  const { data: settings, error: fetchError } = await getUserSettings(supabase, user.id);
  if (fetchError && fetchError.code !== "PGRST116") {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // Fetch user_security_settings
  const { data: securitySettings, error: securityError } = await getUserSecuritySettings(supabase, user.id);
  if (securityError && securityError.code !== "PGRST116") {
    return NextResponse.json({ error: securityError.message }, { status: 500 });
  }

  // Compose auth info
  const authInfo = {
    displayName: user.user_metadata?.displayName || user.email || null,
    email: user.email || null,
    phone: user.phone || null,
    provider: user.app_metadata?.provider || null,
    providerType: user.app_metadata?.provider || null,
  };

  return NextResponse.json({
    settings: settings || null,
    securitySettings: securitySettings || null,
    auth: authInfo,
  });
}

export async function handlePatchUserSettings(request: NextRequest) {
  const { supabase, user, error } = await getAuthUser();
  if (!user) {
    const message = error?.message || "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const body = await request.json();
  const { currency, ...otherSettings } = body;
  const securityUpdates: UserSecuritySettings = {};
  if (Object.prototype.hasOwnProperty.call(body, "screen_lock_enabled")) {
    securityUpdates.screen_lock_enabled = body.screen_lock_enabled;
    delete otherSettings.screen_lock_enabled;
  }
  if (Object.prototype.hasOwnProperty.call(body, "screen_lock_method")) {
    securityUpdates.screen_lock_method = body.screen_lock_method;
    delete otherSettings.screen_lock_method;
  }
  if (Object.prototype.hasOwnProperty.call(body, "screen_lock_pin_hash")) {
    securityUpdates.screen_lock_pin_hash = body.screen_lock_pin_hash;
    delete otherSettings.screen_lock_pin_hash;
  }

  let existingSettings: { currency?: string | null } | null = null;
  if (currency) {
    const { data } = await supabase
      .from("user_settings")
      .select("currency")
      .eq("user_id", user.id)
      .single();
    existingSettings = data ?? null;
  }

  if (existingSettings?.currency && currency && existingSettings.currency !== currency) {
    return NextResponse.json({ error: "Currency cannot be changed once set" }, { status: 400 });
  }

  let settingsData: Record<string, unknown> | null = null;
  if (Object.keys(otherSettings).length > 0 || currency) {
    const { data, error: upsertError } = await upsertUserSettings(supabase, user.id, {
      ...otherSettings,
      ...(currency && { currency }),
    });
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
    settingsData = data ?? null;
  }

  let securityData: UserSecuritySettings | null = null;
  if (Object.keys(securityUpdates).length > 0) {
    const { data, error: securityUpsertError } = await upsertUserSecuritySettings(
      supabase,
      user.id,
      securityUpdates,
    );
    if (securityUpsertError) {
      return NextResponse.json({ error: securityUpsertError.message }, { status: 500 });
    }
    securityData = data ?? null;
  }

  return NextResponse.json({ settings: settingsData, securitySettings: securityData });
}
