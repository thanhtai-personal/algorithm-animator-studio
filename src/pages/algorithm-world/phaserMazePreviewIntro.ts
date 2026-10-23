import type Phaser from "phaser";
import type { AlgorithmWorldCompareState } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";
import { drawTournamentBracket } from "./phaserMazePreviewTournament";
import { COLORS, drawParticleField, easeOutBack, easeOutCubic, lerp, type MazeTextRenderer } from "./phaserMazePreviewShared";

export function drawRaceIntro(scene: MazeTextRenderer, g: Phaser.GameObjects.Graphics, compare: AlgorithmWorldCompareState, x: number, y: number, w: number, h: number, pulse: number, lang: Lang) {
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

  if (intro.stage === "countdown") {
    const progress = Math.min(1, (intro.tick + 1) / Math.max(1, intro.duration));
    const countdownStep = Math.min(3, Math.floor(progress * 4));
    const text = countdownStep < 3 ? String(3 - countdownStep) : "START";
    scene.text(text, cx, cy, Math.min(text === "START" ? 132 : 190, w * (text === "START" ? 0.13 : 0.18)) * (1 + pulse * 0.08), COLORS.yellow, "center", 900, w * 0.72);
    scene.text(lang === "vi" ? "Chuẩn bị xuất phát" : "Ready to launch", cx, cy + Math.min(130, h * 0.17), 28, COLORS.open, "center", 900, w * 0.76);
    return;
  }

  drawVersusIntro(scene, g, intro.leftName, intro.rightName, x, y, w, h, Math.min(1, (intro.tick + 1) / Math.max(1, intro.duration)), intro.tick);
}

function drawVersusIntro(scene: MazeTextRenderer, g: Phaser.GameObjects.Graphics, left: string, right: string, x: number, y: number, w: number, h: number, progress: number, tick: number) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const enter = easeOutBack(Math.min(1, progress / 0.42));
  const settle = easeOutCubic(Math.min(1, Math.max(0, (progress - 0.7) / 0.3)));
  const isPortrait = h > w * 0.95;
  const leftTarget = isPortrait ? { x: x + w * 0.5, y: y + h * 0.14 } : { x: x + w * 0.22, y: y + 44 };
  const rightTarget = isPortrait ? { x: x + w * 0.5, y: y + h * 0.86 } : { x: x + w * 0.78, y: y + 44 };
  const leftX = lerp(lerp(x - w * 0.22, x + w * 0.28, enter), leftTarget.x, settle);
  const rightX = lerp(lerp(x + w * 1.22, x + w * 0.72, enter), rightTarget.x, settle);
  const leftY = lerp(cy - h * 0.11, leftTarget.y, settle);
  const rightY = lerp(cy + h * 0.11, rightTarget.y, settle);
  const vsPop = 1 + Math.max(0, Math.sin(Math.min(1, Math.max(0, (progress - 0.38) / 0.28)) * Math.PI)) * 0.45;
  drawPhaserSpeedLines(g, x, y, w, h, tick);
  g.lineStyle(Math.max(5, w * 0.006), COLORS.yellow, 0.95);
  g.lineBetween(x + w * 0.1, y + h * 0.84, x + w * 0.9, y + h * 0.16);
  drawTeamPlate(scene, g, left, leftX, leftY, Math.min(460, w * 0.36), COLORS.open);
  drawTeamPlate(scene, g, right, rightX, rightY, Math.min(460, w * 0.36), COLORS.goal);
  scene.text("VS", cx, cy, Math.min(126, w * 0.12) * vsPop, COLORS.yellow, "center", 900, w * 0.35);
}

function drawTeamPlate(scene: MazeTextRenderer, g: Phaser.GameObjects.Graphics, text: string, cx: number, cy: number, w: number, color: number) {
  g.fillStyle(COLORS.bg, 0.88);
  g.fillRoundedRect(cx - w / 2, cy - 32, w, 64, 18);
  g.lineStyle(3, color, 0.95);
  g.strokeRoundedRect(cx - w / 2, cy - 32, w, 64, 18);
  scene.text(text, cx, cy, 32, COLORS.text, "center", 900, w * 0.86);
}

function drawPhaserSpeedLines(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, tick: number) {
  g.lineStyle(2, COLORS.open, 0.18);
  for (let i = -10; i < 18; i++) {
    const xx = x + ((i * 86 + tick * 18) % (w + 220)) - 120;
    g.lineBetween(xx, y + h, xx + h * 0.48, y);
  }
}