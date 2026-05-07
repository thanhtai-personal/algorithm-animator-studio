"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardClientService } from "@/features/dashboard/services/dashboardClientService";
import { dashboardStore } from "@/features/dashboard/stores/dashboardStore";
import type { DashboardOverviewQuery } from "@/types/dashboardOverview";
import type { RevenueReportQuery } from "@/types/reportsModule";

const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  overviews: () => [...dashboardQueryKeys.all, "overview"] as const,
  overview: (query: DashboardOverviewQuery) =>
    [...dashboardQueryKeys.overviews(), query.branchId ?? ""] as const,
  financialReports: () => [...dashboardQueryKeys.all, "financial-revenue"] as const,
  financialReport: (query: RevenueReportQuery) =>
    [
      ...dashboardQueryKeys.financialReports(),
      query.branchId ?? "",
      query.startDate ?? "",
      query.endDate ?? "",
      query.granularity ?? "day",
    ] as const,
};

export function useDashboardOverviewQuery(query: DashboardOverviewQuery) {
  const queryResult = useQuery({
    queryKey: dashboardQueryKeys.overview(query),
    queryFn: () => dashboardClientService.fetchOverview(query),
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    dashboardStore.hydrateOverview(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useDashboardFinancialRevenueReportQuery(query: RevenueReportQuery) {
  const queryResult = useQuery({
    queryKey: dashboardQueryKeys.financialReport(query),
    queryFn: () => dashboardClientService.fetchFinancialRevenueReport(query),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    dashboardStore.hydrateFinancialRevenueReport(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useQuickReturnOrderMutation(branchId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => dashboardClientService.quickReturnOrder(orderId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.overview({ branchId }),
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.financialReports(),
        }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
      ]);
    },
  });
}

export { dashboardQueryKeys };
