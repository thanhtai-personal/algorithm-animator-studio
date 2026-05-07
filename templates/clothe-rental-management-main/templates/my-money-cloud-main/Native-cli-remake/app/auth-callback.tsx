import { useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuthActions } from "@/features/auth/hooks/login/useAuthActions";
import * as Linking from "expo-linking";

export default function AuthCallbackScreen() {
  const { completeOAuth } = useAuthActions();
  const handledRef = useRef(false);

  const handleUrl = useCallback(
    (url: string | null | undefined) => {
      if (!url || handledRef.current) return;
      handledRef.current = true;
      void completeOAuth(url);
    },
    [completeOAuth]
  );

  useEffect(() => {
    Linking.getInitialURL()
      .then((url) => handleUrl(url))
      .catch(() => {});
    const subscription = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => {
      subscription.remove();
    };
  }, [handleUrl]);

  return (
    <View style={styles.container}>
      <ActivityIndicator />
      <Text style={styles.subtitle}>Completing sign-in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
