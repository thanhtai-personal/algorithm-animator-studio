export type Theme = {
  bg: string;
  bar: string;
  highlight: string;
  swap: string;
  sorted: string;
  pivot: string;
};

export const THEMES: Record<string, Theme> = {
  neon: { bg: "#0f0d1f", bar: "#94a3b8", highlight: "#facc15", swap: "#ec4899", sorted: "#22c55e", pivot: "#a855f7" },
  ocean: { bg: "#06121f", bar: "#5eead4", highlight: "#fbbf24", swap: "#f472b6", sorted: "#34d399", pivot: "#818cf8" },
  sunset: { bg: "#1a0d1f", bar: "#fda4af", highlight: "#fcd34d", swap: "#fb7185", sorted: "#86efac", pivot: "#c084fc" },
  mono: { bg: "#0a0a0a", bar: "#a3a3a3", highlight: "#fafafa", swap: "#ef4444", sorted: "#22c55e", pivot: "#3b82f6" },
};
