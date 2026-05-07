import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Modal, StyleSheet, View } from "react-native";
import { useRouter, useNavigationContainerRef } from "expo-router";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/themeProvider";
import { compareVersions } from "@/features/app-shell/utils";
import { fetchAppVersion } from "@/features/app-shell/services/fetchAppVersion";
import { getAppVersion } from "@/lib/appVersion";
import { authStore } from "@/store/authStore";
import { transactionStore } from "@/store/transactionStore";
import { categoryStore } from "@/store/categoryStore";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { syncingStore } from "@/store/syncingStore";
import storageAdapter from "@/lib/storageAdapter";

export function ForceUpdateGate({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const navigationRef = useNavigationContainerRef();
  const isNavReady = Boolean(navigationRef?.current?.isReady?.());
  const [versionInfo, setVersionInfo] = useState<Awaited<ReturnType<typeof fetchAppVersion>>>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const data = await fetchAppVersion();
      if (mounted) setVersionInfo(data);
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const shouldBlock = useMemo(() => {
    if (!versionInfo) return false;
    const current = getAppVersion();
    if (versionInfo.force_update) return true;
    if (!versionInfo.min_version) return false;
    return compareVersions(current, versionInfo.min_version) < 0;
  }, [versionInfo]);

  const handleClearAndSignOut = () => {
    Alert.alert(
      t("forceReset.title") ?? "Data refresh required",
      t("forceReset.description") ?? "Your data is out of date.",
      [
        { text: t("common.cancel") ?? "Cancel", style: "cancel" },
        {
          text: t("forceReset.confirm") ?? "Delete local data and sign out",
          style: "destructive",
          onPress: () => {
            storageAdapter.clearAll();
            const activeId = authStore.userId ?? authStore.anonId;
            if (activeId) {
              transactionStore.clearForUser(activeId);
              categoryStore.clearForUser(activeId);
              offlineQueueStore.clear(activeId);
            }
            syncingStore.reset();
            authStore.clearUserSession();
            authStore.clearAnonymousSession();
            if (isNavReady) {
              router.replace("/auth");
            }
          },
        },
      ]
    );
  };

  const handleOpenStore = async () => {
    if (!versionInfo?.store_url) return;
    try {
      await Linking.openURL(versionInfo.store_url);
    } catch {
      // ignore
    }
  };

  return (
    <>
      {children}
      {shouldBlock ? (
        <Modal visible transparent animationType="fade">
          <View style={styles.backdrop}>
            <ThemedView variant="card" style={[styles.card, { borderColor: colors.border }]}>
              <ThemedText style={styles.title}>{t("forceReset.title")}</ThemedText>
              <ThemedText tone="muted">{versionInfo?.message ?? t("forceReset.description")}</ThemedText>
              <ThemedText tone="muted" style={styles.notice}>{t("forceReset.notice")}</ThemedText>
              <ThemedText tone="muted">
                {t("forceReset.requiredVersion", { version: versionInfo?.min_version ?? "0.0.0" })}
              </ThemedText>
              <View style={styles.actions}>
                {versionInfo?.store_url ? (
                  <Button title={t("common.continue") ?? "Update"} variant="outline" onPress={handleOpenStore} />
                ) : null}
                <Button title={t("forceReset.confirm")} onPress={handleClearAndSignOut} />
              </View>
            </ThemedView>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 20,
    borderWidth: 1,
    borderRadius: 16,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  notice: {
    fontSize: 12,
  },
  actions: {
    gap: 8,
    marginTop: 8,
  },
});
