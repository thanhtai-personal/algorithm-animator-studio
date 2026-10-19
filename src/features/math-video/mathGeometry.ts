/** Frame-pure geometry for the math film. Coordinates use SVG's y-down convention. */
export type Point = { x: number; y: number };
export const radians = (degrees: number) => degrees * Math.PI / 180;
export const degrees = (value: number) => value * 180 / Math.PI;
export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);
export const ease = (t: number) => { const v = clamp01(t); return v * v * (3 - 2 * v); };
export const project = (cx: number, cy: number, r: number, angle: number): Point => ({ x: cx + r * Math.cos(radians(angle)), y: cy - r * Math.sin(radians(angle)) });
export const fmt = (n: number) => Number.isFinite(n) ? Number(n.toFixed(3)) : 0;
/** Only finite SVG path coordinates. */
export function sinePath(x: number, y: number, width: number, amplitude: number, cycles: number, phase = 0, steps = 180, reveal = 1) {
  const count = Math.max(1, Math.min(720, Math.round(steps * clamp01(reveal))));
  const points = Array.from({ length: count + 1 }, (_, i) => {
    const t = i / steps;
    return `${i === 0 ? "M" : "L"}${fmt(x + width * t)},${fmt(y - Math.sin(t * Math.PI * 2 * cycles + phase) * amplitude)}`;
  });
  return points.join(" ");
}
export function tanPaths(x: number, y: number, width: number, amplitude: number, cycles: number, steps = 600) {
  const output: string[] = [];
  let part = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = (t - 0.5) * 2 * Math.PI * cycles;
    const c = Math.cos(a);
    if (Math.abs(c) < 0.08) { if (part) output.push(part); part = ""; continue; }
    const v = Math.max(-2.5, Math.min(2.5, Math.tan(a)));
    const command = part ? "L" : "M";
    part += ` ${command}${fmt(x + t * width)},${fmt(y - v * amplitude)}`;
  }
  if (part) output.push(part);
  return output;
}
export const normalAngle = (angle: number) => ((angle % 360) + 360) % 360;
export const sinDeg = (angle: number) => Math.sin(radians(angle));
export const cosDeg = (angle: number) => Math.cos(radians(angle));
export const frameWindow = (frame: number, start: number, end: number) => clamp01((frame - start) / Math.max(1, end - start));
