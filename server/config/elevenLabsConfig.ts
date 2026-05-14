import { readEnvValues, type RuntimeEnvValues } from "../services/EnvFileService";
import { SERVER_ORIGIN } from "./paths";
import type { ElevenLabsModel, ElevenLabsVoice } from "../models/ElevenLabs";

export const ELEVENLABS_MODELS: ElevenLabsModel[] = [
  {
    id: "eleven_flash_v2_5",
    label: "Kể nhanh",
    priceUsdPerThousandCharacters: 0.05,
    creditRateLabel: "Flash/Turbo: $0.05 mỗi 1.000 ký tự",
    characterLimit: 40000,
    languages: "32 ngôn ngữ, có tiếng Việt",
    latency: "Độ trễ rất thấp",
    qualityNote: "Phản hồi nhanh, phù hợp bản nháp dài và nghe thử.",
  },
  {
    id: "eleven_turbo_v2_5",
    label: "Kể cân bằng",
    priceUsdPerThousandCharacters: 0.05,
    creditRateLabel: "Flash/Turbo: $0.05 mỗi 1.000 ký tự",
    characterLimit: 40000,
    languages: "32 ngôn ngữ",
    latency: "Độ trễ thấp",
    qualityNote: "Cân bằng giữa chất lượng và tốc độ.",
  },
  {
    id: "eleven_multilingual_v2",
    label: "Kể đa ngôn ngữ",
    priceUsdPerThousandCharacters: 0.1,
    creditRateLabel: "Đa ngôn ngữ/v3: $0.10 mỗi 1.000 ký tự",
    characterLimit: 10000,
    languages: "29 ngôn ngữ",
    latency: "Độ trễ tiêu chuẩn",
    qualityNote: "Ổn định cho nội dung đọc dài.",
  },
  {
    id: "eleven_v3",
    label: "Kể biểu cảm",
    priceUsdPerThousandCharacters: 0.1,
    creditRateLabel: "Đa ngôn ngữ/v3: $0.10 mỗi 1.000 ký tự",
    characterLimit: 5000,
    languages: "Hơn 70 ngôn ngữ",
    latency: "Độ trễ tiêu chuẩn",
    qualityNote: "Biểu cảm nhất, phù hợp nội dung cần nhiều cảm xúc.",
  },
];

const PREVIEW_URL_ENV_KEYS: Record<string, string> = {
  eleven_flash_v2_5: "PRO_PREVIEW_FAST_URL",
  eleven_turbo_v2_5: "PRO_PREVIEW_BALANCED_URL",
  eleven_multilingual_v2: "PRO_PREVIEW_MULTILINGUAL_URL",
  eleven_v3: "PRO_PREVIEW_EXPRESSIVE_URL",
};

export function getConfiguredElevenLabsModels(envOverrides: RuntimeEnvValues = {}): ElevenLabsModel[] {
  const env = readEnvValues(envOverrides);

  return ELEVENLABS_MODELS.map((model) => ({
    ...model,
    previewAudioUrl: normalizePreviewAudioUrl(env[PREVIEW_URL_ENV_KEYS[model.id]], env),
  }));
}

function normalizePreviewAudioUrl(value: string | undefined, env: RuntimeEnvValues): string | undefined {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  const serverOrigin = env.SERVER_ORIGIN || SERVER_ORIGIN;

  if (trimmedValue.startsWith("/")) {
    return `${serverOrigin}${trimmedValue}`;
  }

  return `${serverOrigin}/generated/previews/${encodeURIComponent(trimmedValue)}`;
}

export function getElevenLabsApiKey(envOverrides: RuntimeEnvValues = {}): string {
  const env = readEnvValues(envOverrides);
  return env.ELEVENLABS_API_KEY || "";
}

export function getConfiguredElevenLabsVoices(envOverrides: RuntimeEnvValues = {}): ElevenLabsVoice[] {
  const env = readEnvValues(envOverrides);
  const voicesJson = env.ELEVENLABS_VOICES;

  if (voicesJson) {
    try {
      const voices = JSON.parse(voicesJson) as ElevenLabsVoice[];
      return voices
        .map((voice) => ({
          id: String(voice.id || "").trim(),
          label: String(voice.label || "").trim(),
        }))
        .filter((voice) => voice.id && voice.label);
    } catch {
      return [];
    }
  }

  return [];
}

export function getElevenLabsModel(
  modelId: string,
  envOverrides: RuntimeEnvValues = {}
): ElevenLabsModel | null {
  return getConfiguredElevenLabsModels(envOverrides).find((model) => model.id === modelId) || null;
}
