import { normalizeStoreUrl } from "./utils";

export const RESET_VERSION_KEY = "spendsmart:forceResetVersion";
export const ZERO_VERSION = "0.0.0";
export const CURRENT_APP_VERSION =
  process.env.EXPO_PUBLIC_APP_VERSION ?? process.env.APP_VERSION ?? ZERO_VERSION;


export const androidUrl = normalizeStoreUrl(
  process.env.EXPO_PUBLIC_APP_STORE_URL_ANDROID ?? process.env.APP_STORE_URL_ANDROID
);
export const iosUrl = normalizeStoreUrl(
  process.env.EXPO_PUBLIC_APP_STORE_URL_IOS ?? process.env.APP_STORE_URL_IOS
);
