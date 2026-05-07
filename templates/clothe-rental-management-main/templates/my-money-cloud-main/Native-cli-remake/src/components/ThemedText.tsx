import { Text, type TextProps } from "react-native";
import { useTheme } from "@/lib/themeProvider";

type Tone = "default" | "muted" | "danger";

type ThemedTextProps = TextProps & {
  tone?: Tone;
};

export function ThemedText({ style, tone = "default", ...props }: ThemedTextProps) {
  const { colors } = useTheme();
  const color =
    tone === "muted" ? colors.mutedText : tone === "danger" ? colors.danger : colors.text;
  return <Text style={[{ color }, style]} {...props} />;
}
