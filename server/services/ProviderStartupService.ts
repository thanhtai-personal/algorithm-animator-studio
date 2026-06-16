import fs from "node:fs";
import path from "node:path";
import { KATA_STUDIO_HOME, PROJECT_ROOT } from "../config/paths";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";

export type StartupProviderId = "supertonic" | "applio" | "vieneu" | "gpt-sovits";

export type StartupProviderSetting = {
  id: StartupProviderId;
  label: string;
  description: string;
  envKey: string;
  enabled: boolean;
  defaultEnabled: boolean;
  restartRequired: boolean;
  heavy: boolean;
  note: string;
};

export type ProviderStartupSettingsResponse = {
  ok: boolean;
  restartRequired: boolean;
  envPath: string;
  providers: StartupProviderSetting[];
};

const PROVIDER_DEFINITIONS: Array<Omit<StartupProviderSetting, "enabled" | "restartRequired">> = [
  {
    id: "supertonic",
    label: "Supertonic local TTS",
    description: "Local TTS service. Bật khi dùng provider Supertonic trong Text to Speech hoặc video workflow.",
    envKey: "KAI_PROVIDER_SUPERTONIC_ENABLED",
    defaultEnabled: true,
    heavy: true,
    note: "Có thể tốn thời gian khởi động vì cần load model Supertonic.",
  },
  {
    id: "applio",
    label: "RVC/Applio",
    description: "Voice conversion/custom voice server. Chỉ cần bật khi có RVC_APPLIO_START_COMMAND hoặc đang dùng Applio local.",
    envKey: "KAI_PROVIDER_APPLIO_ENABLED",
    defaultEnabled: true,
    heavy: true,
    note: "Nếu chưa cấu hình start command thì script vẫn tự bỏ qua.",
  },
  {
    id: "vieneu",
    label: "VieNeu-TTS",
    description: "Provider TTS tiếng Việt local chạy qua Python SDK/fork bundled.",
    envKey: "KAI_PROVIDER_VIENEU_ENABLED",
    defaultEnabled: true,
    heavy: true,
    note: "Tắt provider này để tránh kiểm tra SDK/Python khi không cần voice Việt local.",
  },
  {
    id: "gpt-sovits",
    label: "GPT-SoVITS Local Experimental",
    description: "Provider clone giọng/few-shot TTS qua GPT-SoVITS API local.",
    envKey: "KAI_PROVIDER_GPT_SOVITS_ENABLED",
    defaultEnabled: false,
    heavy: true,
    note: "Mặc định tắt vì GPT-SoVITS load model nặng và tiếng Việt chưa phải ngôn ngữ chính thức.",
  },
];

export function getProviderStartupSettings(envOverrides: RuntimeEnvValues = {}): ProviderStartupSettingsResponse {
  const env = readEnvValues(envOverrides);
  const envPath = getWritableEnvPath();
  const providers = PROVIDER_DEFINITIONS.map((provider) => ({
    ...provider,
    enabled: isProviderStartupEnabled(provider.id, env),
    restartRequired: false,
  }));

  return { ok: true, restartRequired: false, envPath, providers };
}

export function updateProviderStartupSetting(providerId: StartupProviderId, enabled: boolean) {
  const provider = getProviderDefinition(providerId);
  const envPath = getWritableEnvPath();
  const nextValue = enabled ? "true" : "false";

  upsertEnvValue(envPath, provider.envKey, nextValue);

  return {
    ok: true,
    restartRequired: true,
    envPath,
    provider: {
      ...provider,
      enabled,
      restartRequired: true,
    },
    message: "Đã lưu cấu hình provider. Cần khởi động lại app/dev server để thay đổi bật/tắt có hiệu lực.",
  };
}

export function isProviderStartupEnabled(providerId: StartupProviderId, envValues?: RuntimeEnvValues) {
  const provider = getProviderDefinition(providerId);
  const env = envValues || readEnvValues();
  return parseEnabledValue(env[provider.envKey], provider.defaultEnabled);
}

export function getProviderDefinition(providerId: StartupProviderId) {
  const provider = PROVIDER_DEFINITIONS.find((item) => item.id === providerId);
  if (!provider) throw new Error(`Provider không hợp lệ: ${providerId}`);
  return provider;
}

function parseEnabledValue(value: string | undefined, fallback: boolean) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  return fallback;
}

function getWritableEnvPath() {
  if (process.env.KATA_DESKTOP_RUNTIME === "true") {
    return path.join(KATA_STUDIO_HOME, ".env");
  }
  return path.join(PROJECT_ROOT, ".env");
}

function upsertEnvValue(envPath: string, key: string, value: string) {
  fs.mkdirSync(path.dirname(envPath), { recursive: true });
  const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const lines = current.split(/\r?\n/);
  const keyPattern = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=`);
  let replaced = false;

  const nextLines = lines.map((line) => {
    if (!keyPattern.test(line)) return line;
    replaced = true;
    return `${key}=${value}`;
  });

  if (!replaced) {
    if (nextLines.length && nextLines[nextLines.length - 1].trim()) nextLines.push("");
    nextLines.push(`${key}=${value}`);
  }

  fs.writeFileSync(envPath, nextLines.join("\n").replace(/\n{3,}$/g, "\n\n"), "utf8");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
