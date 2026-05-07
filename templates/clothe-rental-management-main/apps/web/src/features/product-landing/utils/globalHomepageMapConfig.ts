export interface GlobalHomepageMapMarkerPosition {
  leftPct: number;
  topPct: number;
}

export type GlobalHomepageMapMarkerPositionMap = Record<
  string,
  GlobalHomepageMapMarkerPosition
>;

export interface GlobalHomepageMapMarker extends GlobalHomepageMapMarkerPosition {
  markerId: string;
  branchId: string;
  label: string | null;
  isActive: boolean;
  displayOrder: number;
}

export type GlobalHomepageMapMarkerCollection = GlobalHomepageMapMarker[];

function parseObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readStringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizePosition(leftPct: number, topPct: number): GlobalHomepageMapMarkerPosition {
  return {
    leftPct: Number(clamp(leftPct, 0, 100).toFixed(2)),
    topPct: Number(clamp(topPct, 0, 100).toFixed(2)),
  };
}

function buildMarkerId(branchId: string, index: number): string {
  const normalizedBranchId = branchId.replace(/[^a-zA-Z0-9_-]+/g, "-");
  return `marker-${normalizedBranchId || "branch"}-${index + 1}`;
}

function normalizeMarkersCollection(markers: GlobalHomepageMapMarkerCollection): GlobalHomepageMapMarkerCollection {
  const ordered = [...markers]
    .filter((entry) => entry.branchId.trim())
    .sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
      if (a.branchId !== b.branchId) return a.branchId.localeCompare(b.branchId, "vi");
      return a.markerId.localeCompare(b.markerId, "vi");
    });

  const seenMarkerIds = new Set<string>();
  return ordered.map((entry, index) => {
    const branchId = entry.branchId.trim();
    const fallbackMarkerId = buildMarkerId(branchId, index);
    const markerId = entry.markerId.trim() || fallbackMarkerId;
    const uniqueMarkerId = seenMarkerIds.has(markerId)
      ? `${fallbackMarkerId}-${index + 1}`
      : markerId;
    seenMarkerIds.add(uniqueMarkerId);

    return {
      markerId: uniqueMarkerId,
      branchId,
      label: readStringOrNull(entry.label),
      isActive: entry.isActive,
      displayOrder: index + 1,
      ...normalizePosition(entry.leftPct, entry.topPct),
    };
  });
}

function buildLegacyMarkerPositionMapFromMarkers(
  markers: GlobalHomepageMapMarkerCollection
): GlobalHomepageMapMarkerPositionMap {
  const output: GlobalHomepageMapMarkerPositionMap = {};
  for (const marker of markers) {
    if (!marker.isActive) continue;
    if (output[marker.branchId]) continue;
    output[marker.branchId] = {
      leftPct: marker.leftPct,
      topPct: marker.topPct,
    };
  }
  return output;
}

function parseLegacyMarkerPositionMap(value: unknown): GlobalHomepageMapMarkerCollection {
  const config = parseObject(value);
  const globalHomepage = parseObject(config.globalHomepage);
  const rawMap = parseObject(globalHomepage.markerPositionsByBranchId);

  const parsedMarkers: GlobalHomepageMapMarkerCollection = [];
  for (const [branchIdRaw, positionRaw] of Object.entries(rawMap)) {
    const branchId = branchIdRaw.trim();
    if (!branchId) continue;

    const position = parseObject(positionRaw);
    const leftPct = readNumber(position.leftPct ?? position.xPct);
    const topPct = readNumber(position.topPct ?? position.yPct);
    if (leftPct === null || topPct === null) continue;

    parsedMarkers.push({
      markerId: buildMarkerId(branchId, parsedMarkers.length),
      branchId,
      label: null,
      isActive: true,
      displayOrder: parsedMarkers.length + 1,
      ...normalizePosition(leftPct, topPct),
    });
  }

  return normalizeMarkersCollection(parsedMarkers);
}

export function parseGlobalHomepageMapMarkers(value: unknown): GlobalHomepageMapMarkerCollection {
  const config = parseObject(value);
  const globalHomepage = parseObject(config.globalHomepage);
  const rawMarkers = Array.isArray(globalHomepage.markers) ? globalHomepage.markers : null;

  if (!rawMarkers) {
    return parseLegacyMarkerPositionMap(value);
  }

  const parsedMarkers: GlobalHomepageMapMarkerCollection = [];
  for (let index = 0; index < rawMarkers.length; index += 1) {
    const row = parseObject(rawMarkers[index]);
    const branchId = readStringOrNull(row.branchId)?.trim() ?? "";
    if (!branchId) continue;

    const leftPct = readNumber(row.leftPct ?? row.xPct);
    const topPct = readNumber(row.topPct ?? row.yPct);
    if (leftPct === null || topPct === null) continue;

    const parsedOrder = readNumber(row.displayOrder);
    parsedMarkers.push({
      markerId: readStringOrNull(row.markerId) ?? buildMarkerId(branchId, index),
      branchId,
      label: readStringOrNull(row.label),
      isActive: readBoolean(row.isActive, true),
      displayOrder: parsedOrder !== null ? Math.max(1, Math.round(parsedOrder)) : index + 1,
      ...normalizePosition(leftPct, topPct),
    });
  }

  return normalizeMarkersCollection(parsedMarkers);
}

export function mergeGlobalHomepageMapMarkers(options: {
  themeConfigJson: unknown;
  markers: GlobalHomepageMapMarkerCollection;
}): Record<string, unknown> {
  const themeConfig = parseObject(options.themeConfigJson);
  const globalHomepage = parseObject(themeConfig.globalHomepage);
  const normalizedMarkers = normalizeMarkersCollection(options.markers);
  const legacyMap = buildLegacyMarkerPositionMapFromMarkers(normalizedMarkers);

  return {
    ...themeConfig,
    globalHomepage: {
      ...globalHomepage,
      markers: normalizedMarkers,
      markerPositionsByBranchId: legacyMap,
    },
  };
}

export function parseGlobalHomepageMapMarkerPositionMap(
  value: unknown
): GlobalHomepageMapMarkerPositionMap {
  const markers = parseGlobalHomepageMapMarkers(value);
  return buildLegacyMarkerPositionMapFromMarkers(markers);
}

export function mergeGlobalHomepageMapMarkerPositionMap(options: {
  themeConfigJson: unknown;
  markerPositionsByBranchId: GlobalHomepageMapMarkerPositionMap;
}): Record<string, unknown> {
  const markers = Object.entries(options.markerPositionsByBranchId).map(
    ([branchIdRaw, position], index): GlobalHomepageMapMarker => ({
      markerId: buildMarkerId(branchIdRaw, index),
      branchId: branchIdRaw.trim(),
      label: null,
      isActive: true,
      displayOrder: index + 1,
      ...normalizePosition(position.leftPct, position.topPct),
    })
  );

  return mergeGlobalHomepageMapMarkers({
    themeConfigJson: options.themeConfigJson,
    markers,
  });
}
