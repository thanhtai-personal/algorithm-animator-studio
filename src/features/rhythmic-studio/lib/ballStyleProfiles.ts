import type { BallStyle, StudioSettings } from "../types";

export type BallStyleVisualProfile = Pick<StudioSettings,
  | "ballBaseColor"
  | "ballStripeColor"
  | "ballSize"
  | "glowAnimation"
  | "pulseAnimation"
  | "impactPlatformLight"
  | "impactRipple"
  | "animationSensitivity"
  | "ringPulseSensitivity"
  | "trailLength"
  | "particleCount"
  | "spectralDensity"
>;

type ProfileInput = Omit<BallStyleVisualProfile, "pulseAnimation" | "impactPlatformLight">;

function profile(values: ProfileInput): BallStyleVisualProfile {
  return {
    pulseAnimation: true,
    impactPlatformLight: true,
    ...values,
  };
}

const BALL_STYLE_VISUAL_PROFILES: Record<BallStyle, BallStyleVisualProfile> = {
  classic: profile({
    ballBaseColor: "#e4473d", ballStripeColor: "#ffd5cf", ballSize: 15,
    glowAnimation: false, impactRipple: false,
    animationSensitivity: 0.28, ringPulseSensitivity: 0.24,
    trailLength: 1, particleCount: 1, spectralDensity: 0.08,
  }),
  chrome: profile({
    ballBaseColor: "#c8d2de", ballStripeColor: "#ffffff", ballSize: 15,
    glowAnimation: false, impactRipple: false,
    animationSensitivity: 0.22, ringPulseSensitivity: 0.18,
    trailLength: 0, particleCount: 0, spectralDensity: 0.04,
  }),
  glass: profile({
    ballBaseColor: "#8fdcff", ballStripeColor: "#e8fbff", ballSize: 16,
    glowAnimation: false, impactRipple: false,
    animationSensitivity: 0.2, ringPulseSensitivity: 0.2,
    trailLength: 1, particleCount: 1, spectralDensity: 0.07,
  }),
  neon: profile({
    ballBaseColor: "#43e8ff", ballStripeColor: "#7165ff", ballSize: 16,
    glowAnimation: true, impactRipple: true,
    animationSensitivity: 0.72, ringPulseSensitivity: 0.7,
    trailLength: 9, particleCount: 5, spectralDensity: 0.34,
  }),
  striped: profile({
    ballBaseColor: "#d93631", ballStripeColor: "#ffffff", ballSize: 15,
    glowAnimation: false, impactRipple: false,
    animationSensitivity: 0.3, ringPulseSensitivity: 0.28,
    trailLength: 2, particleCount: 1, spectralDensity: 0.08,
  }),
  prism: profile({
    ballBaseColor: "#7ec9ff", ballStripeColor: "#ffffff", ballSize: 18,
    glowAnimation: true, impactRipple: true,
    animationSensitivity: 0.68, ringPulseSensitivity: 0.66,
    trailLength: 8, particleCount: 6, spectralDensity: 0.38,
  }),
  flower: profile({
    ballBaseColor: "#ef4738", ballStripeColor: "#ffd84d", ballSize: 15,
    glowAnimation: false, impactRipple: false,
    animationSensitivity: 0.28, ringPulseSensitivity: 0.24,
    trailLength: 1, particleCount: 1, spectralDensity: 0.08,
  }),
  fire: profile({
    ballBaseColor: "#ff4b18", ballStripeColor: "#ffe96a", ballSize: 17,
    glowAnimation: true, impactRipple: true,
    animationSensitivity: 0.84, ringPulseSensitivity: 0.78,
    trailLength: 14, particleCount: 20, spectralDensity: 0.58,
  }),
  water: profile({
    ballBaseColor: "#38dff2", ballStripeColor: "#d9fcff", ballSize: 16,
    glowAnimation: true, impactRipple: true,
    animationSensitivity: 0.58, ringPulseSensitivity: 0.72,
    trailLength: 8, particleCount: 10, spectralDensity: 0.42,
  }),
  rainbow: profile({
    ballBaseColor: "#6fdff2", ballStripeColor: "#ffffff", ballSize: 16,
    glowAnimation: false, impactRipple: true,
    animationSensitivity: 0.62, ringPulseSensitivity: 0.64,
    trailLength: 6, particleCount: 5, spectralDensity: 0.3,
  }),
  patchwork: profile({
    ballBaseColor: "#24c7e8", ballStripeColor: "#ff3cad", ballSize: 17,
    glowAnimation: false, impactRipple: true,
    animationSensitivity: 0.58, ringPulseSensitivity: 0.62,
    trailLength: 4, particleCount: 8, spectralDensity: 0.34,
  }),
};

export function settingsForBallStyle(style: BallStyle) {
  return { ballStyle: style, ...BALL_STYLE_VISUAL_PROFILES[style] };
}
