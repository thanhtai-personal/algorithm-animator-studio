import { useState } from "react";
import { StyleSheet } from "react-native";
import { useAuthActions } from "@/features/auth/hooks/login/useAuthActions";
import { useI18n } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ScreenView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { useRouter } from "expo-router";
import type { FormState } from "@/features/auth/types/authScreen";

export function AuthScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { handleSubmit: submitAuth, handleGoogleSignIn, handleGuestSignIn } = useAuthActions();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) return;
    const form: FormState = {
      email,
      password,
      confirmPassword: password,
      displayName: "",
      phone: "",
      resetPassword: "",
      resetConfirmPassword: "",
    };
    await submitAuth("signIn", form, loading, setLoading);
  };

  if (!isSupabaseConfigured) {
    return (
      <ScreenView style={styles.container}>
        <ThemedText style={styles.title}>{t("auth.missingConfigTitle")}</ThemedText>
        <ThemedText tone="muted" style={styles.subtitle}>
          {t("auth.missingConfigSubtitle")}
        </ThemedText>
        <Button title={t("auth.skipLogin")} onPress={() => handleGuestSignIn(loading, setLoading)} />
      </ScreenView>
    );
  }

  return (
    <ScreenView style={styles.container}>
      <ThemedText style={styles.title}>{t("auth.title")}</ThemedText>
      <ThemedText tone="muted" style={styles.subtitle}>
        {t("auth.subtitle")}
      </ThemedText>

      <TextField
        placeholder={t("auth.email")}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        style={styles.field}
      />
      <TextField
        placeholder={t("auth.password")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.field}
      />

      <Button title={t("auth.signIn")} onPress={handleSubmit} loading={loading} />

      <Button title={t("auth.forgotPassword")} variant="ghost" onPress={() => router.push("/auth/reset")} />

      <ThemedText tone="muted" style={styles.orText}>
        {t("auth.or")}
      </ThemedText>

      <Button
        title={t("auth.continueWithGoogle")}
        variant="outline"
        onPress={() => handleGoogleSignIn(loading, setLoading)}
      />

      <Button title={t("auth.skipLogin")} variant="ghost" onPress={() => handleGuestSignIn(loading, setLoading)} />
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 14,
  },
  field: {
    marginBottom: 12,
  },
  orText: {
    textAlign: "center",
    marginVertical: 16,
  },
});
