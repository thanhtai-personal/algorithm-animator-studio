"use client";

import { authStore } from "@/store/authStore";
import type { AuthPermissionKey } from "@/types/showroomAuth";
import { hasPermission } from "@/features/auth/utils/permissions";

export function useAuthAccess() {
  return {
    profile: authStore.profile,
    role: authStore.role,
    permissions: authStore.permissions,
    currentBranchId: authStore.currentBranchId,
    branchAccess: authStore.branchAccess,
    profileLoadStatus: authStore.profileLoadStatus,
    hasCloudSession: authStore.hasCloudSession,
    hasGuestSession: authStore.hasGuestSession,
    can(permission: AuthPermissionKey) {
      return hasPermission(authStore.permissions, permission);
    },
  };
}

