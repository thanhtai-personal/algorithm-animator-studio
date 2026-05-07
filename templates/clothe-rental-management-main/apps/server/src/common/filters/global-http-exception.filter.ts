import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { resolveEndpointGroup } from '../http/endpoint-group.util';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const normalized = this.normalizeErrorPayload(
      errorResponse,
      exception,
      status,
    );
    const requestId = this.resolveRequestId(request, response);
    const path = request.originalUrl || request.url;
    const endpointGroup = resolveEndpointGroup(path);
    this.logException({
      endpointGroup,
      exception,
      method: request.method,
      path,
      requestId,
      status,
      normalized,
    });

    response.status(status).json({
      ...normalized,
      statusCode: status,
      path,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  private resolveRequestId(request: Request, response: Response): string {
    const existing = response.getHeader('x-request-id');
    if (typeof existing === 'string' && existing.trim().length > 0) {
      return existing;
    }

    const headerValue = request.headers['x-request-id'];
    const fromHeader =
      typeof headerValue === 'string'
        ? headerValue.trim()
        : Array.isArray(headerValue)
          ? (headerValue[0] ?? '').trim()
          : '';
    const requestId = fromHeader.length > 0 ? fromHeader : randomUUID();
    response.setHeader('x-request-id', requestId);
    return requestId;
  }

  private logException(input: {
    endpointGroup: string;
    exception: unknown;
    method: string;
    normalized: Record<string, unknown>;
    path: string;
    requestId: string;
    status: number;
  }): void {
    const {
      endpointGroup,
      exception,
      method,
      normalized,
      path,
      requestId,
      status,
    } = input;
    const statusFamily = `${Math.floor(status / 100)}xx`;
    const rawError = normalized.error;
    const rawCode = normalized.code;
    const payload: Record<string, unknown> = {
      requestId,
      method,
      path,
      endpointGroup,
      status,
      statusFamily,
      errorCode: typeof rawCode === 'string' ? rawCode : null,
      error:
        typeof rawError === 'string'
          ? rawError
          : Array.isArray(rawError)
            ? rawError.join('; ')
            : (rawError ?? 'Request failed'),
      exceptionType:
        exception instanceof Error && exception.name
          ? exception.name
          : 'UnknownError',
    };

    if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
      payload.stack = exception.stack ?? null;
    }

    if (status >= 500) {
      console.warn('[api-error]', payload);
      return;
    }

    console.info('[api-error]', payload);
  }

  private normalizeErrorPayload(
    errorResponse: string | object | undefined,
    exception: unknown,
    status: number,
  ): Record<string, unknown> {
    if (typeof errorResponse === 'string') {
      return { error: errorResponse };
    }

    if (errorResponse && typeof errorResponse === 'object') {
      const payload = { ...(errorResponse as Record<string, unknown>) };
      if (!('error' in payload) && 'message' in payload) {
        payload.error = payload.message;
      }
      return payload;
    }

    if (exception instanceof Error) {
      return { error: exception.message };
    }

    return {
      error: status === 500 ? 'Internal Server Error' : 'Request failed',
    };
  }
}
