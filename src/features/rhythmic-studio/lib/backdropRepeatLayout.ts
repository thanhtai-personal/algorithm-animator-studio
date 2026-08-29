export function sampledBackdropRepeatIndices(
  height: number,
  spacing: number,
  maxItems: number,
) {
  const count = Math.max(0, Math.ceil(height / Math.max(0.001, spacing)));
  const limit = Math.max(0, Math.floor(maxItems));
  if (count <= limit) return Array.from({ length: count }, (_, index) => index);
  if (limit === 0) return [];
  if (limit === 1) return [0];

  return Array.from({ length: limit }, (_, index) => (
    Math.round(index * (count - 1) / (limit - 1))
  ));
}
