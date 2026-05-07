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

export function sanitizeSentryPayload<T>(payload: T): T {
  return sanitizeUnknownValue(payload) as T;
}
