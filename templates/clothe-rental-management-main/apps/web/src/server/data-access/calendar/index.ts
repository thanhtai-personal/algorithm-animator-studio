// filepath: apps/web/src/server/data-access/calendar/index.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalendarEventsQuery, CalendarEventsResponse } from "@/types/calendarModule";
import { DEFAULT_BRANCH_TIMEZONE, DEFAULT_CURRENCY_CODE, DEFAULT_LAUNDRY_STUCK_THRESHOLD_DAYS } from "./constants";
import { CalendarDomainError } from "./errors";
import { assertValidDateRange, formatDateInTimeZone } from "./utils";
import { fetchActorProfile, fetchActorBranchAccessIds, fetchBranchById, fetchBranchSettings, fetchOrdersInRange, fetchOverdueOrders, fetchCustomersByIds, fetchStuckItems, resolveBranchScope } from "./db";
import { mapEvents, mapOverdueReminderRows, mapStuckItems } from "./mappers";

export { CalendarDomainError } from "./errors";
export type { CalendarDomainErrorCode, CalendarDomainErrorContext } from "./types";

export async function getCalendarEventsForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: CalendarEventsQuery;
  }
): Promise<CalendarEventsResponse> {
  assertValidDateRange(options.query.startDate, options.query.endDate);

  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new CalendarDomainError("FORBIDDEN_MANAGER_ACTION", {
      reason: "missing-actor-profile",
    });
  }

  if (actor.role && !new Set(["owner_admin", "manager", "staff", "accountant"]).has(actor.role)) {
    throw new CalendarDomainError("FORBIDDEN_MANAGER_ACTION", {
      reason: "unsupported-role",
      role: actor.role,
    });
  }

  const allowedBranchIds = await fetchActorBranchAccessIds(
    supabase,
    actor.id,
    actor.default_branch_id
  );

  const branchId = resolveBranchScope({
    actor,
    allowedBranchIds,
    requestedBranchId: options.query.branchId ?? null,
  });

  const [branch, branchSettings] = await Promise.all([
    fetchBranchById(supabase, branchId),
    fetchBranchSettings(supabase, branchId),
  ]);

  const timezone = branch?.timezone ?? DEFAULT_BRANCH_TIMEZONE;
  const currencyCode = branch?.currency_code ?? DEFAULT_CURRENCY_CODE;
  const today = formatDateInTimeZone(new Date(), timezone);

  const laundryStuckThresholdDays =
    branchSettings?.laundry_stuck_threshold_days && branchSettings.laundry_stuck_threshold_days > 0
      ? Math.floor(branchSettings.laundry_stuck_threshold_days)
      : DEFAULT_LAUNDRY_STUCK_THRESHOLD_DAYS;

  const staleBefore = new Date(Date.now() - laundryStuckThresholdDays * 86_400_000).toISOString();

  const [rangeOrders, overdueOrders, stuckItems] = await Promise.all([
    fetchOrdersInRange(supabase, {
      branchId,
      startDate: options.query.startDate,
      endDate: options.query.endDate,
    }),
    fetchOverdueOrders(supabase, {
      branchId,
      today,
      limit: 10,
    }),
    fetchStuckItems(supabase, {
      branchId,
      staleBeforeIso: staleBefore,
      limit: 10,
    }),
  ]);

  const customerIds = Array.from(
    new Set([...rangeOrders, ...overdueOrders].map((row) => row.customer_id))
  );

  const customerById = await fetchCustomersByIds(supabase, customerIds);

  return {
    branchId,
    timezone,
    currencyCode,
    startDate: options.query.startDate,
    endDate: options.query.endDate,
    today,
    events: mapEvents({
      orders: rangeOrders,
      customerById,
      startDate: options.query.startDate,
      endDate: options.query.endDate,
      today,
    }),
    reminders: {
      overdueOrders: mapOverdueReminderRows({
        orders: overdueOrders,
        customerById,
        today,
      }),
      stuckItems: mapStuckItems(stuckItems),
      laundryStuckThresholdDays,
    },
  };
}