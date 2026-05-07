import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useI18n } from "@/lib/i18n";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ScreenView } from "@/components/ThemedView";

export function AnonymousSyncPrompt() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <ScreenView style={styles.container}>
      <Card>
        <ThemedText style={styles.title}>{t("auth.anonymousSyncTitle")}</ThemedText>
        <ThemedText tone="muted" style={styles.subtitle}>
          {t("auth.anonymousSyncDescription")}
        </ThemedText>
        <View style={styles.actions}>
          <Button title={t("common.continue")} onPress={() => router.replace("/(tabs)")} />
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
