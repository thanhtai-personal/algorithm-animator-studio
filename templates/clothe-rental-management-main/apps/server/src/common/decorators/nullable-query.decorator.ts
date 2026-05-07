import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

function normalizeNullableQueryValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const NullableQuery = createParamDecorator(
  (queryKey: string, context: ExecutionContext): string | null => {
    const request = context.switchToHttp().getRequest<Request>();
    const rawValue = request.query?.[queryKey];
    if (Array.isArray(rawValue)) {
      return normalizeNullableQueryValue(rawValue[0]);
    }
    return normalizeNullableQueryValue(rawValue);
  },
);
