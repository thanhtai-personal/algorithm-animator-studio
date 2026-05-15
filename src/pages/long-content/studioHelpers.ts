import type { AlgoDef, Frame } from "@/lib/algorithms";
import { audioEngine } from "@/lib/audio";
import type { AnimalColumnSettings } from "@/lib/animalColumns";
import type { Lang } from "@/lib/i18n";
import type { LongContentScene } from "@/lib/longContentTimeline";
import { getSceneAtTime, getTotalDuration } from "@/lib/longContentTimeline";
import { renderLongContentFrame } from "@/lib/longContentRenderer";
import type { Theme } from "@/lib/renderer";

type VoiceProvider = "browser" | "piper" | "elevenlabs";
export type ScriptSceneField = "title" | "subtitle" | "narration" | "bulletsText" | "dataSetText";
export type ScriptSceneOverride = Partial<Record<ScriptSceneField, string>>;

export function applyScriptOverrides(scenes: LongContentScene[], overrides: Record<string, ScriptSceneOverride>) {
  return scenes.map((scene) => {
    const override = overrides[scene.id];
    if (!override) return scene;
    const bullets = override.bulletsText === undefined
      ? scene.bullets
      : override.bulletsText.split("\n").map((line) => line.trim()).filter(Boolean);
    const dataSet = override.dataSetText === undefined ? scene.dataSet : parseDataSetText(override.dataSetText);
    return { ...scene, title: override.title ?? scene.title, subtitle: override.subtitle ?? scene.subtitle, narration: override.narration ?? scene.narration, bullets, dataSet };
  });
}

export function getLoadedVoiceDuration() {
  const duration = audioEngine.voiceEl?.duration;
  return Number.isFinite(duration) && duration > 0 ? duration : 0;
}

export function buildSceneFrames(scenes: LongContentScene[], algo: AlgoDef) {
  if (algo.category !== "sort") return {};
  return scenes.reduce<Record<string, Frame[]>>((acc, scene) => {
    if (scene.dataSet?.length) acc[scene.id] = algo.run(scene.dataSet, {});
    return acc;
  }, {});
}

export function buildVoiceScriptKey(parts: { provider: VoiceProvider; algoId: string; lang: Lang; modelKey: string; elevenModelId: string; elevenVoiceId: string; rate: number; script: string }) {
  return [parts.provider, parts.algoId, parts.lang, parts.modelKey, parts.elevenModelId, parts.elevenVoiceId, parts.rate.toFixed(2), parts.script].join("::");
}

export function speakNarration(text: string, lang: Lang, rate: number, volume: number) {
  const synth = window.speechSynthesis;
  if (!synth || !text.trim()) return;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === "vi" ? "vi-VN" : "en-US";
  utterance.rate = clampNumber(rate, 0.6, 1.3);
  utterance.volume = clampNumber(volume, 0, 1);
  const voice = synth.getVoices().find((item) => item.lang.toLowerCase().startsWith(lang === "vi" ? "vi" : "en"));
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}

export function cancelNarration() { window.speechSynthesis?.cancel(); }

export function formatTime(totalSeconds: number) {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.floor(safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function clampFrameIndex(progress: number, frameCount: number) {
  if (!frameCount) return 0;
  const safeProgress = Number.isFinite(progress) ? clamp01(progress) : 0;
  return clampNumber(Math.floor(safeProgress * (frameCount - 1)), 0, frameCount - 1);
}

export function clampNumber(value: number, min: number, max: number) {
  return !Number.isFinite(value) ? min : Math.max(min, Math.min(max, value));
}

export function clamp01(value: number) { return clampNumber(value, 0, 1); }

export function drawLongContentFrameAtTime(params: {
  canvas: HTMLCanvasElement | null;
  timeSec: number;
  scenes: LongContentScene[];
  sceneFrames: Record<string, Frame[]>;
  baseFrames: Frame[];
  algoId: string;
  algoName: string;
  code: string;
  theme: Theme;
  showCode: boolean;
  animalColumns: AnimalColumnSettings;
}) {
  const ctx = params.canvas?.getContext("2d");
  if (!params.canvas || !ctx || !params.baseFrames.length) return;
  const totalDuration = getTotalDuration(params.scenes);
  const safeTime = clampNumber(params.timeSec, 0, totalDuration);
  const state = getSceneAtTime(params.scenes, safeTime);
  const localFrames = params.sceneFrames[state.scene.id] ?? params.baseFrames;
  const localFrameIdx = getFrameIndexForTime(params.scenes, totalDuration, safeTime, state.scene.animation, localFrames.length);
  const frame = localFrames[localFrameIdx] ?? localFrames[0];
  const previousFrame = localFrameIdx > 0 ? localFrames[localFrameIdx - 1] ?? null : null;
  if (!frame) return;
  renderLongContentFrame(ctx, {
    frame,
    previousFrame,
    scene: state.scene,
    sceneProgress: state.progress,
    timelineProgress: clamp01(safeTime / Math.max(1, totalDuration)),
    algoId: params.algoId,
    algoName: params.algoName,
    code: params.code,
    theme: params.theme,
    showCode: params.showCode,
    animalColumns: params.animalColumns,
    frameLabel: `Data [${frame.arr.join(", ")}] · Frame ${localFrameIdx + 1}/${localFrames.length} · ${formatTime(safeTime)} / ${formatTime(totalDuration)}`,
  });
}

export function getFrameIndexForTime(scenes: LongContentScene[], totalDuration: number, timeSec: number, sceneAnimation: boolean | undefined, frameCount: number) {
  if (!frameCount) return 0;
  const safeTime = clampNumber(timeSec, 0, totalDuration);
  const state = getSceneAtTime(scenes, safeTime);
  const progress = sceneAnimation ? state.progress : safeTime / Math.max(1, totalDuration);
  return clampFrameIndex(progress, frameCount);
}

function parseDataSetText(value: string) {
  const values = value.split(/[\s,;]+/).map((part) => Number(part.trim())).filter((item) => Number.isFinite(item));
  return values.length ? values : undefined;
}
