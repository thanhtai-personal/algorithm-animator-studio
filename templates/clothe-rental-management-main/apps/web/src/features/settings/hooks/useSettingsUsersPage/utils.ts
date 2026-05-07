import type { SettingsUsersCopy } from "./types";

export function resolveSettingsUsersActionErrorMessage(options: {
  error: unknown;
  copy: SettingsUsersCopy;
}): string {
  if (!(options.error instanceof Error)) return options.copy.loadError;

  if (options.error.message === "OWNER_ADMIN_ROLE_IS_SEED_ONLY") {
    return options.copy.ownerAdminSeedOnlyError;
  }

  if (options.error.message === "OWNER_ADMIN_ROLE_IMMUTABLE") {
    return options.copy.ownerAdminImmutableError;
  }

  if (options.error.message === "INVALID_ROLE") {
    return options.copy.invalidRoleError;
  }

  if (options.error.message === "INVALID_CREATE_PASSWORD") {
    return options.copy.createPasswordInvalidError;
  }

  if (options.error.message === "INVALID_RESET_PASSWORD") {
    return options.copy.resetPasswordInvalidError;
  }

  if (options.error.message === "EMAIL_SENDER_DISABLED") {
    return options.copy.emailSenderDisabledError;
  }

  return options.error.message || options.copy.loadError;
}

export function toggleArrayValue(values: string[], value: string): string[] {
  if (values.includes(value)) {
    return values.filter((entry) => entry !== value);
  }
  return [...values, value];
}

export function parseBranchIdsText(value: string): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const token of value.split(/[\s,;\n\r\t]+/)) {
    const normalized = token.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }

  return output;
}

function normalizeBranchIdsForCompare(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }

  output.sort((left, right) => left.localeCompare(right));
  return output;
}

export function areBranchIdsEqual(left: string[], right: string[]): boolean {
  const normalizedLeft = normalizeBranchIdsForCompare(left);
  const normalizedRight = normalizeBranchIdsForCompare(right);
  if (normalizedLeft.length !== normalizedRight.length) return false;

  for (let index = 0; index < normalizedLeft.length; index += 1) {
    if (normalizedLeft[index] !== normalizedRight[index]) return false;
  }

  return true;
}
