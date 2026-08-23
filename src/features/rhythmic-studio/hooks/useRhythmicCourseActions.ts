import { useCallback } from "react";
import { BACKGROUND_PRESETS, BALL_STYLES, PLATFORM_STYLES, type CourseItemStyle } from "../types";
import type { RhythmicStudioStore } from "../store/RhythmicStudioStore";

export function useRhythmicCourseActions(store: RhythmicStudioStore) {
  const selectCourseNode = useCallback((index: number | null) => {
    if (index === null) return store.setSelectedNode(null);
    store.setSelectedNode(Math.max(0, Math.min(index, Math.max(0, store.timeline.length - 1))));
  }, [store]);

  const applyCourseItem = useCallback((style: CourseItemStyle, span: number) => {
    if (store.selectedNodeIndex === null || !store.timeline.length) return;
    const startIndex = Math.max(0, Math.min(store.selectedNodeIndex, store.timeline.length - 1));
    const safeSpan = Math.max(1, Math.min(Math.round(span), store.timeline.length - startIndex));
    const endIndex = startIndex + safeSpan - 1;
    store.setOverrides([
      ...store.courseOverrides.filter((item) => item.startIndex + item.span - 1 < startIndex || item.startIndex > endIndex),
      { id: crypto.randomUUID(), startIndex, span: safeSpan, style },
    ].sort((a, b) => a.startIndex - b.startIndex));
  }, [store]);

  const clearSelectedCourseItem = useCallback(() => {
    if (store.selectedNodeIndex === null) return;
    store.setOverrides(store.courseOverrides.filter((item) => store.selectedNodeIndex! < item.startIndex || store.selectedNodeIndex! >= item.startIndex + item.span));
  }, [store]);

  const clearCourseLayout = useCallback(() => store.setOverrides([]), [store]);

  const randomize = useCallback(() => {
    store.replaceSettings({
      ...store.settings,
      curveIntensity: +(0.18 + Math.random() * 0.78).toFixed(2),
      curvePathLength: +(0.35 + Math.random() * 0.6).toFixed(2),
      platformGap: Math.round(115 + Math.random() * 90),
      platformWidth: Math.round(180 + Math.random() * 120),
      platformTilt: Math.round(2 + Math.random() * 12),
      laneSpread: Math.round(330 + Math.random() * 190),
      bounceHeight: Math.round(90 + Math.random() * 105),
      cameraAnchor: +(0.28 + Math.random() * 0.14).toFixed(2),
      platformGlow: +(0.68 + Math.random() * 0.65).toFixed(2),
      platformMixMode: Math.random() > 0.5 ? "alternate" : "accent",
      platformPrimaryStyle: PLATFORM_STYLES[Math.floor(Math.random() * PLATFORM_STYLES.length)],
      platformSecondaryStyle: PLATFORM_STYLES[Math.floor(Math.random() * PLATFORM_STYLES.length)],
      platformAccentStyle: PLATFORM_STYLES[Math.floor(Math.random() * PLATFORM_STYLES.length)],
      platformAccentEvery: Math.round(4 + Math.random() * 8),
      platformDetail: +(0.58 + Math.random() * 0.55).toFixed(2),
      backgroundPreset: BACKGROUND_PRESETS[Math.floor(Math.random() * BACKGROUND_PRESETS.length)],
      backgroundMotion: +(0.28 + Math.random() * 0.9).toFixed(2),
      trailLength: Math.round(10 + Math.random() * 28),
      particleCount: Math.round(10 + Math.random() * 30),
      ballStyle: BALL_STYLES[Math.floor(Math.random() * BALL_STYLES.length)],
    });
    store.setStatus({ key: "status.randomized" });
  }, [store]);

  return { selectCourseNode, applyCourseItem, clearSelectedCourseItem, clearCourseLayout, randomize };
}
