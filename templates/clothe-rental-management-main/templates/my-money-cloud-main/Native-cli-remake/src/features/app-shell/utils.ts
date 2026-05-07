export function parseSemver(value: string): number[] {
  return value.split(".").map((part) => Number(part) || 0);
}

export function compareVersions(a: string, b: string): number {
  const va = parseSemver(a);
  const vb = parseSemver(b);
  const len = Math.max(va.length, vb.length);
  for (let i = 0; i < len; i += 1) {
    const ai = va[i] ?? 0;
    const bi = vb[i] ?? 0;
    if (ai > bi) return 1;
    if (ai < bi) return -1;
  }
  return 0;
}

export const normalizeStoreUrl = (value?: string) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;
  return trimmed;
};