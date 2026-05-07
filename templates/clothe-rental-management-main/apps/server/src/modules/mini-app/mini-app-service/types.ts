export type MiniAppDomainErrorCode =
  | 'MODULE_DISABLED'
  | 'INVALID_PAYLOAD'
  | 'INVALID_TOKEN'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'IDENTITY_REVOKED';

export class MiniAppDomainError extends Error {
  readonly code: MiniAppDomainErrorCode;
  readonly context: Record<string, unknown>;

  constructor(
    code: MiniAppDomainErrorCode,
    context: Record<string, unknown> = {},
  ) {
    super(code);
    this.name = 'MiniAppDomainError';
    this.code = code;
    this.context = context;
  }
}

export type RentalScope = 'order' | 'revenue';
export type RentalDomainErrorCode =
  | 'FORBIDDEN_ROLE'
  | 'FORBIDDEN_BRANCH_SCOPE'
  | 'MISSING_BRANCH_CONTEXT';

export class RentalDomainError extends Error {
  readonly code: RentalDomainErrorCode;
  readonly context: Record<string, unknown>;

  constructor(
    code: RentalDomainErrorCode,
    context: Record<string, unknown> = {},
  ) {
    super(code);
    this.name = 'RentalDomainError';
    this.code = code;
    this.context = context;
  }
}

export type MiniAppIdentityDto = {
  id: string;
  zaloUserId: string;
  profileId: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  consentScopes: string[];
  consentRevokedAt: string | null;
  lastLoginAt: string;
};

export type MiniAppSessionDto = {
  sessionToken: string;
  expiresAt: string;
  identity: MiniAppIdentityDto;
};

export type MiniAppIdentityRow = {
  id: string;
  zalo_user_id: string;
  profile_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  consent_scopes: string[] | null;
  consent_revoked_at: string | null;
  last_login_at: string;
};

export type MiniAppSessionRow = {
  id: string;
  identity_id: string;
  expires_at: string;
  revoked_at: string | null;
};

export type ProfileRow = {
  id: string;
  role: string | null;
  full_name: string | null;
  default_branch_id: string | null;
};

export type BranchAccessRow = {
  branch_id: string;
};

export type BranchRow = {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  timezone: string | null;
  currency_code: string | null;
  is_active: boolean;
};

export type RentalAccessContext = {
  profileId: string;
  role: string;
  branchId: string;
  displayName: string | null;
  branches: Array<{
    id: string;
    code: string;
    name: string;
    address: string | null;
    phone: string | null;
    timezone: string;
    currencyCode: string;
    isActive: boolean;
  }>;
};

export const ORDER_ROLE_SET = new Set(['owner_admin', 'manager', 'staff']);
export const REVENUE_ROLE_SET = new Set([
  'owner_admin',
  'manager',
  'accountant',
]);
export const DEFAULT_BRANCH_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const DEFAULT_CURRENCY_CODE = 'VND';
