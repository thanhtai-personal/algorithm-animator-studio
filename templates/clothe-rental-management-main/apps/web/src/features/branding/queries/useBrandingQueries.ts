"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { brandingClientService } from "@/features/branding/services/brandingClientService";
import { brandingStore } from "@/features/branding/stores/brandingStore";

const brandingQueryKeys = {
  all: ["branding"] as const,
  public: () => [...brandingQueryKeys.all, "public"] as const,
};

export function usePublicBrandingQuery() {
  const query = useQuery({
    queryKey: brandingQueryKeys.public(),
    queryFn: () => brandingClientService.fetchPublicBranding(),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!query.data) return;
    brandingStore.hydratePublicBranding(query.data);
  }, [query.data]);

  return query;
}
