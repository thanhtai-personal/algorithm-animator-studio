import type { RuntimeEnvValues } from "../services/EnvFileService";

export function getAiShortsConfig(envOverrides?: RuntimeEnvValues) {
  return {
    apiUrl: readSetting("AI_SHORTS_API_URL", envOverrides) || "https://generativelanguage.googleapis.com/v1beta",
    apiKey: readSetting("AI_SHORTS_API_KEY", envOverrides),
    model: readSetting("AI_SHORTS_MODEL", envOverrides) || "veo-3.1-fast-generate-preview",
    provider: "gemini-veo",
  };
}

function readSetting(key: string, envOverrides?: RuntimeEnvValues) {
  const override = envOverrides?.[key];
  if (typeof override === "string" && override.trim()) {
    return override.trim();
  }
  return process.env[key]?.trim() || "";
}
