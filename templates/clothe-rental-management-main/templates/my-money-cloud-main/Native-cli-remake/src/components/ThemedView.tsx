import { View, type ViewProps, StyleSheet } from "react-native";
import { observer } from "mobx-react-lite";
import { useTheme } from "@/lib/themeProvider";
import { AdBanner } from "@/components/AdBanner";
import { adStore } from "@/features/ads/stores/adStore";

type Variant = "card" | "plain";

type ThemedViewProps = ViewProps & {
  variant?: Variant;
};

type ScreenViewMode = "with-ads" | "ad-free";

type ScreenViewProps = ViewProps;

function resolveColors(theme: ReturnType<typeof useTheme> | null | undefined) {
  return (
    theme?.colors ??
    ({
      background: "#ffffff",
      card: "#f9fafb",
      text: "#111827",
      mutedText: "#6b7280",
      border: "#e5e7eb",
      primary: "#111827",
      danger: "#b91c1c",
    } as const)
  );
}

const ScreenViewBase = observer(function ScreenViewBase({
  style,
  children,
  mode,
  ...props
}: ScreenViewProps & { mode: ScreenViewMode }) {
  const theme = useTheme();
  const colors = resolveColors(theme);
  const backgroundColor = colors.background;

  if (mode === "with-ads" && !adStore.isAdFree) {
    return (
      <View style={[styles.screen, { backgroundColor }, style]} {...props}>
        <AdBanner position="top" />
        <View style={styles.content}>{children}</View>
        <AdBanner position="bottom" />
      </View>
    );
  }

  return (
    <View style={[{ backgroundColor }, style]} {...props}>
      {children}
    </View>
  );
});

export function ScreenView(props: ScreenViewProps) {
  return <ScreenViewBase {...props} mode="with-ads" />;
}

export function AdFreeScreenView(props: ScreenViewProps) {
  return <ScreenViewBase {...props} mode="ad-free" />;
}

export const ThemedView = observer(function ThemedView({
  style,
  variant = "plain",
  children,
  ...props
}: ThemedViewProps) {
  const theme = useTheme();
  const colors = resolveColors(theme);
  const backgroundColor = variant === "card" ? colors.card : "transparent";
  return (
    <View style={[{ backgroundColor }, style]} {...props}>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
