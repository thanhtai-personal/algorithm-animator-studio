import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import type { NoteEvent, StudioSettings } from "../types";
import {
  buildMarbleCourse,
  clamp,
  collisionStrength,
  hexToRgb,
  marbleAtTime,
  mixHex,
  type MarblePlatform,
  type MarblePoint,
} from "../lib/marbleCourse";

interface Props {
  events: NoteEvent[];
  settings: StudioSettings;
  durationMs: number;
  playing: boolean;
  playbackToken: number;
  onNote: (event: NoteEvent) => void;
  onTime: (timeMs: number) => void;
  onEnded: () => void;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
}

const WIDTH = 720;
const HEIGHT = 1280;

function drawBackground(ctx: CanvasRenderingContext2D, settings: StudioSettings, pulse: number, timeMs: number) {
  const centerX = WIDTH / 2 + Math.sin(timeMs / 2800) * 46;
  const glow = ctx.createRadialGradient(centerX, HEIGHT * 0.38, 20, WIDTH / 2, HEIGHT * 0.48, HEIGHT * 0.78);
  glow.addColorStop(0, mixHex(settings.backgroundColor, settings.prismStart, 0.12 + pulse * 0.08));
  glow.addColorStop(0.52, mixHex(settings.backgroundColor, settings.prismEnd, 0.035));
  glow.addColorStop(1, settings.backgroundColor);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.11;
  ctx.strokeStyle = settings.shellColor;
  ctx.lineWidth = 1;
  const drift = (timeMs * 0.012) % 54;
  for (let x = -54; x < WIDTH + 54; x += 54) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
  }
  for (let y = -54 + drift; y < HEIGHT + 54; y += 54) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
  }
  ctx.restore();

  const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, HEIGHT * 0.22, WIDTH / 2, HEIGHT / 2, HEIGHT * 0.72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.58)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawPlatform(ctx: CanvasRenderingContext2D, platform: MarblePlatform, screenY: number, timeMs: number, settings: StudioSettings) {
  const age = timeMs - platform.event.timeMs;
  const impact = age >= 0 && age < 320 ? 1 - age / 320 : 0;
  const alpha = 0.55 + platform.event.velocity * 0.3;
  const rgb = hexToRgb(platform.color);
  const half = platform.width / 2;
  const topGlow = settings.platformGlow * (0.5 + impact * 0.72);

  ctx.save();
  ctx.translate(platform.x, screenY);
  ctx.rotate(platform.tiltRad);
  ctx.shadowColor = platform.color;
  ctx.shadowBlur = 18 + topGlow * 34;
  const body = ctx.createLinearGradient(-half, 0, half, platform.thickness);
  body.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${0.22 + alpha * 0.24})`);
  body.addColorStop(0.5, "rgba(11,16,33,.94)");
  body.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},${0.28 + alpha * 0.28})`);
  roundedRect(ctx, -half, 0, platform.width, platform.thickness, platform.thickness / 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.globalAlpha = 0.65 + impact * 0.35;
  ctx.strokeStyle = platform.color;
  ctx.lineWidth = 2.3 + impact * 2.4;
  ctx.beginPath();
  ctx.moveTo(-half + 12, 1);
  ctx.lineTo(half - 12, 1);
  ctx.stroke();

  ctx.globalAlpha = 0.48 + topGlow * 0.35;
  ctx.fillStyle = platform.color;
  ctx.beginPath(); ctx.arc(-half + 10, platform.thickness / 2, 4 + impact * 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(half - 10, platform.thickness / 2, 4 + impact * 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  if (settings.impactRipple && impact > 0) {
    ctx.save();
    ctx.globalAlpha = impact * 0.42;
    ctx.strokeStyle = platform.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(platform.x, screenY + 4, platform.width * (0.22 + (1 - impact) * 0.35), 10 + (1 - impact) * 24, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (settings.showBeatLabels) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,.42)";
    ctx.font = "600 12px Inter, system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`#${platform.index + 1}`, platform.x, screenY + platform.thickness + 24);
    ctx.restore();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, platforms: MarblePlatform[], cameraY: number, timeMs: number, settings: StudioSettings) {
  const count = Math.max(0, Math.floor(settings.particleCount * settings.spectralDensity));
  if (!count) return;
  for (const platform of platforms) {
    const age = timeMs - platform.event.timeMs;
    if (age < 0 || age > 430) continue;
    const life = 1 - age / 430;
    const y = platform.y - cameraY;
    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + (i / Math.max(1, count - 1) - 0.5) * 2.5;
      const speed = 26 + (i % 7) * 10;
      const distance = (1 - life) * speed;
      ctx.globalAlpha = life * 0.78;
      ctx.fillStyle = platform.color;
      ctx.beginPath();
      ctx.arc(platform.x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, 1.5 + life * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawMarble(ctx: CanvasRenderingContext2D, point: MarblePoint, cameraY: number, pulse: number, settings: StudioSettings) {
  const x = point.x;
  const y = point.y - cameraY;
  const radius = settings.ballSize * (1 + pulse * 0.08);
  if (settings.glowAnimation) {
    const glowRadius = radius * (3.6 + pulse * 2.4);
    const glow = ctx.createRadialGradient(x, y, 2, x, y, glowRadius);
    glow.addColorStop(0, `${point.color}b8`);
    glow.addColorStop(0.38, `${point.color}48`);
    glow.addColorStop(1, `${point.color}00`);
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, glowRadius, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 24 + pulse * 34;
  ctx.shadowColor = point.color;
  const marble = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.45, radius * 0.12, x, y, radius);
  marble.addColorStop(0, "#ffffff");
  marble.addColorStop(0.38, mixHex("#ffffff", point.color, 0.22));
  marble.addColorStop(1, mixHex(point.color, "#050712", 0.35));
  ctx.fillStyle = marble;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function drawFrame(ctx: CanvasRenderingContext2D, timeMs: number, events: NoteEvent[], platforms: MarblePlatform[], cameraY: number, durationMs: number, settings: StudioSettings) {
  const pulse = settings.pulseAnimation ? collisionStrength(timeMs, events) * settings.animationSensitivity : 0;
  drawBackground(ctx, settings, pulse, timeMs);
  for (const platform of platforms) {
    const y = platform.y - cameraY;
    if (y < -100 || y > HEIGHT + 120) continue;
    drawPlatform(ctx, platform, y, timeMs, settings);
  }

  const trailCount = Math.max(0, Math.floor(settings.trailLength));
  for (let i = trailCount; i >= 1; i -= 1) {
    const point = marbleAtTime(Math.max(0, timeMs - i * 19), events, platforms, settings);
    const alpha = (1 - i / (trailCount + 1)) * 0.3;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = point.color;
    ctx.beginPath();
    ctx.arc(point.x, point.y - cameraY, Math.max(2, settings.ballSize * (0.18 + alpha * 0.8)), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  drawParticles(ctx, platforms, cameraY, timeMs, settings);
  drawMarble(ctx, marbleAtTime(timeMs, events, platforms, settings), cameraY, pulse, settings);

  const progress = clamp(timeMs / Math.max(1, durationMs));
  ctx.fillStyle = "rgba(255,255,255,.82)";
  ctx.font = "800 20px Inter, system-ui";
  ctx.textAlign = "center";
  ctx.fillText("MARBLE MUSIC", WIDTH / 2, 58);
  ctx.font = "600 12px Inter, system-ui";
  ctx.fillStyle = "rgba(255,255,255,.38)";
  ctx.fillText(`${events.length} beats · ${(durationMs / 1000).toFixed(1)}s`, WIDTH / 2, 82);
  ctx.fillStyle = "rgba(255,255,255,.12)";
  roundedRect(ctx, 76, HEIGHT - 48, WIDTH - 152, 5, 3); ctx.fill();
  ctx.fillStyle = mixHex(settings.prismStart, settings.prismEnd, progress);
  roundedRect(ctx, 76, HEIGHT - 48, (WIDTH - 152) * progress, 5, 3); ctx.fill();
}

export function RhythmicCanvas({ events, settings, durationMs, playing, playbackToken, onNote, onTime, onEnded, canvasRef }: Props) {
  const platforms = useMemo(
    () => buildMarbleCourse(events, settings, WIDTH),
    [events, settings.platformGap, settings.platformWidth, settings.platformThickness, settings.platformTilt, settings.laneSpread, settings.minBounceDistance, settings.prismStart, settings.prismEnd, settings.autoSyncGaps],
  );
  const currentTime = useRef(0);
  const nextNoteIndex = useRef(0);
  const cameraY = useRef(0);
  const frameRef = useRef<number | null>(null);
  const previousToken = useRef(playbackToken);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const point = marbleAtTime(currentTime.current, events, platforms, settings);
    cameraY.current = point.y - HEIGHT * settings.cameraAnchor;
    drawFrame(ctx, currentTime.current, events, platforms, cameraY.current, durationMs, settings);
  }, [canvasRef, durationMs, events, platforms, settings]);

  useEffect(() => {
    if (previousToken.current === playbackToken) return;
    previousToken.current = playbackToken;
    currentTime.current = 0;
    nextNoteIndex.current = 0;
    const point = marbleAtTime(0, events, platforms, settings);
    cameraY.current = point.y - HEIGHT * settings.cameraAnchor;
    onTime(0);
  }, [events, onTime, playbackToken, platforms, settings]);

  useEffect(() => {
    if (!playing) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const start = performance.now() - currentTime.current;
    const loop = (now: number) => {
      const time = now - start;
      currentTime.current = time;
      while (nextNoteIndex.current < events.length && events[nextNoteIndex.current].timeMs <= time) {
        onNote(events[nextNoteIndex.current]);
        nextNoteIndex.current += 1;
      }
      const marble = marbleAtTime(time, events, platforms, settings);
      const targetCamera = marble.y - HEIGHT * settings.cameraAnchor;
      cameraY.current += (targetCamera - cameraY.current) * clamp(settings.cameraSmoothing, 0.03, 1);
      drawFrame(ctx, time, events, platforms, cameraY.current, durationMs, settings);
      onTime(time);
      if (time >= durationMs) { onEnded(); return; }
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [canvasRef, durationMs, events, onEnded, onNote, onTime, platforms, playing, playbackToken, settings]);

  return <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="block h-auto max-h-[66vh] w-auto max-w-full rounded-xl" />;
}
