export function resolveEndpointGroup(path: string): string {
  const normalizedPath = path.split('?')[0] ?? path;
  const segments = normalizedPath
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments[0] === 'api' && segments[1] === 'v1') {
    return segments[2] ?? 'root';
  }
  if (segments[0] === 'api') {
    return segments[1] ?? 'root';
  }
  return segments[0] ?? 'unknown';
}
