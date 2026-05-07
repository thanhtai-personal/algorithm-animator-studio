import { useState } from "react";
import { StyleSheet } from "react-native";
import { useAuthActions } from "@/features/auth/hooks/login/useAuthActions";
import { useI18n } from "@/lib/i18n";
import { ScreenView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";

export function ResetPasswordScreen() {
  const { t } = useI18n();
  const { requestPasswordReset } = useAuthActions();
  const [email, setEmail] = useState("");

  const handleReset = async () => {
    if (!email) return;
    await requestPasswordReset(email);
  };

  return (
    <ScreenView style={styles.container}>
      <ThemedText style={styles.title}>{t("auth.resetPasswordTitle")}</ThemedText>
      <ThemedText tone="muted" style={styles.subtitle}>
        {t("auth.resetPasswordSubtitle")}
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
      <Button title={t("auth.sendResetLink")} onPress={handleReset} />
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
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 16,
  },
  field: {
    marginBottom: 12,
  },
});
