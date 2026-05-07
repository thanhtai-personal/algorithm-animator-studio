import { PropsWithChildren, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { zaloMiniAppAuthStore } from "@/features/auth/stores/zaloMiniAppAuthStore";
import { useZaloPlatformBootstrap } from "@/features/platform/hooks/useZaloPlatformBootstrap";

const CONFIG_LOAD_ERROR_MESSAGE = "Không tải được cấu hình mini app. Vui lòng đăng nhập lại.";

export const ZaloPlatformGate = observer(function ZaloPlatformGate({
  children,
}: PropsWithChildren) {
  const { configQuery, platformState } = useZaloPlatformBootstrap();
  const hasConfigLoadError = configQuery.isError || (!configQuery.isLoading && !configQuery.data);

  useEffect(() => {
    if (!hasConfigLoadError) {
      if (zaloMiniAppAuthStore.errorMessage === CONFIG_LOAD_ERROR_MESSAGE) {
        zaloMiniAppAuthStore.clearError();
      }
      return;
    }

    if (zaloMiniAppAuthStore.isAuthenticated) {
      zaloMiniAppAuthStore.setSession(null);
    }
    if (zaloMiniAppAuthStore.errorMessage !== CONFIG_LOAD_ERROR_MESSAGE) {
      zaloMiniAppAuthStore.setErrorMessage(CONFIG_LOAD_ERROR_MESSAGE);
    }
  }, [hasConfigLoadError]);

  if (configQuery.isLoading && !configQuery.data) {
    return <section className="zalo-card">Đang tải cấu hình mini app...</section>;
  }

  if (hasConfigLoadError) {
    return <>{children}</>;
  }

  if (!configQuery.data?.enabled) {
    return <section className="zalo-card">Mini app đang được tắt bởi feature flag.</section>;
  }

  if (!platformState.isReady) {
    return <section className="zalo-card">Đang khởi tạo mini app...</section>;
  }

  return <>{children}</>;
});
