export type MarbleImpactSoundKind =
  | "wall"
  | "obstacle"
  | "obstacle-strike"
  | "marble"
  | "instrument"
  | "roll";

export type MarbleImpactProfile = {
  duration: number;
  peak: number;
  baseFrequency: number;
  filterType: BiquadFilterType;
  filterFrequency: number;
  filterQ: number;
  fundamentalType: OscillatorType;
  fundamentalEndRatio: number;
  metallicType: OscillatorType;
  metallicRatio: number;
  metallicEndRatio: number;
  metallicGain: number;
};

export function marbleImpactProfile(
  kind: Exclude<MarbleImpactSoundKind, "roll">,
  intensity: number,
  variant = 0,
): MarbleImpactProfile {
  const level = Math.max(0, Math.min(1, intensity));
  const instrument = kind === "instrument";
  const marble = kind === "marble";
  const toyPlastic = kind === "obstacle" && variant === 1;
  const duration = instrument ? 0.2 : marble ? 0.07 : kind === "wall" ? 0.075 : toyPlastic ? 0.085 : kind === "obstacle" ? 0.11 : 0.16;
  const peak = instrument
    ? 0.055 + level * 0.28
    : marble
      ? 0.035 + level * 0.25
      : 0.025 + level * (kind === "obstacle-strike" ? 0.34 : 0.24);
  const instrumentFrequency = 220 * Math.pow(2, ((variant % 19) + 3) / 12);
  const baseFrequency = instrument
    ? instrumentFrequency
    : marble
      ? 520 + level * 420
      : kind === "wall"
        ? 210 + level * 150
        : toyPlastic
          ? 540 + level * 260
          : kind === "obstacle"
            ? 330 + level * 230
            : 145 + level * 115;

  return {
    duration,
    peak,
    baseFrequency,
    filterType: instrument ? "lowpass" : "bandpass",
    filterFrequency: instrument ? 5200 : marble ? 3600 + level * 1400 : toyPlastic ? 2950 + level * 1200 : kind === "obstacle-strike" ? 1250 : 2100 + level * 1700,
    filterQ: instrument ? 0.55 : marble ? 1.6 : kind === "wall" ? 0.75 : toyPlastic ? 1.35 : 1.15,
    fundamentalType: instrument ? "sine" : toyPlastic || kind === "obstacle-strike" ? "triangle" : "sine",
    fundamentalEndRatio: instrument ? 0.995 : marble ? 0.82 : toyPlastic ? 0.72 : 0.58,
    metallicType: instrument ? "sine" : "triangle",
    metallicRatio: instrument ? 2.01 : marble ? 2.75 : kind === "wall" ? 3.15 : toyPlastic ? 2.15 : 2.45,
    metallicEndRatio: instrument ? 1.98 : marble ? 1.8 : toyPlastic ? 1.7 : 1.55,
    metallicGain: instrument ? 0.28 : marble ? 0.32 : kind === "wall" ? 0.42 : toyPlastic ? 0.38 : 0.64,
  };
}
