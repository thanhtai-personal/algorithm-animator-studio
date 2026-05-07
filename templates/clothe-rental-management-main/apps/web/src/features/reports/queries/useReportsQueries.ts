"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { reportsClientService } from "@/features/reports/services/reportsClientService";
import { reportsStore } from "@/features/reports/stores/reportsStore";
import type {
  IncidentsReportQuery,
  RevenueReportQuery,
  UtilizationReportQuery,
} from "@/types/reportsModule";

const reportsQueryKeys = {
  all: ["reports"] as const,
  revenues: () => [...reportsQueryKeys.all, "revenue"] as const,
  revenue: (query: RevenueReportQuery) =>
    [
      ...reportsQueryKeys.revenues(),
      query.branchId ?? "",
      query.startDate ?? "",
      query.endDate ?? "",
      query.granularity ?? "day",
    ] as const,
  utilizations: () => [...reportsQueryKeys.all, "utilization"] as const,
  utilization: (query: UtilizationReportQuery) =>
    [...reportsQueryKeys.utilizations(), query.branchId ?? ""] as const,
  incidents: () => [...reportsQueryKeys.all, "incidents"] as const,
  incident: (query: IncidentsReportQuery) =>
    [
      ...reportsQueryKeys.incidents(),
      query.branchId ?? "",
      query.startDate ?? "",
      query.endDate ?? "",
      query.type ?? "",
    ] as const,
};

export function useRevenueReportQuery(query: RevenueReportQuery) {
  const queryResult = useQuery({
    queryKey: reportsQueryKeys.revenue(query),
    queryFn: () => reportsClientService.fetchRevenueReport(query),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    reportsStore.hydrateRevenueReport(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useExportRevenueCsvMutation() {
  return useMutation({
    mutationFn: (query: RevenueReportQuery) => reportsClientService.exportRevenueCsv(query),
  });
}

export function useUtilizationReportQuery(query: UtilizationReportQuery) {
  const queryResult = useQuery({
    queryKey: reportsQueryKeys.utilization(query),
    queryFn: () => reportsClientService.fetchUtilizationReport(query),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    reportsStore.hydrateUtilizationReport(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useExportUtilizationCsvMutation() {
  return useMutation({
    mutationFn: (query: UtilizationReportQuery) => reportsClientService.exportUtilizationCsv(query),
  });
}

export function useIncidentsReportQuery(query: IncidentsReportQuery) {
  const queryResult = useQuery({
    queryKey: reportsQueryKeys.incident(query),
    queryFn: () => reportsClientService.fetchIncidentsReport(query),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    reportsStore.hydrateIncidentsReport(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useExportIncidentsCsvMutation() {
  return useMutation({
    mutationFn: (query: IncidentsReportQuery) => reportsClientService.exportIncidentsCsv(query),
  });
}

export { reportsQueryKeys };
