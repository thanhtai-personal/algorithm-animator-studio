import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { platformApiService } from "@/features/platform/services/platformApiService";
import { zaloSdkService } from "@/features/platform/services/zaloSdkService";
import { zaloPlatformStore } from "@/features/platform/stores/zaloPlatformStore";

export const zaloPlatformQueryKeys = {
  all: ["zalo-platform"] as const,
  config: () => [...zaloPlatformQueryKeys.all, "config"] as const,
  userInfo: () => [...zaloPlatformQueryKeys.all, "user-info"] as const,
};

export function useZaloConfigQuery() {
  const query = useQuery({
    queryKey: zaloPlatformQueryKeys.config(),
    queryFn: () => platformApiService.fetchConfig(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!query.data) return;
    zaloPlatformStore.hydrateConfig(query.data);
  }, [query.data]);

  return query;
}

export function useZaloUserInfoQuery(enabled: boolean) {
  const query = useQuery({
    queryKey: zaloPlatformQueryKeys.userInfo(),
    queryFn: () => zaloSdkService.getUserInfo(),
    enabled,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (query.data === undefined) return;
    zaloPlatformStore.hydrateUserInfo(query.data);
  }, [query.data]);

  return query;
}

export function useZaloAuthorizeMutation() {
  return useMutation({
    mutationFn: () => zaloSdkService.authorize({ scopes: ["scope.userInfo"] }),
    onSuccess: (result) => {
      zaloPlatformStore.hydrateAuth(result);
    },
  });
}
