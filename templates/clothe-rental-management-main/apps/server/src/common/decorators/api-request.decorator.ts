import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const ApiRequest = createParamDecorator(
  (_: unknown, context: ExecutionContext): Request =>
    context.switchToHttp().getRequest<Request>(),
);
