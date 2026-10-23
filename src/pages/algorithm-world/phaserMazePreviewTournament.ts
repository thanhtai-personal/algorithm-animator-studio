import type Phaser from "phaser";
import type { AlgorithmWorldTournamentMatch, AlgorithmWorldTournamentState } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";
import { COLORS, easeInOut, lerp, type MazeTextRenderer } from "./phaserMazePreviewShared";

export function drawTournamentBracket(
  scene: MazeTextRenderer,
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
  const isLandscape = w > h * 1.2;
  const trophyY = y + (isLandscape ? Math.max(36, h * 0.075) : h * 0.065);
  const titleY = trophyY + (isLandscape ? 40 : 44);
  const subtitleY = titleY + (isLandscape ? 30 : 38);
  const bracketX = x + w * 0.045;
  const bracketY = y + (isLandscape ? h * 0.3 : h * 0.24);
  const bracketW = w * 0.91;
  const bracketH = h * (isLandscape ? 0.56 : 0.58);
  scene.text("🏆", cx, trophyY, 38, COLORS.yellow, "center", 900);
  scene.text(lang === "vi" ? tournament.titleVi : tournament.titleEn, cx, titleY, Math.min(isLandscape ? 36 : 42, w * 0.048), COLORS.yellow, "center", 900);
  scene.text(lang === "vi" ? "Đội thắng tiến vào vòng trong" : "Winner advances to the next round", cx, subtitleY, isLandscape ? 18 : 21, COLORS.open, "center", 900);
  drawBracketConnectors(g, tournament, bracketX, bracketY, bracketW, bracketH, progress);
  tournament.rounds.forEach((round, roundIndex) => {
    const colW = bracketColumnWidth(bracketW);
    const colX = bracketColumnX(roundIndex, bracketX, bracketW, colW);
    const roundLabel = [lang === "vi" ? "Tứ kết" : "Quarterfinals", lang === "vi" ? "Bán kết" : "Semifinals", lang === "vi" ? "Chung kết" : "Final"][roundIndex];
    scene.text(roundLabel, colX + colW / 2, bracketY - 28, 20, COLORS.muted, "center", 900);
    round.forEach((match, matchIndex) => {
      const pos = bracketMatchPosition(roundIndex, matchIndex, bracketX, bracketY, bracketW, bracketH, colW);
      drawBracketMatch(scene, g, match, pos.x, pos.y, colW, pos.h, progress, lang);
    });
  });
  drawAdvancingWinner(scene, g, tournament, bracketX, bracketY, bracketW, bracketH, progress, lang);
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
      const colW = bracketColumnWidth(w);
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
  const colX = bracketColumnX(round, x, w, colW);
  const matchH = bracketMatchHeight(h);
  if (round <= 0) {
    const count = 4;
    const gap = (h - count * matchH) / (count - 1);
    return { x: colX, y: y + match * (matchH + gap), w: colW, h: matchH };
  }
  const fromA = bracketMatchPosition(round - 1, match * 2, x, y, w, h, colW);
  const fromB = bracketMatchPosition(round - 1, match * 2 + 1, x, y, w, h, colW);
  const centerY = (fromA.y + fromA.h / 2 + fromB.y + fromB.h / 2) / 2;
  return { x: colX, y: centerY - matchH / 2, w: colW, h: matchH };
}

function bracketMatchHeight(h: number) {
  return Math.min(72, h / (4 * 1.34));
}

function bracketColumnWidth(w: number) {
  return Math.min(220, Math.max(112, w * 0.25));
}

function bracketColumnX(round: number, x: number, w: number, colW: number) {
  return x + round * ((w - colW) / 2);
}

function drawBracketMatch(scene: MazeTextRenderer, g: Phaser.GameObjects.Graphics, match: AlgorithmWorldTournamentMatch, x: number, y: number, w: number, h: number, progress: number, lang: Lang) {
  const alpha = match.pending && !match.active ? 0.62 : 0.95;
  g.fillStyle(COLORS.bg, alpha);
  g.fillRoundedRect(x, y, w, h, 16);
  g.lineStyle(match.active ? 4 : 2, match.active ? COLORS.yellow : match.winner ? COLORS.open : COLORS.muted, match.active ? 0.96 : 0.46 + progress * 0.2);
  g.strokeRoundedRect(x, y, w, h, 16);
  drawTeamRow(scene, g, match.left?.name, match.winner?.name === match.left?.name, x + 10, y + 10, w - 20, h / 2 - 12, lang);
  drawTeamRow(scene, g, match.right?.name, match.winner?.name === match.right?.name, x + 10, y + h / 2 + 2, w - 20, h / 2 - 12, lang);
  if (match.winner) scene.text("➜", x + w - 14, y + h / 2, 22, COLORS.yellow, "right", 900);
}

function drawTeamRow(scene: MazeTextRenderer, g: Phaser.GameObjects.Graphics, name: string | undefined, winner: boolean, x: number, y: number, w: number, h: number, lang: Lang) {
  if (!name) {
    g.lineStyle(1, COLORS.muted, 0.3);
    g.strokeRoundedRect(x, y, w, h, 9);
    return;
  }
  if (winner) {
    g.fillStyle(COLORS.yellow, 0.18);
    g.fillRoundedRect(x, y, w, h, 10);
  }
  scene.text(winner ? `🏁 ${name}` : name, x + 9, y + h / 2, winner ? 16 : 14, winner ? COLORS.yellow : COLORS.text, "left", 900, w - 18);
  if (winner) scene.text(lang === "vi" ? "ĐI TIẾP" : "ADV", x + w - 8, y + h / 2, 11, COLORS.open, "right", 800);
}

function drawAdvancingWinner(
  scene: MazeTextRenderer,
  g: Phaser.GameObjects.Graphics,
  tournament: AlgorithmWorldTournamentState,
  x: number,
  y: number,
  w: number,
  h: number,
  progress: number,
  lang: Lang,
) {
  if (!tournament.winnerName || tournament.round >= 2) return;
  const active = tournament.rounds[tournament.round]?.[tournament.match];
  if (!active?.winner) return;
  const colW = bracketColumnWidth(w);
  const fromMatch = bracketMatchPosition(tournament.round, tournament.match, x, y, w, h, colW);
  const toMatch = bracketMatchPosition((tournament.round + 1) as 0 | 1 | 2, Math.floor(tournament.match / 2), x, y, w, h, colW);
  const fromSlot = active.winner.name === active.right?.name ? 1 : 0;
  const toSlot = tournament.match % 2;
  const rowH = fromMatch.h / 2 - 12;
  const from = rowCenter(fromMatch.x + 10, fromMatch.y + (fromSlot ? fromMatch.h / 2 + 2 : 10), fromMatch.w - 20, rowH);
  const to = rowCenter(toMatch.x + 10, toMatch.y + (toSlot ? toMatch.h / 2 + 2 : 10), toMatch.w - 20, rowH);
  const midX = fromMatch.x + fromMatch.w + (toMatch.x - fromMatch.x - fromMatch.w) * 0.46;
  const path = [
    { x: fromMatch.x + fromMatch.w, y: from.y },
    { x: midX, y: from.y },
    { x: midX, y: toMatch.y + toMatch.h / 2 },
    { x: toMatch.x, y: toMatch.y + toMatch.h / 2 },
    to,
  ];
  const run = easeInOut(Math.min(1, Math.max(0, (progress - 0.16) / 0.66)));
  drawRunningAdvancePath(g, path, run);
  if (run > 0.86) drawDestinationTeam(scene, g, active.winner.name, to.x, to.y, fromMatch.w - 20, rowH, (run - 0.86) / 0.14, lang);
}

function rowCenter(x: number, y: number, w: number, h: number) {
  return { x: x + w / 2, y: y + h / 2 };
}

function drawRunningAdvancePath(g: Phaser.GameObjects.Graphics, points: Array<{ x: number; y: number }>, progress: number) {
  g.lineStyle(10, COLORS.yellow, progress >= 1 ? 0.3 : 0.2);
  strokePolyline(g, points);
  g.lineStyle(4.8, COLORS.yellow, 0.92);
  const partial = partialPolyline(points, progress);
  strokePolyline(g, partial);
  if (progress < 1) {
    const head = partial[partial.length - 1];
    g.fillStyle(0xfff7ad, 0.96);
    g.fillCircle(head.x, head.y, 7 + Math.sin(progress * Math.PI * 8) * 2);
  }
}

function drawDestinationTeam(scene: MazeTextRenderer, g: Phaser.GameObjects.Graphics, name: string, cx: number, cy: number, w: number, h: number, progress: number, lang: Lang) {
  const alpha = Math.min(1, Math.max(0, progress));
  g.fillStyle(COLORS.yellow, 0.22 * alpha);
  g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
  g.lineStyle(2.6, COLORS.yellow, 0.8 + alpha * 0.2);
  g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
  scene.text(`🏁 ${name}`, cx - w / 2 + 9, cy, 15, COLORS.yellow, "left", 900, w - 18);
  scene.text(lang === "vi" ? "CHỜ ĐẤU" : "WAITING", cx + w / 2 - 8, cy, 10, COLORS.open, "right", 800);
}

function strokePolyline(g: Phaser.GameObjects.Graphics, points: Array<{ x: number; y: number }>) {
  for (let i = 1; i < points.length; i++) g.lineBetween(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
}

function partialPolyline(points: Array<{ x: number; y: number }>, progress: number) {
  if (progress >= 1) return points;
  const target = polylineLength(points) * Math.max(0, progress);
  const next = [points[0]];
  let travelled = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const current = points[i];
    const segment = Math.hypot(current.x - prev.x, current.y - prev.y);
    if (travelled + segment >= target) {
      const t = segment ? (target - travelled) / segment : 0;
      next.push({ x: lerp(prev.x, current.x, t), y: lerp(prev.y, current.y, t) });
      return next;
    }
    next.push(current);
    travelled += segment;
  }
  return next;
}

function polylineLength(points: Array<{ x: number; y: number }>) {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  return total;
}