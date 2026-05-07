export type ZaloMiniAppMakeupSessionSlot = "MORNING" | "AFTERNOON" | "EVENING";
export type ZaloMiniAppMakeupInputMode = "TEXT" | "VOICE";

export interface ZaloMiniAppMakeupEventDto {
  id: string;
  eventDate: string;
  sessionSlot: ZaloMiniAppMakeupSessionSlot;
  startAt: string;
  endAt: string;
  customerName: string | null;
  customerPhone: string | null;
  isConflictWarning: boolean;
  createdAt: string;
}

export interface ZaloMiniAppMakeupEventConflictDto {
  eventId: string;
  eventDate: string;
  sessionSlot: ZaloMiniAppMakeupSessionSlot;
  reason: "ARTIST_SLOT_CONFLICT" | "CUSTOMER_SLOT_CONFLICT";
}

export interface ZaloMiniAppParsedBookingDraft {
  inputMode: ZaloMiniAppMakeupInputMode;
  rawInput: string;
  guestCount?: number | null;
  bookingDate?: string | null;
  bookingTime?: string | null;
  sessionSlot?: ZaloMiniAppMakeupSessionSlot | null;
  startAt?: string | null;
  endAt?: string | null;
  durationMinutes?: number | null;
  customerName: string;
  customerPhone: string;
  note?: string | null;
  parseWarnings: string[];
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

export interface ZaloMiniAppParseBookingInputPayload {
  inputMode: ZaloMiniAppMakeupInputMode;
  inputText: string;
  referenceDate?: string | null;
}

export interface ZaloMiniAppCreateMakeupEventPayload {
  branchId?: string | null;
  eventDate: string;
  sessionSlot: ZaloMiniAppMakeupSessionSlot;
  startAt: string;
  endAt: string;
  artistProfileId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  guestCount: number;
  durationMinutes: number;
  surchargeAmount?: number | null;
  note?: string | null;
  sourceInputMode: ZaloMiniAppMakeupInputMode;
  sourceInputText?: string | null;
  confirmConflictOverride?: boolean;
}

export interface ZaloMiniAppMakeupEventMutationResponse {
  event: ZaloMiniAppMakeupEventDto;
  conflicts: ZaloMiniAppMakeupEventConflictDto[];
  warningAcknowledged: boolean;
}
