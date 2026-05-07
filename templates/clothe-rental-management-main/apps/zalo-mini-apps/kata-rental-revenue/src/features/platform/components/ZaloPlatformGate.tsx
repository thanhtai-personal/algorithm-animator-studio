import { PropsWithChildren } from "react";
import { observer } from "mobx-react-lite";
import { LoadingStateCard } from "@/components/feedback/LoadingStateCard";
import { useZaloPlatformBootstrap } from "@/features/platform/hooks/useZaloPlatformBootstrap";

export const ZaloPlatformGate = observer(function ZaloPlatformGate({
  children,
}: PropsWithChildren) {
  const { configQuery, platformState } = useZaloPlatformBootstrap();

  if (configQuery.isLoading && !configQuery.data) {
    return <LoadingStateCard message="Đang tải cấu hình mini app..." />;
  }

  if (configQuery.isError || !configQuery.data) {
    return <section className="zalo-card error">Không tải được cấu hình mini app.</section>;
  }

  if (!configQuery.data.enabled) {
    return <section className="zalo-card">Mini app đang được tắt bởi feature flag.</section>;
  }

  if (!platformState.isReady) {
    return <LoadingStateCard message="Đang khởi tạo mini app..." />;
  }

  return <>{children}</>;
});
