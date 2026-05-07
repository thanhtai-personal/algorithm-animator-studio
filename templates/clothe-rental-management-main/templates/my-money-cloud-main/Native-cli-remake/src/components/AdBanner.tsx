import { StyleSheet, View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { observer } from "mobx-react-lite";
import { getBannerAdUnitId } from "@/lib/admob";
import { adStore } from "@/features/ads/stores/adStore";

type AdBannerProps = {
  position: "top" | "bottom";
};

export const AdBanner = observer(({ position }: AdBannerProps) => {
  const insets = useSafeAreaInsets();
  if (adStore.isAdFree) return null;
  const unitId = getBannerAdUnitId();
  const BannerComponent: any = BannerAd as any;
  const isValidComponent =
    typeof BannerComponent === "function" || Boolean(BannerComponent && (BannerComponent as any).$$typeof);
  if (!isValidComponent || !(BannerAdSize as any)?.BANNER) return null;

  return (
    <View
      style={[
        styles.container,
        position === "top" ? styles.top : styles.bottom,
        position === "top" ? { paddingTop: insets.top } : { paddingBottom: insets.bottom },
      ]}
    >
      <BannerComponent unitId={unitId} size={BannerAdSize.BANNER} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  top: {
    paddingTop: 6,
    paddingBottom: 6,
  },
  bottom: {
    paddingTop: 6,
    paddingBottom: 6,
  },
});
