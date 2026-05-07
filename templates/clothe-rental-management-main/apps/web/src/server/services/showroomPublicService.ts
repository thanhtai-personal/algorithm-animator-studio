import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import type {
  PublicBranchContextDto,
  PublicBranchMapItemDto,
  PublicShowroomPageConfigDto,
} from "@/types/settingsModule";

function toQueryString(params: Record<string, string | null | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    search.set(key, trimmed);
  }

  const raw = search.toString();
  return raw ? `?${raw}` : "";
}

function parsePublicBranchContext(payload: unknown): PublicBranchContextDto | null {
  if (!payload || typeof payload !== "object") return null;

  const source = payload as Record<string, unknown>;
  const branchId = typeof source.branchId === "string" ? source.branchId.trim() : "";
  const branchCode = typeof source.branchCode === "string" ? source.branchCode.trim() : "";
  const branchSlug = typeof source.branchSlug === "string" ? source.branchSlug.trim() : "";
  const branchName = typeof source.branchName === "string" ? source.branchName.trim() : "";

  if (!branchId || !branchCode || !branchSlug || !branchName) {
    return null;
  }

  const resolvedBy =
    source.resolvedBy === "showroomSlug" ||
    source.resolvedBy === "branchId" ||
    source.resolvedBy === "branchSlug" ||
    source.resolvedBy === "shopDomain" ||
    source.resolvedBy === "default"
      ? source.resolvedBy
      : "default";

  return {
    branchId,
    branchCode,
    branchSlug,
    branchName,
    shopDomain:
      typeof source.shopDomain === "string" && source.shopDomain.trim().length > 0
        ? source.shopDomain
        : null,
    showroomId:
      typeof source.showroomId === "string" && source.showroomId.trim().length > 0
        ? source.showroomId
        : null,
    showroomSlug:
      typeof source.showroomSlug === "string" && source.showroomSlug.trim().length > 0
        ? source.showroomSlug
        : null,
    showroomName:
      typeof source.showroomName === "string" && source.showroomName.trim().length > 0
        ? source.showroomName
        : null,
    isDefaultShowroom: source.isDefaultShowroom === true,
    resolvedBy,
  };
}

function parsePublicBranchMapItem(payload: unknown): PublicBranchMapItemDto | null {
  if (!payload || typeof payload !== "object") return null;

  const source = payload as Record<string, unknown>;
  const branchId = typeof source.branchId === "string" ? source.branchId.trim() : "";
  const branchName = typeof source.branchName === "string" ? source.branchName.trim() : "";
  const branchDomain = typeof source.branchDomain === "string" ? source.branchDomain.trim() : "";
  if (!branchId || !branchName || !branchDomain) {
    return null;
  }

  return {
    branchId,
    branchName,
    branchDomain,
    isActive: source.isActive === true,
    mapLat: typeof source.mapLat === "number" && Number.isFinite(source.mapLat) ? source.mapLat : null,
    mapLng: typeof source.mapLng === "number" && Number.isFinite(source.mapLng) ? source.mapLng : null,
    mapLabel: typeof source.mapLabel === "string" && source.mapLabel.trim().length > 0 ? source.mapLabel : null,
    displayOrder:
      typeof source.displayOrder === "number" && Number.isFinite(source.displayOrder)
        ? source.displayOrder
        : null,
  };
}

interface PublicBranchContextFetchOptions {
  revalidate?: number;
}

async function fetchPublicBranchContext(query: {
  showroomSlug?: string | null;
  branchId?: string | null;
  branchSlug?: string | null;
  shopDomain?: string | null;
}, fetchOptions?: PublicBranchContextFetchOptions): Promise<PublicBranchContextDto | null> {
  const queryString = toQueryString({
    showroomSlug: query.showroomSlug,
    branchId: query.branchId,
    branchSlug: query.branchSlug,
    shopDomain: query.shopDomain,
  });

  const requestInit: RequestInit & { next?: { revalidate: number } } = {
    method: "GET",
  };

  if (
    typeof fetchOptions?.revalidate === "number" &&
    Number.isFinite(fetchOptions.revalidate) &&
    fetchOptions.revalidate > 0
  ) {
    requestInit.next = { revalidate: Math.floor(fetchOptions.revalidate) };
    requestInit.cache = "force-cache";
  } else {
    requestInit.cache = "no-store";
  }

  try {
    const response = await fetch(
      buildNestApiUrl(`/api/v1/settings/public/branch-context${queryString}`),
      requestInit
    );

    if (!response.ok) {
      return null;
    }

    const payload = await response.json().catch(() => null);
    return parsePublicBranchContext(payload);
  } catch {
    return null;
  }
}

export async function assertPublicShowroomSlugExists(
  showroomSlug: string,
  fetchOptions?: PublicBranchContextFetchOptions
): Promise<boolean> {
  const context = await fetchPublicBranchContext({ showroomSlug }, fetchOptions);
  return Boolean(context?.showroomSlug);
}

export async function assertPublicBranchSlugExists(
  branchSlug: string,
  fetchOptions?: PublicBranchContextFetchOptions
): Promise<boolean> {
  const context = await fetchPublicBranchContext({ branchSlug }, fetchOptions);
  return Boolean(context?.branchId);
}

export async function getPublicBranchContextBySlug(
  branchSlug: string,
  fetchOptions?: PublicBranchContextFetchOptions
): Promise<PublicBranchContextDto | null> {
  return fetchPublicBranchContext({ branchSlug }, fetchOptions);
}

export async function getPublicBranchContextByBranchId(
  branchId: string,
  fetchOptions?: PublicBranchContextFetchOptions
): Promise<PublicBranchContextDto | null> {
  return fetchPublicBranchContext({ branchId }, fetchOptions);
}

export async function getPublicBranchContextByShopDomain(
  shopDomain: string,
  fetchOptions?: PublicBranchContextFetchOptions
): Promise<PublicBranchContextDto | null> {
  return fetchPublicBranchContext({ shopDomain }, fetchOptions);
}

export async function getPublicBranchContextByShopDomainOrSlug(
  segment: string,
  fetchOptions?: PublicBranchContextFetchOptions
): Promise<PublicBranchContextDto | null> {
  const normalized = segment.trim();
  if (!normalized) return null;

  const byShopDomain = await fetchPublicBranchContext({ shopDomain: normalized }, fetchOptions);
  if (byShopDomain?.branchId) {
    return byShopDomain;
  }

  return fetchPublicBranchContext({ branchSlug: normalized }, fetchOptions);
}

export async function fetchPublicBranchMap(
  fetchOptions?: PublicBranchContextFetchOptions
): Promise<PublicBranchMapItemDto[]> {
  const requestInit: RequestInit & { next?: { revalidate: number } } = {
    method: "GET",
  };

  if (
    typeof fetchOptions?.revalidate === "number" &&
    Number.isFinite(fetchOptions.revalidate) &&
    fetchOptions.revalidate > 0
  ) {
    requestInit.next = { revalidate: Math.floor(fetchOptions.revalidate) };
    requestInit.cache = "force-cache";
  } else {
    requestInit.cache = "no-store";
  }

  try {
    const response = await fetch(buildNestApiUrl("/api/v1/settings/public/branch-map"), requestInit);
    if (!response.ok) return [];

    const payload = await response.json().catch(() => []);
    if (!Array.isArray(payload)) return [];

    return payload
      .map((item) => parsePublicBranchMapItem(item))
      .filter((item): item is PublicBranchMapItemDto => Boolean(item));
  } catch {
    return [];
  }
}

export async function fetchPublicShowroomConfig(
  query: {
    showroomSlug?: string | null;
    branchId?: string | null;
    branchSlug?: string | null;
    shopDomain?: string | null;
    locale?: string | null;
    scope?: "branch" | "global" | null;
  },
  fetchOptions?: { revalidate?: number }
): Promise<PublicShowroomPageConfigDto | null> {
  const qs = toQueryString({
    showroomSlug: query.showroomSlug,
    branchId: query.branchId,
    branchSlug: query.branchSlug,
    shopDomain: query.shopDomain,
    locale: query.locale,
    scope: query.scope,
  });

  const requestInit: RequestInit & { next?: { revalidate: number } } = { method: "GET" };

  if (
    typeof fetchOptions?.revalidate === "number" &&
    Number.isFinite(fetchOptions.revalidate) &&
    fetchOptions.revalidate > 0
  ) {
    requestInit.next = { revalidate: Math.floor(fetchOptions.revalidate) };
    requestInit.cache = "force-cache";
  } else {
    requestInit.cache = "no-store";
  }

  try {
    const res = await fetch(buildNestApiUrl(`/api/v1/settings/public/showroom-config${qs}`), requestInit);
    if (!res.ok) return null;
    const payload = await res.json().catch(() => null);
    return payload ?? null;
  } catch {
    return null;
  }
}
