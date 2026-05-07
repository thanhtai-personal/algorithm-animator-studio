import { useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseAuthHeaders } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api";
import { authStore } from "@/store/authStore";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { useAuthActions } from "@/features/auth/hooks/login/useAuthActions";
import { useTheme } from "@/lib/themeProvider";

const CONFIRM_TEXT = "DELETE";

export function DeleteAccountScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { toast } = useToast();
  const router = useRouter();
  const { signOut } = useAuthActions();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const user = authStore.userSettings;

  const isConfirmed = confirmText.trim().toUpperCase() === CONFIRM_TEXT;

  const performDelete = async () => {
    if (!isConfirmed || deleting) return;
    setDeleting(true);
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const response = await apiFetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data?.error ?? t("common.error"));
        return;
      }
      await signOut();
      toast.success(t("account.deleteSuccess"));
      router.replace("/auth");
    } catch (error: any) {
      toast.error(error?.message ?? t("common.error"));
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = async () => {
    if (!isConfirmed || deleting) return;
    const pendingCount = authStore.userId ? offlineQueueStore.getCount(authStore.userId) : 0;
    if (pendingCount > 0) {
      Alert.alert(
        t("account.deleteTitle") ?? "Delete account",
        t("sync.pendingNotice", { count: pendingCount }) ?? "Pending sync items will be lost.",
        [
          { text: t("common.cancel") ?? "Cancel", style: "cancel" },
          { text: t("common.confirm") ?? "Confirm", style: "destructive", onPress: () => void performDelete() },
        ]
      );
      return;
    }
    await performDelete();
  };

  return (
    <ScreenView style={styles.container}>
      <Card>
        <ThemedText style={styles.title}>{t("account.deleteTitle")}</ThemedText>
        <ThemedText tone="muted">{t("account.deleteSubtitle")}</ThemedText>
        <View style={[styles.warningBox, { borderColor: colors.danger }]}>
          <ThemedText style={[styles.warningText, { color: colors.danger }]}>
            {t("account.deleteDescription")}
          </ThemedText>
        </View>
        {user?.email ? (
          <ThemedText tone="muted">
            {t("auth.email") ?? "Email"}: {user.email}
          </ThemedText>
        ) : null}
        <View style={styles.form}>
          <ThemedText>{t("account.deleteConfirmLabel")}</ThemedText>
          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder={t("account.deleteConfirmPlaceholder") ?? "Type DELETE"}
            editable={!deleting}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholderTextColor={colors.mutedText}
            autoCapitalize="characters"
          />
          <Button
            title={t("account.deleteAction") ?? "Delete account"}
            loading={deleting}
            onPress={handleDelete}
            disabled={!isConfirmed || deleting}
          />
          <Button title={t("common.back") ?? "Back"} variant="ghost" onPress={() => router.back()} />
        </View>
      </Card>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  warningBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
  },
  warningText: {
    fontSize: 13,
    fontWeight: "600",
  },
  form: {
    marginTop: 12,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
