import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { NoteEvent, StudioSettings } from '../types';
import { timelineDuration } from '../lib/timeline';

interface Point { x: number; y: number; angle: number; color: string }

interface Props {
  events: NoteEvent[];
  settings: StudioSettings;
  playing: boolean;
  playbackToken: number;
  onNote: (event: NoteEvent) => void;
  onTime: (timeMs: number) => void;
  onEnded: () => void;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
}

const WIDTH = 720;
const HEIGHT = 1280;
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  const parsed = Number.parseInt(value, 16);
  return { r: (parsed >> 16) & 255, g: (parsed >> 8) & 255, b: parsed & 255 };
}
function mixHex(a: string, b: string, t: number) {
  const aa = hexToRgb(a); const bb = hexToRgb(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${c(aa.r, bb.r)}${c(aa.g, bb.g)}${c(aa.b, bb.b)}`;
}
function clamp(value: number, min = 0, max = 1) { return Math.min(max, Math.max(min, value)); }
function ease(value: number, mode: StudioSettings['accelerationMode'], factor: number, rate: number) {
  const t = clamp(value);
  if (mode === 'ease-in') return Math.pow(t, Math.max(0.35, rate)) * factor / Math.max(1, factor);
  if (mode === 'ease-out') return 1 - Math.pow(1 - t, Math.max(0.35, rate));
  if (mode === 'pulse') return clamp(t + Math.sin(t * Math.PI) * 0.08 * factor);
  return t;
}

function createImpactPoints(events: NoteEvent[], settings: StudioSettings): Point[] {
  if (!events.length) return [];
  const minMidi = Math.min(...events.map((item) => item.midi));
  const maxMidi = Math.max(...events.map((item) => item.midi));
  const radius = Math.min(WIDTH, HEIGHT) * 0.5 * settings.shieldRadius * settings.circleSizeMultiplier;
  let previousAngle = -Math.PI / 2;
  return events.map((event, index) => {
    const pitch = maxMidi === minMidi ? 0.5 : (event.midi - minMidi) / (maxMidi - minMidi);
    const desired = -Math.PI / 2 + pitch * Math.PI * 1.75 + index * 1.78;
    const rapid = index > 0 && events[index].timeMs - events[index - 1].timeMs < 260;
    const autoGapBoost = settings.autoSyncGaps && rapid ? 1.55 : 1;
    const minDelta = Math.max(0.22, settings.minBounceDistance / Math.max(80, radius)) * autoGapBoost;
    let angle = desired;
    let delta = Math.atan2(Math.sin(angle - previousAngle), Math.cos(angle - previousAngle));
    if (Math.abs(delta) < minDelta) angle = previousAngle + (delta >= 0 ? minDelta : -minDelta);
    previousAngle = angle;
    return {
      x: CENTER.x + Math.cos(angle) * radius,
      y: CENTER.y + Math.sin(angle) * radius,
      angle,
      color: mixHex(settings.prismStart, settings.prismEnd, pitch),
    };
  });
}

function pointAtTime(timeMs: number, events: NoteEvent[], points: Point[], settings: StudioSettings): Point {
  if (!events.length || !points.length) return { ...CENTER, angle: 0, color: settings.prismStart };
  if (timeMs <= events[0].timeMs) {
    const duration = Math.max(180, events[0].timeMs || 600);
    const t = ease(clamp(timeMs / duration), settings.accelerationMode, settings.accelerationFactor, settings.accelerationRate);
    return { x: CENTER.x + (points[0].x - CENTER.x) * t, y: CENTER.y + (points[0].y - CENTER.y) * t, angle: points[0].angle, color: points[0].color };
  }
  let index = events.length - 1;
  for (let i = 0; i < events.length - 1; i += 1) {
    if (timeMs >= events[i].timeMs && timeMs <= events[i + 1].timeMs) { index = i; break; }
  }
  if (index >= events.length - 1) return points[points.length - 1];
  const start = points[index]; const end = points[index + 1];
  const span = Math.max(1, events[index + 1].timeMs - events[index].timeMs);
  let t = (timeMs - events[index].timeMs) / span;
  if (settings.decoupleBallSpeed) {
    const boundedFactor = clamp(settings.accelerationFactor, settings.minSpeedCap, settings.maxSpeedCap);
    t = ease(t, settings.accelerationMode, boundedFactor, settings.accelerationRate);
  } else {
    t = clamp(t);
  }
  const mx = (start.x + end.x) / 2; const my = (start.y + end.y) / 2;
  const dx = end.x - start.x; const dy = end.y - start.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const sign = index % 2 === 0 ? 1 : -1;
  const curve = settings.curveIntensity * settings.curvePathLength * Math.min(220, length * 0.72) * sign;
  const cx = mx - (dy / length) * curve; const cy = my + (dx / length) * curve;
  const inv = 1 - t;
  return {
    x: inv * inv * start.x + 2 * inv * t * cx + t * t * end.x,
    y: inv * inv * start.y + 2 * inv * t * cy + t * t * end.y,
    angle: start.angle + (end.angle - start.angle) * t,
    color: mixHex(start.color, end.color, t),
  };
}

function collisionPulse(timeMs: number, events: NoteEvent[]) {
  let nearest = Infinity;
  for (const event of events) nearest = Math.min(nearest, Math.abs(timeMs - event.timeMs));
  return clamp(1 - nearest / 150);
}

function drawFrame(ctx: CanvasRenderingContext2D, timeMs: number, events: NoteEvent[], points: Point[], settings: StudioSettings) {
  const duration = timelineDuration(events);
  const progress = clamp(timeMs / duration);
  const pulse = settings.pulseAnimation ? collisionPulse(timeMs, events) * settings.animationSensitivity : 0;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  const bg = ctx.createRadialGradient(CENTER.x, CENTER.y, 10, CENTER.x, CENTER.y, 680);
  bg.addColorStop(0, mixHex(settings.backgroundColor, settings.prismStart, 0.08 + pulse * 0.05));
  bg.addColorStop(1, settings.backgroundColor);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.translate(CENTER.x, CENTER.y);
  for (let i = 1; i <= 5; i += 1) {
    const baseRadius = 58 + i * 50 * settings.circleSizeMultiplier;
    const ringPulse = pulse * settings.ringPulseSensitivity * (i / 5) * 9;
    ctx.beginPath(); ctx.arc(0, 0, baseRadius + ringPulse, 0, Math.PI * 2);
    const shell = hexToRgb(settings.shellColor);
    ctx.strokeStyle = `rgba(${shell.r},${shell.g},${shell.b},${0.045 + i * 0.01})`;
    ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();

  if (settings.shieldEnabled) {
    const radius = Math.min(WIDTH, HEIGHT) * 0.5 * settings.shieldRadius * settings.circleSizeMultiplier + pulse * 8;
    const segments = 84;
    const destroyed = Math.floor(progress * segments);
    ctx.save(); ctx.translate(CENTER.x, CENTER.y); ctx.lineCap = 'round';
    for (let i = 0; i < segments; i += 1) {
      let visible = true;
      if (settings.shieldDestroyMode === 'sweep') visible = i >= destroyed;
      else if (settings.shieldDestroyMode === 'segment') visible = ((i * 17) % segments) >= destroyed;
      else visible = (i % 4 !== 0) || i >= destroyed;
      if (!visible) continue;
      const start = (i / segments) * Math.PI * 2 - Math.PI / 2;
      const end = ((i + 0.62) / segments) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath(); ctx.arc(0, 0, radius, start, end);
      ctx.strokeStyle = mixHex(settings.prismStart, settings.prismEnd, i / segments);
      ctx.globalAlpha = 0.65 + pulse * 0.3; ctx.lineWidth = 7; ctx.stroke();
    }
    ctx.restore();
  }

  const trailSamples = Math.max(0, Math.floor(settings.trailLength));
  for (let i = trailSamples; i >= 1; i -= 1) {
    const p = pointAtTime(Math.max(0, timeMs - i * 18), events, points, settings);
    const alpha = (1 - i / (trailSamples + 1)) * 0.24;
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(2, settings.ballSize * (0.25 + alpha)), 0, Math.PI * 2);
    ctx.fillStyle = p.color; ctx.globalAlpha = alpha; ctx.fill();
  }
  ctx.globalAlpha = 1;

  const ball = pointAtTime(timeMs, events, points, settings);
  if (settings.glowAnimation) {
    const glow = ctx.createRadialGradient(ball.x, ball.y, 2, ball.x, ball.y, settings.ballSize * (3 + pulse * 2));
    glow.addColorStop(0, `${ball.color}aa`); glow.addColorStop(1, `${ball.color}00`);
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(ball.x, ball.y, settings.ballSize * (3 + pulse * 2), 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 24 + pulse * 26; ctx.shadowColor = ball.color;
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, settings.ballSize * (1 + pulse * 0.08), 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  for (let i = Math.max(0, events.length - 120); i < events.length; i += 1) {
    const age = timeMs - events[i].timeMs;
    if (age < 0 || age > 420 || !points[i]) continue;
    const p = points[i]; const life = 1 - age / 420;
    const count = Math.max(0, Math.floor(settings.particleCount * settings.spectralDensity));
    for (let n = 0; n < count; n += 1) {
      const angle = p.angle + ((n / Math.max(1, count)) - 0.5) * 1.8;
      const distance = (1 - life) * (20 + (n % 6) * 8);
      ctx.globalAlpha = life * 0.7;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x + Math.cos(angle) * distance, p.y + Math.sin(angle) * distance, 1.5 + life * 2, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = 'rgba(255,255,255,.76)'; ctx.font = '600 19px Inter, system-ui'; ctx.textAlign = 'center';
  ctx.fillText('RHYTHMIC MODE', CENTER.x, 62);
  ctx.font = '500 13px Inter, system-ui'; ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.fillText(`${events.length} collisions · ${(duration / 1000).toFixed(1)}s`, CENTER.x, 88);
}

export function RhythmicCanvas({ events, settings, playing, playbackToken, onNote, onTime, onEnded, canvasRef }: Props) {
  const points = useMemo(() => createImpactPoints(events, settings), [events, settings.minBounceDistance, settings.shieldRadius, settings.circleSizeMultiplier, settings.prismStart, settings.prismEnd, settings.autoSyncGaps]);
  const currentTime = useRef(0);
  const nextNoteIndex = useRef(0);
  const frameRef = useRef<number | null>(null);
  const previousToken = useRef(playbackToken);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) drawFrame(ctx, currentTime.current, events, points, settings);
  }, [events, points, settings, canvasRef]);

  useEffect(() => {
    if (previousToken.current !== playbackToken) {
      previousToken.current = playbackToken;
      currentTime.current = 0;
      nextNoteIndex.current = 0;
      onTime(0);
    }
  }, [playbackToken, onTime]);

  useEffect(() => {
    if (!playing) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const start = performance.now() - currentTime.current;
    const duration = timelineDuration(events);
    const loop = (now: number) => {
      const time = now - start;
      currentTime.current = time;
      while (nextNoteIndex.current < events.length && events[nextNoteIndex.current].timeMs <= time) {
        onNote(events[nextNoteIndex.current]);
        nextNoteIndex.current += 1;
      }
      drawFrame(ctx, time, events, points, settings);
      onTime(time);
      if (time >= duration) { onEnded(); return; }
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [playing, playbackToken, events, points, settings, onNote, onTime, onEnded, canvasRef]);

  return <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="block h-auto max-h-[66vh] w-auto max-w-full rounded-xl" />;
}
