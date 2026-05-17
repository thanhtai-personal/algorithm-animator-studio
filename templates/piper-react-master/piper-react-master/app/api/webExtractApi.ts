import type { ApiErrorResponse } from "../types";
import { buildApiUrl, withRuntimeSettingsHeaders } from "../utils/appSettingsStorage";

export type ExtractedTextItem = {
  ok: boolean;
  url: string;
  title?: string;
  text: string;
  characterCount: number;
  error?: string;
};

export type ExtractTextResponse = {
  ok: boolean;
  selector: string;
  combinedText: string;
  characterCount: number;
  results: ExtractedTextItem[];
};

export type ExtractedLinkItem = {
  href: string;
  text: string;
};

export type ExtractLinksResponse = {
  ok: boolean;
  url: string;
  selector: string;
  count: number;
  links: ExtractedLinkItem[];
};

export async function extractTextFromWeb(payload: {
  urls: string[];
  selector: string;
}): Promise<ExtractTextResponse> {
  let response: Response;

  try {
    response = await fetch(buildApiUrl("/api/extract-text"), {
      method: "POST",
      headers: withRuntimeSettingsHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(
      `Không gọi được API extract-text. Hãy kiểm tra backend đang chạy và VITE_API_URL trong Settings. Chi tiết: ${
        error instanceof Error ? error.message : "Unknown network error"
      }`
    );
  }

  const data = (await readJsonSafely(response)) as ExtractTextResponse | ApiErrorResponse;
  if (!response.ok) {
    throw new Error(formatApiError(data as ApiErrorResponse));
  }

  return data as ExtractTextResponse;
}

export async function extractLinksFromWeb(payload: {
  url: string;
  selector: string;
}): Promise<ExtractLinksResponse> {
  let response: Response;

  try {
    response = await fetch(buildApiUrl("/api/extract-links"), {
      method: "POST",
      headers: withRuntimeSettingsHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(
      `Không gọi được API extract-links. Hãy kiểm tra backend đang chạy và VITE_API_URL trong Settings. Chi tiết: ${
        error instanceof Error ? error.message : "Unknown network error"
      }`
    );
  }

  const data = (await readJsonSafely(response)) as ExtractLinksResponse | ApiErrorResponse;
  if (!response.ok) {
    throw new Error(formatApiError(data as ApiErrorResponse));
  }

  return data as ExtractLinksResponse;
}

async function readJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: `API trả về không phải JSON. HTTP ${response.status}`,
      detail: text.slice(0, 500),
    };
  }
}

function formatApiError(errorData: ApiErrorResponse): string {
  return errorData.detail || errorData.error || "Trích xuất nội dung thất bại.";
}
