import { DUEL_ATTACKS, sampleDuelPose } from "./choreography";
import { drawFlyingDragon, drawPalmCharge } from "./dragon";

/** Deterministic 640x360 battle scene, inspired by a user-supplied gameplay reference.
 * Characters and dragon effects are procedural; no third-party sprites.
 */
export const DUEL_WIDTH = 640;
export const DUEL_HEIGHT = 360;
export const DUEL_FPS = 30;
export const DUEL_DURATION = 16;
export const DUEL_FRAMES = DUEL_FPS * DUEL_DURATION;

export type DuelOptions = {
  seed: number;
  glow: number;
  showHud: boolean;
};

const TAU = Math.PI * 2;
const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const smooth = (n: number) => { const x = clamp(n); return x * x * (3 - 2 * x); };
const wave = (n: number) => Math.sin(n);
const random = (seed: number) => {
  const value = Math.sin(seed * 129.31 + 78.233) * 43758.5453;
  return value - Math.floor(value);
};

function line(ctx: CanvasRenderingContext2D, x: number, y: number, x2: number, y2: number, color: string, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function background(ctx: CanvasRenderingContext2D, time: number, seed: number) {
  const wall = ctx.createLinearGradient(0, 0, 0, 310);
  wall.addColorStop(0, "#020613");
  wall.addColorStop(0.58, "#031122");
  wall.addColorStop(1, "#051b30");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, 640, 360);
  const haze = ctx.createRadialGradient(45, 198, 10, 220, 180, 390);
  haze.addColorStop(0, "rgba(4,85,142,.3)");
  haze.addColorStop(1, "rgba(2,12,30,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, 640, 305);

  // Circuit-board wall and illuminated diamond-shaped reactor lights.
  for (let i = 0; i < 66; i++) {
    const y = 115 + (i % 17) * 10;
    const x = 20 + ((i * 137) % 600);
    const t = (i % 4) * 18 + 8;
    line(ctx, x, y, x + t, y, "rgba(31,102,155,.13)");
    if (i % 3 === 0) line(ctx, x + t, y, x + t, y + 14, "rgba(31,102,155,.15)");
    circle(ctx, x, y, 0.7, "rgba(39,143,195,.2)");
  }
  for (const x of [54, 223, 389, 560]) {
    const y = 131;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = "rgba(37,136,203,.18)";
    for (let ring = 16; ring < 41; ring += 6) ctx.strokeRect(-ring / 2, -ring / 2, ring, ring);
    ctx.restore();
    const glow = ctx.createRadialGradient(x, y, 1, x, y, 43);
    glow.addColorStop(0, "#30e9ff");
    glow.addColorStop(0.18, "rgba(15,161,246,.64)");
    glow.addColorStop(0.55, "rgba(11,71,156,.14)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 47, y - 47, 94, 94);
    circle(ctx, x, y, 5, "#46ddff");
  }

  for (let i = 0; i < 17; i++) {
    const x = random(seed + i * 14) * 640;
    const y = ((random(seed + i * 17 + 8) * 290 + time * (3 + i % 4)) % 290);
    circle(ctx, x, y, i % 4 === 0 ? 2 : 1, "rgba(38,220,237,.56)");
  }
  ctx.fillStyle = "#010208";
  ctx.fillRect(0, 291, 640, 69);
  line(ctx, 0, 290, 640, 290, "#54a8e9", 1.4);
  line(ctx, 0, 293, 640, 293, "rgba(22,104,192,.36)", 2);
  for (let x = 0; x < 640; x += 19) {
    line(ctx, x, 295, x + 2, 302, "rgba(15,61,100,.24)");
  }
  for (let y = 0; y < 360; y += 4) {
    ctx.fillStyle = "rgba(0,0,8,.055)";
    ctx.fillRect(0, y, 640, 1);
  }
}

function robot(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, palm = 0, tilt = 0) {
  ctx.save();
  ctx.translate(x, y + wave(time * 7) * (1.3 + palm));
  ctx.rotate(tilt);
  circle(ctx, 0, -1, 11 + palm * 2, "rgba(0,182,225,.1)");
  line(ctx, -6, -10, -9, -1, "#fa70a7", 4);
  line(ctx, 6, -10, 9, -1, "#fa70a7", 4);
  line(ctx, -9, -1, -13 - palm * 3, -palm * 5, "#ec84bf", 3);
  line(ctx, 9, -1, 11 + palm * 4, -palm * 4, "#ec84bf", 3);
  rounded(ctx, -9, -25, 18, 17, 3, "#6b94a9");
  rounded(ctx, -13, -38, 26, 18, 3, "#86aab9");

  // Palm strike: draw both articulated arms ahead of the body, not a sword.
  const palmX = 25 + palm * 9;
  const palmY = -34;
  line(ctx, 8, -27, 17, -21 + palm * 3, "#6c95ad", 6);
  line(ctx, 17, -21 + palm * 3, palmX, palmY, "#a4cce1", 5);
  line(ctx, -8, -26, 11 + palm * 2, -18 - palm * 5, "#5989a3", 5);
  line(ctx, 11 + palm * 2, -18 - palm * 5, palmX - 3, palmY + 5, "#a7e2ed", 4);
  circle(ctx, palmX + 1, palmY, 4.2, "#b8f8ec");
  for (let i = 0; i < 3; i++) {
    line(ctx, palmX + 2, palmY - 3 + i * 2.3,
      palmX + 6 + palm * 2, palmY - 4 + i * 2.5, "#edfff3", 1.4);
  }

  rounded(ctx, -10, -35, 20, 12, 2, "#103b59");
  circle(ctx, -4, -29, 2, "#40d5ff");
  circle(ctx, 4, -29, 2, "#40d5ff");
  line(ctx, -11, -37, 11, -37, "#b4eaff", 1.2);
  line(ctx, -10, -18, 10, -18, "#a4f5ff", 1.5);
  circle(ctx, 0, -12, 3, "#29e7ff");
  ctx.restore();
}

function skeleton(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, stagger: number, hp: number) {
  ctx.save();
  ctx.translate(x, y - stagger * 12 + wave(time * 4) * 1.5);
  ctx.rotate(stagger * 0.1);
  ctx.lineCap = "round";
  const bone = "#a9b5d2";
  line(ctx, -1, -39, -5, -19, bone, 4);
  line(ctx, -5, -19, -10, -9, bone, 3);
  line(ctx, -10, -9, -13, -1, bone, 2);
  line(ctx, -5, -19, 5, -8, bone, 3);
  line(ctx, 5, -8, 4, 0, bone, 2);
  line(ctx, -4, -36, 10, -25, bone, 3);
  line(ctx, 10, -25, 16, -12, bone, 2);
  line(ctx, -4, -34, -12, -22, bone, 3);
  line(ctx, -12, -22, -8, -13, bone, 2);
  for (let i = 0; i < 4; i++) line(ctx, -6, -33 + i * 3, 4, -33 + i * 3, "#bcc7df", 1);
  rounded(ctx, -13, -59, 26, 21, 9, "#a7b4d0");
  circle(ctx, -5, -48, 3.2, "#0b1226");
  circle(ctx, 6, -48, 3.2, "#e34283");
  line(ctx, -3, -41, 6, -41, "#101b31", 1.2);
  for (let i = 0; i < 3; i++) line(ctx, i * 3 - 2, -43, i * 3 - 2, -39, "#293448");
  ctx.restore();
  ctx.fillStyle = "rgba(0,0,0,.8)";
  ctx.fillRect(x - 18, y - 71 - stagger * 12, 36, 4);
  ctx.fillStyle = "#fd5474";
  ctx.fillRect(x - 18, y - 71 - stagger * 12, Math.max(0, 36 * hp), 2);
  ctx.fillStyle = "#e9d992";
  ctx.fillRect(x - 18, y - 71 - stagger * 12, 36, 1);
}

/** Only the compact bottom-left status and top-right hit count remain.
 * The minimap and bottom-right hotkey/timer frame are intentionally removed.
 */
function interfaceHud(ctx: CanvasRenderingContext2D, hits: number) {
  ctx.save();
  ctx.textBaseline = "middle";
  rounded(ctx, 0, 301, 169, 59, 0, "rgba(1,3,16,.78)");
  ctx.fillStyle = "#d5e7ff";
  ctx.font = "8px monospace";
  ctx.fillText("ROBOT  /  POWER", 9, 313);
  ctx.fillStyle = "#20364b";
  ctx.fillRect(8, 329, 141, 8);
  const bar = ctx.createLinearGradient(8, 0, 150, 0);
  bar.addColorStop(0, "#36d5eb");
  bar.addColorStop(1, "#c7fff0");
  ctx.fillStyle = bar;
  ctx.fillRect(8, 329, 126, 8);
  ctx.fillStyle = "#dafaff";
  ctx.fillText("500/500", 105, 347);
  if (hits > 0) {
    ctx.textAlign = "right";
    ctx.fillStyle = "#f4c17e";
    ctx.shadowColor = "#ff821d";
    ctx.shadowBlur = 5;
    ctx.font = "bold 31px Georgia";
    ctx.fillText(String(hits), 605, 62);
    ctx.shadowBlur = 0;
    ctx.font = "italic bold 17px sans-serif";
    ctx.fillStyle = "#eef5ff";
    ctx.fillText("HIT", 629, 79);
  }
  ctx.restore();
}

/** Deterministic frame renderer shared by preview and exported MediaRecorder frames. */
export function drawDuelScene(ctx: CanvasRenderingContext2D, time: number, options: DuelOptions): void {
  const t = clamp(time, 0, DUEL_DURATION);
  const seed = Number.isFinite(options.seed) ? options.seed : 42;
  const pose = sampleDuelPose(t);
  const shake = pose.impact * 3.5;
  const enemyHp = Math.max(.06, 1 - pose.hits / (DUEL_ATTACKS.length + 1));
  ctx.save();
  ctx.clearRect(0, 0, DUEL_WIDTH, DUEL_HEIGHT);
  ctx.translate(wave(t * 81) * shake, wave(t * 57) * shake * .66);
  background(ctx, t, seed);

  // Charge, extend both hands and project the dragon at the skeleton.
  robot(ctx, pose.heroX, pose.heroY, t, pose.heroAttack, pose.heroTilt);
  drawPalmCharge(ctx, pose, t, options.glow);
  skeleton(ctx, pose.enemyX, pose.enemyY, t, pose.enemyStagger, enemyHp);
  drawFlyingDragon(ctx, pose, t, options.glow, seed);

  if (pose.impact > .05) {
    const x = pose.enemyX;
    const y = pose.enemyY - 41;
    const radius = 90 * Math.sqrt(pose.impact);
    const flash = ctx.createRadialGradient(x, y, 0, x, y, radius);
    flash.addColorStop(0, "rgba(231,248,255,.76)");
    flash.addColorStop(.21, "rgba(62,212,255,.43)");
    flash.addColorStop(1, "rgba(0,101,211,0)");
    ctx.fillStyle = flash;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    for (let i = 0; i < 42; i++) {
      const angle = random(seed + i * 29) * TAU;
      const spread = (1 - pose.impact) * 65 + random(seed + i * 47) * 19;
      const sx = x + Math.cos(angle) * spread;
      const sy = y + Math.sin(angle) * spread * .75;
      line(ctx, sx, sy, sx + Math.cos(angle) * 8,
        sy + Math.sin(angle) * 8, i % 3 ? "#bdfaff" : "#ffe3b9", 1);
    }
  }
  ctx.restore();

  // Both rejected UI frames are absent regardless of the HUD toggle.
  if (options.showHud) interfaceHud(ctx, pose.hits);
  if (t > 15.25) {
    ctx.fillStyle = "rgba(0,0,6," + String(smooth((t - 15.25) / .75) * .93) + ")";
    ctx.fillRect(0, 0, DUEL_WIDTH, DUEL_HEIGHT);
    ctx.font = "small-caps 19px Georgia";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(191,221,249," + String(smooth((t - 15.4) / .4)) + ")";
    ctx.fillText("DRAGON STRIKE", 320, 174);
  }
}
