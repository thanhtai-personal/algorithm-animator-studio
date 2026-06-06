import fs from "node:fs";
import path from "node:path";
import { parse } from "dotenv";
import { SERVER_ROOT } from "../config/paths";
import { DEFAULT_RUNTIME_ENV_VALUES, KNOWN_RUNTIME_ENV_KEYS } from "../config/runtimeDefaults";

const ENV_PATH = path.resolve(SERVER_ROOT, "..", ".env");
const SERVER_ENV_PATH = path.resolve(SERVER_ROOT, ".env");

const LEGACY_LOCAL_ENV_VALUES: Record<string, Record<string, string>> = {

};

export type RuntimeEnvValues = Record<string, string>;

export function readEnvValues(overrides: RuntimeEnvValues = {}): RuntimeEnvValues {
  return normalizeLegacyEnvValues({
    ...DEFAULT_RUNTIME_ENV_VALUES,
    ...pickKnownEnv(process.env),
    ...readDotEnvValues(ENV_PATH),
    ...readDotEnvValues(SERVER_ENV_PATH),
    ...pickKnownEnv(overrides),
  });
}

export function pickKnownEnv(values: NodeJS.ProcessEnv | Record<string, unknown>): RuntimeEnvValues {
  const output: RuntimeEnvValues = {};

  for (const key of KNOWN_RUNTIME_ENV_KEYS) {
    const value = values[key];
    if (value !== undefined && value !== null) {
      output[key] = normalizeLegacyEnvValue(key, String(value));
    }
  }

  return output;
}

function normalizeLegacyEnvValues(values: RuntimeEnvValues): RuntimeEnvValues {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, normalizeLegacyEnvValue(key, value)])
  );
}

function normalizeLegacyEnvValue(key: string, value: string): string {
  const trimmed = value.trim();
  return LEGACY_LOCAL_ENV_VALUES[key]?.[trimmed] ?? value;
}

function readDotEnvValues(envPath: string): RuntimeEnvValues {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  return pickKnownEnv(parse(fs.readFileSync(envPath, "utf8")));
}
