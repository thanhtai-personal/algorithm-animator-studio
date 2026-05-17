import type { Language } from "../models/PiperModel";

export function stripAnsi(text: string): string {
  return text.replace(/\u001b\[[0-9;]*m/g, "");
}

export function prepareText(text: string, lang: Language): string {
  if (lang === "vi") {
    return cleanVietnameseText(text);
  }

  return cleanNonVietnameseText(text);
}

function cleanVietnameseText(text: string): string {
  return normalizePiperLines(
    text
      .normalize("NFC")
      .replace(/\uFEFF/g, "")
      .replace(/…/g, ".")
      .replace(/。/g, ".")
      .replace(/，/g, ",")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[;:]+/g, ",")
      .replace(/["'()[\]{}<>*_#|\\/]/g, " ")
  );
}

function cleanNonVietnameseText(text: string): string {
  return normalizePiperLines(
    text
      .normalize("NFC")
      .replace(/\uFEFF/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/([.!?]+)\s+/g, "$1\n")
  );
}

function normalizePiperLines(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}
