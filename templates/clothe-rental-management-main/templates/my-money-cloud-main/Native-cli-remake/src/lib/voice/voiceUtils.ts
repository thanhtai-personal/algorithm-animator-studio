
import { detectLanguage, parseAmount } from "./transactionParser";

const LANGUAGE_PREFIXES = ["vi", "en", "zh", "ko", "ja", "hi"] as const;

export function normalizeVoiceLanguage(language?: string): string | undefined {
  if (!language) return undefined;
  const lower = language.toLowerCase();
  const matched = LANGUAGE_PREFIXES.find((prefix) => lower.startsWith(prefix));
  return matched ?? language;
}

// Normalize transcript text
export function cleanTranscript(raw: string): string {
  return raw?.trim?.() ?? "";
}

export const extractAmountFromTranscript = (rawTranscript: string, userLanguage?: string) => {
  const normalizedLanguage = normalizeVoiceLanguage(userLanguage);
  return parseAmount(rawTranscript, normalizedLanguage || detectLanguage(rawTranscript));
};
