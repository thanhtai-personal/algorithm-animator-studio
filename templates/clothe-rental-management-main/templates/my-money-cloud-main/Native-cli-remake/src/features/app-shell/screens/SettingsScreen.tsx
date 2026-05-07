import React from "react";
import { observer } from "mobx-react-lite";
import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ScreenView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/themeProvider";
import { authStore } from "@/store/authStore";
import { useAuthActions } from "@/features/auth/hooks/login/useAuthActions";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";
import { categoryService } from "@/features/categories/services/categoryService";
import { categoryStore } from "@/store/categoryStore";
import { transactionService } from "@/features/transactions/services/transactionService";
import { transactionStore } from "@/store/transactionStore";
import { useThemeVariant } from "@/lib/themeVariants";
import { LANGUAGE_OPTIONS } from "@/lib/constants/i18n";
import { languageFlags } from "@/features/onboarding/constants";
import { AppLockSheet } from "@/features/auth/components/AppLockSheet";
import { useAnonymousMode } from "@/hooks/useAnonymousMode";
import { buildDefaultCategoryInputs } from "@/features/categories/utils/defaultCategories";
import type { CategoryRow } from "@/features/categories/types";
import { settingsUpdateStore } from "@/store/settingsUpdateStore";
import { updateUserSettings } from "@/features/app-shell/services/user";
import { useAIVoiceSettings } from "@/hooks/useAIVoiceSettings";
import { getAppLockConfig } from "@/lib/appLock";

export const SettingsScreen = observer(function SettingsScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useI18n();
  const { mode, setThemeMode, colors } = useTheme();
  const { variant, setVariant, options: themeOptions } = useThemeVariant();
  const { signOut } = useAuthActions();
  const { isOnline } = useOnlineChecker();
  const { useAI, ignoreVoiceVerify, setUseAI, setIgnoreVerify } = useAIVoiceSettings();
  const [languageSheetOpen, setLanguageSheetOpen] = React.useState(false);
  const [lockSheetOpen, setLockSheetOpen] = React.useState(false);
  const user = authStore.userSettings;
  const { isAnonymous } = useAnonymousMode();
  const queueUserId = authStore.userId || authStore.anonId;
  const [resyncing, setResyncing] = React.useState(false);
  const lockEnabled = React.useMemo(() => {
    const config = getAppLockConfig();
    return Boolean(config.enabled && config.method === "pin");
  }, [lockSheetOpen]);

  const displayName = user?.displayName || t("profile.anonymousUser") || "Anonymous";
  const email = user?.email || (isAnonymous ? t("profile.anonymousHint") : "");
  const displayEmail = isAnonymous ? t("profile.guest") : email || t("profile.noEmail");
  const displayNameText = displayName?.trim() || t("profile.notAvailable");
  const rowBackground = mode === "dark" ? "rgba(255,255,255,0.04)" : "#ffffff";
  const rowBorder = mode === "dark" ? "rgba(255,255,255,0.08)" : colors.border;
  const pillBackground = mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
  const buildDefaultCategories = (): CategoryRow[] => {
    const createdAt = new Date().toISOString();
    const anonKey = authStore.anonId ?? null;
    return buildDefaultCategoryInputs(t).map((input) => ({
      id: input.id || Math.random().toString(36).slice(2),
      user_id: authStore.userId ?? null,
      anon_key: authStore.userId ? null : anonKey,
      name: input.name,
      icon: input.icon ?? null,
      color: input.color ?? null,
      created_at: createdAt,
    }));
  };
  const getLanguageLabel = (code: string) => {
    const option = LANGUAGE_OPTIONS.find((item) => item.value === code);
    return option ? t(option.labelKey) : code.toUpperCase();
  };
  const handleSelectLanguage = async (code: string) => {
    setLanguage(code);
    authStore.upsert({ language: code });
    if (isAnonymous) return;
    if (!isOnline) {
      offlineQueueStore.enqueue({
        id: Math.random().toString(36).substring(2),
        entity: "settings",
        action: "update",
        payload: { updates: { language: code } },
      });
      return;
    }
    try {
      const updated = await updateUserSettings({ language: code });
      authStore.upsert(updated);
    } catch {
      // fallback to local update
    }
  };
  const handleSignOut = () => {
    if (!authStore.userId) {
      void signOut();
      return;
    }
    const pending = offlineQueueStore.getCount(authStore.userId);
    if (pending === 0) {
      void signOut();
      return;
    }
    Alert.alert(
      t("auth.logoutConfirmTitle") ?? "Confirm sign out",
      t("auth.logoutConfirmDesc") ?? "You have pending offline data. Sign out anyway?",
      [
        { text: t("auth.logoutCancel") ?? "Cancel", style: "cancel" },
        { text: t("auth.logoutConfirm") ?? "Sign out", style: "destructive", onPress: () => void signOut() },
      ]
    );
  };

  const handleToggleUseAI = async () => {
    await setUseAI(!useAI);
  };


  const renderSwitch = (value: boolean, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={6}
    >
      <View
        style={[
          styles.switchTrack,
          { backgroundColor: value ? colors.primary : rowBorder, borderColor: rowBorder },
        ]}
      >
        <View
          style={[
            styles.switchThumb,
            { backgroundColor: colors.background },
            value && styles.switchThumbOn,
          ]}
        />
      </View>
    </Pressable>
  );

  return (
    <ScreenView style={styles.container}>
      {settingsUpdateStore.updating ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>{t("profile.title") ?? "Profile"}</ThemedText>
          <ThemedText tone="muted">{t("profile.subtitle") ?? "Manage your account and preferences"}</ThemedText>
        </View>

        <Card style={styles.card}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <ThemedText style={styles.avatarText}>{displayEmail?.charAt(0)?.toUpperCase() || "?"}</ThemedText>
            </View>
            <View style={styles.profileInfo}>
              <ThemedText style={styles.profileEmail} numberOfLines={1} ellipsizeMode="tail">
                {displayEmail}
              </ThemedText>
              <ThemedText tone="muted" style={styles.profileName} numberOfLines={1} ellipsizeMode="tail">
                {t("profile.displayName") ?? "Display name"}: {displayNameText}
              </ThemedText>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <ThemedText style={styles.sectionTitle}>{t("profile.preferences") ?? "Preferences"}</ThemedText>

          <View style={styles.settingGroup}>
            <Pressable
              style={[styles.settingRow, { backgroundColor: rowBackground, borderColor: rowBorder }]}
              onPress={() => setLanguageSheetOpen(true)}
            >
              <View style={styles.settingText}>
                <ThemedText style={styles.settingTitle}>{t("profile.language") ?? "Language"}</ThemedText>
                <ThemedText tone="muted" style={styles.settingSubtitle}>
                  {t("actions.toggleLanguage") ?? "Switch language"}
                </ThemedText>
              </View>
              <View style={[styles.valuePill, { backgroundColor: pillBackground, borderColor: rowBorder }]}>
                <Ionicons name="globe-outline" size={14} color={colors.mutedText} />
                <ThemedText style={styles.valuePillText}>
                  {languageFlags[language]} {getLanguageLabel(language)}
                </ThemedText>
              </View>
            </Pressable>

            <Pressable
              style={[styles.settingRow, { backgroundColor: rowBackground, borderColor: rowBorder }]}
              onPress={() => setLockSheetOpen(true)}
            >
              <View style={styles.settingText}>
                <ThemedText style={styles.settingTitle}>{t("profile.screenLock") ?? "Screen lock"}</ThemedText>
                <ThemedText tone="muted" style={styles.settingSubtitle}>
                  {t("profile.screenLockHint") ?? "Require a PIN to unlock the app"}
                </ThemedText>
              </View>
              {renderSwitch(lockEnabled, () => setLockSheetOpen(true))}
            </Pressable>

            {/* Change password hidden for now */}
          </View>

          <View style={[styles.divider, { backgroundColor: rowBorder }]} />

          <View style={styles.settingGroup}>
            <Pressable
              style={[styles.settingRow, { backgroundColor: rowBackground, borderColor: rowBorder }]}
              onPress={handleToggleUseAI}
            >
              <View style={styles.settingText}>
                <ThemedText style={styles.settingTitle}>{t("profile.useAI") ?? "Use AI mode"}</ThemedText>
                <ThemedText tone="muted" style={styles.settingSubtitle}>
                  {t("profile.useAIHint") ?? "Enable AI voice parsing for transactions"}
                </ThemedText>
              </View>
              {renderSwitch(useAI, handleToggleUseAI)}
            </Pressable>

            {useAI ? (
              <Pressable
                style={[styles.settingRow, { backgroundColor: rowBackground, borderColor: rowBorder }]}
                onPress={() => void setIgnoreVerify(!ignoreVoiceVerify)}
              >
                <View style={styles.settingText}>
                  <ThemedText style={styles.settingTitle}>
                    {t("profile.aiVoiceSettings") ?? "Voice input settings"}
                  </ThemedText>
                  <ThemedText tone="muted" style={styles.settingSubtitle}>
                    {t("profile.autoCreateTransactionHint") ?? "Skip confirmation, auto-create from voice"}
                  </ThemedText>
                </View>
                {renderSwitch(ignoreVoiceVerify, () => void setIgnoreVerify(!ignoreVoiceVerify))}
              </Pressable>
            ) : null}
          </View>

          <View style={[styles.divider, { backgroundColor: rowBorder }]} />

          <View style={styles.settingGroup}>
            <Pressable
              style={[styles.settingRow, { backgroundColor: rowBackground, borderColor: rowBorder }]}
              onPress={() => void setThemeMode(mode === "dark" ? "light" : "dark")}
            >
              <View style={styles.settingText}>
                <ThemedText style={styles.settingTitle}>{t("profile.theme") ?? "Theme"}</ThemedText>
                <ThemedText tone="muted" style={styles.settingSubtitle}>
                  {t("actions.toggleTheme") ?? "Switch appearance"}
                </ThemedText>
              </View>
              <View style={[styles.iconBubble, { backgroundColor: pillBackground, borderColor: rowBorder }]}>
                <Ionicons
                  name={mode === "dark" ? "moon-outline" : "sunny-outline"}
                  size={16}
                  color={colors.mutedText}
                />
              </View>
            </Pressable>
          </View>

          <View style={styles.preferenceColumn}>
            <ThemedText style={styles.settingTitle}>{t("profile.themeStyle") ?? "Theme style"}</ThemedText>
            <ThemedText tone="muted" style={styles.settingSubtitle}>
              {t("profile.themeStyleHint") ?? "Choose a color palette for the app"}
            </ThemedText>
            <View style={styles.paletteGrid}>
              {themeOptions.map((option) => {
                const selected = variant === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => void setVariant(option.id)}
                    style={[
                      styles.paletteCard,
                      { borderColor: selected ? colors.primary : rowBorder },
                      selected && { backgroundColor: rowBackground },
                    ]}
                  >
                    <View style={styles.palettePreview}>
                      <View style={[styles.paletteBar, { backgroundColor: option.preview.primary, width: "60%" }]} />
                      <View style={[styles.paletteBar, { backgroundColor: option.preview.secondary, width: "100%" }]} />
                      <View style={[styles.paletteDot, { backgroundColor: option.preview.accent }]} />
                      <View style={[styles.paletteBar, { backgroundColor: option.preview.nav, width: "100%" }]} />
                    </View>
                    <ThemedText style={styles.paletteTitle}>{t(option.labelKey) ?? option.id}</ThemedText>
                    <ThemedText tone="muted" style={styles.paletteSubtitle}>
                      {t(option.descriptionKey) ?? ""}
                    </ThemedText>
                    {selected ? <ThemedText style={styles.paletteCheck}>✓</ThemedText> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <ThemedText style={styles.sectionTitle}>{t("resync.title") ?? "Clear local data"}</ThemedText>
          <ThemedText tone="muted" style={styles.preferenceSubtitle}>
            {t("resync.description") ?? "Clear cache and refresh your data from server."}
          </ThemedText>
          <Button
            title={t("resync.action") ?? t("resync.clearCache") ?? "Clear data"}
            variant="primary"
            loading={resyncing}
            style={[styles.dangerButton, { backgroundColor: colors.danger }]}
            onPress={async () => {
              if (resyncing) return;
              if (!isAnonymous && !isOnline) return;
              Alert.alert(
                t("resync.title") ?? "Resync data",
                t("resync.confirm") ??
                  "Delete all data on this device? Cloud data will remain. Sign-in data is kept.",
                [
                  { text: t("common.cancel") ?? "Cancel", style: "cancel" },
                  {
                    text: t("common.confirm") ?? "Confirm",
                    style: "destructive",
                    onPress: async () => {
                      setResyncing(true);
                      try {
                        if (queueUserId) {
                          offlineQueueStore.clear(queueUserId);
                          categoryStore.clearForUser(queueUserId);
                          transactionStore.clearForUser(queueUserId);
                        }
                        if (isAnonymous) {
                          const defaults = buildDefaultCategories();
                          categoryStore.write(defaults);
                        }
                        if (authStore.userId) {
                          const start = new Date("2025-01-01T00:00:00.000Z");
                          const end = new Date();
                          const [categories, transactions] = await Promise.all([
                            categoryService.list(),
                            transactionService.listByRange({ start, end }),
                          ]);
                          categoryStore.write(categories);
                          transactionStore.write(transactions);
                        }
                      } catch {
                        // ignore errors for now
                      } finally {
                        setResyncing(false);
                      }
                    },
                  },
                ]
              );
            }}
          />
        </Card>

        <Card style={styles.card}>
          <ThemedText style={styles.sectionTitle}>{t("profile.supportTitle") ?? "Contact & support"}</ThemedText>
          <ThemedText tone="muted" style={styles.preferenceSubtitle}>
            {t("profile.supportSubtitle") ?? "Message us on Facebook for help."}
          </ThemedText>
          <Button
            title={t("profile.supportAction") ?? "Facebook"}
            variant="outline"
            style={[styles.supportButton, { borderColor: colors.primary }]}
            onPress={() => Linking.openURL("https://www.facebook.com/profile.php?id=61585671813640")}
          />
        </Card>

        {!isAnonymous ? (
          <Card style={styles.card}>
            <ThemedText style={styles.sectionTitle}>{t("account.deleteTitle") ?? "Delete account"}</ThemedText>
            <ThemedText tone="muted">{t("account.deleteSubtitle") ?? "This action cannot be undone."}</ThemedText>
            <Button
              title={t("account.deleteAction") ?? "Delete account"}
              variant="outline"
              onPress={() => router.push("/delete-account")}
            />
          </Card>
        ) : null}

        <Card style={styles.card}>
          <ThemedText style={styles.sectionTitle}>
            {isAnonymous ? t("profile.signIn") ?? "Sign in" : t("profile.signOut") ?? "Sign out"}
          </ThemedText>
          <ThemedText tone="muted">
            {isAnonymous
              ? t("profile.anonymousHint") ?? "Sign in to sync your data."
              : t("auth.logoutConfirmDesc") ?? "You will lose all unsynced data if you continue to sign out."}
          </ThemedText>
          <Button
            title={isAnonymous ? t("profile.signIn") ?? "Sign in" : t("profile.signOut") ?? "Sign out"}
            variant={isAnonymous ? "outline" : "primary"}
            onPress={isAnonymous ? () => router.push("/auth") : handleSignOut}
            style={!isAnonymous ? [styles.authButton, { backgroundColor: colors.primary }] : styles.authButton}
          />
        </Card>
      </ScrollView>
      <Modal transparent visible={languageSheetOpen} animationType="slide" onRequestClose={() => setLanguageSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setLanguageSheetOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card }]}>
            <ThemedText style={styles.sheetTitle}>{t("profile.language") ?? "Language"}</ThemedText>
            <View style={styles.sheetOptions}>
              {LANGUAGE_OPTIONS.map((option) => {
                const selected = language === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.sheetOption,
                      { borderColor: selected ? colors.primary : colors.border },
                      selected && { backgroundColor: colors.background },
                    ]}
                    onPress={() => void handleSelectLanguage(option.value)}
                  >
                    <ThemedText style={styles.sheetOptionText}>
                      {languageFlags[option.value]} {getLanguageLabel(option.value)}
                    </ThemedText>
                    {selected ? <Ionicons name="checkmark" size={16} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </View>
            <Button title={t("common.close") ?? "Close"} variant="outline" onPress={() => setLanguageSheetOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
      <AppLockSheet open={lockSheetOpen} onClose={() => setLockSheetOpen(false)} />
    </ScreenView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 160,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  card: {
    borderRadius: 20,
    gap: 14,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileEmail: {
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  profileName: {
    fontSize: 12,
    marginTop: 4,
    flexShrink: 1,
  },
  authButton: {
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  preferenceColumn: {
    gap: 10,
    marginTop: 6,
  },
  preferenceSubtitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  settingGroup: {
    gap: 10,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 14,
  },
  settingText: {
    flex: 1,
    gap: 4,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  settingSubtitle: {
    fontSize: 12,
  },
  valuePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  valuePillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  switchTrack: {
    width: 46,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    padding: 2,
    justifyContent: "center",
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  switchThumbOn: {
    alignSelf: "flex-end",
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    gap: 12,
    maxHeight: "70%",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sheetOptions: {
    gap: 8,
  },
  sheetOption: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  paletteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  paletteCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 6,
    width: "48%",
  },
  palettePreview: {
    gap: 6,
    borderRadius: 12,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  paletteBar: {
    height: 6,
    borderRadius: 999,
  },
  paletteDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  paletteTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  paletteSubtitle: {
    fontSize: 12,
  },
  paletteCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    fontSize: 14,
    fontWeight: "700",
  },
  dangerButton: {
    borderRadius: 999,
  },
  supportButton: {
    borderRadius: 999,
    borderWidth: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
});
