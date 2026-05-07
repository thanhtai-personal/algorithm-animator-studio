import { DashboardOverviewQuery, DashboardOverviewResponse, DashboardKpiDto } from "@/types/dashboardOverview";
import { SupabaseClient } from "@supabase/supabase-js";
import { isStaffRole, isManagerPlusRole, sanitizeText, normalizeBranchTimeZone, formatDateInTimeZone, buildTodayUtcRange, roundMoney, mapRecentActivities, mapOrderRows } from "..";
import { getMakeupModuleMetricsByBranchAndDay } from "../../makeupStats";
import { FINANCIAL_FORMULA_VERSION } from "../../orderFinance";
import { DEFAULT_CURRENCY } from "../constants";
import { DashboardDomainError } from "../DashboardDomainError";
import { computeOutstandingDebtTotal } from "./computeOutstandingDebtTotal";
import { fetchActorBranchAccessIds } from "./fetchActorBranchAccessIds";
import { fetchActorProfile } from "./fetchActorProfile";
import { fetchBranchById } from "./fetchBranchById";
import { fetchCustomersByIds } from "./fetchCustomersByIds";
import { fetchDueTodayCount } from "./fetchDueTodayCount";
import { fetchDueTodayOrders } from "./fetchDueTodayOrders";
import { fetchInitialCapitalAndImportOrderTotals } from "./fetchInitialCapitalAndImportOrderTotals";
import { fetchLaundryItemsCount } from "./fetchLaundryItemsCount";
import { fetchOverdueCount } from "./fetchOverdueCount";
import { fetchOverdueOrders } from "./fetchOverdueOrders";
import { fetchProfileNames } from "./fetchProfileNames";
import { fetchRecentAuditEvents } from "./fetchRecentAuditEvents";
import { fetchRentalSaleOrderCountByDay } from "./fetchRentalSaleOrderCountByDay";
import { fetchReservedPickupOverdueCount } from "./fetchReservedPickupOverdueCount";
import { fetchReservedPickupTodayCount } from "./fetchReservedPickupTodayCount";
import { fetchRevenueToday } from "./fetchRevenueToday";
import { fetchSoldItemsTotalCount } from "./fetchSoldItemsTotalCount";
import { resolveSingleBranchScope } from "./resolveSingleBranchScope";
import { fetchOrdersCountByStatus } from "./fetchOrdersCountByStatus";

export async function getDashboardOverviewForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: DashboardOverviewQuery;
  },
): Promise<DashboardOverviewResponse> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new DashboardDomainError("FORBIDDEN_MANAGER_ACTION", {
      reason: "missing-actor-profile",
    });
  }

  // Keep non-staff query behavior branch-safe in dashboard context.
  if (
    actor.role &&
    !isStaffRole(actor.role) &&
    !isManagerPlusRole(actor.role) &&
    actor.role !== "accountant"
  ) {
    throw new DashboardDomainError("FORBIDDEN_MANAGER_ACTION", {
      reason: "unsupported-role",
      role: actor.role,
    });
  }

  const allowedBranchIds = await fetchActorBranchAccessIds(
    supabase,
    actor.id,
    actor.default_branch_id,
  );

  const branchId = resolveSingleBranchScope({
    actor,
    allowedBranchIds,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  const branch = await fetchBranchById(supabase, branchId);
  const timeZone = normalizeBranchTimeZone(branch?.timezone);
  const currencyCode = sanitizeText(branch?.currency_code) ?? DEFAULT_CURRENCY;

  const today = formatDateInTimeZone(new Date(), timeZone);
  const { startIso, endExclusiveIso } = buildTodayUtcRange({
    today,
    timeZone,
  });

  const [
    revenueTodaySummary,
    soldItemsTotal,
    rentalSaleOrderCount,
    ordersOnRent,
    ordersReserved,
    reservedPickupToday,
    reservedPickupOverdue,
    itemsInLaundry,
    dueTodayCount,
    overdueCount,
    dueTodayRows,
    overdueRows,
    auditRows,
    initialCapitalAndImportTotals,
    outstandingDebtTotal,
  ] = await Promise.all([
    fetchRevenueToday(supabase, {
      branchId,
      startIso,
      endExclusiveIso,
    }),
    fetchSoldItemsTotalCount(supabase, branchId),
    fetchRentalSaleOrderCountByDay(supabase, {
      branchId,
      startIso,
      endExclusiveIso,
    }),
    fetchOrdersCountByStatus(supabase, {
      branchId,
      status: "PICKED_UP",
    }),
    fetchOrdersCountByStatus(supabase, {
      branchId,
      status: "RESERVED",
    }),
    fetchReservedPickupTodayCount(supabase, {
      branchId,
      today,
    }),
    fetchReservedPickupOverdueCount(supabase, {
      branchId,
      today,
    }),
    fetchLaundryItemsCount(supabase, branchId),
    fetchDueTodayCount(supabase, {
      branchId,
      today,
    }),
    fetchOverdueCount(supabase, {
      branchId,
      today,
    }),
    fetchDueTodayOrders(supabase, {
      branchId,
      today,
      limit: 16,
    }),
    fetchOverdueOrders(supabase, {
      branchId,
      today,
      limit: 16,
    }),
    fetchRecentAuditEvents(supabase, {
      branchId,
      limit: 16,
    }),
    fetchInitialCapitalAndImportOrderTotals(supabase, branchId),
    computeOutstandingDebtTotal(supabase, branchId),
  ]);

  const makeupMetrics = await getMakeupModuleMetricsByBranchAndDay(supabase, {
    branchId,
    day: today,
  });

  const moduleMetrics: DashboardKpiDto["moduleMetrics"] = [
    {
      module: "ALL_MODULES",
      revenue: roundMoney(
        revenueTodaySummary.revenueToday + makeupMetrics.revenue,
      ),
      profit: roundMoney(
        revenueTodaySummary.grossProfitToday + makeupMetrics.profit,
      ),
      orderCount: rentalSaleOrderCount + makeupMetrics.orderCount,
    },
    {
      module: "RENTAL_SALE_MODULE",
      revenue: revenueTodaySummary.revenueToday,
      profit: revenueTodaySummary.grossProfitToday,
      orderCount: rentalSaleOrderCount,
    },
    {
      module: "MAKEUP_MODULE",
      revenue: makeupMetrics.revenue,
      profit: makeupMetrics.profit,
      orderCount: makeupMetrics.orderCount,
    },
  ];

  const customerIds = Array.from(
    new Set([...dueTodayRows, ...overdueRows].map((row) => row.customer_id)),
  );
  const actorIds: any = Array.from(
    new Set(
      auditRows
        .map((row: any) => row.actor_profile_id)
        .filter((value: any): value is string => Boolean(value)),
    ),
  );

  const [customerById, actorById] = await Promise.all([
    fetchCustomersByIds(supabase, {
      branchId,
      customerIds,
    }),
    fetchProfileNames(supabase, actorIds),
  ]);

  const dueTodayOrders = mapOrderRows(dueTodayRows, customerById);
  const overdueOrders = mapOrderRows(overdueRows, customerById);

  const kpi: DashboardKpiDto = {
    branchId,
    timezone: timeZone,
    currencyCode,
    today,
    revenueToday: revenueTodaySummary.revenueToday,
    revenueGrossToday: revenueTodaySummary.revenueGrossToday,
    refundEffectiveToday: revenueTodaySummary.refundEffectiveToday,
    cogsToday: revenueTodaySummary.cogsToday,
    grossProfitToday: revenueTodaySummary.grossProfitToday,
    profitMarginToday: revenueTodaySummary.profitMarginToday,
    salesProfitToday: revenueTodaySummary.salesProfitToday,
    realProfitToday: revenueTodaySummary.realProfitToday,
    realInflowToday: revenueTodaySummary.realInflowToday,
    realOutflowToday: revenueTodaySummary.realOutflowToday,
    depositCollectedToday: revenueTodaySummary.depositCollectedToday,
    depositRefundedToday: revenueTodaySummary.depositRefundedToday,
    initialCapitalInflowTotal:
      initialCapitalAndImportTotals.initialCapitalInflowTotal,
    initialCapitalOutflowTotal:
      initialCapitalAndImportTotals.initialCapitalOutflowTotal,
    initialCapitalNetTotal:
      initialCapitalAndImportTotals.initialCapitalNetTotal,
    importOrderExpenseTotal:
      initialCapitalAndImportTotals.importOrderExpenseTotal,
    outstandingDebtTotal,
    financialFormulaVersion: FINANCIAL_FORMULA_VERSION,
    soldItemsTotal,
    ordersOnRent,
    ordersReserved,
    reservedPickupToday,
    reservedPickupOverdue,
    dueToday: dueTodayCount,
    overdue: overdueCount,
    itemsInLaundry,
    moduleMetrics,
  };

  return {
    kpi,
    dueTodayOrders,
    overdueOrders,
    recentActivities: mapRecentActivities(auditRows, actorById),
  };
}