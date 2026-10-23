import type { EndpointCheckStatus } from "../models/EndpointHealth";

type GradioEndpointRequest = {
  label: string;
  apiName: string;
};

export async function checkGradioApiEndpoints(
  baseUrl: string,
  requests: GradioEndpointRequest[],
  timeoutMs: number
): Promise<{ ok: boolean; checks: EndpointCheckStatus[]; availableApiNames: string[] }> {
  const uniqueRequests = dedupeRequests(requests);
  if (!uniqueRequests.length) return { ok: false, checks: [], availableApiNames: [] };

  const configUrl = `${baseUrl.replace(/\/+$/g, "")}/config`;
  try {
    const response = await fetchWithTimeout(configUrl, timeoutMs);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const config = await response.json();
    const availableApiNames = extractApiNames(config);
    const available = new Set(availableApiNames.map(normalizeApiName));
    const checks = uniqueRequests.map((request) => {
      const apiName = normalizeApiName(request.apiName);
      const ok = available.has(apiName);
      return {
        label: request.label,
        method: "GRADIO",
        url: `${baseUrl}${apiName}`,
        apiName,
        ok,
        detail: ok ? "Endpoint available in Gradio /config." : "Missing from Gradio /config.",
      };
    });
    return { ok: checks.every((check) => check.ok), checks, availableApiNames };
  } catch (error) {
    return {
      ok: false,
      checks: uniqueRequests.map((request) => ({
        label: request.label,
        method: "GET",
        url: configUrl,
        apiName: normalizeApiName(request.apiName),
        ok: false,
        detail: error instanceof Error ? error.message : "Cannot read Gradio /config.",
      })),
      availableApiNames: [],
    };
  }
}

function dedupeRequests(requests: GradioEndpointRequest[]) {
  const seen = new Set<string>();
  return requests.filter((request) => {
    const key = `${normalizeApiName(request.apiName)}:${request.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return Boolean(normalizeApiName(request.apiName));
  });
}

function extractApiNames(config: unknown): string[] {
  const names = new Set<string>();
  visit(config, (key, value) => {
    if ((key === "api_name" || key === "apiName") && typeof value === "string") {
      const normalized = normalizeApiName(value);
      if (normalized) names.add(normalized);
    }
  });
  return [...names].sort();
}

function visit(value: unknown, onEntry: (key: string, value: unknown) => void) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item) => visit(item, onEntry));
    return;
  }
  Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
    onEntry(key, child);
    visit(child, onEntry);
  });
}

function normalizeApiName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { method: "GET", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
