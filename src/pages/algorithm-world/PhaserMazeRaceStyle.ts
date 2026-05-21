import Phaser from "phaser";
import type { AlgorithmWorldCell } from "@/lib/algorithms";

export function drawRaceTrackBase(g: Phaser.GameObjects.Graphics, cols: number, rows: number, cell: number, x: number, y: number) {
  const w = cols * cell;
  const h = rows * cell;
  const lip = Math.max(10, cell * 0.34);
  g.fillStyle(0x000000, 0.36);
  g.fillRoundedRect(x - lip + 8, y - lip + 12, w + lip * 2, h + lip * 2, 12);
  g.fillStyle(0x111827, 1);
  g.fillRoundedRect(x - lip, y - lip, w + lip * 2, h + lip * 2, 12);
  g.lineStyle(Math.max(2, cell * 0.1), 0xef4444, 0.95);
  g.strokeRoundedRect(x - lip, y - lip, w + lip * 2, h + lip * 2, 12);
  g.fillStyle(0x171717, 1);
  g.fillRoundedRect(x - 2, y - 2, w + 4, h + 4, 6);
  g.lineStyle(Math.max(1.5, cell * 0.06), 0xef4444, 0.72);
  g.strokeRect(x - 4, y - 4, w + 8, h + 8);
  g.lineStyle(1, 0xffffff, 0.05);
  for (let col = 0; col <= cols; col++) g.lineBetween(x + col * cell, y, x + col * cell, y + h);
  for (let row = 0; row <= rows; row++) g.lineBetween(x, y + row * cell, x + w, y + row * cell);
}

export function drawRaceWalls(g: Phaser.GameObjects.Graphics, cells: AlgorithmWorldCell[], cell: number, x: number, y: number, dynamic: boolean) {
  const lift = Math.max(5, cell * 0.22);
  cells.forEach((c) => {
    const px = x + c.x * cell + 1;
    const py = y + c.y * cell + 1;
    g.fillStyle(dynamic ? 0x7f1d1d : 0x374151, 1);
    g.fillRoundedRect(px + 3, py + lift + 3, cell - 2, cell - lift, Math.max(2, cell * 0.1));
    g.fillStyle(dynamic ? 0xf97316 : 0xe5e7eb, 1);
    g.fillRoundedRect(px, py, cell - 2, cell - lift, Math.max(2, cell * 0.1));
    g.lineStyle(Math.max(1.2, cell * 0.05), dynamic ? 0xfb923c : 0xef4444, 1);
    g.strokeRoundedRect(px, py, cell - 2, cell - lift, Math.max(2, cell * 0.1));
    g.fillStyle(0xffffff, dynamic ? 0.28 : 0.36);
    g.fillRect(px + 3, py + 3, cell - 8, Math.max(2, lift * 0.36));
  });
}
