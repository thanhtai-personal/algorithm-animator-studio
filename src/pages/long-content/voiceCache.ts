import { useEffect } from "react";
import type { Lang } from "@/lib/i18n";
import { buildVoiceScriptKey } from "./studioHelpers";
import type { VoiceProvider } from "./useLongContentStudio";

const VOICE_CACHE_KEY = "kata.longContent.generatedVoice.v2";

export type GeneratedVoiceProvider = Exclude<VoiceProvider, "browser">;

export type CachedGeneratedVoice = {
  provider: GeneratedVoiceProvider;
  scriptKey: string;
  audioUrl: string;
  relativePath?: string;
  fileName: string;
  durationSec: number;
  segmentDurationsSec?: number[];
  savedAt: number;
};

type VoiceScriptKeyParts = {
  provider: GeneratedVoiceProvider;
  algoId: string;
  lang: Lang;
  piperModelKey: string;
  elevenModelId: string;
  elevenVoiceId: string;
  supertonicVoice: string;
  supertonicTotalSteps: number;
  rvcApplioKey?: string;
  vieneuVoiceId?: string;
  vieneuMode?: string;
  vieneuEmotion?: string;
  narrationRate: number;
  narrationScript: string;
};

type VoiceRestoreParams = Omit<VoiceScriptKeyParts, "provider"> & {
  voiceUrl: string;
  voiceLoading: boolean;
  voiceProvider: VoiceProvider;
  setVoiceProvider: (provider: VoiceProvider) => void;
  setVoiceUrl: (url: string) => void;
  setVoiceRelativePath: (relativePath: string) => void;
  setVoiceFileName: (fileName: string) => void;
  setVoiceDurationSec: (durationSec: number) => void;
  setVoiceSegmentDurationsSec: (durations: number[]) => void;
  setVoiceScriptKey: (scriptKey: string) => void;
};

export function useRestoreGeneratedVoiceCache(params: VoiceRestoreParams) {
  useEffect(() => {
    if (params.voiceUrl || params.voiceLoading || params.voiceProvider !== "browser") return;
    const cached = readCachedGeneratedVoice();
    if (!cached) return;
    const expectedKey = buildGeneratedVoiceScriptKey({ ...params, provider: cached.provider });
    if (cached.scriptKey !== expectedKey) return;
    params.setVoiceProvider(cached.provider);
    params.setVoiceUrl(cached.audioUrl);
    params.setVoiceRelativePath(cached.relativePath || "");
    params.setVoiceFileName(cached.fileName);
    params.setVoiceDurationSec(cached.durationSec);
    params.setVoiceSegmentDurationsSec(cached.segmentDurationsSec ?? []);
    params.setVoiceScriptKey(cached.scriptKey);
  }, [
    params.algoId,
    params.elevenModelId,
    params.elevenVoiceId,
    params.lang,
    params.narrationRate,
    params.narrationScript,
    params.piperModelKey,
    params.supertonicTotalSteps,
    params.supertonicVoice,
    params.rvcApplioKey,
    params.vieneuVoiceId,
    params.vieneuMode,
    params.vieneuEmotion,
    params.voiceLoading,
    params.voiceProvider,
    params.voiceUrl,
  ]);
}

export function buildGeneratedVoiceScriptKey(parts: VoiceScriptKeyParts) {
  return buildVoiceScriptKey({
    provider: parts.provider,
    algoId: parts.algoId,
    lang: parts.lang,
    modelKey: [
      parts.piperModelKey,
      parts.supertonicVoice,
      parts.supertonicTotalSteps,
      parts.rvcApplioKey || "",
      parts.vieneuVoiceId || "",
      parts.vieneuMode || "",
      parts.vieneuEmotion || "",
    ].join("|"),
    elevenModelId: parts.elevenModelId,
    elevenVoiceId: parts.elevenVoiceId,
    rate: parts.narrationRate,
    script: parts.narrationScript,
  });
}

export function writeCachedGeneratedVoice(voice: CachedGeneratedVoice) {
  try {
    window.localStorage.setItem(VOICE_CACHE_KEY, JSON.stringify(voice));
  } catch {
    // Voice cache is a convenience; generation/export still works without localStorage.
  }
}

function readCachedGeneratedVoice(): CachedGeneratedVoice | null {
  try {
    const raw = window.localStorage.getItem(VOICE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedGeneratedVoice>;
    if (
      (parsed.provider !== "piper" && parsed.provider !== "elevenlabs" && parsed.provider !== "supertonic" && parsed.provider !== "applio" && parsed.provider !== "vieneu")
      || !parsed.scriptKey
      || !parsed.audioUrl
      || !parsed.fileName
    ) {
      window.localStorage.removeItem(VOICE_CACHE_KEY);
      return null;
    }
    return {
      provider: parsed.provider,
      scriptKey: parsed.scriptKey,
      audioUrl: parsed.audioUrl,
      relativePath: typeof parsed.relativePath === "string" ? parsed.relativePath : "",
      fileName: parsed.fileName,
      durationSec: Number.isFinite(parsed.durationSec) ? Number(parsed.durationSec) : 0,
      segmentDurationsSec: Array.isArray(parsed.segmentDurationsSec)
        ? parsed.segmentDurationsSec.filter((value) => Number.isFinite(value))
        : undefined,
      savedAt: Number.isFinite(parsed.savedAt) ? Number(parsed.savedAt) : Date.now(),
    };
  } catch {
    window.localStorage.removeItem(VOICE_CACHE_KEY);
    return null;
  }
}
