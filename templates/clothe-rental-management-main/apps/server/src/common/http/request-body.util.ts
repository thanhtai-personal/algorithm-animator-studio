import type { Request } from 'express';

function parseJsonText(value: string): unknown | null {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export function readJsonBody(request: Request): unknown {
  if (!request.body) return null;
  if (typeof request.body === 'string') {
    return parseJsonText(request.body);
  }
  return request.body as unknown;
}

export function readJsonBodyAsRecord(
  request: Request,
): Record<string, unknown> {
  const body = readJsonBody(request);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {};
  }
  return body as Record<string, unknown>;
}
