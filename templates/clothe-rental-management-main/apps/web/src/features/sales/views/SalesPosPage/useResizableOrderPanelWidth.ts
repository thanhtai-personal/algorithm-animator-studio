"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

const ORDER_PANEL_WIDTH_STORAGE_KEY = "sales-pos.order-panel-width.v1";
const ORDER_PANEL_DEFAULT_WIDTH = 420;
const ORDER_PANEL_MIN_WIDTH = 360;
const ORDER_PANEL_MAX_WIDTH = 640;
const PRODUCTS_PANEL_MIN_WIDTH = 520;
const ORDER_PANEL_KEYBOARD_STEP = 16;

function resolveViewportMaxOrderPanelWidth(viewportWidth: number): number {
  const maxByViewport = viewportWidth - PRODUCTS_PANEL_MIN_WIDTH;
  return Math.max(ORDER_PANEL_MIN_WIDTH, Math.min(ORDER_PANEL_MAX_WIDTH, maxByViewport));
}

function clampOrderPanelWidth(width: number, viewportWidth: number): number {
  const safeMax = resolveViewportMaxOrderPanelWidth(viewportWidth);
  return Math.max(ORDER_PANEL_MIN_WIDTH, Math.min(safeMax, width));
}

function resolveInitialWidth(): number {
  if (typeof window === "undefined") return ORDER_PANEL_DEFAULT_WIDTH;
  const raw = window.localStorage.getItem(ORDER_PANEL_WIDTH_STORAGE_KEY);
  if (!raw) return clampOrderPanelWidth(ORDER_PANEL_DEFAULT_WIDTH, window.innerWidth);
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return clampOrderPanelWidth(ORDER_PANEL_DEFAULT_WIDTH, window.innerWidth);
  }
  return clampOrderPanelWidth(parsed, window.innerWidth);
}

interface UseResizableOrderPanelWidthResult {
  orderPanelWidth: number;
  orderPanelMinWidth: number;
  orderPanelMaxWidth: number;
  isResizingOrderPanel: boolean;
  onResizeHandlePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onResizeHandleKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
}

export function useResizableOrderPanelWidth(): UseResizableOrderPanelWidthResult {
  const [orderPanelWidth, setOrderPanelWidth] = useState<number>(() => resolveInitialWidth());
  const [isResizingOrderPanel, setIsResizingOrderPanel] = useState(false);
  const latestWidthRef = useRef<number>(orderPanelWidth);

  useEffect(() => {
    latestWidthRef.current = orderPanelWidth;
  }, [orderPanelWidth]);

  const persistWidth = useCallback((width: number) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ORDER_PANEL_WIDTH_STORAGE_KEY, String(width));
  }, []);

  const setClampedWidth = useCallback((nextWidth: number) => {
    if (typeof window === "undefined") return;
    const clamped = clampOrderPanelWidth(nextWidth, window.innerWidth);
    setOrderPanelWidth((previous) => (previous === clamped ? previous : clamped));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => {
      setOrderPanelWidth((previous) => {
        const clamped = clampOrderPanelWidth(previous, window.innerWidth);
        if (clamped === previous) return previous;
        latestWidthRef.current = clamped;
        persistWidth(clamped);
        return clamped;
      });
    };

    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [persistWidth]);

  const onResizeHandlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      if (typeof window === "undefined") return;

      const pointerId = event.pointerId;
      event.preventDefault();
      setIsResizingOrderPanel(true);

      const onPointerMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) return;
        const nextWidth = window.innerWidth - moveEvent.clientX;
        setClampedWidth(nextWidth);
      };

      const stopResizing = (endEvent: PointerEvent) => {
        if (endEvent.pointerId !== pointerId) return;
        setIsResizingOrderPanel(false);
        persistWidth(latestWidthRef.current);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", stopResizing);
        window.removeEventListener("pointercancel", stopResizing);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", stopResizing);
      window.addEventListener("pointercancel", stopResizing);
    },
    [persistWidth, setClampedWidth]
  );

  const onResizeHandleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (typeof window === "undefined") return;
      if (
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowRight" &&
        event.key !== "Home" &&
        event.key !== "End"
      ) {
        return;
      }

      event.preventDefault();

      let nextWidth = latestWidthRef.current;
      if (event.key === "ArrowLeft") {
        nextWidth += ORDER_PANEL_KEYBOARD_STEP;
      } else if (event.key === "ArrowRight") {
        nextWidth -= ORDER_PANEL_KEYBOARD_STEP;
      } else if (event.key === "Home") {
        nextWidth = ORDER_PANEL_MIN_WIDTH;
      } else if (event.key === "End") {
        nextWidth = resolveViewportMaxOrderPanelWidth(window.innerWidth);
      }

      const clamped = clampOrderPanelWidth(nextWidth, window.innerWidth);
      setOrderPanelWidth((previous) => (previous === clamped ? previous : clamped));
      latestWidthRef.current = clamped;
      persistWidth(clamped);
    },
    [persistWidth]
  );

  const orderPanelMaxWidth =
    typeof window === "undefined"
      ? ORDER_PANEL_MAX_WIDTH
      : resolveViewportMaxOrderPanelWidth(window.innerWidth);

  return {
    orderPanelWidth,
    orderPanelMinWidth: ORDER_PANEL_MIN_WIDTH,
    orderPanelMaxWidth,
    isResizingOrderPanel,
    onResizeHandlePointerDown,
    onResizeHandleKeyDown,
  };
}
