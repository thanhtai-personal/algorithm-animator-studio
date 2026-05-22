import { useEffect, useRef } from "react";
import Phaser from "phaser";
import type { AlgorithmWorldCell, AlgorithmWorldCompareState, AlgorithmWorldState, AlgorithmWorldTournamentMatch, AlgorithmWorldTournamentState, Frame } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/renderer";
import { cellKey } from "@/lib/algorithmWorld";
import { drawRaceTrackBase, drawRaceWalls } from "./PhaserMazeRaceStyle";

type Props = {
  frame: Frame | null | undefined;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  theme: Theme;
  lang: Lang;
};

type PreviewState = {
  frame: Frame | null | undefined;
  title: string;
  subtitle: string;
  theme: Theme;
  lang: Lang;
};

const COLORS = {
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

const PREVIEW_MAX_HEIGHT = "min(70vh, 1920px)";

export function PhaserMazePreview({ frame, width, height, title, subtitle, theme, lang }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<MazePreviewScene | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new MazePreviewScene();
    sceneRef.current = scene;
    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width,
      height,
      backgroundColor: "#020617",
      scene,
      transparent: false,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    });
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    gameRef.current?.scale.resize(width, height);
  }, [width, height]);

  useEffect(() => {
    sceneRef.current?.setPreviewState({ frame, title, subtitle, theme, lang });
  }, [frame, title, subtitle, theme, lang]);

  return (
    <div
      ref={hostRef}
      className="overflow-hidden rounded-lg bg-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.14)]"
      style={{ height: PREVIEW_MAX_HEIGHT, aspectRatio: `${width}/${height}` }}
    />
  );
}

class MazePreviewScene extends Phaser.Scene {
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

function drawBackground(g: Phaser.GameObjects.Graphics, w: number, h: number, accent: string) {
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

function drawCompare(scene: MazePreviewScene, g: Phaser.GameObjects.Graphics, compare: AlgorithmWorldCompareState, w: number, h: number, pulse: number, lang: Lang) {
  const gap = 18;
  const top = 92;
  const panelH = (h - top - 34 - gap) / 2;
  if (compare.raceIntro?.stage === "randomizing") {
    drawRaceIntro(scene, g, compare, 26, top, w - 52, h - top - 34, pulse, lang);
    return;
  }
  drawWorld(scene, g, compare.left, 26, top, w - 52, panelH, pulse, lang, false);
  drawWorld(scene, g, compare.right, 26, top + panelH + gap, w - 52, panelH, pulse, lang, false);
  drawRaceIntro(scene, g, compare, 26, top, w - 52, h - top - 34, pulse, lang);
}


function drawRaceIntro(scene: MazePreviewScene, g: Phaser.GameObjects.Graphics, compare: AlgorithmWorldCompareState, x: number, y: number, w: number, h: number, pulse: number, lang: Lang) {
  const intro = compare.raceIntro;
  if (!intro || intro.stage === "race") return;
  const cx = x + w / 2;
  const cy = y + h * 0.48;
  g.fillStyle(COLORS.bg, intro.stage === "winner" || intro.stage === "randomizing" ? 0.82 : 0.58);
  g.fillRoundedRect(x, y, w, h, 22);
  drawParticleField(g, x, y, w, h, COLORS.open, intro.tick, pulse);

  if (intro.stage === "randomizing") {
    scene.text(lang === "vi" ? "🎲 RANDOM SÂN ĐẤU" : "🎲 RANDOM ARENA", cx, y + h * 0.2, 54, COLORS.yellow, "center", 900);
    const names = lang === "vi" ? intro.candidatesVi ?? [] : intro.candidatesEn ?? [];
    const name = names.length ? names[(intro.pickedIndex ?? intro.tick) % names.length] : "Random Arena";
    g.fillStyle(COLORS.panel, 0.92);
    g.fillRoundedRect(cx - Math.min(560, w * 0.76) / 2, cy - 42, Math.min(560, w * 0.76), 84, 22);
    g.lineStyle(3, COLORS.yellow, 0.9);
    g.strokeRoundedRect(cx - Math.min(560, w * 0.76) / 2, cy - 42, Math.min(560, w * 0.76), 84, 22);
    scene.text(name, cx, cy, 34, COLORS.text, "center", 900);
    scene.text(`${intro.leftName} VS ${intro.rightName}`, cx, y + h * 0.82, 28, COLORS.text, "center", 900);
    return;
  }

  if (intro.stage === "assembling") {
    scene.text(lang === "vi" ? "ĐANG RÁP SÂN ĐẤU" : "ASSEMBLING ARENA", cx, cy - 58, 30, COLORS.open, "center", 900);
    scene.text(lang === "vi" ? intro.mazeNameVi : intro.mazeNameEn, cx, cy - 6, 48, COLORS.text, "center", 900);
    const barW = Math.min(540, w * 0.62);
    g.fillStyle(COLORS.muted, 0.22);
    g.fillRoundedRect(cx - barW / 2, cy + 52, barW, 14, 7);
    g.fillStyle(COLORS.open, 0.94);
    g.fillRoundedRect(cx - barW / 2, cy + 52, barW * (intro.assemblyProgress ?? 0), 14, 7);
    return;
  }

  if (intro.stage === "bracket" && intro.tournament) {
    drawTournamentBracket(scene, g, intro.tournament, x, y, w, h, intro.tick, intro.duration, lang);
    return;
  }

  if (intro.stage === "winner") {
    const title = intro.tie ? (lang === "vi" ? "HÒA" : "TIE") : intro.winnerName ?? "WINNER";
    g.fillStyle(COLORS.panel, 0.96);
    g.fillRoundedRect(cx - Math.min(760, w * 0.88) / 2, cy - 120, Math.min(760, w * 0.88), 240, 24);
    g.lineStyle(4, COLORS.yellow, 0.95);
    g.strokeRoundedRect(cx - Math.min(760, w * 0.88) / 2, cy - 120, Math.min(760, w * 0.88), 240, 24);
    g.fillStyle(COLORS.yellow, 1);
    g.fillRoundedRect(cx - 132, cy - 128, 264, 36, 18);
    scene.text("WINNER", cx, cy - 110, 18, COLORS.bg, "center", 900);
    scene.text(lang === "vi" ? "🏁 CHIẾN THẮNG" : "🏁 WINNER", cx, cy - 58, 38, COLORS.yellow, "center", 900, w * 0.76);
    scene.text(title, cx, cy + 8, 62, COLORS.text, "center", 900, w * 0.72);
    scene.text(lang === "vi" ? "Xe thắng được đưa lên giữa video" : "Winner spotlight in the center", cx, cy + 76, 24, COLORS.open, "center", 900, w * 0.76);
    return;
  }

  scene.text(lang === "vi" ? `${intro.leftName} VS ${intro.rightName} tại ${intro.mazeNameVi}` : `${intro.leftName} VS ${intro.rightName} at ${intro.mazeNameEn}`, cx, cy - 104, 25, COLORS.open, "center", 900);
  scene.text(intro.leftName, cx, cy - 44, 52, COLORS.text, "center", 900);
  scene.text("VS", cx, cy + 12, 56, COLORS.yellow, "center", 900);
  scene.text(intro.rightName, cx, cy + 76, 52, COLORS.text, "center", 900);
}

function drawWorld(scene: MazePreviewScene, g: Phaser.GameObjects.Graphics, world: AlgorithmWorldState, x: number, y: number, w: number, h: number, pulse: number, lang: Lang, large: boolean) {
  g.fillStyle(COLORS.panel, 0.9);
  g.fillRoundedRect(x, y, w, h, 16);
  g.lineStyle(2, COLORS.open, 0.28 + pulse * 0.18);
  g.strokeRoundedRect(x, y, w, h, 16);
  const labelH = large ? 58 : 42;
  scene.text(world.algorithmName ?? "A*", x + 16, y + labelH / 2, large ? 34 : 30, COLORS.text, "left", 900);
  scene.text(world.runtimeLabel ?? "", x + w - 16, y + labelH / 2, large ? 24 : 20, COLORS.yellow, "right", 800);

  const hudH = large ? 152 : 108;
  const mazeY = y + labelH + 8;
  const mazeH = h - labelH - hudH - 18;
  const cell = Math.floor(Math.min((w - 22) / world.cols, mazeH / world.rows));
  const gridW = cell * world.cols;
  const gridH = cell * world.rows;
  const gridX = x + (w - gridW) / 2;
  const gridY = mazeY + Math.max(0, (mazeH - gridH) / 2);
  const raceMode = world.presentationMode === "vehicle_race";
  const visible = null;
  raceMode ? drawRaceTrackBase(g, world.cols, world.rows, cell, gridX, gridY) : drawGrid(g, world.cols, world.rows, cell, gridX, gridY);
  if (raceMode) {
    scene.text(formatRaceTime(world.raceTime ?? world.stepCount ?? 0), gridX + gridW - 4, gridY - Math.max(40, cell * 1.25), large ? 44 : 34, world.raceWinner ? COLORS.yellow : COLORS.text, "right", 900);
  }
  if (visible) drawFog(g, world, visible, cell, gridX, gridY);
  drawCellSet(g, world.closedSet, cell, gridX, gridY, COLORS.closed, 0.36);
  drawCellSet(g, world.openSet, cell, gridX, gridY, COLORS.open, 0.28 + pulse * 0.18);
  if (!raceMode) drawPath(g, world.previousPath, cell, gridX, gridY, COLORS.oldPath, 0.42, true);
  drawPath(g, world.shatteredPath ?? [], cell, gridX, gridY, COLORS.danger, 0.88, true);
  raceMode ? drawRaceWalls(g, filterVisible(world.walls, visible), cell, gridX, gridY, false) : drawWalls(g, filterVisible(world.walls, visible), cell, gridX, gridY, false);
  raceMode ? drawRaceWalls(g, filterVisible(world.dynamicWalls, visible), cell, gridX, gridY, true) : drawWalls(g, filterVisible(world.dynamicWalls, visible), cell, gridX, gridY, true);
  drawCellSet(g, world.pulseCells ?? [], cell, gridX, gridY, COLORS.danger, 0.55 + pulse * 0.3);
  drawPath(g, world.path, cell, gridX, gridY, raceMode ? algorithmColor(world) : COLORS.path, 0.95, false);
  drawPortal(scene, g, world.start, cell, gridX, gridY, COLORS.start, lang === "vi" ? "VÀO" : "IN");
  drawPortal(scene, g, world.goal, cell, gridX, gridY, COLORS.goal, lang === "vi" ? "RA" : "OUT");
  if (world.current) drawRunner(g, world, cell, gridX, gridY, algorithmColor(world), pulse);
  if (raceMode && world.raceWinner) drawWinnerOverlay(scene, g, world, gridX + gridW / 2, gridY + gridH / 2, gridW, lang);
  drawHud(scene, g, world, x + 10, y + h - hudH - 8, w - 20, hudH, lang, large);
}

function drawTournamentBracket(
  scene: MazePreviewScene,
  g: Phaser.GameObjects.Graphics,
  tournament: AlgorithmWorldTournamentState,
  x: number,
  y: number,
  w: number,
  h: number,
  tick: number,
  duration: number,
  lang: Lang,
) {
  const progress = Math.min(1, (tick + 1) / Math.max(1, duration));
  const cx = x + w / 2;
  const top = y + h * 0.1;
  const bracketX = x + w * 0.055;
  const bracketY = y + h * 0.22;
  const bracketW = w * 0.89;
  const bracketH = h * 0.64;
  scene.text(lang === "vi" ? tournament.titleVi : tournament.titleEn, cx, top, Math.min(46, w * 0.05), COLORS.yellow, "center", 900);
  scene.text(lang === "vi" ? "Đội thắng tiến vào vòng trong" : "Winner advances to the next round", cx, top + 42, 23, COLORS.open, "center", 900);
  drawBracketConnectors(g, tournament, bracketX, bracketY, bracketW, bracketH, progress);
  tournament.rounds.forEach((round, roundIndex) => {
    const colW = Math.min(270, bracketW * 0.28);
    const colX = bracketX + roundIndex * (bracketW / 2);
    const roundLabel = [lang === "vi" ? "Tứ kết" : "Quarterfinals", lang === "vi" ? "Bán kết" : "Semifinals", lang === "vi" ? "Chung kết" : "Final"][roundIndex];
    scene.text(roundLabel, colX + colW / 2, bracketY - 28, 20, COLORS.muted, "center", 900);
    round.forEach((match, matchIndex) => {
      const pos = bracketMatchPosition(roundIndex, matchIndex, bracketX, bracketY, bracketW, bracketH, colW);
      drawBracketMatch(scene, g, match, pos.x, pos.y, colW, pos.h, progress, lang);
    });
  });
  if (tournament.winnerName) {
    const bannerW = Math.min(690, w * 0.82);
    const bannerY = y + h * 0.91;
    g.fillStyle(COLORS.bg, 0.94);
    g.fillRoundedRect(cx - bannerW / 2, bannerY - 38, bannerW, 76, 20);
    g.lineStyle(3, COLORS.yellow, 0.92);
    g.strokeRoundedRect(cx - bannerW / 2, bannerY - 38, bannerW, 76, 20);
    scene.text(`${tournament.winnerName} ➜ ${lang === "vi" ? "VÒNG TRONG" : "NEXT ROUND"}`, cx, bannerY, 28, COLORS.text, "center", 900);
  }
}

function drawBracketConnectors(g: Phaser.GameObjects.Graphics, tournament: AlgorithmWorldTournamentState, x: number, y: number, w: number, h: number, progress: number) {
  g.lineStyle(3, COLORS.open, 0.24 + progress * 0.35);
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < tournament.rounds[round].length; i += 2) {
      const colW = Math.min(270, w * 0.28);
      const a = bracketMatchPosition(round, i, x, y, w, h, colW);
      const b = bracketMatchPosition(round, i + 1, x, y, w, h, colW);
      const to = bracketMatchPosition(round + 1, i / 2, x, y, w, h, colW);
      const midX = a.x + a.w + (to.x - a.x - a.w) * 0.46;
      g.lineBetween(a.x + a.w, a.y + a.h / 2, midX, a.y + a.h / 2);
      g.lineBetween(b.x + b.w, b.y + b.h / 2, midX, b.y + b.h / 2);
      g.lineBetween(midX, a.y + a.h / 2, midX, b.y + b.h / 2);
      g.lineBetween(midX, to.y + to.h / 2, to.x, to.y + to.h / 2);
    }
  }
}

function bracketMatchPosition(round: number, match: number, x: number, y: number, w: number, h: number, colW: number) {
  const counts = [4, 2, 1];
  const count = counts[round] ?? 1;
  const colX = x + round * (w / 2);
  const matchH = Math.min(84, h / (count * 1.25));
  const gap = count === 1 ? 0 : (h - count * matchH) / (count - 1);
  return { x: colX, y: y + match * (matchH + gap), w: colW, h: matchH };
}

function drawBracketMatch(scene: MazePreviewScene, g: Phaser.GameObjects.Graphics, match: AlgorithmWorldTournamentMatch, x: number, y: number, w: number, h: number, progress: number, lang: Lang) {
  const alpha = match.pending && !match.active ? 0.62 : 0.95;
  g.fillStyle(COLORS.bg, alpha);
  g.fillRoundedRect(x, y, w, h, 16);
  g.lineStyle(match.active ? 4 : 2, match.active ? COLORS.yellow : match.winner ? COLORS.open : COLORS.muted, match.active ? 0.96 : 0.46 + progress * 0.2);
  g.strokeRoundedRect(x, y, w, h, 16);
  drawTeamRow(scene, g, match.left?.name ?? "—", match.winner?.name === match.left?.name, x + 10, y + 10, w - 20, h / 2 - 12, lang);
  drawTeamRow(scene, g, match.right?.name ?? "—", match.winner?.name === match.right?.name, x + 10, y + h / 2 + 2, w - 20, h / 2 - 12, lang);
  if (match.winner) scene.text("➜", x + w - 14, y + h / 2, 22, COLORS.yellow, "right", 900);
}

function drawTeamRow(scene: MazePreviewScene, g: Phaser.GameObjects.Graphics, name: string, winner: boolean, x: number, y: number, w: number, h: number, lang: Lang) {
  if (winner) {
    g.fillStyle(COLORS.yellow, 0.18);
    g.fillRoundedRect(x, y, w, h, 10);
  }
  scene.text(winner ? `🏁 ${name}` : name, x + 9, y + h / 2, winner ? 17 : 15, winner ? COLORS.yellow : COLORS.text, "left", 900);
  if (winner) scene.text(lang === "vi" ? "ĐI TIẾP" : "ADV", x + w - 8, y + h / 2, 11, COLORS.open, "right", 800);
}

function drawParticleField(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number, tick: number, pulse: number) {
  g.fillStyle(color, 0.14 + pulse * 0.07);
  const step = Math.max(42, Math.min(72, w / 12));
  for (let yy = y + 28; yy < y + h - 20; yy += step) {
    for (let xx = x + 28; xx < x + w - 20; xx += step) {
      const wave = Math.sin((xx + yy + tick * 12) * 0.018);
      g.fillCircle(xx + wave * 5, yy, 1.4 + Math.max(0, wave) * 1.5);
    }
  }
}

function drawWinnerOverlay(scene: MazePreviewScene, g: Phaser.GameObjects.Graphics, world: AlgorithmWorldState, cx: number, cy: number, w: number, lang: Lang) {
  const age = world.raceWinAge ?? 0;
  const pop = age < 10 ? 0.72 + age * 0.04 : 1 + Math.sin(age * 0.45) * 0.035;
  const alpha = Math.min(0.96, 0.3 + age * 0.12);
  const boxW = Math.min(w * 0.92, 720) * pop;
  const boxH = 150 * pop;
  g.fillStyle(COLORS.yellow, 0.16);
  g.fillCircle(cx, cy, boxW * 0.66);
  g.fillStyle(0x020617, alpha);
  g.fillRoundedRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH, 22);
  g.lineStyle(Math.max(3, 4 * pop), COLORS.yellow, 0.92);
  g.strokeRoundedRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH, 22);
  g.fillStyle(COLORS.yellow, 1);
  g.fillRoundedRect(cx - boxW * 0.28, cy - boxH / 2 - 18 * pop, boxW * 0.56, 34 * pop, 17 * pop);
  scene.text("WINNER", cx, cy - boxH / 2 - pop, Math.round(16 * pop), COLORS.bg, "center", 900);
  scene.text(world.algorithmName ?? "Algorithm", cx, cy - 8 * pop, Math.round(52 * pop), COLORS.yellow, "center", 900, boxW * 0.86);
  scene.text(lang === "vi" ? "Xe thắng đã dừng tại cửa ra" : "Winning car stopped at the exit", cx, cy + 42 * pop, Math.round(22 * pop), COLORS.text, "center", 900, boxW * 0.86);
}

function drawGrid(g: Phaser.GameObjects.Graphics, cols: number, rows: number, cell: number, x: number, y: number) {
  g.fillStyle(0x050b18, 0.95);
  g.fillRoundedRect(x - 10, y - 10, cols * cell + 20, rows * cell + 20, 16);
  g.lineStyle(1, COLORS.grid, 0.82);
  for (let col = 0; col <= cols; col++) g.lineBetween(x + col * cell, y, x + col * cell, y + rows * cell);
  for (let row = 0; row <= rows; row++) g.lineBetween(x, y + row * cell, x + cols * cell, y + row * cell);
}

function drawWalls(g: Phaser.GameObjects.Graphics, cells: AlgorithmWorldCell[], cell: number, x: number, y: number, dynamic: boolean) {
  cells.forEach((c) => {
    const px = x + c.x * cell + 1;
    const py = y + c.y * cell + 1;
    g.fillStyle(dynamic ? COLORS.danger : COLORS.wall, dynamic ? 0.9 : 0.96);
    g.fillRoundedRect(px, py, cell - 2, cell - 2, Math.max(3, cell * 0.18));
    g.lineStyle(1, dynamic ? 0xfecdd3 : 0x64748b, dynamic ? 0.8 : 0.25);
    g.strokeRoundedRect(px, py, cell - 2, cell - 2, Math.max(3, cell * 0.18));
  });
}

function drawCellSet(g: Phaser.GameObjects.Graphics, cells: AlgorithmWorldCell[], cell: number, x: number, y: number, color: number, alpha: number) {
  cells.forEach((c) => {
    g.fillStyle(color, alpha);
    g.fillRoundedRect(x + c.x * cell + 2, y + c.y * cell + 2, cell - 4, cell - 4, Math.max(3, cell * 0.2));
  });
}

function drawPath(g: Phaser.GameObjects.Graphics, path: AlgorithmWorldCell[], cell: number, x: number, y: number, color: number, alpha: number, dashed: boolean) {
  if (path.length < 2) return;
  g.lineStyle(Math.max(4, cell * 0.26), color, alpha);
  for (let i = 1; i < path.length; i++) {
    if (dashed && i % 2 === 0) continue;
    const a = path[i - 1];
    const b = path[i];
    g.lineBetween(x + a.x * cell + cell / 2, y + a.y * cell + cell / 2, x + b.x * cell + cell / 2, y + b.y * cell + cell / 2);
  }
}

function drawPortal(scene: MazePreviewScene, g: Phaser.GameObjects.Graphics, c: AlgorithmWorldCell, cell: number, x: number, y: number, color: number, text: string) {
  const cx = x + c.x * cell + cell / 2;
  const cy = y + c.y * cell + cell / 2;
  g.fillStyle(color, 0.25);
  g.fillCircle(cx, cy, cell * 0.72);
  g.fillStyle(color, 0.95);
  g.fillRoundedRect(cx - cell * 0.48, cy - cell * 0.34, cell * 0.96, cell * 0.68, Math.max(5, cell * 0.18));
  scene.text(text, cx, cy + 1, Math.max(9, cell * 0.3), 0x020617, "center", 900);
}

function drawRunner(g: Phaser.GameObjects.Graphics, world: AlgorithmWorldState, cell: number, x: number, y: number, color: number, pulse: number) {
  if (!world.current) return;
  const c = world.current;
  const cx = x + c.x * cell + cell / 2;
  const cy = y + c.y * cell + cell / 2;
  const shape = world.vehicleShape ?? "sport";
  const bodyW = cell * (shape === "truck" ? 0.96 : shape === "formula" ? 0.76 : 0.86);
  const bodyH = cell * (shape === "truck" ? 0.62 : 0.5);
  g.fillStyle(color, 0.18 + pulse * 0.2);
  g.fillCircle(cx, cy, cell * (0.62 + pulse * 0.12));
  g.fillStyle(color, 0.95);
  g.fillRoundedRect(cx - bodyW / 2, cy - bodyH / 2, bodyW, bodyH, Math.max(4, cell * 0.15));
  if (shape === "formula") {
    g.fillTriangle(cx + bodyW * 0.5, cy, cx + bodyW * 0.15, cy - bodyH * 0.48, cx + bodyW * 0.15, cy + bodyH * 0.48);
  }
  g.fillStyle(0xffffff, 0.82);
  g.fillRoundedRect(cx - bodyW * 0.05, cy - bodyH * 0.3, bodyW * 0.28, bodyH * 0.6, 4);
  g.fillStyle(0x020617, 0.95);
  g.fillCircle(cx - bodyW * 0.3, cy + bodyH * 0.56, Math.max(2, cell * 0.11));
  g.fillCircle(cx + bodyW * 0.3, cy + bodyH * 0.56, Math.max(2, cell * 0.11));
  g.lineStyle(Math.max(2, cell * 0.08), 0xffffff, 0.9);
  g.strokeRoundedRect(cx - bodyW / 2, cy - bodyH / 2, bodyW, bodyH, Math.max(4, cell * 0.15));
}

function drawHud(scene: MazePreviewScene, g: Phaser.GameObjects.Graphics, world: AlgorithmWorldState, x: number, y: number, w: number, h: number, lang: Lang, large: boolean) {
  g.fillStyle(0x020617, 0.78);
  g.fillRoundedRect(x, y, w, h, 16);
  g.lineStyle(1, COLORS.open, 0.32);
  g.strokeRoundedRect(x, y, w, h, 16);
  const raceMode = world.presentationMode === "vehicle_race";
  const status = localizedStatus(world, lang);
  scene.text(status, x + 14, y + 20, large ? 22 : 20, world.raceWinner ? COLORS.yellow : COLORS.open, "left", 800);
  if (raceMode) {
    const timer = formatRaceTime(world.raceTime ?? world.stepCount ?? 0);
    const state = world.raceFinished ? (world.raceWinner ? "WIN" : "DONE") : "RUN";
    scene.text(timer, x + w - 14, y + 20, large ? 36 : 30, world.raceWinner ? COLORS.yellow : COLORS.text, "right", 900);
    scene.text(state, x + w - 14, y + (large ? 64 : 56), large ? 18 : 16, world.raceWinner ? COLORS.yellow : COLORS.muted, "right", 900);
  }
  const stats = [
    [lang === "vi" ? "Thuật toán" : "Algorithm", world.algorithmName ?? "-"],
    [lang === "vi" ? "Đồng hồ" : "Timer", formatRaceTime(world.raceTime ?? world.stepCount ?? 0)],
    [lang === "vi" ? "Đã xét" : "Visited", String(world.visitedCount ?? world.closedSet.length)],
    [lang === "vi" ? "Độ dài" : "Path", String((world.pathLength ?? world.path.length) || "-")],
    [raceMode ? (lang === "vi" ? "Kết quả" : "Result") : "f = g + h", raceMode ? raceResult(world, lang) : String(world.scores?.f ?? "-")],
  ];
  const startY = y + (large ? 84 : 66);
  stats.forEach(([key, value], index) => {
    const sx = x + 14 + index * (w / stats.length);
    scene.text(key, sx, startY, large ? 16 : 15, COLORS.muted, "left", 700);
    scene.text(value, sx, startY + (large ? 28 : 24), large ? 23 : 20, key === "f = g + h" || world.raceWinner && index === stats.length - 1 ? COLORS.yellow : COLORS.text, "left", 900);
  });
}

function drawFog(g: Phaser.GameObjects.Graphics, world: AlgorithmWorldState, visible: Set<string>, cell: number, x: number, y: number) {
  g.fillStyle(0x020617, 0.82);
  for (let row = 0; row < world.rows; row++) {
    for (let col = 0; col < world.cols; col++) {
      if (!visible.has(`${col},${row}`)) g.fillRect(x + col * cell + 1, y + row * cell + 1, cell - 2, cell - 2);
    }
  }
}

function filterVisible(cells: AlgorithmWorldCell[], visible: Set<string> | null) {
  return visible ? cells.filter((cell) => visible.has(cellKey(cell))) : cells;
}

function algorithmColor(world: AlgorithmWorldState) {
  if (world.vehicleColor) return Phaser.Display.Color.HexStringToColor(world.vehicleColor).color;
  if (world.algorithmId === "dfs") return 0xfb7185;
  if (world.algorithmId === "bfs") return 0x38bdf8;
  if (world.algorithmId === "dijkstra") return 0xfacc15;
  return 0x34d399;
}

function localizedStatus(world: AlgorithmWorldState, lang: Lang) {
  const algo = world.algorithmName ?? "A*";
  if (world.presentationMode === "vehicle_race") {
    if (world.raceWinner) return lang === "vi" ? `${algo} tới đích trước. Đồng hồ đã dừng.` : `${algo} finishes first. Timer stopped.`;
    if (world.raceFinished) return lang === "vi" ? `${algo} đã tới điểm ra. Đồng hồ đã dừng.` : `${algo} reached the exit. Timer stopped.`;
    return lang === "vi" ? `${algo} chỉ chạy sang ô lân cận không bị tường chắn.` : `${algo} moves only to adjacent unblocked cells.`;
  }
  if (world.phase === "obstacle") return lang === "vi" ? "Tường mới xuất hiện, đường cũ bị phá." : "New walls appear and break the old route.";
  if (world.phase === "done") return lang === "vi" ? `${algo} đã tìm thấy lối ra.` : `${algo} reached the exit.`;
  if (world.phase === "replan") return lang === "vi" ? `${algo} đang tính lại đường đi.` : `${algo} is replanning.`;
  return lang === "vi" ? `${algo} mở rộng mê cung từ lối vào.` : `${algo} expands the maze from the entrance.`;
}

function formatRaceTime(value: number) {
  return `${Math.max(0, value).toString().padStart(2, "0")} tick`;
}

function raceResult(world: AlgorithmWorldState, lang: Lang) {
  if (world.raceWinner) return "WIN";
  if (world.raceFinished) return lang === "vi" ? "Về đích" : "Done";
  return lang === "vi" ? "Đang chạy" : "Running";
}
