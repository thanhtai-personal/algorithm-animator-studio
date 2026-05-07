import { ActivityIndicator, StyleSheet, View } from "react-native";
import { observer } from "mobx-react-lite";
import { useAuthGate } from "@/features/auth/hooks/useAuthGate";

export const AuthGate = observer(({ children }: { children: React.ReactNode }) => {
  const { isWaiting } = useAuthGate();

  return (
    <>
      {children}
      {isWaiting ? (
        <View style={styles.overlay}>
          <ActivityIndicator />
        </View>
      ) : null}
    </>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
});
