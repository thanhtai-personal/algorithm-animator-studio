import type { Event } from "@sentry/nextjs";

const MASKED_VALUE = "[Filtered]";
const SENSITIVE_KEY_PATTERN =
  /authorization|cookie|token|secret|password|passwd|api[-_]?key|phone|email/i;

function sanitizeUnknownValue(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUnknownValue(item));
  }

  const record = { ...(value as Record<string, unknown>) };

  for (const key of Object.keys(record)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      record[key] = MASKED_VALUE;
      continue;
    }

    record[key] = sanitizeUnknownValue(record[key]);
  }

  return record;
}

export function sanitizeSentryEvent<TEvent extends Event>(event: TEvent): TEvent {
  const sanitizedEvent = { ...event } as TEvent;

  if (sanitizedEvent.request?.headers) {
    sanitizedEvent.request = {
      ...sanitizedEvent.request,
      headers: sanitizeUnknownValue(sanitizedEvent.request.headers) as Record<string, string>,
    };
  }

  if (sanitizedEvent.extra) {
    sanitizedEvent.extra = sanitizeUnknownValue(sanitizedEvent.extra) as Record<string, unknown>;
  }

  if (sanitizedEvent.contexts) {
    sanitizedEvent.contexts = sanitizeUnknownValue(sanitizedEvent.contexts) as Event["contexts"];
  }

  if (sanitizedEvent.user) {
    sanitizedEvent.user = {
      ...sanitizedEvent.user,
      email: sanitizedEvent.user.email ? MASKED_VALUE : undefined,
      ip_address: sanitizedEvent.user.ip_address ? MASKED_VALUE : undefined,
    };
  }

  return sanitizedEvent;
}
