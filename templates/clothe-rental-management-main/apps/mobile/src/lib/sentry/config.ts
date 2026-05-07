import Constants from "expo-constants";

type ExpoConfigShape = {
  version?: string;
  extra?: Record<string, unknown>;
};

const expoConfig = ((Constants.expoConfig ?? Constants.manifest) as ExpoConfigShape | null) ?? {};
const extra = expoConfig.extra ?? {};

function readExtraString(key: string): string | undefined {
  const value = extra[key];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const appVersion = typeof expoConfig.version === "string" ? expoConfig.version : undefined;

export const SENTRY_DSN =
  process.env.EXPO_PUBLIC_SENTRY_DSN ??
  process.env.SENTRY_DSN ??
  readExtraString("SENTRY_DSN");

export const SENTRY_ENVIRONMENT =
  process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ??
  process.env.SENTRY_ENVIRONMENT ??
  readExtraString("SENTRY_ENVIRONMENT") ??
  process.env.NODE_ENV ??
  "development";

export const SENTRY_RELEASE =
  process.env.EXPO_PUBLIC_SENTRY_RELEASE ??
  process.env.SENTRY_RELEASE ??
  readExtraString("SENTRY_RELEASE") ??
  (appVersion ? `quanlychitieu@${appVersion}` : undefined);

export const SENTRY_SHOWROOM_ID =
  process.env.EXPO_PUBLIC_SHOWROOM_ID ??
  process.env.SHOWROOM_ID ??
  readExtraString("SHOWROOM_ID");

export const isSentryConfigured = Boolean(SENTRY_DSN);
