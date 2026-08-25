import type { MarbleAppearanceSettings, StudioSettings } from "../types";
import type { MarblePlatform } from "./marblePhysicsTypes";
import type { ChaseOwner } from "./chaseStrikeOwnership";

export interface ChaseLane {
  owner: ChaseOwner;
  centerX: number;
  width: number;
  offsetX: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function settingsForChaseOwner(settings: StudioSettings, owner: ChaseOwner): StudioSettings {
  if (owner === "A") return settings;
  const appearance: MarbleAppearanceSettings = settings.secondaryMarble;
  return { ...settings, ...appearance };
}

export function chaseLaneFor(owner: ChaseOwner, width: number): ChaseLane {
  const laneWidth = clamp(width * 0.3, 210, 360);
  const centerX = width * (owner === "A" ? 0.32 : 0.68);
  return { owner, centerX, width: laneWidth, offsetX: centerX - laneWidth / 2 };
}

export function physicalSettingsForChaseLane(
  settings: StudioSettings,
  owner: ChaseOwner,
  lane: ChaseLane,
): StudioSettings {
  const appearanceSettings = settingsForChaseOwner(settings, owner);
  return {
    ...appearanceSettings,
    instrumentLayout: "corridor",
    laneSpread: Math.min(appearanceSettings.laneSpread, lane.width * 0.55),
    platformWidth: Math.min(appearanceSettings.platformWidth, Math.max(72, lane.width * 0.4)),
    platformGap: Math.min(appearanceSettings.platformGap, 118),
  };
}

function shifted(value: number | undefined, offsetX: number) {
  return value === undefined ? undefined : value + offsetX;
}

export function placePlatformsInChaseLane(
  platforms: MarblePlatform[],
  lane: ChaseLane,
): MarblePlatform[] {
  return platforms.map((platform) => ({
    ...platform,
    x: platform.x + lane.offsetX,
    contactX: platform.contactX + lane.offsetX,
    hitX: platform.hitX + lane.offsetX,
    visualX: shifted(platform.visualX, lane.offsetX),
  }));
}
