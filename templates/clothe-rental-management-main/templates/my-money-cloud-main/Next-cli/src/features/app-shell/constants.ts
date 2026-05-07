import { normalizeStoreUrl } from "./utils";

export const RESET_VERSION_KEY = "spendsmart:forceResetVersion";
export const ZERO_VERSION = "0.0.0";
export const CURRENT_APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? ZERO_VERSION;


export const androidUrl = normalizeStoreUrl(process.env.NEXT_PUBLIC_APP_STORE_URL_ANDROID);
export const iosUrl = normalizeStoreUrl(process.env.NEXT_PUBLIC_APP_STORE_URL_IOS);