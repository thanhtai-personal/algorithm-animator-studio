"use client";

import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import { getSupabaseAuthHeaders, getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  CompleteMediaUploadResponse,
  DeleteMediaResponse,
  MediaAssetType,
  MediaListQuery,
  MediaListResponse,
  PrepareMediaUploadPayload,
  PrepareMediaUploadResponse,
} from "@/types/mediaLibrary";

interface ApiErrorPayload {
  error?: string;
  context?: Record<string, unknown>;
}

export class MediaApiError extends Error {
  readonly code: string;
  readonly context: Record<string, unknown>;

  constructor(code: string, context: Record<string, unknown> = {}) {
    super(code);
    this.name = "MediaApiError";
    this.code = code;
    this.context = context;
  }
}

function toQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.set(key, String(value));
  }

  const raw = search.toString();
  return raw ? `?${raw}` : "";
}

async function buildRequestInit(
  method: "GET" | "POST" | "DELETE",
  body?: unknown
): Promise<RequestInit> {
  const authHeaders = await getSupabaseAuthHeaders();

  return {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...authHeaders,
    },
    credentials: "same-origin",
    cache: "no-store",
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload & T;

  if (!response.ok) {
    const errorCode = payload.error ?? `HTTP_${response.status}`;
    throw new MediaApiError(errorCode, payload.context ?? {});
  }

  return payload;
}

function inferMediaTypeByMimeType(mimeType: string): MediaAssetType {
  const normalized = mimeType.trim().toLowerCase();
  if (normalized.startsWith("video/")) return "video";
  return "image";
}

export const mediaClientService = {
  async fetchMediaAssets(query: MediaListQuery): Promise<MediaListResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      search: query.search,
      mediaType: query.mediaType,
      page: query.page,
      pageSize: query.pageSize,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/media${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<MediaListResponse>(response);
  },

  async prepareUpload(payload: PrepareMediaUploadPayload): Promise<PrepareMediaUploadResponse> {
    const response = await fetch(buildNestApiUrl("/api/v1/media"),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<PrepareMediaUploadResponse>(response);
  },

  async completeUpload(uploadSessionId: string): Promise<CompleteMediaUploadResponse> {
    const response = await fetch(buildNestApiUrl("/api/v1/media/upload-complete"),
      await buildRequestInit("POST", { uploadSessionId })
    );

    return parseJsonResponse<CompleteMediaUploadResponse>(response);
  },

  async deleteMediaAsset(mediaAssetId: string): Promise<DeleteMediaResponse> {
    const response = await fetch(buildNestApiUrl(`/api/v1/media/${mediaAssetId}`),
      await buildRequestInit("DELETE")
    );

    return parseJsonResponse<DeleteMediaResponse>(response);
  },

  async uploadMediaFile(options: {
    branchId?: string | null;
    file: File;
    mediaType?: MediaAssetType;
  }): Promise<CompleteMediaUploadResponse> {
    const file = options.file;
    const mediaType = options.mediaType ?? inferMediaTypeByMimeType(file.type || "");

    const prepared = await this.prepareUpload({
      branchId: options.branchId ?? null,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      mediaType,
    });

    const supabase = getSupabaseBrowserClient();
    const { error: uploadError } = await supabase.storage
      .from(prepared.bucket)
      .upload(prepared.storagePath, file, {
        upsert: true,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      throw uploadError;
    }

    return this.completeUpload(prepared.uploadSessionId);
  },
};
