import type { PlatformStyle, StudioSettings } from "../types";

export interface PresetObstaclePlan {
  style: PlatformStyle;
  widthScale: number;
}

function instrumentStyle(index: number): PlatformStyle {
  const section = Math.floor(index / 8) % 6;
  const local = index % 8;
  if (section === 0) return "instrument-key";
  if (section === 1) return local % 5 === 0 ? "instrument-rail" : "instrument-pad";
  if (section === 2) return local % 3 === 0 ? "instrument-rail" : "instrument-cymbal";
  if (section === 3) return local % 2 ? "instrument-pad" : "instrument-rail";
  if (section === 4) return local % 4 === 0 ? "instrument-cymbal" : "instrument-wire";
  return local % 3 === 0 ? "instrument-key" : local % 3 === 1 ? "instrument-rail" : "instrument-wire";
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
    return { style: "tube-cylinder", widthScale: 0.94 + (index % 5 === 0 ? 0.1 : 0) };
  }
  if (settings.terrainProfile === "comet" && settings.platformPrimaryStyle === "comet-pad") {
    return { style: "comet-pad", widthScale: widthScale("comet-pad") };
  }
  if (settings.terrainProfile === "xylophone" && settings.platformPrimaryStyle.startsWith("instrument-")) {
    const style = instrumentStyle(index);
    return { style, widthScale: widthScale(style) };
  }
  return null;
}
