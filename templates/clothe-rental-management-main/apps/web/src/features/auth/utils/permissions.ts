import {
  EMPTY_AUTH_PERMISSIONS,
  SHOWROOM_ROLE_VALUES,
  type AuthPermissionKey,
  type AuthPermissions,
  type ShowroomRole,
} from "@/types/showroomAuth";

const ROLE_SET = new Set<string>(SHOWROOM_ROLE_VALUES);

export function normalizeShowroomRole(role: string | null | undefined): ShowroomRole | null {
  if (!role) return null;
  const normalized = role.trim().toLowerCase();
  if (normalized === "admin") {
    return "owner_admin";
  }
  if (!ROLE_SET.has(normalized)) return null;
  return normalized as ShowroomRole;
}

export function buildPermissionsForRole(role: ShowroomRole | null): AuthPermissions {
  if (!role) {
    return { ...EMPTY_AUTH_PERMISSIONS };
  }

  if (role === "owner_admin") {
    return {
      "orders.create": true,
      "orders.edit_reserved": true,
      "orders.edit_confirmed": true,
      "orders.cancel": true,
      "products.edit_pricing": true,
      "payments.update_status_manual": true,
      "settings.manage": true,
      "users.manage": true,
      "branches.switch": true,
    };
  }

  if (role === "manager") {
    return {
      "orders.create": true,
      "orders.edit_reserved": true,
      "orders.edit_confirmed": true,
      "orders.cancel": true,
      "products.edit_pricing": true,
      "payments.update_status_manual": false,
      "settings.manage": true,
      "users.manage": false,
      "branches.switch": true,
    };
  }

  if (role === "accountant") {
    return {
      "orders.create": false,
      "orders.edit_reserved": false,
      "orders.edit_confirmed": false,
      "orders.cancel": false,
      "products.edit_pricing": false,
      "payments.update_status_manual": false,
      "settings.manage": false,
      "users.manage": false,
      "branches.switch": true,
    };
  }

  if (role === "staff") {
    return {
      "orders.create": true,
      "orders.edit_reserved": true,
      "orders.edit_confirmed": false,
      "orders.cancel": false,
      "products.edit_pricing": false,
      "payments.update_status_manual": false,
      "settings.manage": false,
      "users.manage": false,
      "branches.switch": true,
    };
  }

  if (role === "makeup_artist") {
    return {
      "orders.create": false,
      "orders.edit_reserved": false,
      "orders.edit_confirmed": false,
      "orders.cancel": false,
      "products.edit_pricing": false,
      "payments.update_status_manual": false,
      "settings.manage": false,
      "users.manage": false,
      "branches.switch": true,
    };
  }

  return {
    "orders.create": false,
    "orders.edit_reserved": false,
    "orders.edit_confirmed": false,
    "orders.cancel": false,
    "products.edit_pricing": false,
    "payments.update_status_manual": false,
    "settings.manage": false,
    "users.manage": false,
    "branches.switch": false,
  };
}

export function hasPermission(
  permissions: AuthPermissions | null | undefined,
  key: AuthPermissionKey
): boolean {
  return Boolean(permissions?.[key]);
}
