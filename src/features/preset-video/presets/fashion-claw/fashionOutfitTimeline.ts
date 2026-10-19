/** Reference cuts inside the fan-occlusion windows (source video: 30fps). */
export const FASHION_REFERENCE_FPS = 30;
export const FASHION_LOOK_CUT_FRAMES = [139, 184, 248] as const;

export const FASHION_LOOKS = [
  { id: "black-white", dressColor: "#25232a", laceColor: "#f7eee7", shoeColor: "#29212a", handbag: null },
  { id: "champagne", dressColor: "#d8bc9c", laceColor: "#fdf0d9", shoeColor: "#f7f5ee", handbag: "blush" },
  { id: "silver-blue", dressColor: "#a9c0c8", laceColor: "#f2f8fa", shoeColor: "#f7f5ee", handbag: "blue-grey" },
  { id: "pink", dressColor: "#e7b3c6", laceColor: "#fff0f5", shoeColor: "#e9b0ba", handbag: "pink" },
] as const;

export type FashionLook = (typeof FASHION_LOOKS)[number];
export type FashionLookState = FashionLook & { index: number };

export function getFashionLookAtFrame(frame: number): FashionLookState {
  const f = Number.isFinite(frame) ? Math.max(0, Math.floor(frame)) : 0;
  const index = FASHION_LOOK_CUT_FRAMES.filter((cut) => f >= cut).length;
  return { ...FASHION_LOOKS[index], index };
}

/** Source timestamps remain valid when Remotion previews at other output fps. */
export function getFashionLookAtSeconds(seconds: number): FashionLookState {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return getFashionLookAtFrame(Math.floor(safe * FASHION_REFERENCE_FPS + 1e-7));
}

/** Fewer than four user photos: hold the last; never cycle earlier outfits. */
export function resolveFashionOutfitSource(sources: readonly string[], lookIndex: number): string | undefined {
  if (!sources.length) return undefined;
  const index = Number.isFinite(lookIndex) ? Math.max(0, Math.floor(lookIndex)) : 0;
  return sources[Math.min(index, sources.length - 1)];
}
