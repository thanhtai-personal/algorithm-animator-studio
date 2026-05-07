import { TextInput, type TextInputProps, StyleSheet } from "react-native";
import { useTheme } from "@/lib/themeProvider";

export function TextField({ style, ...props }: TextInputProps) {
  const { colors } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.mutedText}
      style={[
        styles.input,
        { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});
