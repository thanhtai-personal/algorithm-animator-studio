import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { useSystemLang } from "@/hooks/use-system-lang";
import { rhythmicText } from "../i18n";
import type { CourseItemOverride, LyricCue, NoteEvent, StudioSettings } from "../types";
import { buildPresetMixPlan, createPresetMixSettingsResolver } from "../lib/presetMix";
import { buildMarbleCourse, clamp, marbleAtTime } from "../lib/marbleCourse";
import { presetCameraAnchorX, unprojectPresetCamera } from "../lib/presetCamera";
import { drawRhythmicFrame } from "../lib/rhythmicFrameRenderer";

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
  courseOverrides: CourseItemOverride[];
  selectedNodeIndex: number | null;
  onSelectNode: (index: number | null) => void;
  recording: boolean;
  targetFps: number;
  onNote: (event: NoteEvent, index?: number) => void;
  onTime: (timeMs: number) => void;
  onEnded: () => void;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  presetMixEnabled: boolean;
  presetMixSeed: number;
}

const WIDTH = 720;
const HEIGHT = 1280;
const PREVIEW_FPS = 45;

function contextFor(canvas: HTMLCanvasElement | null) {
  const ctx = canvas?.getContext("2d", { alpha: false }) ?? null;
  if (ctx) ctx.imageSmoothingQuality = "medium";
  return ctx;
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

export function RhythmicCanvas({ events, settings, durationMs, playing, playbackToken, playbackStartMs, playbackEndMs, backgroundUrl, lyrics, courseOverrides, selectedNodeIndex, onSelectNode, recording, targetFps, onNote, onTime, onEnded, canvasRef, presetMixEnabled, presetMixSeed }: Props) {
  const lang = useSystemLang();
  const beatLabel = rhythmicText(lang, "canvas.beats");
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const mixPlan = useMemo(() => buildPresetMixPlan(events, presetMixEnabled, presetMixSeed), [events, presetMixEnabled, presetMixSeed]);
  const resolveSettings = useMemo(() => createPresetMixSettingsResolver(settings, mixPlan), [mixPlan, settings]);
  const platforms = useMemo(
    () => buildMarbleCourse(events, settings, WIDTH, resolveSettings),
    [events, resolveSettings, settings],
  );
  const currentTime = useRef(0);
  const nextNoteIndex = useRef(0);
  const cameraX = useRef(0);
  const cameraY = useRef(0);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRenderAt = useRef(0);
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
    const ctx = contextFor(canvasRef.current);
    if (!ctx) return;
    const point = marbleAtTime(currentTime.current, events, platforms, settings, courseOverrides, resolveSettings);
    const frameSettings = resolveSettings(point.platformIndex);
    cameraX.current = point.x - WIDTH * presetCameraAnchorX(frameSettings);
    cameraY.current = point.y - HEIGHT * frameSettings.cameraAnchor;
    const frame = requestAnimationFrame(() => drawRhythmicFrame({
      ctx, width: WIDTH, height: HEIGHT, timeMs: currentTime.current, events, platforms,
      cameraX: cameraX.current, cameraY: cameraY.current, durationMs, settings: frameSettings, beatLabel,
      backgroundImage, lyrics, courseOverrides, selectedNodeIndex, recording, quality: "idle",
    }));
    return () => cancelAnimationFrame(frame);
  }, [backgroundImage, beatLabel, canvasRef, courseOverrides, durationMs, events, lyrics, platforms, recording, resolveSettings, selectedNodeIndex, settings]);

  useEffect(() => {
    if (previousToken.current === playbackToken) return;
    previousToken.current = playbackToken;
    currentTime.current = playbackStartMs;
    nextNoteIndex.current = firstEventAtOrAfter(events, playbackStartMs);
    const point = marbleAtTime(playbackStartMs, events, platforms, settings, courseOverrides, resolveSettings);
    const frameSettings = resolveSettings(point.platformIndex);
    cameraX.current = point.x - WIDTH * presetCameraAnchorX(frameSettings);
    cameraY.current = point.y - HEIGHT * frameSettings.cameraAnchor;
    onTime(playbackStartMs);
  }, [courseOverrides, events, onTime, playbackStartMs, playbackToken, platforms, resolveSettings, settings]);

  useEffect(() => {
    const cancelScheduled = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      frameRef.current = null;
      timerRef.current = null;
    };
    if (!playing) { cancelScheduled(); return; }
    const ctx = contextFor(canvasRef.current);
    if (!ctx) return;
    const start = performance.now() - currentTime.current;
    lastRenderAt.current = 0;
    const scheduleNext = (loop: (now: number) => void) => {
      if (recording) timerRef.current = setTimeout(() => loop(performance.now()), 1000 / Math.max(1, targetFps));
      else frameRef.current = requestAnimationFrame(loop);
    };
    const loop = (now: number) => {
      if (!recording && document.visibilityState !== "visible") { scheduleNext(loop); return; }
      const frameDeltaMs = lastRenderAt.current > 0 ? now - lastRenderAt.current : 1000 / PREVIEW_FPS;
      if (!recording && frameDeltaMs < 1000 / PREVIEW_FPS - 0.5) { scheduleNext(loop); return; }
      lastRenderAt.current = now;
      const time = now - start;
      currentTime.current = time;
      while (nextNoteIndex.current < events.length && events[nextNoteIndex.current].timeMs <= time) {
        onNote(events[nextNoteIndex.current], nextNoteIndex.current);
        nextNoteIndex.current += 1;
      }
      const marble = marbleAtTime(time, events, platforms, settings, courseOverrides, resolveSettings);
      const frameSettings = resolveSettings(marble.platformIndex);
      const targetCameraX = marble.x - WIDTH * presetCameraAnchorX(frameSettings);
      const targetCameraY = marble.y - HEIGHT * frameSettings.cameraAnchor;
      // Treat cameraSmoothing as a 60fps response value, then normalize it for
      // the actual frame duration. This removes the slow/floaty camera at 30-45fps.
      const baseCameraEase = clamp(frameSettings.cameraSmoothing, 0.03, 1);
      const frameScale = clamp(frameDeltaMs / (1000 / 60), 0.5, 3);
      const cameraEase = 1 - Math.pow(1 - baseCameraEase, frameScale);
      cameraX.current += (targetCameraX - cameraX.current) * cameraEase;
      cameraY.current += (targetCameraY - cameraY.current) * cameraEase;
      drawRhythmicFrame({
        ctx, width: WIDTH, height: HEIGHT, timeMs: time, events, platforms,
        cameraX: cameraX.current, cameraY: cameraY.current, durationMs, settings: frameSettings, beatLabel,
        backgroundImage, lyrics, courseOverrides, selectedNodeIndex, recording, quality: "live",
      });
      if (now - lastUiUpdate.current >= 64) { lastUiUpdate.current = now; onTime(time); }
      if (time >= playbackEndMs) { onTime(playbackEndMs); onEnded(); return; }
      scheduleNext(loop);
    };
    scheduleNext(loop);
    return cancelScheduled;
  }, [backgroundImage, beatLabel, canvasRef, courseOverrides, durationMs, events, lyrics, onEnded, onNote, onTime, playbackEndMs, platforms, playing, playbackToken, recording, resolveSettings, selectedNodeIndex, settings, targetFps]);

  const selectAtPointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = (clientX - rect.left) * WIDTH / rect.width;
    const screenY = (clientY - rect.top) * HEIGHT / rect.height;
    const currentPoint = marbleAtTime(currentTime.current, events, platforms, settings, courseOverrides, resolveSettings);
    const frameSettings = resolveSettings(currentPoint.platformIndex);
    const projected = unprojectPresetCamera({ x: screenX, y: screenY }, frameSettings, WIDTH, HEIGHT);
    const x = projected.x + cameraX.current;
    const worldY = projected.y + cameraY.current;
    let bestIndex: number | null = null;
    let bestScore = Infinity;
    for (const platform of platforms) {
      const dx = Math.abs(platform.hitX - x) / Math.max(30, frameSettings.ballSize * 2.8);
      const dy = Math.abs(platform.hitY - worldY) / Math.max(38, frameSettings.ballSize * 3.4);
      const score = dx * dx + dy * dy;
      if (score < bestScore && score < 1.35) { bestScore = score; bestIndex = platform.index; }
    }
    onSelectNode(bestIndex);
  };

  return <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} onClick={(event) => selectAtPointer(event.clientX, event.clientY)} className="block h-auto max-h-[66vh] w-auto max-w-full cursor-crosshair rounded-xl" />;
}
