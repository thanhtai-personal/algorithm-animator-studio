import type { CourseItemOverride, LyricCue, NoteEvent, RenderQuality, StudioSettings } from "../types";
import { drawRhythmicBackground } from "./backgrounds";
import { drawCourseLongItems, isPlatformCourseItem, overrideForNode } from "./courseItems";
import { activeLyricAt } from "./lyrics";
import { drawLongGapTubes } from "./longGapTube";
import { clamp, collisionStrength, marbleAtTime, mixHex, type MarblePlatform, type MarblePoint } from "./marbleCourse";
import { applyPresetCamera } from "./presetCamera";
import { drawPresetMarble } from "./presetMarbleRenderer";
import { drawPresetTrail } from "./presetTrailRenderer";
import { drawStyledPlatform } from "./platformStyles";

interface DrawFrameArgs {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  timeMs: number;
  events: NoteEvent[];
  platforms: MarblePlatform[];
  cameraX: number;
  cameraY: number;
  durationMs: number;
  settings: StudioSettings;
  beatLabel: string;
  backgroundImage: HTMLImageElement | null;
  lyrics: LyricCue[];
  courseOverrides: CourseItemOverride[];
  selectedNodeIndex: number | null;
  recording: boolean;
  quality: RenderQuality;
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

function firstPlatformAtOrAfter(platforms: MarblePlatform[], timeMs: number) {
  let low = 0;
  let high = platforms.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (platforms[mid].event.timeMs < timeMs) low = mid + 1;
    else high = mid;
  }
  return low;
}

function visiblePlatformRange(platforms: MarblePlatform[], cameraY: number, height: number) {
  const minY = cameraY - 160;
  const maxY = cameraY + height + 180;
  let low = 0;
  let high = platforms.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (platforms[mid].hitY < minY) low = mid + 1;
    else high = mid;
  }
  const start = Math.max(0, low - 2);
  low = start;
  high = platforms.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (platforms[mid].hitY <= maxY) low = mid + 1;
    else high = mid;
  }
  return { start, end: Math.min(platforms.length, low + 2) };
}

function drawParticles(ctx: CanvasRenderingContext2D, platforms: MarblePlatform[], cameraY: number, timeMs: number, settings: StudioSettings) {
  const count = Math.max(0, Math.floor(settings.particleCount * settings.spectralDensity));
  if (!count) return;
  const start = Math.max(0, firstPlatformAtOrAfter(platforms, timeMs - 430) - 1);
  for (let p = start; p < platforms.length; p += 1) {
    const platform = platforms[p];
    const age = timeMs - platform.event.timeMs;
    if (age < 0) break;
    if (age > 430) continue;
    const life = 1 - age / 430;
    const y = platform.hitY - cameraY;
    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + (i / Math.max(1, count - 1) - 0.5) * 2.5;
      const distance = (1 - life) * (26 + (i % 7) * 10);
      ctx.globalAlpha = life * 0.78;
      ctx.fillStyle = platform.color;
      ctx.beginPath();
      ctx.arc(platform.hitX + Math.cos(angle) * distance, y + Math.sin(angle) * distance, 1.5 + life * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawFallbackMarble(ctx: CanvasRenderingContext2D, point: MarblePoint, cameraY: number, pulse: number, settings: StudioSettings) {
  const x = point.x;
  const y = point.y - cameraY;
  const radius = settings.ballSize * (1 + pulse * 0.08);
  const baseColor = settings.ballStyle === "prism" ? point.color : settings.ballBaseColor;
  if (settings.glowAnimation) {
    const glowRadius = radius * (3.4 + pulse * 2.2);
    const glow = ctx.createRadialGradient(x, y, 2, x, y, glowRadius);
    glow.addColorStop(0, `${baseColor}b8`);
    glow.addColorStop(0.42, `${baseColor}38`);
    glow.addColorStop(1, `${point.color}00`);
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, glowRadius, 0, Math.PI * 2); ctx.fill();
  }
  ctx.save();
  ctx.shadowBlur = 18 + pulse * 28;
  ctx.shadowColor = baseColor;
  const sphere = ctx.createRadialGradient(x - radius * 0.32, y - radius * 0.4, radius * 0.08, x, y, radius);
  sphere.addColorStop(0, "#ffffff");
  sphere.addColorStop(0.34, mixHex("#ffffff", baseColor, 0.24));
  sphere.addColorStop(1, mixHex(baseColor, "#050712", 0.35));
  ctx.fillStyle = sphere;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  if (settings.ballStyle === "striped") {
    ctx.strokeStyle = settings.ballStripeColor;
    ctx.lineWidth = Math.max(2, radius * 0.22);
    ctx.beginPath(); ctx.arc(x, y, radius * 0.7, Math.PI * 0.18, Math.PI * 0.94); ctx.stroke();
  }
  ctx.restore();
}

function drawIdleMarble(ctx: CanvasRenderingContext2D, point: MarblePoint, cameraY: number, settings: StudioSettings) {
  const radius = settings.ballSize;
  const x = point.x;
  const y = point.y - cameraY;
  ctx.save();
  ctx.fillStyle = settings.terrainProfile === "tube-board" ? settings.ballBaseColor : point.color;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.72)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
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

function drawLyrics(ctx: CanvasRenderingContext2D, width: number, height: number, timeMs: number, lyrics: LyricCue[], settings: StudioSettings) {
  if (!settings.lyricsEnabled || !lyrics.length) return;
  const { current, next } = activeLyricAt(lyrics, timeMs);
  if (!current) return;
  const baseY = settings.lyricPosition === "top" ? 150 : settings.lyricPosition === "middle" ? height * 0.56 : height - 155;
  const fontSize = settings.lyricFontSize;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
  const lines = wrapLyric(ctx, current.text, width - 112);
  const nextLines = settings.lyricShowNext && next ? wrapLyric(ctx, next.text, width - 150).slice(0, 1) : [];
  const lineHeight = fontSize * 1.18;
  const blockHeight = lines.length * lineHeight + (nextLines.length ? fontSize * 0.9 : 0);
  const top = baseY - blockHeight / 2;
  if (settings.lyricStyle === "boxed") {
    ctx.fillStyle = "rgba(2,4,12,.62)";
    roundedRect(ctx, 42, top - 24, width - 84, blockHeight + 48, 22);
    ctx.fill();
  }
  const progress = clamp((timeMs - current.startMs) / Math.max(1, current.endMs - current.startMs));
  lines.forEach((line, index) => {
    const y = top + index * lineHeight + lineHeight / 2;
    if (settings.lyricStyle === "karaoke") {
      const lineWidth = Math.max(1, ctx.measureText(line).width);
      const gradient = ctx.createLinearGradient(width / 2 - lineWidth / 2, 0, width / 2 + lineWidth / 2, 0);
      const edge = Math.max(0.002, Math.min(0.998, progress));
      gradient.addColorStop(0, settings.lyricAccentColor);
      gradient.addColorStop(edge, settings.lyricAccentColor);
      gradient.addColorStop(Math.min(1, edge + 0.002), settings.lyricColor);
      gradient.addColorStop(1, settings.lyricColor);
      ctx.fillStyle = gradient;
    } else ctx.fillStyle = settings.lyricColor;
    ctx.fillText(line, width / 2, y);
  });
  if (nextLines.length) {
    ctx.globalAlpha = 0.52;
    ctx.font = `600 ${Math.max(18, fontSize * 0.62)}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = settings.lyricColor;
    ctx.fillText(nextLines[0], width / 2, top + lines.length * lineHeight + fontSize * 0.48);
  }
  ctx.restore();
}

function shouldShowPlatform(platform: MarblePlatform, timeMs: number, settings: StudioSettings) {
  if (settings.terrainProfile === "comet") return platform.event.timeMs >= timeMs - 1450 && platform.event.timeMs <= timeMs + 3300;
  if (settings.terrainProfile === "xylophone") return platform.event.timeMs >= timeMs - 1700 && platform.event.timeMs <= timeMs + 3400;
  return true;
}

export function drawRhythmicFrame(args: DrawFrameArgs) {
  const { ctx, width, height, timeMs, events, platforms, cameraX, cameraY, durationMs, settings, beatLabel, backgroundImage, lyrics, courseOverrides, selectedNodeIndex, recording, quality } = args;
  const live = quality === "live";
  const pulse = live && settings.pulseAnimation ? collisionStrength(timeMs, events) * settings.animationSensitivity : 0;
  drawRhythmicBackground(ctx, width, height, settings, pulse, live ? timeMs : 0, backgroundImage);
  ctx.save();
  applyPresetCamera(ctx, settings, width, height);
  ctx.translate(-cameraX, 0);
  if (live) drawLongGapTubes(ctx, platforms, events, cameraY, timeMs, settings, courseOverrides);
  if (live || courseOverrides.length) drawCourseLongItems(ctx, platforms, courseOverrides, cameraY, settings);
  let rendered = 0;
  const maxIdleItems = 42;
  const range = visiblePlatformRange(platforms, cameraY, height);
  for (let platformIndex = range.start; platformIndex < range.end; platformIndex += 1) {
    const platform = platforms[platformIndex];
    if (!shouldShowPlatform(platform, timeMs, settings)) continue;
    const y = platform.y - cameraY;
    if (y < -260 || y > height + 280) continue;
    if (!live && rendered >= maxIdleItems) break;
    const override = overrideForNode(platform.index, courseOverrides);
    if (!override || isPlatformCourseItem(override.style)) {
      drawStyledPlatform(ctx, platform, y, timeMs, settings, override && isPlatformCourseItem(override.style) ? override.style : undefined, quality);
      rendered += 1;
    }
  }
  if (selectedNodeIndex !== null && platforms[selectedNodeIndex]) {
    const selected = platforms[selectedNodeIndex];
    const y = selected.hitY - cameraY;
    if (y > -80 && y < height + 80) {
      ctx.save(); ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(selected.hitX, y, Math.max(22, settings.ballSize + 11), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
  }
  const marble = marbleAtTime(timeMs, events, platforms, settings, courseOverrides);
  if (live) {
    const trailCount = settings.terrainProfile === "comet" ? Math.max(104, Math.floor(settings.trailLength * 2.15)) : Math.max(0, Math.floor(settings.trailLength));
    const trailPoints = Array.from({ length: trailCount }, (_, index) => {
      const i = trailCount - index;
      return { ...marbleAtTime(Math.max(0, timeMs - i * 19), events, platforms, settings, courseOverrides), age: i / Math.max(1, trailCount) };
    });
    if (!drawPresetTrail(ctx, trailPoints, cameraY, settings)) {
      trailPoints.forEach((point) => {
        const alpha = (1 - point.age) * 0.3;
        ctx.globalAlpha = alpha; ctx.fillStyle = point.color;
        ctx.beginPath(); ctx.arc(point.x, point.y - cameraY, Math.max(2, settings.ballSize * (0.18 + alpha * 0.8)), 0, Math.PI * 2); ctx.fill();
      });
    }
    ctx.globalAlpha = 1;
    drawParticles(ctx, platforms, cameraY, timeMs, settings);
    if (!drawPresetMarble(ctx, marble, cameraY, pulse, settings)) drawFallbackMarble(ctx, marble, cameraY, pulse, settings);
  } else drawIdleMarble(ctx, marble, cameraY, settings);
  ctx.restore();
  drawLyrics(ctx, width, height, timeMs, lyrics, settings);

  const progress = clamp(timeMs / Math.max(1, durationMs));
  ctx.textAlign = "center";
  const title = settings.titleText.trim();
  if (title) {
    let titleSize = 20;
    ctx.font = `800 ${titleSize}px Inter, system-ui`;
    while (titleSize > 12 && ctx.measureText(title).width > width - 120) { titleSize -= 1; ctx.font = `800 ${titleSize}px Inter, system-ui`; }
    ctx.fillStyle = "rgba(255,255,255,.82)";
    ctx.fillText(title, width / 2, 58);
  }
  ctx.font = "600 12px Inter, system-ui";
  ctx.fillStyle = "rgba(255,255,255,.38)";
  ctx.fillText(`${events.length} ${beatLabel} · ${(durationMs / 1000).toFixed(1)}s`, width / 2, 82);
  if (!recording) {
    ctx.fillStyle = "rgba(255,255,255,.12)";
    roundedRect(ctx, 76, height - 48, width - 152, 5, 3); ctx.fill();
    ctx.fillStyle = mixHex(settings.prismStart, settings.prismEnd, progress);
    roundedRect(ctx, 76, height - 48, (width - 152) * progress, 5, 3); ctx.fill();
  }
}
