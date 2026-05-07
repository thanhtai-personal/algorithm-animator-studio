interface HttpRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  sessionToken?: string | null;
  signal?: AbortSignal;
}

interface ApiErrorPayload {
  error?: string;
  message?: string;
}

export function resolveApiBaseUrl(): string {
  const fromNestEnv = import.meta.env.VITE_NEST_API_BASE_URL as string | undefined;
  return fromNestEnv?.trim() || "http://localhost:3056";
}

export class ApiClientError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

export async function requestJson<TResponse>(
  path: string,
  options: HttpRequestOptions = {}
): Promise<TResponse> {
  const endpoint = `${resolveApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
  }
  if (options.sessionToken) {
    headers["x-zalo-mini-app-session"] = options.sessionToken;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    const appOrigin = typeof window !== "undefined" ? window.location.origin : "unknown";
    const errorMessage = error instanceof Error ? error.message : "Network error";
    throw new Error(
      `Không thể kết nối API. Endpoint: ${endpoint}. Origin hiện tại: ${appOrigin}. Chi tiết: ${errorMessage}`
    );
  }

  const rawText = await response.text();
  let payload: unknown = null;
  if (rawText) {
    try {
      payload = JSON.parse(rawText) as unknown;
    } catch {
      payload = rawText;
    }
  }

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | null;
    throw new ApiClientError(
      response.status,
      errorPayload?.error || errorPayload?.message || `Request failed (${response.status})`
    );
  }

  return payload as TResponse;
}
