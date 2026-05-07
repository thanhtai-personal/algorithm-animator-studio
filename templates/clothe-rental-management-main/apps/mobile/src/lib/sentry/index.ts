import { Platform } from "react-native";
import * as Sentry from "@sentry/react-native";
import {
  SENTRY_DSN,
  SENTRY_ENVIRONMENT,
  SENTRY_RELEASE,
  SENTRY_SHOWROOM_ID,
  isSentryConfigured,
} from "./config";
import { sanitizeSentryPayload } from "./sanitizeEvent";

let hasInitialized = false;

export function initializeSentry(): void {
  if (hasInitialized || !isSentryConfigured || !SENTRY_DSN) {
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      enabled: true,
      environment: SENTRY_ENVIRONMENT,
      release: SENTRY_RELEASE,
      tracesSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.1 : 1,
      ignoreErrors: ["AbortError", "Network request failed"],
      beforeSend(event) {
        return sanitizeSentryPayload(event);
      },
    });

    Sentry.setTag("platform", `mobile-${Platform.OS}`);
    if (SENTRY_SHOWROOM_ID) {
      Sentry.setTag("showroom_id", SENTRY_SHOWROOM_ID);
    }

    hasInitialized = true;
  } catch {
    // Fail-safe: telemetry cannot break app startup.
  }
}
