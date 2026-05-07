"use client";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function stripBranchCodePrefix(value: string): string {
  const match = /^([A-Z0-9]{1,12})\s*-\s*(.+)$/.exec(value);
  if (!match) return value;

  const candidate = match[2]?.trim();
  return candidate?.length ? candidate : value;
}

function isLikelyIdentifier(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function resolveBrandDisplayName(options: {
  branchName?: string | null;
  pageName?: string | null;
  fallback?: string;
}): string {
  const fallback = normalizeText(options.fallback) ?? "KATA";
  const pageName = normalizeText(options.pageName);
  const branchNameRaw = normalizeText(options.branchName);
  const branchName = branchNameRaw ? stripBranchCodePrefix(branchNameRaw) : null;

  if (branchName && !isLikelyIdentifier(branchName)) {
    return branchName;
  }

  if (pageName && !isLikelyIdentifier(pageName)) {
    return pageName;
  }

  return fallback;
}
