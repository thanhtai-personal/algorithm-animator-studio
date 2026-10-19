/** T06: deterministic finishing values for the 296-frame source reference. */
const garmentDetails = [
  { type: "maid", layerCount: 2, sparkleCount: 0, hemY: 390 },
  { type: "champagne", layerCount: 3, sparkleCount: 21, hemY: 410 },
  { type: "silver", layerCount: 3, sparkleCount: 13, hemY: 405 },
  { type: "tulle", layerCount: 4, sparkleCount: 0, hemY: 423 },
] as const;
const cutFrames = [139,184,248];
const clamped = (v:number) => Math.max(0,Math.min(1,v));
export function getFashionGarmentDetail(index:number) {
  const n = Number.isFinite(index) ? Math.max(0,Math.min(garmentDetails.length-1,Math.floor(index))) : 0;
  return garmentDetails[n];
}
export function getFashionVisualState(seconds:number) {
  const t = Number.isFinite(seconds) ? Math.max(0,seconds) : 0;
  const f = t*30;
  const proximity = Math.max(0,...cutFrames.map(cut=>clamped(1-Math.abs(f-cut)/4)));
  return {
    transitionVeil: 0.12*proximity*proximity,
    hairSway: Math.sin(t*2.6)*1.9,
    shadowOpacity: 0.29 + 0.02*Math.sin(t*1.9),
    vignetteOpacity: 0.095,
  };
}
