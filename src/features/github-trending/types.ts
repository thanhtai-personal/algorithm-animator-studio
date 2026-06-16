import type { BackgroundMusicId } from "@/lib/backgroundMusic";
import type { VoiceGenerateResult } from "@/lib/voiceApi";

export type GithubTrendingRepo = {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string;
  url: string;
  homepage: string;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
  topics: string[];
  createdAt: string;
  pushedAt: string;
};

export type GithubTrendingFilter = {
  topic: string;
  language: string;
  days: number;
  minStars: number;
  limit: number;
};

export type GithubTrendingOutputLanguage = "en" | "vi" | "zh" | "ja" | "ko";
export type GithubTrendingVoiceProvider = "piper" | "supertonic" | "vieneu" | "elevenlabs" | "applio";
export type GithubTrendingMusicMode = "procedural" | "asset" | "library" | "custom";

export type GithubTrendingProductionSettings = {
  outputLanguage: GithubTrendingOutputLanguage;
  voiceProvider: GithubTrendingVoiceProvider;
  piperModelKey: string;
  supertonicVoice: string;
  supertonicTotalSteps: number;
  elevenModelId: string;
  elevenVoiceId: string;
  vieneuMode: string;
  vieneuEmotion: string;
  vieneuVoiceId: string;
  applioTtsTemplateId: string;
  externalVoiceUrl: string;
  musicMode: GithubTrendingMusicMode;
  musicPreset: BackgroundMusicId;
  customMusicUrl: string;
  voiceVolume: number;
  musicVolume: number;
};

export type GithubTrendingVideoPlan = {
  title: string;
  subtitle: string;
  hook: string;
  narration: string;
  description: string;
  tags: string[];
  chapters: string[];
  data: number[];
  language: GithubTrendingOutputLanguage;
};

export type GithubTrendingGeneratedMedia = {
  voice: VoiceGenerateResult | null;
  voiceUrl: string;
  musicUrl: string;
  musicLabel: string;
};
