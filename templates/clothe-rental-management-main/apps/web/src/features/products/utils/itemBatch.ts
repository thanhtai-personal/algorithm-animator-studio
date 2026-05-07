export function parseItemCodesFromText(value: string): string[] {
  return value
    .split(/[\n,;]+/g)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function findDuplicateItemCodes(codes: string[]): string[] {
  const seen = new Set<string>();
  const duplicated = new Set<string>();

  for (const code of codes) {
    const normalized = code.trim().toLowerCase();
    if (!normalized) continue;
    if (seen.has(normalized)) {
      duplicated.add(code);
    } else {
      seen.add(normalized);
    }
  }

  return Array.from(duplicated);
}

export function uniqueItemCodes(codes: string[]): string[] {
  const normalizedMap = new Map<string, string>();

  for (const code of codes) {
    const trimmed = code.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toLowerCase();
    if (normalizedMap.has(normalized)) continue;
    normalizedMap.set(normalized, trimmed);
  }

  return Array.from(normalizedMap.values());
}

export function parseNonNegativeIntegerInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function generateSequentialItemCodes(baseCode: string, quantity: number): string[] {
  const normalizedBaseCode = baseCode.trim();
  if (!normalizedBaseCode || quantity <= 0) return [];

  return Array.from({ length: quantity }, (_entry, index) => {
    const suffix = String(index + 1).padStart(3, "0");
    return `${normalizedBaseCode}-${suffix}`;
  });
}
