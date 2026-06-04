import type Phaser from "phaser";
import type { AlgorithmWorldCompareState } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";
import type { MazeTextRenderer } from "./phaserMazePreviewShared";
import { drawRaceIntro } from "./phaserMazePreviewIntro";
import { drawWorld } from "./phaserMazePreviewWorld";

export function drawCompare(scene: MazeTextRenderer, g: Phaser.GameObjects.Graphics, compare: AlgorithmWorldCompareState, w: number, h: number, pulse: number, lang: Lang) {
  const gap = 18;
  const top = 92;
  const contentX = 26;
  const contentY = top;
  const contentW = w - 52;
  const contentH = h - top - 34;
  const isPortrait = h > w * 0.95;
  if (shouldHideMapForIntro(compare)) {
    drawRaceIntro(scene, g, compare, contentX, contentY, contentW, contentH, pulse, lang);
    return;
  }
  if (isPortrait) {
    const panelH = (contentH - gap) / 2;
    drawWorld(scene, g, compare.left, contentX, contentY, contentW, panelH, pulse, lang, false);
    drawWorld(scene, g, compare.right, contentX, contentY + panelH + gap, contentW, panelH, pulse, lang, false);
  } else {
    const panelW = (contentW - gap) / 2;
    drawWorld(scene, g, compare.left, contentX, contentY, panelW, contentH, pulse, lang, false);
    drawWorld(scene, g, compare.right, contentX + panelW + gap, contentY, panelW, contentH, pulse, lang, false);
  }
  drawRaceIntro(scene, g, compare, contentX, contentY, contentW, contentH, pulse, lang);
}

function shouldHideMapForIntro(compare: AlgorithmWorldCompareState) {
  const stage = compare.raceIntro?.stage;
  return stage === "bracket" || stage === "randomizing" || stage === "assembling" || stage === "versus";
}
