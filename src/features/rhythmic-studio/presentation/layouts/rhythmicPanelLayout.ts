import { useCallback, useEffect, useRef, useState } from "react";

export interface RhythmicPanelLayout {
  left: number;
  right: number;
}

export type RhythmicPanelSide = keyof RhythmicPanelLayout;

export const RHYTHMIC_PANEL_LAYOUT_STORAGE_KEY = "kai-studio.rhythmic.panel-layout.v1";

export const DEFAULT_RHYTHMIC_PANEL_LAYOUT: RhythmicPanelLayout = {
  left: 240,
  right: 360,
};

export const RHYTHMIC_PANEL_LAYOUT_LIMITS = {
  left: { min: 220, max: 480 },
  right: { min: 300, max: 600 },
} as const;

type LayoutStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

function getBrowserStorage(storage?: LayoutStorage) {
  if (storage) return storage;
  return typeof window === "undefined" ? undefined : window.localStorage;
}

function clampWidth(side: RhythmicPanelSide, value: unknown) {
  const fallback = DEFAULT_RHYTHMIC_PANEL_LAYOUT[side];
  const numericValue = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  const limits = RHYTHMIC_PANEL_LAYOUT_LIMITS[side];
  return Math.round(Math.min(limits.max, Math.max(limits.min, numericValue)));
}

export function normalizeRhythmicPanelLayout(value: Partial<RhythmicPanelLayout> | null | undefined): RhythmicPanelLayout {
  return {
    left: clampWidth("left", value?.left),
    right: clampWidth("right", value?.right),
  };
}

export function readRhythmicPanelLayout(storage?: LayoutStorage): RhythmicPanelLayout {
  try {
    const saved = getBrowserStorage(storage)?.getItem(RHYTHMIC_PANEL_LAYOUT_STORAGE_KEY);
    return saved ? normalizeRhythmicPanelLayout(JSON.parse(saved) as Partial<RhythmicPanelLayout>) : { ...DEFAULT_RHYTHMIC_PANEL_LAYOUT };
  } catch {
    return { ...DEFAULT_RHYTHMIC_PANEL_LAYOUT };
  }
}

export function writeRhythmicPanelLayout(layout: RhythmicPanelLayout, storage?: LayoutStorage) {
  try {
    getBrowserStorage(storage)?.setItem(RHYTHMIC_PANEL_LAYOUT_STORAGE_KEY, JSON.stringify(normalizeRhythmicPanelLayout(layout)));
  } catch {
    // Layout persistence is a convenience; resizing must keep working when storage is unavailable.
  }
}

export function resetRhythmicPanelLayout(storage?: LayoutStorage) {
  try {
    getBrowserStorage(storage)?.removeItem(RHYTHMIC_PANEL_LAYOUT_STORAGE_KEY);
  } catch {
    // Resetting the in-memory layout remains useful when storage is unavailable.
  }
}

export function resizeRhythmicPanel(layout: RhythmicPanelLayout, side: RhythmicPanelSide, deltaX: number): RhythmicPanelLayout {
  const directionalDelta = side === "left" ? deltaX : -deltaX;
  return normalizeRhythmicPanelLayout({
    ...layout,
    [side]: layout[side] + directionalDelta,
  });
}

interface DragState {
  side: RhythmicPanelSide;
  startX: number;
  startLayout: RhythmicPanelLayout;
}

export function useRhythmicPanelLayout() {
  const [layout, setLayout] = useState(readRhythmicPanelLayout);
  const [activeSide, setActiveSide] = useState<RhythmicPanelSide | null>(null);
  const layoutRef = useRef(layout);
  const dragRef = useRef<DragState | null>(null);

  const commitLayout = useCallback((nextLayout: RhythmicPanelLayout) => {
    layoutRef.current = nextLayout;
    setLayout(nextLayout);
    writeRhythmicPanelLayout(nextLayout);
  }, []);

  const beginResize = useCallback((side: RhythmicPanelSide, clientX: number) => {
    dragRef.current = { side, startX: clientX, startLayout: layoutRef.current };
    setActiveSide(side);
  }, []);

  const resizeByPointerDelta = useCallback((side: RhythmicPanelSide, deltaX: number) => {
    commitLayout(resizeRhythmicPanel(layoutRef.current, side, deltaX));
  }, [commitLayout]);

  const resetLayout = useCallback(() => {
    dragRef.current = null;
    layoutRef.current = { ...DEFAULT_RHYTHMIC_PANEL_LAYOUT };
    setActiveSide(null);
    setLayout({ ...DEFAULT_RHYTHMIC_PANEL_LAYOUT });
    resetRhythmicPanelLayout();
  }, []);

  useEffect(() => {
    if (!activeSide) return;

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      commitLayout(resizeRhythmicPanel(drag.startLayout, drag.side, event.clientX - drag.startX));
    };
    const stopDragging = () => {
      dragRef.current = null;
      setActiveSide(null);
    };

    document.body.classList.add("rhythmic-panel-resizing");
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      document.body.classList.remove("rhythmic-panel-resizing");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [activeSide, commitLayout]);

  return { layout, activeSide, beginResize, resizeByPointerDelta, resetLayout };
}
