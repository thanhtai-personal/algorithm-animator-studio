import type { Request } from 'express';
import { MakeupDomainError } from '../../infrastructure/makeup.data-access';
import {
  getAuthedClient as getAuthedClientFromShared,
  jsonResult,
  type MakeupApiResult,
} from '../makeup-admin-shared.service';

export async function getAuthedClient(request: Request) {
  return getAuthedClientFromShared(request);
}

export function unauthorizedResponse() {
  return jsonResult({ error: 'Unauthorized' }, { status: 401 });
}

export function mapDomainError(error: unknown): MakeupApiResult {
  if (error instanceof MakeupDomainError) {
    const payload =
      Object.keys(error.context ?? {}).length > 0
        ? { error: error.code, context: error.context }
        : { error: error.code };

    if (error.code === 'CONFLICT_WARNING_REQUIRED') {
      return jsonResult(payload, { status: 409 });
    }

    if (
      error.code === 'MISSING_BRANCH_CONTEXT' ||
      error.code === 'MODULE_DISABLED'
    ) {
      return jsonResult(payload, { status: 409 });
    }

    if (
      error.code === 'FORBIDDEN_BRANCH_SCOPE' ||
      error.code === 'FORBIDDEN_ROLE' ||
      error.code === 'FORBIDDEN_ARTIST_SCOPE'
    ) {
      return jsonResult(payload, { status: 403 });
    }

    if (
      error.code === 'EVENT_NOT_FOUND' ||
      error.code === 'PACKAGE_NOT_FOUND'
    ) {
      return jsonResult(payload, { status: 404 });
    }

    return jsonResult(payload, { status: 400 });
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  return jsonResult({ error: message }, { status: 500 });
}
