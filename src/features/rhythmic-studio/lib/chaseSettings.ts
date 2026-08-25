import { BALL_STYLES } from "../types";
import type {
  BallStyle,
  MarbleAppearanceSettings,
  MarbleAvatar,
  MarbleMode,
  StudioSettings,
} from "../types";
import { settingsForBallStyle } from "./ballStyleProfiles";

export const DEFAULT_SECONDARY_MARBLE: MarbleAppearanceSettings = {
  marbleAvatar: "ball",
  ...settingsForBallStyle("multicolor-glass"),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isBallStyle(value: unknown): value is BallStyle {
  return typeof value === "string" && (BALL_STYLES as readonly string[]).includes(value);
}

function isMarbleAvatar(value: unknown): value is MarbleAvatar {
  return value === "ball" || (typeof value === "string" && /^animal-(?:[1-9]|1\d|20)$/.test(value));
}

function color(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function numberIn(value: unknown, fallback: number, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

function boolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function secondaryMarbleForStyle(
  ballStyle: BallStyle,
  marbleAvatar: MarbleAvatar = "ball",
): MarbleAppearanceSettings {
  return { marbleAvatar, ...settingsForBallStyle(ballStyle) };
}

export function normalizeSecondaryMarble(value: unknown): MarbleAppearanceSettings {
  if (!isRecord(value) || !isBallStyle(value.ballStyle) || !isMarbleAvatar(value.marbleAvatar)) {
    return { ...DEFAULT_SECONDARY_MARBLE };
  }
  const fallback = secondaryMarbleForStyle(value.ballStyle, value.marbleAvatar);
  return {
    ballStyle: value.ballStyle,
    marbleAvatar: value.marbleAvatar,
    ballBaseColor: color(value.ballBaseColor, fallback.ballBaseColor),
    ballStripeColor: color(value.ballStripeColor, fallback.ballStripeColor),
    ballSize: numberIn(value.ballSize, fallback.ballSize, 6, 28),
    glowAnimation: boolean(value.glowAnimation, fallback.glowAnimation),
    pulseAnimation: boolean(value.pulseAnimation, fallback.pulseAnimation),
    impactPlatformLight: boolean(value.impactPlatformLight, fallback.impactPlatformLight),
    impactRipple: boolean(value.impactRipple, fallback.impactRipple),
    animationSensitivity: numberIn(value.animationSensitivity, fallback.animationSensitivity, 0, 1.5),
    ringPulseSensitivity: numberIn(value.ringPulseSensitivity, fallback.ringPulseSensitivity, 0, 1.5),
    trailLength: numberIn(value.trailLength, fallback.trailLength, 0, 48),
    particleCount: numberIn(value.particleCount, fallback.particleCount, 0, 48),
    spectralDensity: numberIn(value.spectralDensity, fallback.spectralDensity, 0, 1.5),
  };
}

export function normalizeChaseSettings(settings: unknown): Pick<StudioSettings, "marbleMode" | "secondaryMarble"> {
  const source = isRecord(settings) ? settings : {};
  const marbleMode: MarbleMode = source.marbleMode === "chase" ? "chase" : "single";
  return { marbleMode, secondaryMarble: normalizeSecondaryMarble(source.secondaryMarble) };
}
