import { View, StyleSheet, type ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Size = "sm" | "md" | "lg";

type Props = {
  icon: string;
  color: string;
  size?: Size;
  style?: ViewStyle;
};

const ICON_MAP: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  UtensilsCrossed: "silverware-fork-knife",
  Car: "car",
  ShoppingBag: "shopping",
  Gamepad2: "gamepad-variant",
  Heart: "heart",
  Receipt: "receipt",
  GraduationCap: "school",
  MoreHorizontal: "dots-horizontal",
  Wallet: "wallet",
  Gift: "gift",
  TrendingUp: "trending-up",
  Plus: "plus",
  Plane: "airplane",
  Home: "home",
  PiggyBank: "piggy-bank",
  Coffee: "coffee",
  Briefcase: "briefcase",
  Sparkles: "star-four-points",
  Music4: "music",
  Activity: "pulse",
  Coins: "cash",
};

const COLOR_MAP: Record<string, string> = {
  "category-food": "hsl(15, 90%, 60%)",
  "category-transport": "hsl(210, 80%, 55%)",
  "category-shopping": "hsl(280, 70%, 60%)",
  "category-entertainment": "hsl(330, 75%, 60%)",
  "category-health": "hsl(145, 65%, 50%)",
  "category-bills": "hsl(35, 85%, 55%)",
  "category-education": "hsl(200, 75%, 55%)",
  "category-other": "hsl(220, 20%, 60%)",
};

const SIZE_MAP: Record<Size, number> = {
  sm: 32,
  md: 44,
  lg: 56,
};

const ICON_SIZE: Record<Size, number> = {
  sm: 16,
  md: 22,
  lg: 28,
};

export function resolveCategoryColorValue(color?: string | null, fallback?: string) {
  if (!color) return fallback ?? "hsl(220, 20%, 60%)";
  return COLOR_MAP[color] ?? color;
}

export function CategoryIcon({ icon, color, size = "md", style }: Props) {
  const resolvedColor = resolveCategoryColorValue(color, "hsl(220, 20%, 60%)");
  const iconName = ICON_MAP[icon] ?? "dots-horizontal";
  const boxSize = SIZE_MAP[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: boxSize,
          height: boxSize,
          borderRadius: Math.round(boxSize * 0.3),
          backgroundColor: resolvedColor,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons name={iconName} size={ICON_SIZE[size]} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
