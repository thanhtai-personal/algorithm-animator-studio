import { NextRequest, NextResponse } from "next/server";
import { getAnonKeyForUser } from "@/lib/supabase/anonKey";
import type { CategoryInput } from "@/features/categories/types";
import {
  deleteCategoryForAnonKey,
  deleteCategoryForAnonymousUser,
  deleteCategoryForUser,
  fetchCategoryOwnership,
  insertCategoryForAnonKey,
  insertCategoryForAnonymousUser,
  insertCategoryForUser,
  listCategoriesForAnonKey,
  listCategoriesForAnonymousUser,
  listCategoriesForUser,
  reassignTransactionsToFallbackForAnonKey,
  reassignTransactionsToFallbackForUser,
  updateCategoryForAnonKey,
  updateCategoryForAnonymousUser,
  updateCategoryForUser,
} from "@/server/data-access/categories";
import { getRequestContext } from "@/server/data-access/supabaseClients";
import { createServiceRoleClient, readAnonKey } from "@/server/utils/anonKey";

export async function handleListCategories(request: NextRequest) {
  try {
    const { supabase, user } = await getRequestContext(request);
    const anonKey = !user ? readAnonKey(request) : null;

    if (!user && !anonKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (anonKey) {
      const admin = createServiceRoleClient();
      const { data, error } = await listCategoriesForAnonKey(admin, anonKey);
      if (error) return NextResponse.json({ error }, { status: 500 });
      return NextResponse.json(data ?? []);
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await listCategoriesForUser(supabase, user.id);
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function handleCreateCategory(request: NextRequest) {
  try {
    const { supabase, user } = await getRequestContext(request);
    const anonKey = !user ? readAnonKey(request) : null;

    if (!user && !anonKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CategoryInput;
    const name = body?.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Invalid category payload" }, { status: 400 });
    }
    const normalizedBody: CategoryInput = { ...body, name };

    if (anonKey) {
      const admin = createServiceRoleClient();
      const { data, error } = await insertCategoryForAnonKey(admin, anonKey, normalizedBody);
      if (error || !data) return NextResponse.json({ error: error ?? "Insert failed" }, { status: 500 });
      return NextResponse.json(data);
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await insertCategoryForUser(supabase, user.id, normalizedBody);
    if (error || !data) return NextResponse.json({ error: error ?? "Insert failed" }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function handleUpdateCategory(request: NextRequest, id: string) {
  try {
    const { supabase, user } = await getRequestContext(request);
    const anonKey = !user ? readAnonKey(request) : null;

    if (!user && !anonKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { name?: string; icon?: string | null; color?: string | null };
    const name = body?.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Invalid category payload" }, { status: 400 });
    }

    if (anonKey) {
      const admin = createServiceRoleClient();
      const { data: category, error: checkError } = await fetchCategoryOwnership(admin, id);
      if (checkError) return NextResponse.json({ error: checkError }, { status: 500 });
      if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
      if (category.user_id === null && category.anon_key === null) {
        return NextResponse.json({ error: "Cannot edit default categories" }, { status: 403 });
      }
      if (category.anon_key !== anonKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const { data, error } = await updateCategoryForAnonKey(admin, id, anonKey, { name, icon: body.icon, color: body.color });
      if (error || !data) return NextResponse.json({ error: error ?? "Update failed" }, { status: 500 });
      return NextResponse.json(data);
    }

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: category, error: checkError } = await fetchCategoryOwnership(supabase, id);
    if (checkError) return NextResponse.json({ error: checkError }, { status: 500 });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    if (category.user_id === null) {
      return NextResponse.json({ error: "Cannot edit default categories" }, { status: 403 });
    }
    if (category.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data, error } = await updateCategoryForUser(supabase, id, user.id, { name, icon: body.icon, color: body.color });
    if (error || !data) return NextResponse.json({ error: error ?? "Update failed" }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function handleDeleteCategory(request: NextRequest, id: string) {
  try {
    const { supabase, user } = await getRequestContext(request);
    const anonKey = !user ? readAnonKey(request) : null;

    if (!user && !anonKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (anonKey) {
      const admin = createServiceRoleClient();
      const { data: category, error: categoryError } = await fetchCategoryOwnership(admin, id);
      if (categoryError) return NextResponse.json({ error: categoryError }, { status: 500 });
      if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
      if (category.user_id === null && category.anon_key === null) {
        return NextResponse.json({ error: "Cannot delete default categories" }, { status: 403 });
      }
      if (category.anon_key !== anonKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const reassignError = await reassignTransactionsToFallbackForAnonKey(admin, anonKey, id);
      if (reassignError) return NextResponse.json({ error: reassignError }, { status: 500 });

      const deleteError = await deleteCategoryForAnonKey(admin, anonKey, id);
      if (deleteError) return NextResponse.json({ error: deleteError }, { status: 500 });

      return NextResponse.json({ success: true });
    }

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: category, error: categoryError } = await fetchCategoryOwnership(supabase, id);
    if (categoryError) return NextResponse.json({ error: categoryError }, { status: 500 });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    if (category.user_id === null) {
      return NextResponse.json({ error: "Cannot delete default categories" }, { status: 403 });
    }
    if (category.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const reassignError = await reassignTransactionsToFallbackForUser(supabase, user.id, id);
    if (reassignError) return NextResponse.json({ error: reassignError }, { status: 500 });

    const deleteError = await deleteCategoryForUser(supabase, user.id, id);
    if (deleteError) return NextResponse.json({ error: deleteError }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
