"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { AppLocale } from "@/constants/locale";
import { buildVietnamStoreMapMarkers } from "@/features/product-landing/utils/vietnamStoreMapMarkers";
import type {
  GlobalHomepageMapMarkerCollection,
  GlobalHomepageMapMarkerPosition,
} from "@/features/product-landing/utils/globalHomepageMapConfig";
import type { SettingsBranchDto } from "@/types/settingsModule";

interface GlobalHomepageMapMarkerEditorProps {
  locale: AppLocale;
  branches: SettingsBranchDto[];
  markers: GlobalHomepageMapMarkerCollection;
  selectedMarkerId: string | null;
  onSelectMarker: (markerId: string) => void;
  onUpdateMarkerPosition: (
    markerId: string,
    position: GlobalHomepageMapMarkerPosition
  ) => void;
  onAddMarker: (branchId?: string, seedPosition?: GlobalHomepageMapMarkerPosition) => void;
  onRemoveMarker: (markerId: string) => void;
  onMoveMarker: (markerId: string, direction: "up" | "down") => void;
  onUpdateMarkerBranch: (markerId: string, branchId: string) => void;
  onUpdateMarkerLabel: (markerId: string, label: string) => void;
  draggingMarkerId: string | null;
  onDraggingMarkerIdChange: (markerId: string | null) => void;
  disabled: boolean;
}

const COPY = {
  vi: {
    title: "Bản đồ store toàn cục",
    hint: "Mỗi branch có thể có nhiều marker. Kéo marker để đổi vị trí, thêm/xóa ở panel bên phải.",
    noBranch: "Không có chi nhánh đang hoạt động.",
    noMarker: "Chưa có marker. Thêm marker đầu tiên để bắt đầu.",
    coordinates: "Tọa độ",
    marker: "Marker",
    branch: "Chi nhánh",
    label: "Nhãn hiển thị",
    labelPlaceholder: "Để trống để dùng tên chi nhánh",
    addMarker: "Thêm marker",
    remove: "Xóa",
    moveUp: "Lên",
    moveDown: "Xuống",
  },
  en: {
    title: "Global store map",
    hint: "Each branch can have multiple markers. Drag markers to reposition and manage them in the right panel.",
    noBranch: "No active branches.",
    noMarker: "No marker yet. Add your first marker to start.",
    coordinates: "Coordinates",
    marker: "Marker",
    branch: "Branch",
    label: "Display label",
    labelPlaceholder: "Leave empty to use branch name",
    addMarker: "Add marker",
    remove: "Remove",
    moveUp: "Up",
    moveDown: "Down",
  },
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toPositionFromPointer(options: {
  clientX: number;
  clientY: number;
  mapRect: DOMRect;
}): GlobalHomepageMapMarkerPosition {
  const leftPct = ((options.clientX - options.mapRect.left) / options.mapRect.width) * 100;
  const topPct = ((options.clientY - options.mapRect.top) / options.mapRect.height) * 100;
  return {
    leftPct: Number(clamp(leftPct, 6, 94).toFixed(2)),
    topPct: Number(clamp(topPct, 6, 94).toFixed(2)),
  };
}

export function GlobalHomepageMapMarkerEditor({
  locale,
  branches,
  markers,
  selectedMarkerId,
  onSelectMarker,
  onUpdateMarkerPosition,
  onAddMarker,
  onRemoveMarker,
  onMoveMarker,
  onUpdateMarkerBranch,
  onUpdateMarkerLabel,
  draggingMarkerId,
  onDraggingMarkerIdChange,
  disabled,
}: GlobalHomepageMapMarkerEditorProps) {
  const copy = COPY[locale];
  const mapRef = useRef<HTMLDivElement | null>(null);

  const activeBranches = useMemo(
    () => branches.filter((entry) => entry.isActive),
    [branches]
  );
  const branchMapItems = useMemo(
    () =>
      activeBranches.map((entry, index) => ({
        branchId: entry.id,
        branchName: entry.name,
        branchDomain: entry.shopDomain,
        isActive: entry.isActive,
        mapLat: null,
        mapLng: null,
        mapLabel: entry.name,
        displayOrder: index + 1,
      })),
    [activeBranches]
  );
  const markerDraftById = useMemo(
    () => new Map(markers.map((entry) => [entry.markerId, entry])),
    [markers]
  );
  const renderedMarkers = useMemo(
    () =>
      buildVietnamStoreMapMarkers({
        locale,
        branches: branchMapItems,
        customMarkers: markers,
        includeFallbackMarkers: false,
      }),
    [branchMapItems, locale, markers]
  );
  const markerRows = useMemo(
    () =>
      [...markers].sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
        return a.markerId.localeCompare(b.markerId, "vi");
      }),
    [markers]
  );
  const selectedMarker = selectedMarkerId ? markerDraftById.get(selectedMarkerId) ?? null : null;
  const selectedBranchId = selectedMarker?.branchId ?? activeBranches[0]?.id ?? "";

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!draggingMarkerId || disabled) return;
      const mapNode = mapRef.current;
      if (!mapNode) return;
      const mapRect = mapNode.getBoundingClientRect();
      if (mapRect.width <= 0 || mapRect.height <= 0) return;

      onUpdateMarkerPosition(
        draggingMarkerId,
        toPositionFromPointer({
          clientX: event.clientX,
          clientY: event.clientY,
          mapRect,
        })
      );
    },
    [disabled, draggingMarkerId, onUpdateMarkerPosition]
  );

  const handlePointerUp = useCallback(() => {
    onDraggingMarkerIdChange(null);
  }, [onDraggingMarkerIdChange]);

  useEffect(() => {
    if (!draggingMarkerId) return;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingMarkerId, handlePointerMove, handlePointerUp]);

  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
      <header className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{copy.title}</h3>
        <p className="text-xs text-muted-foreground">{copy.hint}</p>
      </header>

      {activeBranches.length === 0 ? (
        <p className="text-xs text-muted-foreground">{copy.noBranch}</p>
      ) : (
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div
            ref={mapRef}
            className={`relative overflow-hidden rounded-2xl border border-border bg-sky-50/50 ${
              draggingMarkerId ? "cursor-grabbing" : "cursor-default"
            }`}
          >
            <img
              src="/template-assets/homepage-3d/vietnam-map-3d.png"
              alt={locale === "vi" ? "Bản đồ Việt Nam" : "Vietnam map"}
              className="pointer-events-none h-auto w-full select-none"
              draggable={false}
            />

            {renderedMarkers.map((marker) => {
              const selected = marker.markerId === selectedMarkerId;
              return (
                <button
                  key={marker.markerId}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectMarker(marker.markerId)}
                  onPointerDown={(event) => {
                    if (disabled) return;
                    event.preventDefault();
                    onSelectMarker(marker.markerId);
                    onDraggingMarkerIdChange(marker.markerId);
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-1 text-[10px] font-semibold text-white shadow-sm transition ${
                    selected
                      ? "border-white bg-primary ring-2 ring-primary/40"
                      : "border-white/80 bg-emerald-600/90"
                  }`}
                  style={{
                    left: `${marker.leftPct}%`,
                    top: `${marker.topPct}%`,
                  }}
                >
                  {marker.markerLabel ?? marker.mapLabel ?? marker.branchName}
                </button>
              );
            })}
          </div>

          <aside className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3">
            <div className="flex items-center gap-2">
              <select
                value={selectedBranchId}
                onChange={(event) => {
                  onAddMarker(event.target.value);
                }}
                disabled={disabled}
                className="h-9 flex-1 rounded-xl border border-border bg-background px-3 text-xs text-foreground"
              >
                {activeBranches.map((entry) => (
                  <option key={`add-${entry.id}`} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onAddMarker(selectedBranchId)}
                className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground"
              >
                {copy.addMarker}
              </button>
            </div>

            {markerRows.length === 0 ? (
              <p className="text-xs text-muted-foreground">{copy.noMarker}</p>
            ) : (
              <div className="space-y-2">
                {markerRows.map((marker, index) => {
                  const selected = marker.markerId === selectedMarkerId;
                  return (
                    <div
                      key={`marker-row-${marker.markerId}`}
                      className={`space-y-2 rounded-xl border p-3 ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground"
                      }`}
                    >
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelectMarker(marker.markerId)}
                        className="w-full text-left"
                      >
                        <p className="text-xs font-semibold">
                          {copy.marker} #{index + 1}
                        </p>
                        <p className="mt-1 text-[11px]">
                          {copy.coordinates}: {marker.leftPct.toFixed(2)}% / {marker.topPct.toFixed(2)}%
                        </p>
                      </button>

                      <label className="space-y-1 text-[11px] text-muted-foreground">
                        <span>{copy.branch}</span>
                        <select
                          value={marker.branchId}
                          disabled={disabled}
                          onChange={(event) =>
                            onUpdateMarkerBranch(marker.markerId, event.target.value)
                          }
                          className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs text-foreground"
                        >
                          {activeBranches.map((entry) => (
                            <option key={`branch-${marker.markerId}-${entry.id}`} value={entry.id}>
                              {entry.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1 text-[11px] text-muted-foreground">
                        <span>{copy.label}</span>
                        <input
                          type="text"
                          value={marker.label ?? ""}
                          disabled={disabled}
                          onChange={(event) =>
                            onUpdateMarkerLabel(marker.markerId, event.target.value)
                          }
                          onBlur={(event) =>
                            onUpdateMarkerLabel(marker.markerId, event.target.value.trim())
                          }
                          placeholder={copy.labelPlaceholder}
                          className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs text-foreground"
                        />
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={disabled || index === 0}
                          onClick={() => onMoveMarker(marker.markerId, "up")}
                          className="h-8 rounded-lg border border-border px-2 text-[11px] font-semibold text-foreground disabled:opacity-50"
                        >
                          {copy.moveUp}
                        </button>
                        <button
                          type="button"
                          disabled={disabled || index === markerRows.length - 1}
                          onClick={() => onMoveMarker(marker.markerId, "down")}
                          className="h-8 rounded-lg border border-border px-2 text-[11px] font-semibold text-foreground disabled:opacity-50"
                        >
                          {copy.moveDown}
                        </button>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onRemoveMarker(marker.markerId)}
                          className="ml-auto h-8 rounded-lg border border-destructive/40 px-2 text-[11px] font-semibold text-destructive disabled:opacity-50"
                        >
                          {copy.remove}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
