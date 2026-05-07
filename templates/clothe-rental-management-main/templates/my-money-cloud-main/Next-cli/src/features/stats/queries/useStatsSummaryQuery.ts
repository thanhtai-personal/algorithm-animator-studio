"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { statsStore } from "@/store/statsStore";
import { fetchStatsSummary } from "@/features/stats/services/statsService";

export function useStatsSummaryQuery(enabled = true) {
  const query = useQuery({
    queryKey: ["stats", "summary"],
    queryFn: fetchStatsSummary,
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.isSuccess && query.data) {
      statsStore.setSummary(query.data);
    }
    if (query.isError && query.error) {
      statsStore.setError(query.error instanceof Error ? query.error.message : "Failed to fetch stats summary");
    }
    statsStore.setLoading(query.isFetching);
  }, [query.isSuccess, query.data, query.isError, query.error, query.isFetching]);

  return query;
}
