import type { AgentVideoKind, AgentVideoPlan, AgentVideoPlatform } from "../models/AiVideoAgent";

const FALLBACK_PRESET_DURATIONS: Record<string, number> = {
  "algorithm-shorts": 45,
  "maze-pathfinding": 55,
  "algorithm-long": 240,
  "github-trending": 120,
  "story-video": 60,
  "story-author": 300,
  "story-review": 60,
  "mu-news": 55,
};

export function getAgentFallbackDurationSec(input: {
  agentPreset?: string;
  kind?: AgentVideoKind;
  platform?: AgentVideoPlatform;
}) {
  const presetDuration = input.agentPreset ? FALLBACK_PRESET_DURATIONS[input.agentPreset] : undefined;
  if (presetDuration) return presetDuration;
  if (input.kind === "football") return 55;
  if (input.kind === "story") return input.platform === "youtube-long" ? 300 : 60;
  return input.platform === "youtube-long" ? 180 : 45;
}

export function splitDurationAcrossScenes(totalSeconds: number, sceneCount: number, minSceneSeconds = 8) {
  if (sceneCount <= 0) return [];
  const total = Math.max(sceneCount * minSceneSeconds, Math.round(totalSeconds));
  const base = Math.floor(total / sceneCount);
  const remainder = total - base * sceneCount;
  return Array.from({ length: sceneCount }, (_item, index) => base + (index < remainder ? 1 : 0));
}

export function getPlanDurationSec(plan: Pick<AgentVideoPlan, "scenes"> | undefined, fallbackSeconds: number) {
  const total = (plan?.scenes || []).reduce((sum, scene) => {
    const duration = Number(scene.durationSec);
    return Number.isFinite(duration) && duration > 0 ? sum + duration : sum;
  }, 0);
  return total > 0 ? Math.round(total) : fallbackSeconds;
}
