import { makeAutoObservable } from "mobx";
import type { ZaloMiniAppConfigDto } from "@/lib/contracts";
import type { ZaloSdkAuthResult, ZaloSdkUserInfo } from "@/features/platform/types/platform";

class ZaloPlatformStore {
  config: ZaloMiniAppConfigDto | null = null;
  isReady = false;
  isSupported = false;
  userInfo: ZaloSdkUserInfo | null = null;
  auth: ZaloSdkAuthResult | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  hydrateConfig(config: ZaloMiniAppConfigDto): void {
    this.config = config;
  }

  setSdkSupport(isSupported: boolean): void {
    this.isSupported = isSupported;
  }

  setReady(isReady: boolean): void {
    this.isReady = isReady;
  }

  hydrateUserInfo(userInfo: ZaloSdkUserInfo | null): void {
    this.userInfo = userInfo;
  }

  hydrateAuth(auth: ZaloSdkAuthResult | null): void {
    this.auth = auth;
  }
}

export const zaloPlatformStore = new ZaloPlatformStore();
