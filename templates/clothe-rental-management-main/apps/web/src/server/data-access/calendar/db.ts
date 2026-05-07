// filepath: apps/web/src/server/data-access/calendar/db.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProfileActorRow,
  ProfileBranchAccessRow,
  BranchRow,
  BranchSettingRow,
  OrderRow,
  CustomerRow,
  ItemRow,
} from "./types";
import { isStaffRole } from "./utils";
import { CalendarDomainError } from "./errors";

export async function fetchActorProfile(
  supabase: SupabaseClient,
  profileId: string
): Promise<ProfileActorRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, default_branch_id")
    .eq("id", profileId)
    .eq("is_active", true)
    .maybeSingle<ProfileActorRow>();

  if (error) throw error;
  return data ?? null;
}

export async function fetchActorBranchAccessIds(
  supabase: SupabaseClient,
  actorProfileId: string,
  defaultBranchId: string | null
): Promise<string[]> {
  const { data, error } = await supabase
    .from("profile_branch_access")
    .select("branch_id")
    .eq("profile_id", actorProfileId)
    .eq("is_delete", false)
    .returns<ProfileBranchAccessRow[]>();

  if (error) throw error;

  const allowed = new Set((data ?? []).map((entry) => entry.branch_id));
  if (defaultBranchId) {
    allowed.add(defaultBranchId);
  }

  return Array.from(allowed);
}

export function resolveBranchScope(options: {
  actor: ProfileActorRow;
  allowedBranchIds: string[];
  requestedBranchId: string | null;
}): string {
  const requestedBranchId = options.requestedBranchId;

  if (isStaffRole(options.actor.role)) {
    const staffBranchId = options.actor.default_branch_id ?? options.allowedBranchIds[0] ?? null;
    if (!staffBranchId) {
      throw new CalendarDomainError("MISSING_BRANCH_CONTEXT", {
        reason: "staff-without-branch",
      });
    }

    if (requestedBranchId && requestedBranchId !== staffBranchId) {
      throw new CalendarDomainError("FORBIDDEN_BRANCH_SCOPE", {
        requestedBranchId,
      });
    }

    return staffBranchId;
  }

  if (requestedBranchId) {
    if (!options.allowedBranchIds.includes(requestedBranchId)) {
      throw new CalendarDomainError("FORBIDDEN_BRANCH_SCOPE", {
        requestedBranchId,
      });
    }

    return requestedBranchId;
  }

  const fallback = options.actor.default_branch_id ?? options.allowedBranchIds[0] ?? null;
  if (!fallback) {
    throw new CalendarDomainError("MISSING_BRANCH_CONTEXT", {
      role: options.actor.role,
    });
  }

  return fallback;
}

export async function fetchBranchById(
  supabase: SupabaseClient,
  branchId: string
): Promise<BranchRow | null> {
  const { data, error } = await supabase
    .from("branches")
    .select("id, timezone, currency_code")
    .eq("id", branchId)
    .maybeSingle<BranchRow>();

  if (error) throw error;
  return data ?? null;
}

export async function fetchBranchSettings(
  supabase: SupabaseClient,
  branchId: string
): Promise<BranchSettingRow | null> {
  const { data, error } = await supabase
    .from("branch_settings")
    .select("laundry_stuck_threshold_days")
    .eq("branch_id", branchId)
    .maybeSingle<BranchSettingRow>();

  if (error) throw error;
  return data ?? null;
}

export async function fetchOrdersInRange(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    startDate: string;
    endDate: string;
  }
): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("rental_orders")
    .select("id, order_code, customer_id, status, start_date, end_date, updated_at")
    .eq("branch_id", options.branchId)
    .lte("start_date", options.endDate)
    .gte("end_date", options.startDate)
    .neq("status", "CANCELLED")
    .order("start_date", { ascending: true })
    .returns<OrderRow[]>();

  if (error) throw error;
  return data ?? [];
}

export async function fetchOverdueOrders(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    today: string;
    limit: number;
  }
): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("rental_orders")
    .select("id, order_code, customer_id, status, start_date, end_date, updated_at")
    .eq("branch_id", options.branchId)
    .eq("status", "PICKED_UP")
    .lt("end_date", options.today)
    .order("end_date", { ascending: true })
    .limit(options.limit)
    .returns<OrderRow[]>();

  if (error) throw error;
  return data ?? [];
}

export async function fetchCustomersByIds(
  supabase: SupabaseClient,
  customerIds: string[]
): Promise<Map<string, CustomerRow>> {
  if (customerIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("customers")
    .select("id, full_name, phone")
    .in("id", customerIds)
    .returns<CustomerRow[]>();

  if (error) throw error;

  return new Map((data ?? []).map((row) => [row.id, row]));
}

export async function fetchStuckItems(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    staleBeforeIso: string;
    limit: number;
  }
): Promise<ItemRow[]> {
  const { data, error } = await supabase
    .from("items")
    .select("id, item_code, status, updated_at")
    .eq("branch_id", options.branchId)
    .in("status", ["LAUNDRY", "MAINTENANCE"])
    .lt("updated_at", options.staleBeforeIso)
    .order("updated_at", { ascending: true })
    .limit(options.limit)
    .returns<ItemRow[]>();

  if (error) throw error;
  return data ?? [];
}