export type SignInPayload = { email?: string; phone?: string; password?: string };
export type SignUpPayload = { email?: string; password?: string };
export type RefreshPayload = { refresh_token?: string };

export interface ApiProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  default_branch_id: string | null;
  locale: string | null;
  is_active: boolean | null;
}

export interface ApiProfileBranchAccessRow {
  branch_id: string;
  is_default: boolean;
  branch_name: string | null;
}

export interface ApiAuthUserProfilePayload {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  branch_id: string | null;
  default_branch_id: string | null;
  locale: string | null;
  active: boolean;
}

export interface ApiAuthUserContextResponse {
  user: unknown;
  profile: ApiAuthUserProfilePayload | null;
  branch_access: ApiProfileBranchAccessRow[];
}
