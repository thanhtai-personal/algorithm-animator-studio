export const SHOWROOM_ROLE_VALUES = [
  'owner_admin',
  'manager',
  'staff',
  'accountant',
  'makeup_artist',
  'customer',
] as const;

export type ShowroomRole = (typeof SHOWROOM_ROLE_VALUES)[number];

export type AuthPermissionKey =
  | 'orders.create'
  | 'orders.edit_reserved'
  | 'orders.edit_confirmed'
  | 'orders.cancel'
  | 'products.edit_pricing'
  | 'payments.update_status_manual'
  | 'settings.manage'
  | 'users.manage'
  | 'branches.switch';

export type AuthPermissions = Record<AuthPermissionKey, boolean>;

export interface ShowroomProfile {
  id: string;
  authUserId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: ShowroomRole | null;
  defaultBranchId: string | null;
  branchId: string | null;
  locale: 'vi' | 'en' | null;
  isActive: boolean;
}

export interface ProfileBranchAccess {
  branchId: string;
  branchName: string | null;
  isDefault: boolean;
}

export interface AuthProfileContext {
  profile: ShowroomProfile | null;
  branchAccess: ProfileBranchAccess[];
}

export type AuthProfileLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export type RouteAuthPolicy =
  | 'auth-only-no-session'
  | 'public'
  | 'session-any'
  | 'cloud-only';

export interface RouteAccessDecision {
  allowed: boolean;
  redirectTo: string | null;
  policy: RouteAuthPolicy;
}

export const EMPTY_AUTH_PERMISSIONS: AuthPermissions = {
  'orders.create': false,
  'orders.edit_reserved': false,
  'orders.edit_confirmed': false,
  'orders.cancel': false,
  'products.edit_pricing': false,
  'payments.update_status_manual': false,
  'settings.manage': false,
  'users.manage': false,
  'branches.switch': false,
};
