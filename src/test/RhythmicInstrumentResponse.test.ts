import { describe, expect, it } from "vitest";
import {
  instrumentImpactResponseAtTime,
  instrumentKeyPressAtTime,
} from "../features/rhythmic-studio/lib/instrumentResponse";

describe("rolling instrument response", () => {
  it("presses a piano key at contact and smoothly releases it", () => {
    expect(instrumentKeyPressAtTime(1_000, 999)).toBe(0);
    expect(instrumentKeyPressAtTime(1_000, 1_000)).toBe(1);
    expect(instrumentKeyPressAtTime(1_000, 1_020)).toBeLessThan(1);
    expect(instrumentKeyPressAtTime(1_000, 1_080)).toBeGreaterThan(0);
    expect(instrumentKeyPressAtTime(1_000, 1_120)).toBe(0);
  });

  it("starts tangent at contact, then gives the struck bar a small damped wobble", () => {
    const before = instrumentImpactResponseAtTime("xylophone-bar", 1_000, 999, 2);
    const contact = instrumentImpactResponseAtTime("xylophone-bar", 1_000, 1_000, 2);
    const moving = instrumentImpactResponseAtTime("xylophone-bar", 1_000, 1_022, 2);
    const settled = instrumentImpactResponseAtTime("xylophone-bar", 1_000, 1_600, 2);

    expect(before).toEqual({ normalRecoil: 0, tiltRad: 0, twistRad: 0 });
    expect(contact).toEqual({ normalRecoil: 0, tiltRad: 0, twistRad: 0 });
    expect(moving.normalRecoil).toBeGreaterThan(0);
    expect(Math.abs(moving.tiltRad) + Math.abs(moving.twistRad)).toBeGreaterThan(0);
    expect(moving.normalRecoil).toBeLessThan(0.25);
    expect(settled).toEqual({ normalRecoil: 0, tiltRad: 0, twistRad: 0 });
  });

  it("lets metal discs ring visually longer than wooden bars", () => {
    const wooden = instrumentImpactResponseAtTime("xylophone-bar", 1_000, 1_380, 0);
    const cymbal = instrumentImpactResponseAtTime("instrument-cymbal", 1_000, 1_380, 0);

    expect(wooden).toEqual({ normalRecoil: 0, tiltRad: 0, twistRad: 0 });
    expect(Math.abs(cymbal.tiltRad) + Math.abs(cymbal.twistRad)).toBeGreaterThan(0);
  });

  it("does not add a second wobble on piano keys that already depress", () => {
    const response = instrumentImpactResponseAtTime("piano-key", 1_000, 1_024, 0);

    expect(response).toEqual({ normalRecoil: 0, tiltRad: 0, twistRad: 0 });
  });
});
