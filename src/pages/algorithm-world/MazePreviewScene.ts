import Phaser from "phaser";
import type { Frame } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/renderer";
import { drawCompare } from "./phaserMazePreviewLayout";
import { drawWorld } from "./phaserMazePreviewWorld";
import { COLORS, drawBackground } from "./phaserMazePreviewShared";

type PreviewState = {
  frame: Frame | null | undefined;
  title: string;
  subtitle: string;
  theme: Theme;
  lang: Lang;
};

export class MazePreviewScene extends Phaser.Scene {
  private gfx?: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private preview: PreviewState = {
    frame: null,
    title: "",
    subtitle: "",
    theme: { bg: "#020617", bar: "#94a3b8", highlight: "#22d3ee", swap: "#f43f5e", sorted: "#22c55e", pivot: "#a855f7" },
    lang: "en",
  };

  constructor() {
    super("maze-preview");
  }

  create() {
    this.gfx = this.add.graphics();
    this.render();
  }

  update() {
    this.render();
  }

  setPreviewState(next: PreviewState) {
    this.preview = next;
    this.render();
  }

  private render() {
    if (!this.gfx) return;
    const g = this.gfx;
    g.clear();
    this.labels.forEach((label) => label.destroy());
    this.labels = [];
    const w = this.scale.width;
    const h = this.scale.height;
    const pulse = 0.5 + Math.sin(this.time.now / 240) * 0.5;
    drawBackground(g, w, h, this.preview.theme.highlight);
    this.text(this.preview.title, w / 2, 42, 42, COLORS.text, "center", 900);
    this.text(this.preview.subtitle, w / 2, 76, 21, COLORS.yellow, "center", 800);
    const frame = this.preview.frame;
    if (frame?.worldCompare) {
      drawCompare(this, g, frame.worldCompare, w, h, pulse, this.preview.lang);
    } else if (frame?.world) {
      drawWorld(this, g, frame.world, 118, 138, w - 236, h - 230, pulse, this.preview.lang, true);
    }
  }

  text(value: string, x: number, y: number, size: number, color: number, align: "left" | "center" | "right" = "left", weight = 700, maxWidth?: number) {
    const item = this.add.text(x, y, value, {
      fontFamily: "Inter, ui-sans-serif, system-ui",
      fontSize: `${size}px`,
      fontStyle: String(weight),
      color: toHex(color),
      align,
    }).setOrigin(align === "center" ? 0.5 : align === "right" ? 1 : 0, 0.5);
    fitTextToWidth(item, size, maxWidth);
    item.setShadow(0, 2, "rgba(0,0,0,0.55)", 8);
    this.labels.push(item);
    return item;
  }
}

function fitTextToWidth(item: Phaser.GameObjects.Text, initialSize: number, maxWidth?: number) {
  if (!maxWidth || item.width <= maxWidth) return;
  item.setFontSize(Math.max(14, Math.floor(initialSize * maxWidth / item.width)));
}

function toHex(color: number) {
  return `#${color.toString(16).padStart(6, "0")}`;
}
