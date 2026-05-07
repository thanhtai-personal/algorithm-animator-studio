import type { AppLocale } from "@/constants/locale";
import type { GlobalHomepageMapMarkerCollection } from "@/features/product-landing/utils/globalHomepageMapConfig";
import type { PublicBranchMapItemDto } from "@/types/settingsModule";
import { localizePathname } from "@/utils/locale";

interface MarkerVisualPreset {
  leftPct: number;
  topPct: number;
  color: string;
  ring: string;
}

interface MarkerVisualResolved {
  leftPct: number;
  topPct: number;
  color: string;
  ring: string;
}

export interface VietnamStoreMapMarkerItem
  extends PublicBranchMapItemDto,
    MarkerVisualPreset {
  markerId: string;
  markerLabel: string | null;
  href: string;
}

const KNOWN_MARKER_BY_DOMAIN: Record<string, MarkerVisualPreset> = {
  "thoi-trang-july": {
    leftPct: 40,
    topPct: 22,
    color: "oklch(0.72 0.18 10)",
    ring: "oklch(0.85 0.12 10)",
  },
  kata: {
    leftPct: 55,
    topPct: 65,
    color: "oklch(0.6 0.22 290)",
    ring: "oklch(0.8 0.15 290)",
  },
};

const FALLBACK_MARKER_COORDINATES: Array<Pick<MarkerVisualPreset, "leftPct" | "topPct">> = [
  { leftPct: 40, topPct: 22 },
  { leftPct: 49, topPct: 34 },
  { leftPct: 52, topPct: 43 },
  { leftPct: 54, topPct: 50 },
  { leftPct: 55, topPct: 60 },
  { leftPct: 57, topPct: 68 },
  { leftPct: 62, topPct: 76 },
];

const FALLBACK_COLORS = [
  { color: "oklch(0.72 0.18 10)", ring: "oklch(0.85 0.12 10)" },
  { color: "oklch(0.66 0.2 40)", ring: "oklch(0.82 0.12 40)" },
  { color: "oklch(0.62 0.2 160)", ring: "oklch(0.8 0.11 160)" },
  { color: "oklch(0.6 0.22 290)", ring: "oklch(0.8 0.15 290)" },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toMapPercentFromLatLng(
  lat: number | null,
  lng: number | null
): Pick<MarkerVisualPreset, "leftPct" | "topPct"> | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const minLat = 8;
  const maxLat = 24;
  const minLng = 102;
  const maxLng = 110;

  const leftPct = ((lng - minLng) / (maxLng - minLng)) * 100;
  const topPct = ((maxLat - lat) / (maxLat - minLat)) * 100;

  return {
    leftPct: clamp(leftPct, 18, 82),
    topPct: clamp(topPct, 10, 86),
  };
}

function resolveBranchVisuals(
  branches: PublicBranchMapItemDto[]
): Map<string, MarkerVisualResolved> {
  const resolved = new Map<string, MarkerVisualResolved>();
  let fallbackIndex = 0;

  for (let index = 0; index < branches.length; index += 1) {
    const branch = branches[index]!;
    const preset = KNOWN_MARKER_BY_DOMAIN[branch.branchDomain];
    const byLatLng = toMapPercentFromLatLng(branch.mapLat, branch.mapLng);
    const fallback = FALLBACK_MARKER_COORDINATES[fallbackIndex % FALLBACK_MARKER_COORDINATES.length];
    const fallbackColor = FALLBACK_COLORS[index % FALLBACK_COLORS.length];

    if (!preset && !byLatLng) {
      fallbackIndex += 1;
    }

    resolved.set(branch.branchId, {
      leftPct: preset?.leftPct ?? byLatLng?.leftPct ?? fallback.leftPct,
      topPct: preset?.topPct ?? byLatLng?.topPct ?? fallback.topPct,
      color: preset?.color ?? fallbackColor.color,
      ring: preset?.ring ?? fallbackColor.ring,
    });
  }

  return resolved;
}

export function buildVietnamStoreMapMarkers(options: {
  locale: AppLocale;
  branches: PublicBranchMapItemDto[];
  customMarkers?: GlobalHomepageMapMarkerCollection | null;
  includeFallbackMarkers?: boolean;
}): VietnamStoreMapMarkerItem[] {
  const sortedBranches = [...options.branches].sort((a, b) => {
    const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.branchName.localeCompare(b.branchName, "vi");
  });
  const branchById = new Map(sortedBranches.map((entry) => [entry.branchId, entry]));
  const branchVisuals = resolveBranchVisuals(sortedBranches);
  const customMarkers = (options.customMarkers ?? [])
    .filter((entry) => entry.isActive)
    .sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
      if (a.branchId !== b.branchId) return a.branchId.localeCompare(b.branchId, "vi");
      return a.markerId.localeCompare(b.markerId, "vi");
    });

  const output: VietnamStoreMapMarkerItem[] = [];
  const branchIdWithCustomMarker = new Set<string>();

  for (const marker of customMarkers) {
    const branch = branchById.get(marker.branchId);
    if (!branch) continue;
    const visuals = branchVisuals.get(branch.branchId);
    if (!visuals) continue;

    branchIdWithCustomMarker.add(branch.branchId);
    output.push({
      ...branch,
      markerId: marker.markerId,
      markerLabel: marker.label,
      href: localizePathname(`/${branch.branchDomain}`, options.locale),
      leftPct: marker.leftPct,
      topPct: marker.topPct,
      color: visuals.color,
      ring: visuals.ring,
    });
  }

  if (options.includeFallbackMarkers !== false) {
    for (const branch of sortedBranches) {
      if (branchIdWithCustomMarker.has(branch.branchId)) continue;
      const visuals = branchVisuals.get(branch.branchId);
      if (!visuals) continue;

      output.push({
        ...branch,
        markerId: `fallback-${branch.branchId}`,
        markerLabel: branch.mapLabel ?? branch.branchName,
        href: localizePathname(`/${branch.branchDomain}`, options.locale),
        leftPct: visuals.leftPct,
        topPct: visuals.topPct,
        color: visuals.color,
        ring: visuals.ring,
      });
    }
  }

  return output;
}
