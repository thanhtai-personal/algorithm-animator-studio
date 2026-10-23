export const IS_PUBLIC_WEB = import.meta.env.VITE_PUBLIC_WEB === "true";

export function buildApiUrl(path: string) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const configured = String(import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");

  if (configured) return `${configured}${suffix}`;
  return suffix;
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
