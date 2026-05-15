import type { Lang } from "@/lib/i18n";
import type { LongContentScene } from "@/lib/longContentTimeline";

const SCENE_VOICE_PADDING_SEC = 1.6;
const CONSERVATIVE_VOICE_FACTOR = 1.35;

export function fitSceneDurationsToNarration(
  scenes: LongContentScene[],
  lang: Lang,
  narrationRate: number,
  voiceDurationSec: number,
) {
  const estimates = scenes.map((scene) => estimateNarrationDuration(scene.narration, lang, narrationRate));
  const estimateTotal = estimates.reduce((sum, value) => sum + value, 0);
  const finiteVoiceDuration = Number.isFinite(voiceDurationSec) ? voiceDurationSec : 0;
  const voiceDrivenTotal = finiteVoiceDuration > estimateTotal
    ? finiteVoiceDuration + SCENE_VOICE_PADDING_SEC * scenes.length
    : 0;

  return scenes.map((scene, index) => {
    const estimate = estimates[index] ?? 0;
    const voiceShare = voiceDrivenTotal && estimateTotal > 0
      ? (estimate / estimateTotal) * voiceDrivenTotal
      : 0;
    return {
      ...scene,
      durationSec: Math.max(
        scene.durationSec,
        estimate * CONSERVATIVE_VOICE_FACTOR + SCENE_VOICE_PADDING_SEC,
        voiceShare,
      ),
    };
  });
}

export function estimateNarrationDuration(text: string, lang: Lang, narrationRate: number) {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) return 0;
  const wordCount = normalized.split(" ").filter(Boolean).length;
  const punctuationPauses = (normalized.match(/[,.!?;:，。！？]/g)?.length ?? 0) * 0.28;
  const wordsPerMinute = (lang === "vi" ? 118 : 130) * clampNumber(narrationRate, 0.7, 1.2);
  return (wordCount / wordsPerMinute) * 60 + punctuationPauses;
}

function clampNumber(value: number, min: number, max: number) {
  return !Number.isFinite(value) ? min : Math.max(min, Math.min(max, value));
}
