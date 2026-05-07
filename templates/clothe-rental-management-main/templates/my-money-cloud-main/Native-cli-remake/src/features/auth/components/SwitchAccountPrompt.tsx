import { StyleSheet, View } from "react-native";
import { useAccountSwitchContext } from "@/features/auth/components/AccountSwitchProvider";
import { useI18n } from "@/lib/i18n";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ScreenView } from "@/components/ThemedView";

export function SwitchAccountPrompt() {
  const { t } = useI18n();
  const { pendingLogin, confirmErase, cancelErase } = useAccountSwitchContext();

  if (!pendingLogin) return null;

  return (
    <ScreenView style={styles.container}>
      <Card>
        <ThemedText style={styles.title}>{t("auth.switchAccountTitle")}</ThemedText>
        <ThemedText tone="muted" style={styles.subtitle}>
          {t("auth.switchAccountDescription")}
        </ThemedText>
        <View style={styles.actions}>
          <Button title={t("auth.switchAccountErase")} variant="outline" onPress={confirmErase} />
          <Button title={t("auth.switchAccountCancel")} variant="ghost" onPress={cancelErase} />
        </View>
      </Card>
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
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 16,
  },
  actions: {
    gap: 10,
  },
});
