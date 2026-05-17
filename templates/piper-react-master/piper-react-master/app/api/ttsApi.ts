import type {
  ApiErrorResponse,
  GenerateResponse,
  HealthResponse,
  ModelsResponse,
} from "../types";
import { buildApiUrl, withRuntimeSettingsHeaders } from "../utils/appSettingsStorage";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(formatApiError(data as ApiErrorResponse));
  }

  return data;
}

function formatApiError(errorData: ApiErrorResponse): string {
  let message = errorData.detail || errorData.error || "Yêu cầu thất bại.";

  try {
    const parsed = JSON.parse(message) as {
      message?: string;
      stderr?: string;
      stdout?: string;
      code?: number;
    };

    return [
      parsed.message,
      parsed.code !== undefined ? `Mã lỗi: ${parsed.code}` : "",
      parsed.stderr ? `Lỗi chi tiết:\n${parsed.stderr}` : "",
      parsed.stdout ? `Kết quả chi tiết:\n${parsed.stdout}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  } catch {
    return message;
  }
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(buildApiUrl("/api/health"), { headers: withRuntimeSettingsHeaders() });
  return parseJsonResponse<HealthResponse>(response);
}

export async function getModels(): Promise<ModelsResponse> {
  const response = await fetch(buildApiUrl("/api/models"), { headers: withRuntimeSettingsHeaders() });
  return parseJsonResponse<ModelsResponse>(response);
}

export async function generateAudio(payload: {
  text: string;
  modelKey: string;
  sentenceSilence: number;
  speechRate?: number;
  fileName: string;
}): Promise<GenerateResponse> {
  const response = await fetch(buildApiUrl("/api/generate"), {
    method: "POST",
    headers: withRuntimeSettingsHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<GenerateResponse>(response);
}

export async function previewAudio(payload: {
  text: string;
  modelKey: string;
  sentenceSilence: number;
  speechRate?: number;
  fileName?: string;
}): Promise<GenerateResponse> {
  const response = await fetch(buildApiUrl("/api/preview-audio"), {
    method: "POST",
    headers: withRuntimeSettingsHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<GenerateResponse>(response);
}
