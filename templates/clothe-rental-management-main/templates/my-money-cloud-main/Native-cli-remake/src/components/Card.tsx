import { StyleSheet, type ViewProps } from "react-native";
import { ThemedView } from "@/components/ThemedView";

type CardProps = ViewProps;

export function Card({ style, ...props }: CardProps) {
  return <ThemedView variant="card" style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
  },
});
