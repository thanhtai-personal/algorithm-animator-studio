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
  return ["scene-segmented-v3", parts.provider, parts.algoId, parts.lang, parts.modelKey, parts.elevenModelId, parts.elevenVoiceId, parts.rate.toFixed(2), parts.script].join("::");
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
  const sceneElapsedSec = Math.max(0, safeTime - state.start);
  const sceneIndex = params.scenes.findIndex((scene) => scene.id === state.scene.id);
  const previousScene = sceneIndex > 0 ? params.scenes[sceneIndex - 1] : null;
  const previousSceneWasAnimation = Boolean(previousScene?.animation);
  const localFrames = params.sceneFrames[state.scene.id] ?? params.baseFrames;
  const closingFrames = previousSceneWasAnimation && previousScene
    ? params.sceneFrames[previousScene.id] ?? params.baseFrames
    : [];
  const frameState = getInterpolatedFrameState(state.progress, state.scene.animation, localFrames, state.scene, params.algoId);
  const localFrameIdx = frameState.index;
  const frame = state.scene.animation
    ? frameState.frame
    : closingFrames[closingFrames.length - 1] ?? null;
  renderLongContentFrame(ctx, {
    frame,
    previousFrame: frameState.previousFrame,
    scene: state.scene,
    sceneProgress: state.progress,
    sceneElapsedSec,
    previousSceneWasAnimation,
    timelineProgress: clamp01(safeTime / Math.max(1, totalDuration)),
    algoId: params.algoId,
    algoName: params.algoName,
    code: params.code,
    theme: params.theme,
    showCode: params.showCode,
    animalColumns: params.animalColumns,
    frameTransitionProgress: frameState.transitionProgress,
    frameLabel: state.scene.animation && frame
      ? `Data [${frame.arr.join(", ")}] · Frame ${localFrameIdx + 1}/${localFrames.length} · ${formatTime(safeTime)} / ${formatTime(totalDuration)}`
      : `${state.scene.kindLabel} · ${formatTime(safeTime)} / ${formatTime(totalDuration)}`,
  });
}

function getInterpolatedFrameState(
  progress: number,
  sceneAnimation: boolean | undefined,
  frames: Frame[],
  scene?: LongContentScene,
  algoId?: string,
) {
  if (!sceneAnimation || frames.length <= 1) {
    return { frame: frames[0] ?? null, previousFrame: null, index: 0, transitionProgress: 1 };
  }
  const position = getLectureFramePosition(progress, frames, scene, algoId);
  const previousIndex = Math.floor(position);
  const nextIndex = Math.min(frames.length - 1, Math.ceil(position));
  const transitionProgress = previousIndex === nextIndex ? 1 : position - previousIndex;
  return {
    frame: frames[nextIndex] ?? frames[previousIndex] ?? frames[0] ?? null,
    previousFrame: previousIndex === nextIndex ? null : frames[previousIndex] ?? null,
    index: nextIndex,
    transitionProgress: easeInOutCubic(transitionProgress),
  };
}

function getLectureFramePosition(progress: number, frames: Frame[], scene?: LongContentScene, algoId?: string) {
  if (algoId !== "bubble" || !scene?.animation) return clamp01(progress) * (frames.length - 1);
  if (scene.id === "step-by-step") return getBubbleStepByStepCuePosition(progress, frames);
  if (scene.id === "animation") return getBubblePassWeightedPosition(progress, frames, [0.42, 0.28, 0.18, 0.12]);
  return getWeightedOperationPosition(progress, frames);
}

function getBubbleStepByStepCuePosition(progress: number, frames: Frame[]) {
  const cues = [
    { at: 0, frame: 0 },
    { at: 0.16, frame: findBubbleFrame(frames, 0, 0, "compare") },
    { at: 0.3, frame: findBubbleFrame(frames, 0, 0, "swap") },
    { at: 0.43, frame: findBubbleFrame(frames, 0, 1, "compare") },
    { at: 0.51, frame: findBubbleFrame(frames, 0, 1, "swap") },
    { at: 0.59, frame: findBubbleFrame(frames, 0, 2, "compare") },
    { at: 0.66, frame: findBubbleFrame(frames, 0, 2, "swap") },
    { at: 0.73, frame: findBubbleFrame(frames, 0, 3, "compare") },
    { at: 0.8, frame: findBubblePassEndFrame(frames, 0) },
    { at: 0.88, frame: findBubbleFrame(frames, 1, 1, "compare") },
    { at: 0.94, frame: findBubbleFrame(frames, 1, 1, "swap") },
    { at: 1, frame: frames.length - 1 },
  ].filter((cue) => cue.frame >= 0);

  return getCuePosition(clamp01(progress), cues);
}

function getCuePosition(progress: number, cues: Array<{ at: number; frame: number }>) {
  if (cues.length <= 1) return cues[0]?.frame ?? 0;
  for (let index = 0; index < cues.length - 1; index++) {
    const current = cues[index];
    const next = cues[index + 1];
    if (progress <= next.at) {
      const span = Math.max(0.001, next.at - current.at);
      const local = clamp01((progress - current.at) / span);
      const holdThenMove = local < 0.72 ? 0 : easeInOutCubic((local - 0.72) / 0.28);
      return current.frame + (next.frame - current.frame) * holdThenMove;
    }
  }
  return cues[cues.length - 1].frame;
}

function findBubbleFrame(frames: Frame[], pass: number, j: number, event: Frame["event"]) {
  return frames.findIndex((frame) => frame.vars.i === pass && frame.vars.j === j && frame.event === event);
}

function findBubblePassEndFrame(frames: Frame[], pass: number) {
  return frames.findIndex((frame) => frame.vars.i === pass && frame.sorted.length && !frame.event);
}

function getBubblePassWeightedPosition(progress: number, frames: Frame[], passWeights: number[]) {
  const groups = groupBubbleFramesByPass(frames);
  if (groups.length <= 1) return getWeightedOperationPosition(progress, frames);
  const weights = groups.map((_, index) => passWeights[index] ?? passWeights[passWeights.length - 1] ?? 1);
  const totalWeight = weights.reduce((sum, value) => sum + value, 0) || 1;
  let cursor = 0;
  const safeProgress = clamp01(progress);

  for (let index = 0; index < groups.length; index++) {
    const share = weights[index] / totalWeight;
    const next = cursor + share;
    if (safeProgress <= next || index === groups.length - 1) {
      const localProgress = share > 0 ? clamp01((safeProgress - cursor) / share) : 1;
      const [start, end] = groups[index];
      return start + getWeightedOperationLocalPosition(localProgress, frames.slice(start, end + 1));
    }
    cursor = next;
  }

  return frames.length - 1;
}

function groupBubbleFramesByPass(frames: Frame[]) {
  const groups: Array<[number, number]> = [];
  let currentPass: number | null = null;
  let start = 0;

  frames.forEach((frame, index) => {
    const pass = typeof frame.vars.i === "number" ? frame.vars.i : currentPass;
    if (pass == null) return;
    if (currentPass == null) {
      currentPass = pass;
      start = 0;
      return;
    }
    if (pass !== currentPass) {
      groups.push([start, index - 1]);
      currentPass = pass;
      start = index;
    }
  });

  if (currentPass != null) groups.push([start, frames.length - 1]);
  return groups;
}

function getWeightedOperationPosition(progress: number, frames: Frame[]) {
  return getWeightedOperationLocalPosition(progress, frames);
}

function getWeightedOperationLocalPosition(progress: number, frames: Frame[]) {
  if (frames.length <= 1) return 0;
  const weights = frames.map(getFrameHoldWeight);
  const total = weights.reduce((sum, value) => sum + value, 0) || 1;
  const target = clamp01(progress) * total;
  let cursor = 0;

  for (let index = 0; index < frames.length; index++) {
    const next = cursor + weights[index];
    if (target <= next || index === frames.length - 1) {
      const local = weights[index] > 0 ? (target - cursor) / weights[index] : 1;
      return Math.max(0, index - 1) + easeInOutCubic(clamp01(local));
    }
    cursor = next;
  }

  return frames.length - 1;
}

function getFrameHoldWeight(frame: Frame) {
  if (frame.event === "compare") return 2.8;
  if (frame.event === "swap") return 3.4;
  if (frame.sorted.length) return 2.2;
  return 1.1;
}

export function getFrameIndexForTime(scenes: LongContentScene[], totalDuration: number, timeSec: number, sceneAnimation: boolean | undefined, frameCount: number) {
  if (!frameCount) return 0;
  if (!sceneAnimation) return 0;
  const safeTime = clampNumber(timeSec, 0, totalDuration);
  const state = getSceneAtTime(scenes, safeTime);
  return clampFrameIndex(state.progress, frameCount);
}

function parseDataSetText(value: string) {
  const values = value.split(/[\s,;]+/).map((part) => Number(part.trim())).filter((item) => Number.isFinite(item));
  return values.length ? values : undefined;
}

function easeInOutCubic(value: number) {
  const safe = clamp01(value);
  return safe < 0.5 ? 4 * safe * safe * safe : 1 - Math.pow(-2 * safe + 2, 3) / 2;
}
