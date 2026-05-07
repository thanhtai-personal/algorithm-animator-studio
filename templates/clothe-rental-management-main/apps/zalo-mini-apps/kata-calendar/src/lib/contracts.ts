export type ZaloMiniAppMakeupSessionSlot = "MORNING" | "AFTERNOON" | "EVENING";

export interface ZaloMiniAppConfigDto {
  enabled: boolean;
}

export interface ZaloMiniAppIdentityDto {
  id: string;
  zaloUserId: string;
  profileId: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  consentScopes: string[];
  consentRevokedAt: string | null;
  lastLoginAt: string;
}

export interface ZaloMiniAppSessionDto {
  sessionToken: string;
  expiresAt: string;
  identity: ZaloMiniAppIdentityDto;
}

export interface ZaloMiniAppCreateSessionPayload {
  zaloUserId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  consentScopes?: string[];
  zaloAccessToken?: string | null;
}

export interface ZaloMiniAppMakeupCalendarAccessDto {
  profileId: string;
  role: string;
  branchId: string;
  timeZone: string;
  displayName: string | null;
}

export interface ZaloMiniAppMakeupEventDto {
  id: string;
  branchId: string;
  eventDate: string;
  sessionSlot: ZaloMiniAppMakeupSessionSlot;
  artistProfileId: string;
  artistName: string | null;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  packageId: string | null;
  packageCode: string | null;
  packageName: string | null;
  guestCount: number;
  durationMinutes: number;
  startAt: string;
  endAt: string;
  status: "BOOKED" | "COMPLETED" | "CANCELLED";
  note: string | null;
  priceAmount: number;
  surchargeAmount: number;
  costAmount: number;
  isConflictWarning: boolean;
  conflictNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ZaloMiniAppMakeupEventsResponse {
  branchId: string;
  timezone: string;
  moduleEnabled: boolean;
  events: ZaloMiniAppMakeupEventDto[];
}

export interface ZaloMiniAppMakeupArtistDto {
  profileId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  defaultBranchId: string | null;
  branchIds: string[];
}

export interface ZaloMiniAppMakeupArtistsResponse {
  branchId: string;
  items: ZaloMiniAppMakeupArtistDto[];
}

export interface ZaloMiniAppWebAuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
}

export interface ZaloMiniAppWebAuthProfile {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  branchId: string | null;
  defaultBranchId: string | null;
}

export interface ZaloMiniAppWebAuthBranchAccess {
  branchId: string;
  branchName: string | null;
  isDefault: boolean;
}

export interface ZaloMiniAppWebAuthContext {
  profile: ZaloMiniAppWebAuthProfile | null;
  branchAccess: ZaloMiniAppWebAuthBranchAccess[];
}
