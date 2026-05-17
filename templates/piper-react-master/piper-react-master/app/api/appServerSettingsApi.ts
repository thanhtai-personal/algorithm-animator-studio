export type AppServerDeviceResponse = {
  deviceId: string;
  deviceName: string;
  machineName: string;
  deviceNameChanged: boolean;
  settings: Record<string, string>;
  updatedAt?: string;
};

export type SaveAppServerDevicePayload = {
  deviceName: string;
  machineName?: string;
  settings: Record<string, string>;
  passkey?: string;
};

const APP_SERVER_TIMEOUT_MS = 6000;
const APP_SERVER_URL = "https://text-to-video-server-gamma.vercel.app";
const APP_SERVER_API_PREFIX = "/api";

export function buildAppServerUrl(path: string, overrideBaseUrl?: string): string {
  const baseUrl = overrideBaseUrl || APP_SERVER_URL;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const apiPath = normalizedPath.startsWith(`${APP_SERVER_API_PREFIX}/`)
    ? normalizedPath
    : `${APP_SERVER_API_PREFIX}${normalizedPath}`;

  return `${baseUrl.replace(/\/$/, "")}${apiPath}`;
}

export async function getDefaultDeviceName(baseUrl?: string): Promise<string> {
  const data = await requestJson<{ machineName?: string }>(buildAppServerUrl("/settings/default-device-name", baseUrl));
  return data.machineName || "Local device";
}

export async function getAppServerPasskey(deviceId: string, baseUrl?: string): Promise<string> {
  const params = new URLSearchParams();
  if (deviceId) {
    params.set("deviceId", deviceId);
  }

  const data = await requestJson<{ passkey?: string }>(
    buildAppServerUrl(`/settings/passkey${params.toString() ? `?${params.toString()}` : ""}`, baseUrl)
  );

  return data.passkey || "020321";
}

export async function getDeviceSettings(deviceId: string, baseUrl?: string): Promise<AppServerDeviceResponse | null> {
  const response = await timedFetch(buildAppServerUrl(`/settings/devices/${encodeURIComponent(deviceId)}`, baseUrl));

  if (response.status === 404) {
    return null;
  }

  return parseJsonResponse<AppServerDeviceResponse>(response);
}

export async function saveDeviceSettings(
  deviceId: string,
  payload: SaveAppServerDevicePayload,
  baseUrl?: string
): Promise<AppServerDeviceResponse> {
  const response = await timedFetch(buildAppServerUrl(`/settings/devices/${encodeURIComponent(deviceId)}`, baseUrl), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<AppServerDeviceResponse>(response);
}

async function requestJson<T>(url: string): Promise<T> {
  return parseJsonResponse<T>(await timedFetch(url));
}

async function timedFetch(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), APP_SERVER_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string; error?: string };

  if (!response.ok) {
    throw new Error(data.message || data.error || "App-server request failed.");
  }

  return data;
}
