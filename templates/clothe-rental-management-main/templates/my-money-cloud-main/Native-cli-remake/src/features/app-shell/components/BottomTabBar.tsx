import { useMemo, useState } from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { observer } from "mobx-react-lite";

import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/themeProvider";
import { THEME_VARIANTS, DEFAULT_THEME_VARIANT } from "@/constants/themeVariant";
import { homeUiStore } from "@/features/dashboard/stores/homeUiStore";
import { appShellStore } from "@/features/app-shell/stores/appShellStore";

const BAR_HEIGHT = 90;
const NOTCH_WIDTH = 140;
const NOTCH_DEPTH = 56;
const TOP_EDGE = 10;
const BUTTON_SIZE = 56;
const BUTTON_LIFT = 30;

function buildNotchPath(width: number) {
  const safeWidth = Math.max(width, NOTCH_WIDTH + 60);
  const leftX = (safeWidth - NOTCH_WIDTH) / 2;
  const rightX = leftX + NOTCH_WIDTH;
  const centerX = safeWidth / 2;
  const valleyY = TOP_EDGE + NOTCH_DEPTH;
  const curve = NOTCH_WIDTH * 0.25;

  return [
    `M0 ${TOP_EDGE}`,
    `H${leftX.toFixed(2)}`,
    `C${(leftX + curve).toFixed(2)} ${TOP_EDGE}`,
    `${(centerX - curve).toFixed(2)} ${valleyY.toFixed(2)}`,
    `${centerX.toFixed(2)} ${valleyY.toFixed(2)}`,
    `C${(centerX + curve).toFixed(2)} ${valleyY.toFixed(2)}`,
    `${(rightX - curve).toFixed(2)} ${TOP_EDGE}`,
    `${rightX.toFixed(2)} ${TOP_EDGE}`,
    `H${safeWidth.toFixed(2)}`,
    `V${BAR_HEIGHT}`,
    "H0",
    "Z",
  ].join(" ");
}

const TAB_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "home-outline",
  stats: "stats-chart-outline",
  store: "cart-outline",
  profile: "person-outline",
};

export const BottomTabBar = observer(function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useI18n();
  const { colors, variant } = useTheme();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);

  const palette = useMemo(() => {
    const stored = variant ?? DEFAULT_THEME_VARIANT;
    return THEME_VARIANTS.find((item) => item.id === stored) ?? THEME_VARIANTS[0];
  }, [variant]);

  const tabBarBg = palette.preview.nav;
  const tabBarWave = palette.preview.primary;

  const routes = useMemo(
    () => state.routes.filter((route) => route.name !== "add"),
    [state.routes]
  );
  const leftTabs = routes.slice(0, 2);
  const rightTabs = routes.slice(2);
  const valleyY = TOP_EDGE + NOTCH_DEPTH;
  const buttonTop = valleyY - BUTTON_SIZE / 2 - BUTTON_LIFT;

  const labelMap: Record<string, string> = {
    index: t("tabs.home"),
    stats: t("tabs.stats"),
    store: t("tabs.store"),
    profile: t("tabs.settings"),
  };

  const renderTab = (route: typeof state.routes[number]) => {
    const { options } = descriptors[route.key];
    const label =
      labelMap[route.name] ??
      options.tabBarLabel?.toString() ??
      options.title ??
      route.name;
    const isFocused = state.index === state.routes.findIndex((r) => r.key === route.key);
    const iconName = TAB_ICON[route.name] ?? "ellipse-outline";
    const color = isFocused ? colors.primary : colors.mutedText;

    const onPress = () => {
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name as never);
      }
    };

    return (
      <Pressable key={route.key} onPress={onPress} style={styles.tabButton}>
        <Ionicons name={iconName} size={20} color={color} />
        <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    );
  };

  const handleAddPress = () => {
    const route = state.routes.find((r) => r.name === "index");
    if (route) {
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!event.defaultPrevented) {
        navigation.navigate("index" as never);
      }
    }
    homeUiStore.openAudioForm();
  };

  const isAIModeOn = appShellStore.homeAIMode;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View
        style={[styles.barShell, { height: BAR_HEIGHT }]}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        {width > 0 ? (
          <Svg width={width} height={BAR_HEIGHT} style={styles.shape} pointerEvents="none">
            <Path d={buildNotchPath(width)} fill={tabBarBg} />
          </Svg>
        ) : null}
        <Svg
          width={width}
          height={28}
          style={styles.wave}
          pointerEvents="none"
          viewBox="0 0 120 28"
          preserveAspectRatio="none"
        >
          <Path
            d="M0 12 C18 0 36 20 54 12 C72 4 90 22 108 12 C116 8 120 10 120 10 L120 28 L0 28 Z"
            fill={tabBarWave}
            opacity={0.18}
          />
        </Svg>

        <View style={styles.tabRow}>
          <View style={styles.tabGroup}>{leftTabs.map(renderTab)}</View>
          <View style={styles.centerGap} />
          <View style={styles.tabGroup}>{rightTabs.map(renderTab)}</View>
        </View>
      </View>
      <View style={[styles.safeArea, { height: insets.bottom, backgroundColor: tabBarBg }]} />

      <Pressable
        onPress={handleAddPress}
        style={[
          styles.centerButton,
          {
            top: buttonTop,
            borderColor: tabBarBg,
            backgroundColor: colors.primary,
          },
        ]}
      >
        {isAIModeOn ? (
          <View style={[styles.aiBadge, { backgroundColor: colors.background }]}>
            <Text style={[styles.aiBadgeText, { color: colors.primary }]}>AI</Text>
          </View>
        ) : null}
        <Ionicons name="mic" size={24} color={colors.background} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  barShell: {
    position: "relative",
    overflow: "visible",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 12,
    elevation: 12,
  },
  shape: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  wave: {
    position: "absolute",
    left: 0,
    bottom: 0,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 24,
    paddingBottom: 18,
  },
  tabGroup: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-evenly",
    gap: 4,
  },
  centerGap: {
    width: 64,
  },
  tabButton: {
    minWidth: 72,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  centerButton: {
    position: "absolute",
    left: "50%",
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    marginLeft: -BUTTON_SIZE / 2,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 16,
  },
  aiBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  safeArea: {
    width: "100%",
  },
});
