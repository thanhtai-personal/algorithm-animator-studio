"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import type { AppLocale } from "@/constants/locale";
import { DrawerFormShell } from "@/components/layout/DrawerFormShell";
import { VoiceDictationField } from "@/components/voice/VoiceDictationField";
import { VietnamStoreMapHomepage } from "@/features/product-landing/components/VietnamStoreMapHomepage";
import { GlobalHomepageMapMarkerEditor } from "./GlobalHomepageMapMarkerEditor";
import {
  GLOBAL_HOMEPAGE_EDITOR_COPY,
  GLOBAL_HOMEPAGE_EDITOR_SLOTS,
  type GlobalEditorSlotId,
} from "./GlobalHomepageVisualEditor.constants";
import type {
  GlobalHomepageMapMarkerCollection,
  GlobalHomepageMapMarkerPosition,
} from "@/features/product-landing/utils/globalHomepageMapConfig";
import type {
  PublicBranchMapItemDto,
  SettingLocale,
  SettingsBranchDto,
} from "@/types/settingsModule";

interface SlotAnchorPosition {
  topPercent: number;
  leftPercent: number;
}

interface GlobalHomepageVisualEditorProps {
  locale: AppLocale;
  pageLocale: SettingLocale;
  voiceLanguage: string;
  isSaving: boolean;
  previewBranches: PublicBranchMapItemDto[];
  previewContent: {
    brandName?: string | null;
    badge?: string | null;
    title?: string | null;
    subtitle?: string | null;
    description?: string | null;
    markers?: GlobalHomepageMapMarkerCollection | null;
  } | null;
  heroBadge: string;
  setHeroBadge: (value: string) => void;
  heroHeading: string;
  setHeroHeading: (value: string) => void;
  heroSubheading: string;
  setHeroSubheading: (value: string) => void;
  seoDescription: string;
  setSeoDescription: (value: string) => void;
  mapBranches: SettingsBranchDto[];
  mapMarkers: GlobalHomepageMapMarkerCollection;
  selectedMapMarkerId: string | null;
  setSelectedMapMarkerId: (markerId: string) => void;
  draggingMapMarkerId: string | null;
  setDraggingMapMarkerId: (markerId: string | null) => void;
  updateMapMarkerPosition: (
    markerId: string,
    position: GlobalHomepageMapMarkerPosition
  ) => void;
  addMapMarker: (branchId?: string, seedPosition?: GlobalHomepageMapMarkerPosition) => void;
  removeMapMarker: (markerId: string) => void;
  moveMapMarker: (markerId: string, direction: "up" | "down") => void;
  updateMapMarkerBranch: (markerId: string, branchId: string) => void;
  updateMapMarkerLabel: (markerId: string, label: string) => void;
  isMapMarkerPositionDirty: boolean;
}

export function GlobalHomepageVisualEditor({
  locale,
  pageLocale,
  voiceLanguage,
  isSaving,
  previewBranches,
  previewContent,
  heroBadge,
  setHeroBadge,
  heroHeading,
  setHeroHeading,
  heroSubheading,
  setHeroSubheading,
  seoDescription,
  setSeoDescription,
  mapBranches,
  mapMarkers,
  selectedMapMarkerId,
  setSelectedMapMarkerId,
  draggingMapMarkerId,
  setDraggingMapMarkerId,
  updateMapMarkerPosition,
  addMapMarker,
  removeMapMarker,
  moveMapMarker,
  updateMapMarkerBranch,
  updateMapMarkerLabel,
  isMapMarkerPositionDirty,
}: GlobalHomepageVisualEditorProps) {
  const copy = GLOBAL_HOMEPAGE_EDITOR_COPY[locale];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<GlobalEditorSlotId | null>(null);
  const [slotAnchorPositions, setSlotAnchorPositions] = useState<
    Record<GlobalEditorSlotId, SlotAnchorPosition>
  >({} as Record<GlobalEditorSlotId, SlotAnchorPosition>);

  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const previewSceneRef = useRef<HTMLDivElement | null>(null);

  const selectedSlot = useMemo(
    () => GLOBAL_HOMEPAGE_EDITOR_SLOTS.find((entry) => entry.id === selectedSlotId) ?? null,
    [selectedSlotId]
  );

  const openSlot = (slotId: GlobalEditorSlotId) => {
    setSelectedSlotId(slotId);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedSlotId(null);
  };

  const recomputeSlotAnchors = useCallback(() => {
    const previewScene = previewSceneRef.current;
    if (!previewScene) return;

    const contentRect = previewScene.getBoundingClientRect();
    if (contentRect.width <= 0 || contentRect.height <= 0) return;

    const nextPositions = {} as Record<GlobalEditorSlotId, SlotAnchorPosition>;

    for (const slot of GLOBAL_HOMEPAGE_EDITOR_SLOTS) {
      const selector = `[data-edit-slot="${slot.id}"]`;
      const anchorNode = previewScene.querySelector<HTMLElement>(selector);
      if (!anchorNode) {
        nextPositions[slot.id] = slot.fallbackPosition;
        continue;
      }

      const anchorRect = anchorNode.getBoundingClientRect();
      const topRaw = ((anchorRect.top - contentRect.top + 8) / contentRect.height) * 100;
      const leftRaw = ((anchorRect.left - contentRect.left + 8) / contentRect.width) * 100;
      nextPositions[slot.id] = {
        topPercent: Math.max(1, Math.min(99, topRaw)),
        leftPercent: Math.max(1, Math.min(99, leftRaw)),
      };
    }

    setSlotAnchorPositions(nextPositions);
  }, []);

  useEffect(() => {
    const previewViewport = previewViewportRef.current;
    const previewScene = previewSceneRef.current;
    if (!previewScene) return;

    let mounted = true;
    const runSafeRecompute = () => {
      if (!mounted) return;
      recomputeSlotAnchors();
    };

    const rafId = window.requestAnimationFrame(runSafeRecompute);
    const timeoutA = window.setTimeout(runSafeRecompute, 220);
    const timeoutB = window.setTimeout(runSafeRecompute, 780);

    if (previewViewport) {
      previewViewport.addEventListener("scroll", runSafeRecompute, { passive: true });
    }
    window.addEventListener("resize", runSafeRecompute);

    const resizeObserver = new ResizeObserver(runSafeRecompute);
    resizeObserver.observe(previewScene);
    if (previewViewport) resizeObserver.observe(previewViewport);

    const mutationObserver = new MutationObserver(runSafeRecompute);
    mutationObserver.observe(previewScene, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });

    return () => {
      mounted = false;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutA);
      window.clearTimeout(timeoutB);
      if (previewViewport) {
        previewViewport.removeEventListener("scroll", runSafeRecompute);
      }
      window.removeEventListener("resize", runSafeRecompute);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [recomputeSlotAnchors, pageLocale, mapMarkers, selectedMapMarkerId]);

  return (
    <>
      <section className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <header className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">{copy.sectionTitle}</h3>
          <p className="text-xs text-muted-foreground">{copy.sectionHint}</p>
        </header>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/10">
              <div ref={previewViewportRef} className="max-h-[62vh] overflow-auto sm:max-h-[70vh] xl:max-h-[78vh]">
                <div ref={previewSceneRef} className="relative overflow-x-hidden">
                  <VietnamStoreMapHomepage
                    locale={pageLocale}
                    branches={previewBranches}
                    currentUserRole="owner_admin"
                    content={previewContent}
                    previewMode
                    editableSlots
                    selectedMarkerId={selectedMapMarkerId}
                  />

                  <div className="pointer-events-none absolute inset-0 z-20 hidden md:block">
                    {GLOBAL_HOMEPAGE_EDITOR_SLOTS.map((slot) => {
                      const isActive = selectedSlotId === slot.id && drawerOpen;
                      const anchorPosition =
                        slotAnchorPositions[slot.id] ?? slot.fallbackPosition;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isSaving}
                          onClick={() => openSlot(slot.id)}
                          className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border bg-card p-2 shadow-sm transition hover:scale-105 ${
                            isActive
                              ? "border-primary text-primary"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                          style={{
                            top: `${anchorPosition.topPercent}%`,
                            left: `${anchorPosition.leftPercent}%`,
                          }}
                          title={slot.label[locale]}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2 md:hidden">
              {GLOBAL_HOMEPAGE_EDITOR_SLOTS.map((slot) => {
                const isActive = selectedSlotId === slot.id && drawerOpen;
                return (
                  <button
                    key={`mobile-${slot.id}`}
                    type="button"
                    disabled={isSaving}
                    onClick={() => openSlot(slot.id)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground"
                    }`}
                  >
                    <span>{slot.label[locale]}</span>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="hidden space-y-2 rounded-2xl border border-border bg-muted/10 p-3 xl:block">
            <p className="text-xs text-muted-foreground">{copy.nodeListHint}</p>
            {GLOBAL_HOMEPAGE_EDITOR_SLOTS.map((slot) => {
              const isActive = selectedSlotId === slot.id && drawerOpen;
              return (
                <button
                  key={`desktop-${slot.id}`}
                  type="button"
                  disabled={isSaving}
                  onClick={() => openSlot(slot.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{slot.label[locale]}</span>
                    <Pencil className="h-3.5 w-3.5 shrink-0" />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {slot.description[locale]}
                  </p>
                </button>
              );
            })}
          </aside>
        </div>
      </section>

      <DrawerFormShell
        open={drawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDrawer();
            return;
          }
          setDrawerOpen(true);
        }}
        title={selectedSlot?.label[locale] ?? copy.drawerFallbackTitle}
        description={selectedSlot?.description[locale] ?? copy.drawerFallbackDescription}
        widthClassName={selectedSlotId === "global.map.markers" ? "max-w-6xl" : "max-w-2xl"}
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={closeDrawer}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              {copy.closeAction}
            </button>
          </div>
        }
      >
        {selectedSlotId === "global.hero.badge" ? (
          <VoiceDictationField
            label={selectedSlot?.label[locale] ?? copy.fieldLabel}
            value={heroBadge}
            onValueChange={setHeroBadge}
            language={voiceLanguage}
            fieldType="input"
            locale={locale}
          />
        ) : null}

        {selectedSlotId === "global.hero.heading" ? (
          <VoiceDictationField
            label={selectedSlot?.label[locale] ?? copy.fieldLabel}
            value={heroHeading}
            onValueChange={setHeroHeading}
            language={voiceLanguage}
            fieldType="input"
            locale={locale}
          />
        ) : null}

        {selectedSlotId === "global.hero.subheading" ? (
          <VoiceDictationField
            label={selectedSlot?.label[locale] ?? copy.fieldLabel}
            value={heroSubheading}
            onValueChange={setHeroSubheading}
            language={voiceLanguage}
            fieldType="input"
            locale={locale}
          />
        ) : null}

        {selectedSlotId === "global.hero.description" ? (
          <VoiceDictationField
            label={selectedSlot?.label[locale] ?? copy.fieldLabel}
            value={seoDescription}
            onValueChange={setSeoDescription}
            language={voiceLanguage}
            fieldType="textarea"
            rows={4}
            locale={locale}
          />
        ) : null}

        {selectedSlotId === "global.map.markers" ? (
          <div className="space-y-2">
            <GlobalHomepageMapMarkerEditor
              locale={locale}
              branches={mapBranches}
              markers={mapMarkers}
              selectedMarkerId={selectedMapMarkerId}
              onSelectMarker={setSelectedMapMarkerId}
              onUpdateMarkerPosition={updateMapMarkerPosition}
              onAddMarker={addMapMarker}
              onRemoveMarker={removeMapMarker}
              onMoveMarker={moveMapMarker}
              onUpdateMarkerBranch={updateMapMarkerBranch}
              onUpdateMarkerLabel={updateMapMarkerLabel}
              draggingMarkerId={draggingMapMarkerId}
              onDraggingMarkerIdChange={setDraggingMapMarkerId}
              disabled={isSaving}
            />
            {isMapMarkerPositionDirty ? (
              <p className="px-1 text-xs text-amber-700">{copy.mapDirtyHint}</p>
            ) : null}
          </div>
        ) : null}
      </DrawerFormShell>
    </>
  );
}
