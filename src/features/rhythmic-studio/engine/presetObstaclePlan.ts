import type { InstrumentFamily, InstrumentLayout, PlatformStyle, StudioSettings } from "../types";
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
  if (style === "instrument-key" || style === "xylophone-bar") return 1.16;
  if (style === "piano-key") return 1.08;
  if (style === "marimba-bar") return 1.12;
  if (style === "vibraphone-bar") return 1.04;
  if (style === "boomwhacker-tube") return 1.02;
  if (style === "pluck-pad") return 0.72;
  if (style === "drum-disc") return 0.7;
  if (style === "cowbell-block") return 0.82;
  if (style === "bell-cone") return 0.68;
  if (style === "arcade-pad") return 0.74;
  if (style === "instrument-pad") return 0.78;
  if (style === "instrument-cymbal") return 0.62;
  if (style === "instrument-rail") return 0.94;
  if (style === "instrument-wire") return 1.08;
  if (style === "comet-pad") return 0.88;
  return 1;
}

function layoutScale(layout: InstrumentLayout, index: number) {
  // Reference-style wall installations read best when gravity is the dominant
  // direction. Keep lateral travel restrained and let the course descend.
  if (layout === "fan") return { vertical: 0.9 + (index % 5) * 0.018, horizontal: 0.56 + (index % 4) * 0.025 };
  if (layout === "gallery") return { vertical: 0.94, horizontal: 0.5 + (index % 3) * 0.03 };
  if (layout === "split") return { vertical: 0.88, horizontal: 0.62 + (index % 2) * 0.05 };
  return { vertical: 0.92 + (index % 4) * 0.014, horizontal: 0.54 + (index % 3) * 0.02 };
}

function familyPattern(family: InstrumentFamily, index: number): PlatformStyle {
  if (family === "boomwhacker") return index % 7 === 5 ? "xylophone-bar" : "boomwhacker-tube";
  if (family === "xylophone") return index % 9 === 7 ? "instrument-rail" : "xylophone-bar";
  if (family === "piano") return index % 8 === 6 ? "pluck-pad" : "piano-key";
  if (family === "marimba") return index % 8 === 5 ? "drum-disc" : "marimba-bar";
  if (family === "pluck") return index % 6 === 4 ? "instrument-wire" : "pluck-pad";
  if (family === "vibraphone") return index % 10 === 8 ? "instrument-rail" : "vibraphone-bar";
  if (family === "percussion") {
    const pattern: PlatformStyle[] = ["cowbell-block", "cowbell-block", "drum-disc", "bell-cone", "cowbell-block", "drum-disc"];
    return pattern[index % pattern.length];
  }
  if (family === "arcade") {
    const pattern: PlatformStyle[] = ["arcade-pad", "arcade-pad", "vibraphone-bar", "bell-cone", "arcade-pad", "pluck-pad"];
    return pattern[index % pattern.length];
  }
  if (family === "mixed") {
    const section = Math.floor(index / 8) % 8;
    return familyPattern((["percussion", "boomwhacker", "xylophone", "marimba", "arcade", "vibraphone", "pluck", "piano"] as const)[section], index);
  }
  return "instrument-key";
}

export function presetObstaclePlan(index: number, settings: StudioSettings): PresetObstaclePlan | null {
  if (settings.instrumentFamily !== "auto") {
    const style = familyPattern(settings.instrumentFamily, index);
    const layout = layoutScale(settings.instrumentLayout, index);
    const sectionLength = settings.instrumentFamily === "mixed" ? 8 : settings.instrumentLayout === "gallery" ? 10 : settings.instrumentLayout === "fan" ? 14 : 12;
    return {
      style,
      widthScale: widthScale(style) * (index % 6 === 0 ? 1.06 : 1),
      verticalScale: layout.vertical,
      horizontalScale: layout.horizontal,
      sceneStart: index > 0 && index % sectionLength === 0,
      sceneIndex: Math.floor(index / sectionLength),
    };
  }
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
