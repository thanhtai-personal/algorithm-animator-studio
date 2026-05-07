import { PropsWithChildren } from "react";
import { observer } from "mobx-react-lite";
import { useZaloPlatformBootstrap } from "@/features/platform/hooks/useZaloPlatformBootstrap";

export const ZaloPlatformGate = observer(function ZaloPlatformGate({
  children,
}: PropsWithChildren) {
  const { configQuery, platformState } = useZaloPlatformBootstrap();

  if (configQuery.isLoading && !configQuery.data) {
    return <section className="card">Đang tải cấu hình mini app...</section>;
  }

  if (configQuery.isError || !configQuery.data) {
    return <section className="card error">Không tải được cấu hình mini app.</section>;
  }

  if (!configQuery.data.enabled) {
    return <section className="card">Mini app đang tắt bởi feature flag.</section>;
  }

  if (!platformState.isReady) {
    return <section className="card">Đang khởi tạo mini app...</section>;
  }

  return <>{children}</>;
});
