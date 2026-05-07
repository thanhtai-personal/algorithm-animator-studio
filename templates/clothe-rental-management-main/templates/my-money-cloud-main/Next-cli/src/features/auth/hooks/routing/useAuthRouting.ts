"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authStore } from "@/store/authStore";

interface UseAuthRoutingResult {
  isWaiting: boolean;
}

/**
 * useAuthRouting - Handles route redirects based on auth state
 * 
 * Responsibilities:
 * - Redirect unauthenticated users to login
 * - Redirect to onboarding when currency is missing
 * - Track loading state
 * 
 * Single effect for all routing logic
 */
export function useAuthRouting(): UseAuthRoutingResult {
  const router = useRouter();
  const pathname = usePathname();
  // Only use store state: userId, anonId, user
  const { userId, anonId, userSettings: user } = authStore;

  const isAuthRoute = pathname === "/auth" || pathname.startsWith("/auth/");
  const hasSession = Boolean(userId || anonId);
  const hasUserSettings = Boolean(user);
  const needsAuthRedirect = !hasSession && !isAuthRoute;
  const needsOnboardingRedirect =
    hasUserSettings &&
    !user?.currency &&
    pathname !== "/onboarding" &&
    !(isAuthRoute && anonId);
  const needsHomeRedirect = hasUserSettings && Boolean(user?.currency) && isAuthRoute && Boolean(userId) && !anonId;
  const awaitingUserSettings = hasSession && !hasUserSettings && !isAuthRoute;

  // Waiting state: if userId/anonId is not yet determined
  const isWaiting =
    needsAuthRedirect ||
    needsOnboardingRedirect ||
    needsHomeRedirect ||
    awaitingUserSettings;
  useEffect(() => {
    // If not logged in and not anonymous, redirect to login
    if (needsAuthRedirect) {
      router.replace("/auth");
      return;
    }
    // Wait for user state to be available
    if (!hasUserSettings) return;
    // If missing currency, redirect to onboarding (allow /auth for anonymous login)
    if (needsOnboardingRedirect) {
      router.replace("/onboarding");
      return;
    }
    if (needsHomeRedirect) {
      router.replace("/home");
    }
  }, [
    needsAuthRedirect,
    needsOnboardingRedirect,
    needsHomeRedirect,
    hasUserSettings,
    router,
  ]);

  return { isWaiting };
}
