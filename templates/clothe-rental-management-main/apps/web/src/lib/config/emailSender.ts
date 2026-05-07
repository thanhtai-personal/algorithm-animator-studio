const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

export const EMAIL_SENDER_DISABLED_MESSAGE = "Email sender is disabled by configuration.";

export function parseBooleanFlag(value: string | null | undefined): boolean | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return undefined;
}

export const enabledEmailSender =
  parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLED_EMAIL_SENDER) ?? false;
