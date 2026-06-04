import Phaser from "phaser";

export type MazeTextRenderer = {
  text(value: string, x: number, y: number, size: number, color: number, align?: "left" | "center" | "right", weight?: number, maxWidth?: number): Phaser.GameObjects.Text;
};

export const COLORS = {
  bg: 0x020617,
  panel: 0x07111f,
  grid: 0x1f2a44,
  wall: 0x243244,
  closed: 0x6366f1,
  open: 0x22d3ee,
  path: 0xa3e635,
  oldPath: 0x94a3b8,
  danger: 0xf43f5e,
  start: 0x22d3ee,
  goal: 0xfb7185,
  text: 0xf8fafc,
  muted: 0x94a3b8,
  yellow: 0xfde047,
};

export function drawBackground(g: Phaser.GameObjects.Graphics, w: number, h: number, accent: string) {
  const accentColor = Phaser.Display.Color.HexStringToColor(accent || "#22d3ee").color;
  g.fillGradientStyle(0x020617, 0x020617, 0x07111f, 0x030712, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(accentColor, 0.16);
  const step = Math.max(42, Math.min(72, w / 12));
  for (let yy = 28; yy < h - 20; yy += step) {
    for (let xx = 28; xx < w - 20; xx += step) g.fillCircle(xx, yy, 1.5);
  }
  g.fillStyle(accentColor, 0.08);
  g.fillCircle(w * 0.22, h * 0.18, Math.min(w, h) * 0.18);
  g.fillStyle(COLORS.danger, 0.07);
  g.fillCircle(w * 0.84, h * 0.78, Math.min(w, h) * 0.22);
}

export function drawParticleField(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number, tick: number, pulse: number) {
  g.fillStyle(color, 0.14 + pulse * 0.07);
  const step = Math.max(42, Math.min(72, w / 12));
  for (let yy = y + 28; yy < y + h - 20; yy += step) {
    for (let xx = x + 28; xx < x + w - 20; xx += step) {
      const wave = Math.sin((xx + yy + tick * 12) * 0.018);
      g.fillCircle(xx + wave * 5, yy, 1.4 + Math.max(0, wave) * 1.5);
    }
  }
}

export function easeOutBack(value: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}

export function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

export function easeInOut(value: number) {
  return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
