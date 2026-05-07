import { PropsWithChildren } from "react";
import { observer } from "mobx-react-lite";
import { useZaloPlatformBootstrap } from "@/features/platform/hooks/useZaloPlatformBootstrap";

export const ZaloPlatformGate = observer(function ZaloPlatformGate({
  children,
}: PropsWithChildren) {
  const { configQuery, platformState } = useZaloPlatformBootstrap();

  if (configQuery.isLoading && !configQuery.data) {
    return <section className="zalo-card">Dang tai cau hinh mini app...</section>;
  }

  if (configQuery.isError || !configQuery.data) {
    return <section className="zalo-card error">Khong tai duoc cau hinh mini app.</section>;
  }

  if (!configQuery.data.enabled) {
    return <section className="zalo-card">Mini app dang duoc tat boi feature flag.</section>;
  }

  if (!platformState.isReady) {
    return <section className="zalo-card">Dang khoi tao mini app...</section>;
  }

  return <>{children}</>;
});
