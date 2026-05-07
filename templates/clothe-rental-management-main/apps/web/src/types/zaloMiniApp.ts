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

export interface ZaloMiniAppDraftItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  name?: string | null;
}

export interface ZaloMiniAppCreateOrderDraftPayload {
  branchId?: string;
  customerId?: string | null;
  items: ZaloMiniAppDraftItemInput[];
  discountAmount?: number;
  surchargeAmount?: number;
  note?: string | null;
}

export interface ZaloMiniAppOrderDraftDto {
  id: string;
  branchId: string;
  identityId: string | null;
  customerId: string | null;
  status: "DRAFT" | "PENDING_PAYMENT" | "PAID" | "CANCELLED";
  currencyCode: string;
  subtotalAmount: number;
  discountAmount: number;
  surchargeAmount: number;
  totalAmount: number;
  itemsJson: ZaloMiniAppDraftItemInput[];
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ZaloMiniAppCreatePaymentOrderPayload {
  draftId: string;
  appId: string;
}

export interface ZaloMiniAppPaymentOrderDto {
  draftId: string;
  externalOrderId: string;
  amount: number;
  currencyCode: string;
  checksum: string | null;
  appId: string | null;
  description: string;
}

export interface ZaloMiniAppPaymentTransactionDto {
  id: string;
  draftId: string;
  externalOrderId: string;
  transactionId: string | null;
  amount: number;
  currencyCode: string;
  status: "CREATED" | "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  callbackPayloadJson: unknown;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ZaloMiniAppPaymentCallbackPayload {
  externalOrderId: string;
  transactionId?: string | null;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  amount?: number;
  eventId?: string | null;
}

export interface ZaloMiniAppWebhookPayload {
  eventId: string;
  eventType: string;
  timestamp?: string | null;
  data?: Record<string, unknown>;
}
