import { useCallback, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { FlatList, Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ScreenView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useToast } from "@/hooks/use-toast";
import { storePageStore } from "@/features/store/stores/storePageStore";
import { useStorePage } from "@/features/store/hooks/useStorePage";
import { useIap } from "@/features/store/hooks/useIap";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/themeProvider";
import { authStore } from "@/store/authStore";
import { hasPurchased, saveDevicePurchase } from "@/lib/devicePurchases";
import { adStore } from "@/features/ads/stores/adStore";
import { useAnonymousMode } from "@/hooks/useAnonymousMode";

export const StoreScreen = observer(function StoreScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { toast } = useToast();
  const { isOnline, formatUSDPrice } = useStorePage();
  const { products, productIds, purchase, restore, ready, error: iapError } = useIap();
  const { isAnonymous } = useAnonymousMode();
  const lastIapErrorRef = useRef<string | null>(null);
  const lastIapUnavailableRef = useRef<string | null>(null);

  useEffect(() => {
    if (!iapError || iapError === lastIapErrorRef.current) return;
    lastIapErrorRef.current = iapError;
    toast.error(iapError);
  }, [iapError, toast]);

  useEffect(() => {
    if (!ready) return;
    const hasProductIds = Boolean(productIds.monthly || productIds.lifetime);
    const hasProducts = Object.keys(products).length > 0;
    if (hasProductIds && hasProducts) return;
    const message = t("store.purchaseUnavailable") ?? "Purchases are not available on this device.";
    if (lastIapUnavailableRef.current === message) return;
    lastIapUnavailableRef.current = message;
    toast.error(message);
  }, [ready, productIds.monthly, productIds.lifetime, products, t, toast]);

  const platform = Platform.OS === "ios" ? "ios" : "android";

  const recordPurchase = (packageId: string, price: number, currency: string, purchaseToken?: string) => {
    saveDevicePurchase({
      packageId,
      price,
      currency,
      platform,
      purchaseToken,
      anonymousId: authStore.anonId ?? undefined,
      userId: authStore.userId ?? undefined,
    });
  };

  const resolvePrice = (fallback: number, productId?: string) => {
    if (!productId) return { price: fallback, currency: "USD" };
    const product = products[productId];
    const parsed = Number.parseFloat(String(product?.price ?? ""));
    return {
      price: Number.isFinite(parsed) ? parsed : fallback,
      currency: product?.currency ?? "USD",
    };
  };

  const handleIapPurchase = async (packageId: string, productId?: string, fallbackPrice?: number) => {
    if (storePageStore.processing === packageId) return;
    if (!isOnline) {
      toast.error(t("store.offlineDisabled") ?? "Purchases are unavailable while offline.");
      return;
    }
    if (isAnonymous) {
      storePageStore.setShowLoginPrompt(true);
      toast.error(t("store.loginPromptDesc") ?? "Please sign in to complete this action.");
      return;
    }
    if (!ready) {
      toast.error(t("store.purchaseUnavailable") ?? "Purchases are not available on this device.");
      return;
    }
    if (!productId) {
      toast.error(t("store.purchaseUnavailable") ?? "Purchases are not available on this device.");
      return;
    }
    if (!products[productId]) {
      toast.error(t("store.purchaseUnavailable") ?? "Purchases are not available on this device.");
      return;
    }
    if (iapError) {
      toast.error(iapError);
      return;
    }
    storePageStore.setProcessing(packageId);
    const guardTimer = setTimeout(() => {
      if (storePageStore.processing === packageId) {
        storePageStore.setProcessing(null);
      }
    }, 20000);
    try {
      await purchase(productId);
      const { price, currency } = resolvePrice(fallbackPrice ?? 0, productId);
      if (!hasPurchased(packageId)) {
        recordPurchase(packageId, price, currency);
        adStore.refresh();
      }
      toast.success(t("common.updated"));
    } catch (error: any) {
      toast.error(error?.message ?? t("common.error"));
    } finally {
      clearTimeout(guardTimer);
      storePageStore.setProcessing(null);
    }
  };


  const handleRestore = async () => {
    if (!isOnline) {
      toast.error(t("store.offlineDisabled") ?? "Purchases are unavailable while offline.");
      return;
    }
    try {
      const restored = await restore();
      restored?.forEach((purchaseItem) => {
        const packageId =
          purchaseItem.productId === productIds.monthly
            ? "ad-monthly"
            : purchaseItem.productId === productIds.lifetime
              ? "ad-lifetime"
              : null;
        if (!packageId || hasPurchased(packageId)) return;
        recordPurchase(packageId, 0, "USD", purchaseItem.transactionReceipt ?? undefined);
        adStore.refresh();
      });
      toast.success(t("common.updated"));
    } catch (error: any) {
      toast.error(error?.message ?? t("common.error"));
    }
  };
  const renderPackageItem = useCallback(
    ({ item: pkg }: { item: (typeof storePageStore.adPackages)[number] }) => {
      const mappedId =
        pkg.id === "ad-monthly"
          ? productIds.monthly
          : pkg.id === "ad-lifetime"
            ? productIds.lifetime
            : undefined;
      const product = mappedId ? products[mappedId] : undefined;
      const priceLabel = product?.localizedPrice ?? formatUSDPrice(pkg.price);
      return (
        <Card style={[styles.packageCard, pkg.popular && styles.popularCard]}>
          {pkg.popular ? (
            <View style={[styles.badge, styles.popularBadge]}>
              <ThemedText style={styles.badgeText}>{t("store.popular")}</ThemedText>
            </View>
          ) : null}
          {pkg.save ? (
            <View style={[styles.badge, styles.saveBadge]}>
              <ThemedText style={styles.badgeText}>{t("store.save")} {pkg.save}</ThemedText>
            </View>
          ) : null}
          <View style={styles.packageHeader}>
            <ThemedText style={styles.packageTitle}>{t(pkg.nameKey)}</ThemedText>
            <View style={styles.priceRow}>
              <ThemedText style={styles.priceValue}>{priceLabel}</ThemedText>
              <ThemedText tone="muted">/{t(pkg.periodKey)}</ThemedText>
            </View>
          </View>
          <View style={styles.featureList}>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <ThemedText>{t("store.adFeature1")}</ThemedText>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <ThemedText>{t("store.adFeature2")}</ThemedText>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <ThemedText>{t("store.adFeature3")}</ThemedText>
            </View>
          </View>
          <Button
            title={storePageStore.processing === pkg.id ? t("store.processing") : t("store.purchase")}
            variant={pkg.popular ? "primary" : "outline"}
            onPress={() => void handleIapPurchase(pkg.id, mappedId, pkg.price)}
            disabled={storePageStore.processing === pkg.id}
          />
        </Card>
      );
    },
    [formatUSDPrice, handleIapPurchase, productIds.lifetime, productIds.monthly, products, storePageStore.processing, t]
  );

  return (
    <ScreenView style={styles.container}>
      {!isOnline ? (
        <View style={styles.offlineOverlay}>
          <View style={styles.offlineOverlayContent}>
            <ThemedText style={styles.offlineTitle}>{t("store.needsOnline")}</ThemedText>
            <ThemedText tone="muted">{t("store.connectToAccess")}</ThemedText>
          </View>
        </View>
      ) : null}
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={storePageStore.adPackages}
        keyExtractor={(item) => item.id}
        renderItem={renderPackageItem}
        extraData={[storePageStore.processing, products, productIds.monthly, productIds.lifetime]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.header}>
              <ThemedText style={styles.title}>{t("store.title")}</ThemedText>
              <ThemedText tone="muted">{t("store.subtitle")}</ThemedText>
            </View>

            {!isOnline ? (
              <Card style={styles.offlineNotice}>
                <ThemedText tone="muted">
                  {t("common.offline") ?? "Offline"} · {t("store.offlineDisabled")}
                </ThemedText>
              </Card>
            ) : null}

            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="shield-outline" size={18} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>{t("store.removeAdsTitle")}</ThemedText>
              </View>
              <ThemedText tone="muted">{t("store.removeAdsDesc")}</ThemedText>
            </View>
          </View>
        }
        ListFooterComponent={
          <Card>
            <Button title={t("store.restorePurchases")} variant="outline" onPress={() => void handleRestore()} />
          </Card>
        }
      />

      <Modal
        transparent
        visible={storePageStore.showLoginPrompt}
        animationType="fade"
        onRequestClose={() => storePageStore.setShowLoginPrompt(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => storePageStore.setShowLoginPrompt(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card }]} onPress={() => undefined}>
            <ThemedText style={styles.modalTitle}>{t("store.loginPromptTitle") ?? "Login required"}</ThemedText>
            <ThemedText tone="muted">{t("store.loginPromptDesc") ?? "Please sign in to complete this action."}</ThemedText>
            <View style={styles.modalActions}>
              <Button
                title={t("common.cancel") ?? "Cancel"}
                variant="outline"
                onPress={() => storePageStore.setShowLoginPrompt(false)}
              />
              <Button
                title={t("auth.signIn") ?? "Sign in"}
                onPress={() => {
                  storePageStore.setShowLoginPrompt(false);
                  router.push("/auth");
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingBottom: 140,
  },
  listHeader: {
    gap: 16,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  sectionHeader: {
    marginTop: 10,
    gap: 6,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  warningCard: {
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.5)",
    backgroundColor: "rgba(234,179,8,0.12)",
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#a16207",
  },
  offlineNotice: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.6)",
  },
  packageCard: {
    gap: 12,
  },
  popularCard: {
    borderWidth: 2,
    borderColor: "#7c3aed",
  },
  badge: {
    position: "absolute",
    top: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  popularBadge: {
    right: 12,
    backgroundColor: "#7c3aed",
  },
  saveBadge: {
    left: 12,
    backgroundColor: "#10b981",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  packageHeader: {
    gap: 6,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  featureList: {
    gap: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  offlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  offlineOverlayContent: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(17,24,39,0.95)",
    gap: 6,
  },
  offlineTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
