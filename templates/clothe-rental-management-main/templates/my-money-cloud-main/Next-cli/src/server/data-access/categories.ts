import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategoryInput, CategoryRow } from "@/features/categories/types";
import { FALLBACK_CATEGORY_ID } from "@/features/categories/constants";

export async function listCategoriesForAnonKey(
  admin: SupabaseClient,
  anonKey: string,
): Promise<{ data: CategoryRow[] | null; error: string | null }> {
  const { data, error } = await admin
    .from("categories")
    .select("*")
    .or(`and(user_id.is.null,anon_key.is.null),and(user_id.is.null,anon_key.eq.${anonKey})`)
    .order("created_at", { ascending: false });

  return { data: data ?? [], error: error?.message ?? null };
}

export async function listCategoriesForAnonymousUser(
  supabase: SupabaseClient,
  anonKey: string,
): Promise<{ data: CategoryRow[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .or(`and(user_id.is.null,anon_key.is.null),and(user_id.is.null,anon_key.eq.${anonKey})`)
    .order("created_at", { ascending: false });

  return { data: data ?? [], error: error?.message ?? null };
}

export async function listCategoriesForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: CategoryRow[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  return { data: data ?? [], error: error?.message ?? null };
}

export async function insertCategoryForAnonKey(
  admin: SupabaseClient,
  anonKey: string,
  body: CategoryInput,
): Promise<{ data: CategoryRow | null; error: string | null }> {
  const { data, error } = await admin
    .from("categories")
    .insert({
      id: body.id,
      user_id: null,
      anon_key: anonKey,
      name: body.name,
      icon: body.icon ?? null,
      color: body.color ?? null,
    })
    .select("*")
    .single();

  return { data: data ?? null, error: error?.message ?? null };
}

export async function insertCategoryForAnonymousUser(
  supabase: SupabaseClient,
  anonKey: string,
  body: CategoryInput,
): Promise<{ data: CategoryRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("categories")
    .insert({
      id: body.id,
      user_id: null,
      anon_key: anonKey,
      name: body.name,
      icon: body.icon ?? null,
      color: body.color ?? null,
    })
    .select("*")
    .single();

  return { data: data ?? null, error: error?.message ?? null };
}

export async function insertCategoryForUser(
  supabase: SupabaseClient,
  userId: string,
  body: CategoryInput,
): Promise<{ data: CategoryRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("categories")
    .upsert(
      {
        id: body.id,
        user_id: userId,
        name: body.name,
        icon: body.icon ?? null,
        color: body.color ?? null,
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  return { data: data ?? null, error: error?.message ?? null };
}

export async function fetchCategoryOwnership(
  client: SupabaseClient,
  id: string,
): Promise<{ data: { id: string; user_id: string | null; anon_key?: string | null } | null; error: string | null }> {
  const { data, error } = await client
    .from("categories")
    .select("id, user_id, anon_key")
    .eq("id", id)
    .maybeSingle();

  return { data: data ?? null, error: error?.message ?? null };
}

export async function updateCategoryForAnonKey(
  admin: SupabaseClient,
  id: string,
  anonKey: string,
  payload: { name: string; icon?: string | null; color?: string | null },
): Promise<{ data: CategoryRow | null; error: string | null }> {
  const { data, error } = await admin
    .from("categories")
    .update({
      name: payload.name,
      icon: payload.icon ?? null,
      color: payload.color ?? null,
    })
    .eq("id", id)
    .is("user_id", null)
    .eq("anon_key", anonKey)
    .select("*")
    .single();

  return { data: data ?? null, error: error?.message ?? null };
}

export async function updateCategoryForAnonymousUser(
  supabase: SupabaseClient,
  id: string,
  anonKey: string,
  payload: { name: string; icon?: string | null; color?: string | null },
): Promise<{ data: CategoryRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("categories")
    .update({
      name: payload.name,
      icon: payload.icon ?? null,
      color: payload.color ?? null,
    })
    .eq("id", id)
    .is("user_id", null)
    .eq("anon_key", anonKey)
    .select("*")
    .single();

  return { data: data ?? null, error: error?.message ?? null };
}

export async function updateCategoryForUser(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  payload: { name: string; icon?: string | null; color?: string | null },
): Promise<{ data: CategoryRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("categories")
    .update({
      name: payload.name,
      icon: payload.icon ?? null,
      color: payload.color ?? null,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  return { data: data ?? null, error: error?.message ?? null };
}

export async function reassignTransactionsToFallbackForAnonKey(
  client: SupabaseClient,
  anonKey: string,
  categoryId: string,
): Promise<string | null> {
  const { error } = await client
    .from("transactions")
    .update({ category_id: FALLBACK_CATEGORY_ID })
    .is("user_id", null)
    .eq("anon_key", anonKey)
    .eq("category_id", categoryId);

  return error?.message ?? null;
}

export async function reassignTransactionsToFallbackForUser(
  client: SupabaseClient,
  userId: string,
  categoryId: string,
): Promise<string | null> {
  const { error } = await client
    .from("transactions")
    .update({ category_id: FALLBACK_CATEGORY_ID })
    .eq("user_id", userId)
    .eq("category_id", categoryId);

  return error?.message ?? null;
}

export async function deleteCategoryForAnonKey(
  admin: SupabaseClient,
  anonKey: string,
  id: string,
): Promise<string | null> {
  const { error } = await admin
    .from("categories")
    .delete()
    .eq("id", id)
    .is("user_id", null)
    .eq("anon_key", anonKey);

  return error?.message ?? null;
}

export async function deleteCategoryForAnonymousUser(
  supabase: SupabaseClient,
  anonKey: string,
  id: string,
): Promise<string | null> {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .is("user_id", null)
    .eq("anon_key", anonKey);

  return error?.message ?? null;
}

export async function deleteCategoryForUser(
  supabase: SupabaseClient,
  userId: string,
  id: string,
): Promise<string | null> {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return error?.message ?? null;
}
