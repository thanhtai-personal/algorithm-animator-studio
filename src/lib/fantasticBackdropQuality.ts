export type FantasticBackdropEnvironment = {
  reducedMotion: boolean;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  viewportPixels: number;
};

export type FantasticBackdropQuality = {
  rayCount: number;
  targetFps: number;
  maxBackingPixels: number;
  dprCap: number;
  pointerMotion: boolean;
};

const REDUCED_MOTION_QUALITY: FantasticBackdropQuality = {
  rayCount: 40,
  targetFps: 0,
  maxBackingPixels: 480_000,
  dprCap: 0.75,
  pointerMotion: false,
};

const CONSTRAINED_QUALITY: FantasticBackdropQuality = {
  rayCount: 72,
  targetFps: 12,
  maxBackingPixels: 900_000,
  dprCap: 0.8,
  pointerMotion: false,
};

const STANDARD_QUALITY: FantasticBackdropQuality = {
  rayCount: 120,
  targetFps: 20,
  maxBackingPixels: 1_600_000,
  dprCap: 1,
  pointerMotion: true,
};

export function selectFantasticBackdropQuality(environment: FantasticBackdropEnvironment): FantasticBackdropQuality {
  if (environment.reducedMotion) return REDUCED_MOTION_QUALITY;

  const constrained = (
    (environment.hardwareConcurrency != null && environment.hardwareConcurrency <= 4)
    || (environment.deviceMemory != null && environment.deviceMemory <= 4)
    || environment.viewportPixels >= 3_840 * 2_160
  );

  return constrained ? CONSTRAINED_QUALITY : STANDARD_QUALITY;
}
