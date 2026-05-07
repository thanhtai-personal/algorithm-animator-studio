import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { readJsonBodyAsRecord } from '../../../common/http/request-body.util';
import { getAuthenticatedSupabaseClient } from '../../../common/supabase/request-authenticated-client.util';
import {
  completeMediaUploadForActor,
  deleteMediaAssetForActor,
  listMediaAssetsForActor,
  MediaDomainError,
  prepareMediaUploadForActor,
} from '../infrastructure/media.data-access';
import type {
  CompleteMediaUploadPayload,
  MediaAssetType,
  MediaListQuery,
  PrepareMediaUploadPayload,
} from '../types/media-library.type';

const MAX_PAGE_SIZE = 60;
const DEFAULT_PAGE_SIZE = 24;

export interface MediaApiResult {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
  isRaw?: boolean;
}

function jsonResult(
  body: unknown,
  init?: { status?: number; headers?: Record<string, string> },
): MediaApiResult {
  return {
    status: init?.status ?? 200,
    body,
    headers: init?.headers,
  };
}

function parseString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseInteger(
  value: string | null | undefined,
  fallback: number,
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseNonNegativeInteger(value: unknown): number | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) return null;
    return Math.floor(value);
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return Math.floor(parsed);
  }

  return null;
}

function parseMediaType(value: unknown): MediaAssetType | null {
  const normalized = parseString(value)?.toLowerCase() ?? null;
  if (!normalized) return null;
  if (normalized === 'image' || normalized === 'video') return normalized;
  return null;
}

function getSearchParams(request: Request): URLSearchParams {
  const sourceUrl =
    (typeof request.originalUrl === 'string' && request.originalUrl) ||
    request.url ||
    '/';
  return new URL(sourceUrl, 'http://localhost').searchParams;
}

async function getAuthenticatedClient(request: Request) {
  const { supabase, userId } = await getAuthenticatedSupabaseClient(request);
  return {
    userId,
    supabase,
  };
}

function mapMediaDomainError(error: unknown): MediaApiResult | null {
  if (!(error instanceof MediaDomainError)) {
    return null;
  }

  const payload =
    Object.keys(error.context ?? {}).length > 0
      ? { error: error.code, context: error.context }
      : { error: error.code };

  if (
    error.code === 'FORBIDDEN_MEDIA_ACCESS' ||
    error.code === 'BRANCH_ACCESS_DENIED'
  ) {
    return jsonResult(payload, { status: 403 });
  }

  if (
    error.code === 'MISSING_PROFILE_CONTEXT' ||
    error.code === 'MISSING_BRANCH_CONTEXT' ||
    error.code === 'INVALID_MEDIA_TYPE' ||
    error.code === 'INVALID_FILE_SIZE'
  ) {
    return jsonResult(payload, { status: 400 });
  }

  if (error.code === 'MEDIA_STORAGE_LIMIT_EXCEEDED') {
    return jsonResult(payload, { status: 409 });
  }

  if (
    error.code === 'MEDIA_UPLOAD_SESSION_NOT_FOUND' ||
    error.code === 'MEDIA_NOT_FOUND'
  ) {
    return jsonResult(payload, { status: 404 });
  }

  if (error.code === 'MEDIA_UPLOAD_SESSION_EXPIRED') {
    return jsonResult(payload, { status: 409 });
  }

  if (
    error.code === 'MEDIA_UPLOAD_SESSION_INVALID_STATE' ||
    error.code === 'MEDIA_DELETE_FAILED'
  ) {
    return jsonResult(payload, { status: 409 });
  }

  if (error.code === 'MEDIA_SCHEMA_NOT_READY') {
    return jsonResult(payload, { status: 503 });
  }

  return jsonResult(payload, { status: 400 });
}

function toUnknownErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (!error || typeof error !== 'object') return '';
  if (!('message' in error)) return '';
  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' ? message : '';
}

function handleUnexpectedError(error: unknown): MediaApiResult {
  const message = toUnknownErrorMessage(error) || 'Unexpected error';
  return jsonResult({ error: message }, { status: 500 });
}

function parseMediaListQuery(request: Request): MediaListQuery {
  const searchParams = getSearchParams(request);
  const page = parseInteger(searchParams.get('page'), 1);
  const pageSize = Math.min(
    parseInteger(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE,
  );
  const mediaType = parseMediaType(searchParams.get('mediaType'));

  return {
    branchId: parseString(searchParams.get('branchId')),
    search: parseString(searchParams.get('search')),
    mediaType,
    page,
    pageSize,
  };
}

function parsePrepareUploadPayload(
  body: Record<string, unknown>,
): PrepareMediaUploadPayload | null {
  const fileName = parseString(body.fileName);
  const mimeType = parseString(body.mimeType);
  const mediaType = parseMediaType(body.mediaType);
  const sizeBytes = parseNonNegativeInteger(body.sizeBytes);

  if (
    !fileName ||
    !mimeType ||
    !mediaType ||
    sizeBytes === null ||
    sizeBytes <= 0
  ) {
    return null;
  }

  return {
    branchId: parseString(body.branchId),
    fileName,
    mimeType,
    sizeBytes,
    mediaType,
  };
}

function parseCompleteUploadPayload(
  body: Record<string, unknown>,
): CompleteMediaUploadPayload | null {
  const uploadSessionId = parseString(body.uploadSessionId);
  if (!uploadSessionId) {
    return null;
  }

  return {
    uploadSessionId,
  };
}

@Injectable()
export class MediaService {
  async getMediaAssets(request: Request): Promise<MediaApiResult> {
    try {
      const { userId, supabase } = await getAuthenticatedClient(request);
      const query = parseMediaListQuery(request);

      const response = await listMediaAssetsForActor(supabase, {
        actorProfileId: userId,
        query,
      });

      return jsonResult(response);
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        return jsonResult({ error: 'Unauthorized' }, { status: 401 });
      }

      const domainErrorResponse = mapMediaDomainError(error);
      if (domainErrorResponse) {
        return domainErrorResponse;
      }

      return handleUnexpectedError(error);
    }
  }

  async postMediaPrepareUpload(request: Request): Promise<MediaApiResult> {
    try {
      const { userId, supabase } = await getAuthenticatedClient(request);
      const body = readJsonBodyAsRecord(request);
      const payload = parsePrepareUploadPayload(body);

      if (!payload) {
        return jsonResult(
          { error: 'Invalid media upload payload' },
          { status: 400 },
        );
      }

      const response = await prepareMediaUploadForActor(supabase, {
        actorProfileId: userId,
        payload,
      });

      return jsonResult(response, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        return jsonResult({ error: 'Unauthorized' }, { status: 401 });
      }

      const domainErrorResponse = mapMediaDomainError(error);
      if (domainErrorResponse) {
        return domainErrorResponse;
      }

      return handleUnexpectedError(error);
    }
  }

  async postMediaUploadComplete(request: Request): Promise<MediaApiResult> {
    try {
      const { userId, supabase } = await getAuthenticatedClient(request);
      const body = readJsonBodyAsRecord(request);
      const payload = parseCompleteUploadPayload(body);

      if (!payload) {
        return jsonResult(
          { error: 'Invalid media upload completion payload' },
          { status: 400 },
        );
      }

      const response = await completeMediaUploadForActor(supabase, {
        actorProfileId: userId,
        payload,
      });

      return jsonResult(response, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        return jsonResult({ error: 'Unauthorized' }, { status: 401 });
      }

      const domainErrorResponse = mapMediaDomainError(error);
      if (domainErrorResponse) {
        return domainErrorResponse;
      }

      return handleUnexpectedError(error);
    }
  }

  async deleteMediaAsset(
    request: Request,
    mediaId: string,
  ): Promise<MediaApiResult> {
    try {
      const { userId, supabase } = await getAuthenticatedClient(request);
      const response = await deleteMediaAssetForActor(supabase, {
        actorProfileId: userId,
        mediaAssetId: mediaId,
      });
      return jsonResult(response);
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        return jsonResult({ error: 'Unauthorized' }, { status: 401 });
      }

      const domainErrorResponse = mapMediaDomainError(error);
      if (domainErrorResponse) {
        return domainErrorResponse;
      }

      return handleUnexpectedError(error);
    }
  }
}
