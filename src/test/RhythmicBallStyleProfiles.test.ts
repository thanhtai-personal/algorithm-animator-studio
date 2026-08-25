import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { RhythmicStudioStore } from "../features/rhythmic-studio/store/RhythmicStudioStore";
import { BALL_STYLES } from "../features/rhythmic-studio/types";

describe("ball style visual profiles", () => {
  it("replaces incompatible controls when selecting the fire marble", () => {
    const store = new RhythmicStudioStore();
    store.replaceSettings({
      ...DEFAULT_SETTINGS,
      ballStyle: "glass",
      ballBaseColor: "#00ff00",
      ballStripeColor: "#ff00ff",
      ballSize: 9,
      glowAnimation: false,
      pulseAnimation: false,
      impactPlatformLight: false,
      impactRipple: false,
      animationSensitivity: 0.1,
      ringPulseSensitivity: 0.1,
      trailLength: 0,
      particleCount: 0,
      spectralDensity: 0,
    });

    store.patch("ballStyle", "fire");

    expect(store.settings).toMatchObject({
      ballStyle: "fire",
      ballBaseColor: "#ff4b18",
      ballStripeColor: "#ffe96a",
      ballSize: 17,
      glowAnimation: true,
      pulseAnimation: true,
      impactPlatformLight: true,
      impactRipple: true,
      animationSensitivity: 0.84,
      ringPulseSensitivity: 0.78,
      trailLength: 14,
      particleCount: 20,
      spectralDensity: 0.58,
    });
  });

  it("removes neon residue when selecting the chrome marble", () => {
    const store = new RhythmicStudioStore();
    store.replaceSettings({
      ...DEFAULT_SETTINGS,
      ballStyle: "neon",
      glowAnimation: true,
      impactRipple: true,
      trailLength: 30,
      particleCount: 30,
      spectralDensity: 1.2,
    });

    store.patch("ballStyle", "chrome");

    expect(store.settings).toMatchObject({
      ballStyle: "chrome",
      ballBaseColor: "#c8d2de",
      ballStripeColor: "#ffffff",
      ballSize: 15,
      glowAnimation: false,
      pulseAnimation: true,
      impactPlatformLight: true,
      impactRipple: false,
      animationSensitivity: 0.22,
      ringPulseSensitivity: 0.18,
      trailLength: 0,
      particleCount: 0,
      spectralDensity: 0.04,
    });
  });

  it.each(BALL_STYLES)("provides a complete safe profile for %s", (ballStyle) => {
    const store = new RhythmicStudioStore();

    store.patch("ballStyle", ballStyle);

    expect(store.settings.ballStyle).toBe(ballStyle);
    expect(store.settings.ballBaseColor).toMatch(/^#[0-9a-f]{6}$/i);
    expect(store.settings.ballStripeColor).toMatch(/^#[0-9a-f]{6}$/i);
    expect(store.settings.ballSize).toBeGreaterThanOrEqual(6);
    expect(store.settings.ballSize).toBeLessThanOrEqual(28);
    expect(store.settings.trailLength).toBeGreaterThanOrEqual(0);
    expect(store.settings.trailLength).toBeLessThanOrEqual(48);
    expect(store.settings.particleCount).toBeGreaterThanOrEqual(0);
    expect(store.settings.particleCount).toBeLessThanOrEqual(48);
    expect(store.settings.spectralDensity).toBeGreaterThanOrEqual(0);
    expect(store.settings.spectralDensity).toBeLessThanOrEqual(1.5);
  });
});
