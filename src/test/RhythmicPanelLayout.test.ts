import { beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, renderHook } from "@testing-library/react";
import {
  DEFAULT_RHYTHMIC_PANEL_LAYOUT,
  RHYTHMIC_PANEL_LAYOUT_LIMITS,
  RHYTHMIC_PANEL_LAYOUT_STORAGE_KEY,
  readRhythmicPanelLayout,
  resetRhythmicPanelLayout,
  resizeRhythmicPanel,
  useRhythmicPanelLayout,
  writeRhythmicPanelLayout,
} from "../features/rhythmic-studio/presentation/layouts/rhythmicPanelLayout";

describe("rhythmic panel layout", () => {
  beforeEach(() => window.localStorage.clear());

  it("uses safe defaults when no valid saved layout exists", () => {
    expect(readRhythmicPanelLayout()).toEqual(DEFAULT_RHYTHMIC_PANEL_LAYOUT);

    window.localStorage.setItem(RHYTHMIC_PANEL_LAYOUT_STORAGE_KEY, "not-json");
    expect(readRhythmicPanelLayout()).toEqual(DEFAULT_RHYTHMIC_PANEL_LAYOUT);
  });

  it("clamps saved panel widths to the supported range", () => {
    window.localStorage.setItem(RHYTHMIC_PANEL_LAYOUT_STORAGE_KEY, JSON.stringify({ left: 9999, right: 10 }));

    expect(readRhythmicPanelLayout()).toEqual({
      left: RHYTHMIC_PANEL_LAYOUT_LIMITS.left.max,
      right: RHYTHMIC_PANEL_LAYOUT_LIMITS.right.min,
    });
  });

  it("resizes the requested side while preserving the other side", () => {
    expect(resizeRhythmicPanel(DEFAULT_RHYTHMIC_PANEL_LAYOUT, "left", 80)).toEqual({ left: 320, right: 360 });
    expect(resizeRhythmicPanel(DEFAULT_RHYTHMIC_PANEL_LAYOUT, "right", -80)).toEqual({ left: 240, right: 440 });
  });

  it("persists the chosen widths and clears them on reset", () => {
    writeRhythmicPanelLayout({ left: 320, right: 440 });
    expect(readRhythmicPanelLayout()).toEqual({ left: 320, right: 440 });

    resetRhythmicPanelLayout();
    expect(window.localStorage.getItem(RHYTHMIC_PANEL_LAYOUT_STORAGE_KEY)).toBeNull();
    expect(readRhythmicPanelLayout()).toEqual(DEFAULT_RHYTHMIC_PANEL_LAYOUT);
  });

  it("tracks pointer dragging, persists the result, and restores the default layout", () => {
    const { result } = renderHook(() => useRhythmicPanelLayout());

    act(() => result.current.beginResize("left", 100));
    fireEvent.pointerMove(window, { clientX: 180 });
    fireEvent.pointerUp(window);

    expect(result.current.layout).toEqual({ left: 320, right: 360 });
    expect(readRhythmicPanelLayout()).toEqual({ left: 320, right: 360 });

    act(() => result.current.resetLayout());
    expect(result.current.layout).toEqual(DEFAULT_RHYTHMIC_PANEL_LAYOUT);
    expect(window.localStorage.getItem(RHYTHMIC_PANEL_LAYOUT_STORAGE_KEY)).toBeNull();
  });
});
