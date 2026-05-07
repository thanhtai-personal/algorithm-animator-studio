import * as Sentry from "@sentry/nextjs";
import { sanitizeSentryEvent } from "./src/lib/sentry/sanitizeEvent";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment =
  process.env.SENTRY_ENVIRONMENT ??
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
  process.env.NODE_ENV ??
  "development";
const release = process.env.SENTRY_RELEASE ?? process.env.NEXT_PUBLIC_SENTRY_RELEASE;
const showroomId = process.env.SHOWROOM_ID ?? process.env.NEXT_PUBLIC_SHOWROOM_ID;

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate: environment === "production" ? 0.1 : 1,
    ignoreErrors: ["AbortError", "Network request failed"],
    beforeSend(event) {
      return sanitizeSentryEvent(event);
    },
    initialScope: {
      tags: {
        platform: "web-server",
        ...(showroomId ? { showroom_id: showroomId } : {}),
      },
    },
  });
}
