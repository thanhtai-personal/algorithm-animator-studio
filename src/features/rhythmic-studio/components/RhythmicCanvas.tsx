import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { useSystemLang } from "@/hooks/use-system-lang";
import { rhythmicText } from "../i18n";
import type { LyricCue, NoteEvent, StudioSettings } from "../types";
import {
  buildMarbleCourse,
  clamp,
  collisionStrength,
  marbleAtTime,
  mixHex,
  type MarblePlatform,
  type MarblePoint,
} from "../lib/marbleCourse";
import { drawStyledPlatform } from "../lib/platformStyles";
import { drawLongGapTubes } from "../lib/longGapTube";
import { drawRhythmicBackground } from "../lib/backgrounds";
import { activeLyricAt } from "../lib/lyrics";

interface Props {
  events: NoteEvent[];
  settings: StudioSettings;
  durationMs: number;
  playing: boolean;
  playbackToken: number;
  playbackStartMs: number;
  playbackEndMs: number;
  backgroundUrl: string | null;
  lyrics: LyricCue[];
  recording: boolean;
  targetFps: number;
  onNote: (event: NoteEvent) => void;
  onTime: (timeMs: number) => void;
  onEnded: () => void;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
}

const WIDTH = 720;
const HEIGHT = 1280;

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
    const glowRadius = radius * (3.4 + pulse * 2.2);
    const glow = ctx.createRadialGradient(x, y, 2, x, y, glowRadius);
    glow.addColorStop(0, `${point.color}b8`);
    glow.addColorStop(0.42, `${point.color}38`);
    glow.addColorStop(1, `${point.color}00`);
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, glowRadius, 0, Math.PI * 2); ctx.fill();
  }
  ctx.save();
  ctx.shadowBlur = 24 + pulse * 34;
  ctx.shadowColor = point.color;
  if (settings.ballStyle === "chrome") {
    const g = ctx.createRadialGradient(x - radius * 0.5, y - radius * 0.6, radius * 0.12, x, y, radius);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.18, '#dfe6ef'); g.addColorStop(0.42, point.color); g.addColorStop(1, '#111827');
    ctx.fillStyle = g;
  } else if (settings.ballStyle === "glass") {
    const g = ctx.createRadialGradient(x - radius * 0.25, y - radius * 0.35, radius * 0.08, x, y, radius);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.32, 'rgba(255,255,255,.68)'); g.addColorStop(1, mixHex(point.color, '#040814', 0.16));
    ctx.fillStyle = g;
  } else if (settings.ballStyle === "neon") {
    const g = ctx.createRadialGradient(x, y, 2, x, y, radius);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.28, mixHex('#ffffff', point.color, 0.14)); g.addColorStop(1, mixHex(point.color, '#0a0d18', 0.18));
    ctx.fillStyle = g;
  } else if (settings.ballStyle === "striped") {
    const g = ctx.createRadialGradient(x - radius * 0.25, y - radius * 0.32, radius * 0.06, x, y, radius);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, mixHex(point.color, '#0f172a', 0.24));
    ctx.fillStyle = g;
  } else if (settings.ballStyle === "prism") {
    const g = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
    g.addColorStop(0, settings.prismStart); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, settings.prismEnd);
    ctx.fillStyle = g;
  } else {
    const g = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.45, radius * 0.12, x, y, radius);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.38, mixHex('#ffffff', point.color, 0.22)); g.addColorStop(1, mixHex(point.color, '#050712', 0.35));
    ctx.fillStyle = g;
  }
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  if (settings.ballStyle === 'striped') {
    ctx.strokeStyle = mixHex(settings.prismEnd, '#ffffff', 0.18);
    ctx.lineWidth = Math.max(2, radius * 0.22);
    ctx.beginPath(); ctx.arc(x, y, radius * 0.7, Math.PI * 0.18, Math.PI * 0.94); ctx.stroke();
    ctx.strokeStyle = mixHex(settings.prismStart, '#ffffff', 0.18);
    ctx.beginPath(); ctx.arc(x, y, radius * 0.36, Math.PI * 1.08, Math.PI * 1.88); ctx.stroke();
  }
  if (settings.ballStyle === 'glass') {
    ctx.fillStyle = 'rgba(255,255,255,.26)';
    ctx.beginPath(); ctx.arc(x - radius * 0.32, y - radius * 0.34, radius * 0.24, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,.45)';
  ctx.beginPath(); ctx.arc(x - radius * 0.32, y - radius * 0.36, Math.max(1.8, radius * 0.18), 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}


function wrapLyric(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function drawLyrics(ctx: CanvasRenderingContext2D, timeMs: number, lyrics: LyricCue[], settings: StudioSettings) {
  if (!settings.lyricsEnabled || !lyrics.length) return;
  const { current, next } = activeLyricAt(lyrics, timeMs);
  if (!current) return;
  const baseY = settings.lyricPosition === "top" ? 150 : settings.lyricPosition === "middle" ? HEIGHT * 0.56 : HEIGHT - 155;
  const fontSize = settings.lyricFontSize;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
  const lines = wrapLyric(ctx, current.text, WIDTH - 112);
  const nextLines = settings.lyricShowNext && next ? wrapLyric(ctx, next.text, WIDTH - 150).slice(0, 1) : [];
  const lineHeight = fontSize * 1.18;
  const blockHeight = lines.length * lineHeight + (nextLines.length ? fontSize * 0.9 : 0);
  const top = baseY - blockHeight / 2;
  if (settings.lyricStyle === "boxed") {
    ctx.fillStyle = "rgba(2,4,12,.62)";
    roundedRect(ctx, 42, top - 24, WIDTH - 84, blockHeight + 48, 22);
    ctx.fill();
    ctx.strokeStyle = `${settings.lyricAccentColor}66`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.shadowColor = `rgba(0,0,0,${settings.lyricShadow})`;
  ctx.shadowBlur = 14 + settings.lyricShadow * 18;
  const progress = Math.max(0, Math.min(1, (timeMs - current.startMs) / Math.max(1, current.endMs - current.startMs)));
  lines.forEach((line, index) => {
    const y = top + index * lineHeight + lineHeight / 2;
    if (settings.lyricStyle === "karaoke") {
      const width = Math.max(1, ctx.measureText(line).width);
      const gradient = ctx.createLinearGradient(WIDTH / 2 - width / 2, 0, WIDTH / 2 + width / 2, 0);
      const edge = Math.max(0.002, Math.min(0.998, progress));
      gradient.addColorStop(0, settings.lyricAccentColor);
      gradient.addColorStop(edge, settings.lyricAccentColor);
      gradient.addColorStop(Math.min(1, edge + 0.002), settings.lyricColor);
      gradient.addColorStop(1, settings.lyricColor);
      ctx.fillStyle = gradient;
    } else ctx.fillStyle = settings.lyricColor;
    ctx.fillText(line, WIDTH / 2, y);
  });
  if (nextLines.length) {
    ctx.shadowBlur = 8;
    ctx.globalAlpha = 0.52;
    ctx.font = `600 ${Math.max(18, fontSize * 0.62)}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = settings.lyricColor;
    ctx.fillText(nextLines[0], WIDTH / 2, top + lines.length * lineHeight + fontSize * 0.48);
  }
  ctx.restore();
}

function drawFrame(ctx: CanvasRenderingContext2D, timeMs: number, events: NoteEvent[], platforms: MarblePlatform[], cameraY: number, durationMs: number, settings: StudioSettings, beatLabel: string, backgroundImage: HTMLImageElement | null, lyrics: LyricCue[]) {
  const pulse = settings.pulseAnimation ? collisionStrength(timeMs, events) * settings.animationSensitivity : 0;
  drawRhythmicBackground(ctx, WIDTH, HEIGHT, settings, pulse, timeMs, backgroundImage);
  drawLongGapTubes(ctx, platforms, events, cameraY, timeMs, settings);
  for (const platform of platforms) {
    const y = platform.y - cameraY;
    if (y < -100 || y > HEIGHT + 120) continue;
    drawStyledPlatform(ctx, platform, y, timeMs, settings);
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
  drawLyrics(ctx, timeMs, lyrics, settings);

  const progress = clamp(timeMs / Math.max(1, durationMs));
  ctx.fillStyle = "rgba(255,255,255,.82)";
  ctx.font = "800 20px Inter, system-ui";
  ctx.textAlign = "center";
  ctx.fillText("MARBLE MUSIC", WIDTH / 2, 58);
  ctx.font = "600 12px Inter, system-ui";
  ctx.fillStyle = "rgba(255,255,255,.38)";
  ctx.fillText(`${events.length} ${beatLabel} · ${(durationMs / 1000).toFixed(1)}s`, WIDTH / 2, 82);
  ctx.fillStyle = "rgba(255,255,255,.12)";
  roundedRect(ctx, 76, HEIGHT - 48, WIDTH - 152, 5, 3); ctx.fill();
  ctx.fillStyle = mixHex(settings.prismStart, settings.prismEnd, progress);
  roundedRect(ctx, 76, HEIGHT - 48, (WIDTH - 152) * progress, 5, 3); ctx.fill();
}

function firstEventAtOrAfter(events: NoteEvent[], timeMs: number) {
  let low = 0;
  let high = events.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (events[mid].timeMs < timeMs) low = mid + 1;
    else high = mid;
  }
  return low;
}

export function RhythmicCanvas({ events, settings, durationMs, playing, playbackToken, playbackStartMs, playbackEndMs, backgroundUrl, lyrics, recording, targetFps, onNote, onTime, onEnded, canvasRef }: Props) {
  const lang = useSystemLang();
  const beatLabel = rhythmicText(lang, "canvas.beats");
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const platforms = useMemo(
    () => buildMarbleCourse(events, settings, WIDTH),
    [events, settings.platformGap, settings.platformWidth, settings.platformThickness, settings.platformTilt, settings.laneSpread, settings.minBounceDistance, settings.prismStart, settings.prismEnd, settings.autoSyncGaps],
  );
  const currentTime = useRef(0);
  const nextNoteIndex = useRef(0);
  const cameraY = useRef(0);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUiUpdate = useRef(0);
  const previousToken = useRef(playbackToken);

  useEffect(() => {
    if (!backgroundUrl) { setBackgroundImage(null); return; }
    const image = new Image();
    image.onload = () => setBackgroundImage(image);
    image.onerror = () => setBackgroundImage(null);
    image.src = backgroundUrl;
    return () => { image.onload = null; image.onerror = null; };
  }, [backgroundUrl]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const point = marbleAtTime(currentTime.current, events, platforms, settings);
    cameraY.current = point.y - HEIGHT * settings.cameraAnchor;
    drawFrame(ctx, currentTime.current, events, platforms, cameraY.current, durationMs, settings, beatLabel, backgroundImage, lyrics);
  }, [backgroundImage, beatLabel, canvasRef, durationMs, events, lyrics, platforms, settings]);

  useEffect(() => {
    if (previousToken.current === playbackToken) return;
    previousToken.current = playbackToken;
    currentTime.current = playbackStartMs;
    nextNoteIndex.current = firstEventAtOrAfter(events, playbackStartMs);
    const point = marbleAtTime(playbackStartMs, events, platforms, settings);
    cameraY.current = point.y - HEIGHT * settings.cameraAnchor;
    onTime(playbackStartMs);
  }, [events, onTime, playbackStartMs, playbackToken, platforms, settings]);

  useEffect(() => {
    const cancelScheduled = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      frameRef.current = null;
      timerRef.current = null;
    };
    if (!playing) { cancelScheduled(); return; }
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const start = performance.now() - currentTime.current;
    const scheduleNext = (loop: (now: number) => void) => {
      if (recording) timerRef.current = setTimeout(() => loop(performance.now()), 1000 / Math.max(1, targetFps));
      else frameRef.current = requestAnimationFrame(loop);
    };
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
      drawFrame(ctx, time, events, platforms, cameraY.current, durationMs, settings, beatLabel, backgroundImage, lyrics);
      if (now - lastUiUpdate.current >= 64) { lastUiUpdate.current = now; onTime(time); }
      if (time >= playbackEndMs) { onTime(playbackEndMs); onEnded(); return; }
      scheduleNext(loop);
    };
    scheduleNext(loop);
    return cancelScheduled;
  }, [backgroundImage, beatLabel, canvasRef, durationMs, events, lyrics, onEnded, onNote, onTime, playbackEndMs, platforms, playing, playbackToken, recording, settings, targetFps]);

  return <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="block h-auto max-h-[66vh] w-auto max-w-full rounded-xl" />;
}
