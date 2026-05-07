"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authStore } from "@/store/authStore";
import { resolveLocaleAwareRedirectTarget, normalizeRoleValue } from "@/features/auth/utils/authRedirect";
import { evaluateRouteAccess } from "@/features/auth/utils/routeAccess";

interface UseAuthRoutingResult {
  isWaiting: boolean;
}

/**
 * useAuthRouting - Handles route redirects based on auth state and route policy
 *
 * Responsibilities:
 * - Redirect unauthenticated users to login on protected routes
 * - Redirect guest and non-admin users away from cloud-only admin modules
 * - Keep future public showroom route accessible without login
 * - Redirect authenticated/guest users away from /auth
 * - Track loading state
 *
 * Single effect for all routing logic
 */
export function useAuthRouting(): UseAuthRoutingResult {
  const router = useRouter();
  const pathname = usePathname();
  const { userId, anonId, role, profile, profileLoadStatus, isBootstrapped } = authStore;

  const hasCloudSession = Boolean(userId);
  const hasGuestSession = !hasCloudSession && Boolean(anonId);
  const routeAccess = evaluateRouteAccess({
    pathname,
    hasCloudSession,
    hasGuestSession,
    role: normalizeRoleValue(role),
  });

  const isProfileContextPending =
    hasCloudSession &&
    (profileLoadStatus === "idle" || profileLoadStatus === "loading");

  const resolvedRedirectTarget = resolveLocaleAwareRedirectTarget({
    redirectTo: routeAccess.redirectTo,
    pathname,
    profileLocale: profile?.locale ?? null,
  });

  const needsRedirect = isBootstrapped && !isProfileContextPending && !routeAccess.allowed;
  const isWaiting = !isBootstrapped || isProfileContextPending || needsRedirect;

  useEffect(() => {
    if (!isBootstrapped || !needsRedirect) return;
    if (resolvedRedirectTarget) {
      router.replace(resolvedRedirectTarget);
    }
  }, [
    isBootstrapped,
    isProfileContextPending,
    needsRedirect,
    resolvedRedirectTarget,
    router,
  ]);

  return { isWaiting };
}
