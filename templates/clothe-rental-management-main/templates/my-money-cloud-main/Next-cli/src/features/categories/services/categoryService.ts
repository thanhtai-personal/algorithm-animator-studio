import type { CategoryInput, CategoryRow } from "@/features/categories/types";
import { getSupabaseAuthHeaders } from "@/lib/supabase/client";

function parseCategory(item: CategoryRow): CategoryRow {
  return item;
}

export const categoryService = {
  async list(): Promise<CategoryRow[]> {
    const authHeaders = await getSupabaseAuthHeaders();
    const response = await fetch("/api/categories", {
      credentials: "include",
      headers: authHeaders,
    });

    if (!response.ok) {
      throw new Error("Failed to load categories");
    }

    const data = (await response.json()) as CategoryRow[];
    return data.map(parseCategory);
  },
  async create(input: CategoryInput): Promise<CategoryRow> {
    const authHeaders = await getSupabaseAuthHeaders();
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      credentials: "include",
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error("Failed to create category");
    }

    const body = await response.json();
    const list = Array.isArray(body) ? body : [body];
    return parseCategory(list[0]);
  },
  async update(id: string, input: CategoryInput): Promise<CategoryRow> {
    const authHeaders = await getSupabaseAuthHeaders();
    const response = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders },
      credentials: "include",
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error("Failed to update category");
    }

    const body = await response.json();
    const list = Array.isArray(body) ? body : [body];
    return parseCategory(list[0]);
  },
  async remove(id: string): Promise<CategoryRow[]> {
    const authHeaders = await getSupabaseAuthHeaders();
    const response = await fetch(`/api/categories/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: authHeaders,
    });

    if (!response.ok) {
      let message = "Failed to delete category";
      try {
        const body = (await response.json()) as { error?: string };
        if (body?.error) {
          message = body.error;
        }
      } catch {
        // ignore parse errors
      }
      const error = new Error(message) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    try {
      const body = await response.json();
      const list = Array.isArray(body) ? body : [];
      return list.map(parseCategory);
    } catch {
      return [];
    }
  },
};
