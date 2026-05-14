const DEFAULT_API_URL = "http://localhost:5050";

export function buildApiUrl(path: string) {
  const base = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === "string"
      ? data
      : data?.detail || data?.message || data?.error || "Yêu cầu thất bại.";
    throw new Error(message);
  }

  return data as T;
}
