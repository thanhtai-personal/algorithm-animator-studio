function sanitizeText(value: string | undefined | null): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBooleanFlag(
  value: string | undefined | null,
): boolean | undefined {
  const normalized = sanitizeText(value)?.toLowerCase();
  if (!normalized) return undefined;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return undefined;
}

export function isEmailSenderEnabled(): boolean {
  const privateFlag = parseBooleanFlag(process.env.ENABLED_EMAIL_SENDER);
  if (privateFlag !== undefined) return privateFlag;
  return (
    parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLED_EMAIL_SENDER) ?? false
  );
}
