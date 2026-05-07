import type { ZaloMiniAppConfigDto } from "@/lib/contracts";

export interface ZaloSdkUserInfo {
  id: string;
  name?: string;
  avatar?: string;
  idByOA?: string;
}

export interface ZaloSdkAuthResult {
  accessToken: string;
  scopes: string[];
}

export interface ZaloPlatformState {
  config: ZaloMiniAppConfigDto | null;
  isReady: boolean;
  isSupported: boolean;
  userInfo: ZaloSdkUserInfo | null;
  auth: ZaloSdkAuthResult | null;
}
