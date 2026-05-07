import { useEffect } from "react";
import { useZaloConfigQuery, useZaloUserInfoQuery } from "@/features/platform/queries/useZaloPlatformQueries";
import { zaloSdkService } from "@/features/platform/services/zaloSdkService";
import { zaloPlatformStore } from "@/features/platform/stores/zaloPlatformStore";

export function useZaloPlatformBootstrap() {
  const configQuery = useZaloConfigQuery();

  useEffect(() => {
    const supported = zaloSdkService.isSupported();
    zaloPlatformStore.setSdkSupport(supported);
  }, []);

  const userInfoQuery = useZaloUserInfoQuery(
    Boolean(configQuery.data?.enabled && zaloPlatformStore.isSupported)
  );

  useEffect(() => {
    if (configQuery.isLoading) return;
    zaloPlatformStore.setReady(true);
  }, [configQuery.isLoading]);

  return {
    configQuery,
    userInfoQuery,
    platformState: zaloPlatformStore,
  };
}
