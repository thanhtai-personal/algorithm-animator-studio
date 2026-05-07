import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

function normalizeNullableBodyValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const NullableBodyField = createParamDecorator(
  (bodyKey: string, context: ExecutionContext): string | null => {
    const request = context.switchToHttp().getRequest<Request>();
    const body = request.body as Record<string, unknown> | undefined;
    return normalizeNullableBodyValue(body?.[bodyKey]);
  },
);
