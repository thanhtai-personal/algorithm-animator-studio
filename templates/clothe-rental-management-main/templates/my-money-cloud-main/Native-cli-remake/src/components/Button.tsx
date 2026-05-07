import { Pressable, StyleSheet, Text, type PressableProps, ActivityIndicator } from "react-native";
import { useTheme } from "@/lib/themeProvider";

type Variant = "primary" | "outline" | "ghost";

type ButtonProps = PressableProps & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
};

export function Button({
  title,
  variant = "primary",
  loading,
  backgroundColor,
  textColor,
  borderColor,
  style,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";
  const resolvedBackground = backgroundColor ?? (isGhost ? "transparent" : isOutline ? "transparent" : colors.primary);
  const resolvedBorder = borderColor ?? (isOutline ? colors.border : "transparent");
  const resolvedText = textColor ?? (isOutline || isGhost ? colors.text : colors.background);

  return (
    <Pressable
      style={[
        styles.base,
        { backgroundColor: resolvedBackground, borderColor: resolvedBorder, borderWidth: isOutline ? 1 : 0 },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={resolvedText} />
      ) : (
        <Text style={[styles.text, { color: resolvedText }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "600",
  },
});
