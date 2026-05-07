import { NextRequest, NextResponse } from "next/server";
import { createAnonClient, createClientWithToken, createServiceRoleClient, buildRedirectUrl } from "@/server/data-access/auth";
import type { RefreshPayload, SignInPayload, SignUpPayload } from "@/server/types/auth";

export async function handleSignIn(request: NextRequest) {
  try {
    const body = (await request.json()) as SignInPayload;
    const email = body.email?.trim();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const supabase = createAnonClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return NextResponse.json({ error: error?.message ?? "Sign-in failed" }, { status: 401 });
    }

    return NextResponse.json({ session: data.session, user: data.user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function handleSignUp(request: NextRequest) {
  try {
    const body = (await request.json()) as SignUpPayload;
    const email = body.email?.trim();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const supabase = createAnonClient();
    const redirectTo = buildRedirectUrl(request.headers.get("origin"));
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ session: data.session ?? null, user: data.user ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function handleRefresh(request: NextRequest) {
  try {
    const body = (await request.json()) as RefreshPayload;
    const refreshToken = body.refresh_token;
    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 });
    }

    const supabase = createAnonClient();
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) {
      return NextResponse.json({ error: error?.message ?? "Refresh failed" }, { status: 401 });
    }

    return NextResponse.json({ session: data.session, user: data.user ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function handleSignOut(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "") ?? null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createClientWithToken(token);
    const { error } = await supabase.auth.signOut();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function handleGetUser(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "") ?? null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createClientWithToken(token);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ error: error?.message ?? "Unauthorized" }, { status: 401 });
    return NextResponse.json({ user: data.user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function handleDeleteAccount(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "") ?? null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createClientWithToken(token);
    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser.user) return NextResponse.json({ error: authError?.message ?? "Unauthorized" }, { status: 401 });

    const adminClient = createServiceRoleClient();
    const userId = authUser.user.id;

    const { error: deleteTxError } = await adminClient.from("transactions").delete().eq("user_id", userId);
    if (deleteTxError) return NextResponse.json({ error: deleteTxError.message }, { status: 500 });

    const { error: deleteCatError } = await adminClient.from("categories").delete().eq("user_id", userId);
    if (deleteCatError) return NextResponse.json({ error: deleteCatError.message }, { status: 500 });

    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
