/** Reference timing is measured in seconds in the original 30 FPS source. */
const smooth = (v: number) => { const t = Math.max(0, Math.min(1, v)); return t*t*(3-2*t); };

/** Zoom includes set, model and fan; silver look zooms in, pink look zooms out. */
export function getFashionCameraScale(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds < 6.33) return 1;
  const approach = smooth((seconds - 6.33) / (6.90 - 6.33));
  const retreat = smooth((seconds - 8.08) / (8.65 - 8.08));
  return 1 + 0.43 * approach * (1 - retreat);
}

export type FashionRemotePose = {
  visible: boolean;
  x: number;
  y: number;
  rotation: number;
};

/** Remote starts diagonal at frame 27, stands upright at 153, then disappears. */
export function getFashionRemotePose(seconds: number): FashionRemotePose {
  const elapsed = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const turn = smooth((elapsed - 2.7) / 1.8);
  return {
    visible: elapsed < 6.08,
    x: 308 + 13 * turn,
    y: 325,
    rotation: 70 * (1 - turn),
  };
}
