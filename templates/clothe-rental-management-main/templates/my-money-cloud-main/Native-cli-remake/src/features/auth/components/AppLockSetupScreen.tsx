import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ScreenView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { getAppLockConfig } from "@/lib/appLock";
import { useI18n } from "@/lib/i18n";
import { AppLockSheet } from "@/features/auth/components/AppLockSheet";

export function AppLockSetupScreen() {
  const { t } = useI18n();
  const config = getAppLockConfig();
  const [open, setOpen] = useState(false);
  const enabled = config.enabled && config.method === "pin";

  return (
    <ScreenView style={styles.container}>
      <ThemedText style={styles.title}>{t("auth.lockTitle") ?? "Screen lock"}</ThemedText>
      <ThemedText tone="muted" style={styles.subtitle}>
        {t("profile.screenLockHint") ?? "Require a PIN to unlock the app"}
      </ThemedText>

      {enabled ? (
        <View style={styles.section}>
          <ThemedText>{t("auth.lockEnabled") ?? "Screen lock enabled"}</ThemedText>
          <Button title={t("auth.lockDisable") ?? "Disable"} variant="outline" onPress={() => setOpen(true)} />
        </View>
      ) : (
        <View style={styles.section}>
          <Button title={t("auth.lockSavePin") ?? "Save PIN"} onPress={() => setOpen(true)} />
        </View>
      )}

      <AppLockSheet open={open} onClose={() => setOpen(false)} />
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    marginBottom: 12,
  },
  section: {
    gap: 8,
  },
});
