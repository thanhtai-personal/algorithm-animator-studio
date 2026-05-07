export type PhoneProfileCandidateRow = {
  id: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_active: boolean | null;
};

export type CustomerPhoneLookupRow = {
  profile_id: string | null;
};

export type ApiProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  default_branch_id: string | null;
  locale: string | null;
  is_active: boolean | null;
};

export type ApiProfileBranchAccessRow = {
  branch_id: string;
  is_default: boolean;
  branch_name: string | null;
  branch_domain: string | null;
  shop_domain: string | null;
};

export type ApiProfileBranchAccessSourceRow = Pick<
  ApiProfileBranchAccessRow,
  'branch_id' | 'is_default'
>;

export type ApiAuthUserProfilePayload = {
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
};

export type AuthAdminUserMetadata = Record<string, unknown>;

export type AuthAdminUserForProfileSync = {
  id: string;
  email: string | null;
  phone: string | null;
  app_metadata: AuthAdminUserMetadata | null;
  user_metadata: AuthAdminUserMetadata | null;
};

export type ProfileUpsertPayload = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  locale: 'vi' | 'en';
  is_active: boolean;
  disabled_at: null;
  disabled_by: null;
};
