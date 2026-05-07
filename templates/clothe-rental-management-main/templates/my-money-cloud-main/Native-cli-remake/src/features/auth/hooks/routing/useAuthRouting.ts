import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useNavigationContainerRef } from "expo-router";
import { authStore } from "@/store/authStore";
import { uiStore } from "@/store/uiStore";
import storageAdapter from "@/lib/storageAdapter";

interface UseAuthRoutingResult {
  isWaiting: boolean;
}

export function useAuthRouting(): UseAuthRoutingResult {
  const router = useRouter();
  const pathname = usePathname();
  const navigationRef = useNavigationContainerRef();
  const isNavReady = Boolean(navigationRef?.current?.isReady?.());
  const isBootstrapping = uiStore.loading || !storageAdapter.isHydrated();

  const { userId, anonId, userSettings } = authStore;
  const hasSession = Boolean(userId || anonId);
  const hasUserSettings = Boolean(userSettings);
  const isAuthCallback = pathname === "/auth-callback";
  const isAuthRoute = pathname === "/auth" || (pathname?.startsWith("/auth/") ?? false) || isAuthCallback;
  const isOnboardingRoute = pathname === "/onboarding";

  const needsAuthRedirect = !hasSession && !isAuthRoute;
  const needsOnboardingRedirect =
    hasUserSettings &&
    !userSettings?.currency &&
    !isOnboardingRoute &&
    !(isAuthRoute && anonId);
  const needsHomeRedirect =
    hasUserSettings && Boolean(userSettings?.currency) && isAuthRoute && Boolean(userId) && !anonId;
  const awaitingUserSettings = hasSession && !hasUserSettings && !isAuthRoute;

  const isWaiting = useMemo(
    () =>
      !isNavReady ||
      isBootstrapping ||
      needsAuthRedirect ||
      needsOnboardingRedirect ||
      needsHomeRedirect ||
      awaitingUserSettings,
    [
      isNavReady,
      isBootstrapping,
      needsAuthRedirect,
      needsOnboardingRedirect,
      needsHomeRedirect,
      awaitingUserSettings,
    ]
  );

  useEffect(() => {
    if (!isNavReady || isBootstrapping) {
      return;
    }
    if (needsAuthRedirect) {
      router.replace("/auth");
      return;
    }
    if (!hasUserSettings) return;
    if (needsOnboardingRedirect) {
      router.replace("/onboarding");
      return;
    }
    if (needsHomeRedirect) {
      router.replace("/(tabs)");
    }
  }, [isNavReady, needsAuthRedirect, needsOnboardingRedirect, needsHomeRedirect, hasUserSettings, router]);

  return { isWaiting };
}
