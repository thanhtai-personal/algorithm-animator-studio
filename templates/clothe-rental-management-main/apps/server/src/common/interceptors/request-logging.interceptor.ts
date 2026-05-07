import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable, tap } from 'rxjs';
import type { Request, Response } from 'express';
import { resolveEndpointGroup } from '../http/endpoint-group.util';

const DEFAULT_WARN_LATENCY_MS = 1200;

function parseWarnLatencyMs(): number {
  const raw = process.env.API_LOG_WARN_LATENCY_MS;
  if (!raw) return DEFAULT_WARN_LATENCY_MS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_WARN_LATENCY_MS;
  return parsed;
}

const WARN_LATENCY_MS = parseWarnLatencyMs();

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const requestId =
      (request.headers['x-request-id'] as string | undefined)?.trim() ||
      randomUUID();

    response.setHeader('x-request-id', requestId);
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.logRequest(request, response, requestId, startedAt),
        error: () => this.logRequest(request, response, requestId, startedAt),
      }),
    );
  }

  private logRequest(
    request: Request,
    response: Response,
    requestId: string,
    startedAt: number,
  ): void {
    const durationMs = Date.now() - startedAt;
    const method = request.method;
    const path = request.originalUrl || request.url;
    const status = response.statusCode;
    const endpointGroup = resolveEndpointGroup(path);
    const statusFamily = `${Math.floor(status / 100)}xx`;
    const payload = {
      requestId,
      method,
      path,
      endpointGroup,
      status,
      statusFamily,
      durationMs,
      warnLatencyMs: WARN_LATENCY_MS,
      isSlowRequest: durationMs >= WARN_LATENCY_MS,
    };

    if (status >= 500 || durationMs >= WARN_LATENCY_MS) {
      console.warn('[api-request]', payload);
      return;
    }

    console.info('[api-request]', payload);
  }
}
