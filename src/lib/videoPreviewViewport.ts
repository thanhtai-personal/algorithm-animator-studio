/**
 * CSS sizing shared by editor previews. The selected export dimensions are the
 * source of truth: width is capped by the available column and by maxVh, then
 * height follows the exact video aspect ratio. This avoids `w-full + max-height`
 * stretching/clamping portrait and square previews differently from export.
 */
export function videoPreviewViewportStyle(width: number, height: number, maxVh = 70) {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  return {
    width: `min(100%, calc(${maxVh}vh * ${safeWidth} / ${safeHeight}))`,
    maxWidth: "100%",
    aspectRatio: `${safeWidth} / ${safeHeight}`,
  } as const;
}
