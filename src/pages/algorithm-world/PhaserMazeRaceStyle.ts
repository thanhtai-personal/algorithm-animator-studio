import Phaser from "phaser";
import type { AlgorithmWorldCell } from "@/lib/algorithms";

export function drawRaceTrackBase(g: Phaser.GameObjects.Graphics, cols: number, rows: number, cell: number, x: number, y: number) {
  const w = cols * cell;
  const h = rows * cell;
  const lip = Math.max(12, cell * 0.42);
  g.fillStyle(0x000000, 0.42);
  g.fillRoundedRect(x - lip + 10, y - lip + 14, w + lip * 2, h + lip * 2, 16);
  g.fillGradientStyle(0x7f1d1d, 0xef4444, 0x111827, 0x111827, 1);
  g.fillRoundedRect(x - lip, y - lip, w + lip * 2, h + lip * 2, 16);
  g.fillGradientStyle(0x2b3442, 0x2b3442, 0x111827, 0x171717, 1);
  g.fillRoundedRect(x - 2, y - 2, w + 4, h + 4, 8);

  g.fillStyle(0xffffff, 0.08);
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    if ((col * 17 + row * 29) % 3 === 0) g.fillRect(x + col * cell + cell * 0.18, y + row * cell + cell * 0.22, Math.max(1, cell * 0.08), Math.max(1, cell * 0.08));
  }
  g.lineStyle(1, 0xffffff, 0.06);
  for (let col = 0; col <= cols; col++) g.lineBetween(x + col * cell, y, x + col * cell, y + h);
  for (let row = 0; row <= rows; row++) g.lineBetween(x, y + row * cell, x + w, y + row * cell);
  g.lineStyle(Math.max(1.2, cell * 0.04), 0xfde047, 0.28);
  for (let row = 2; row < rows; row += 4) for (let col = 0; col < cols; col += 2) {
    g.lineBetween(x + col * cell, y + row * cell, x + (col + 1) * cell, y + row * cell);
  }
  drawCheckeredGate(g, rows, cell, x - lip * 0.45, y, 0x22d3ee);
  drawCheckeredGate(g, rows, cell, x + w + lip * 0.12, y, 0xfb7185);
}

function drawCheckeredGate(g: Phaser.GameObjects.Graphics, rows: number, cell: number, x: number, y: number, accent: number) {
  const gateW = Math.max(8, cell * 0.34);
  for (let row = 0; row < rows; row++) {
    g.fillStyle(row % 2 === 0 ? 0xf8fafc : 0x020617, 1);
    g.fillRect(x, y + row * cell, gateW, cell / 2);
    g.fillStyle(row % 2 === 0 ? 0x020617 : 0xf8fafc, 1);
    g.fillRect(x, y + row * cell + cell / 2, gateW, cell / 2);
  }
  g.fillStyle(accent, 0.5);
  g.fillRect(x - 2, y - 3, gateW + 4, 3);
  g.fillRect(x - 2, y + rows * cell, gateW + 4, 3);
}

export function drawRaceWalls(g: Phaser.GameObjects.Graphics, cells: AlgorithmWorldCell[], cell: number, x: number, y: number, dynamic: boolean) {
  const lift = Math.max(5, cell * 0.24);
  cells.forEach((c) => {
    const px = x + c.x * cell + 1;
    const py = y + c.y * cell + 1;
    g.fillStyle(dynamic ? 0x7c2d12 : 0x1f2937, 1);
    g.fillRoundedRect(px + 4, py + lift + 4, cell - 2, cell - lift, Math.max(3, cell * 0.12));
    g.fillGradientStyle(dynamic ? 0xfdba74 : 0xf8fafc, dynamic ? 0xfdba74 : 0xf8fafc, dynamic ? 0xc2410c : 0x94a3b8, dynamic ? 0xf97316 : 0xcbd5e1, 1);
    g.fillRoundedRect(px, py, cell - 2, cell - lift, Math.max(3, cell * 0.12));
    g.lineStyle(Math.max(1.2, cell * 0.05), dynamic ? 0xfed7aa : 0xef4444, 1);
    g.strokeRoundedRect(px, py, cell - 2, cell - lift, Math.max(3, cell * 0.12));
  });
}
