import type { PlatformStyle, StudioSettings } from "../types";
import { instrumentScenePlan } from "./instrumentScenePlan";

export interface PresetObstaclePlan {
  style: PlatformStyle;
  widthScale: number;
  verticalScale?: number;
  horizontalScale?: number;
  sceneStart?: boolean;
  sceneIndex?: number;
}

function widthScale(style: PlatformStyle) {
  if (style === "instrument-key") return 1.16;
  if (style === "instrument-pad") return 0.78;
  if (style === "instrument-cymbal") return 0.62;
  if (style === "instrument-rail") return 1.05;
  if (style === "instrument-wire") return 1.28;
  if (style === "comet-pad") return 0.88;
  return 1;
}

export function presetObstaclePlan(index: number, settings: StudioSettings): PresetObstaclePlan | null {
  if (settings.terrainProfile === "tube-board" && settings.platformPrimaryStyle === "tube-cylinder") {
    const accentEvery = Math.max(4, settings.platformAccentEvery);
    const style = index > 0 && index % accentEvery === 0
      ? settings.platformAccentStyle
      : index % 5 === 3 || index % 7 === 2
        ? settings.platformSecondaryStyle
        : settings.platformPrimaryStyle;
    const scale = style === "toy-peg" ? 0.58 : style === "toy-tube" ? 0.82 : 1 + (index % 6 === 0 ? 0.04 : 0);
    return { style, widthScale: scale };
  }
  if (settings.terrainProfile === "comet" && settings.platformPrimaryStyle === "comet-pad") {
    const accentEvery = Math.max(4, settings.platformAccentEvery);
    const style = index > 0 && index % accentEvery === 0
      ? settings.platformAccentStyle
      : index % 4 === 2
        ? settings.platformSecondaryStyle
        : settings.platformPrimaryStyle;
    return { style, widthScale: style === "comet-pad" ? 0.94 : style === "light-pods" ? 0.78 : 0.9 };
  }
  if (settings.terrainProfile === "xylophone" && settings.platformPrimaryStyle.startsWith("instrument-")) {
    const scene = instrumentScenePlan(index);
    return {
      style: scene.style,
      widthScale: widthScale(scene.style) * scene.widthScale,
      verticalScale: scene.verticalScale,
      horizontalScale: scene.horizontalScale,
      sceneStart: scene.sceneStart,
      sceneIndex: scene.sceneIndex,
    };
  }
  return null;
}
