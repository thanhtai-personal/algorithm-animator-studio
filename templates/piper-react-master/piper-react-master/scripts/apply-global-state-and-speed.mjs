import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function file(filePath) {
  return path.join(root, filePath);
}

function read(filePath) {
  return fs.readFileSync(file(filePath), "utf8");
}

function write(filePath, content) {
  fs.writeFileSync(file(filePath), content, "utf8");
}

function update(filePath, updater) {
  const before = read(filePath);
  const after = updater(before);
  if (after !== before) {
    write(filePath, after);
    console.log(`updated ${filePath}`);
  } else {
    console.log(`unchanged ${filePath}`);
  }
}

function ensureIncludes(content, marker, transform) {
  return content.includes(marker) ? content : transform(content);
}

function replaceRequired(content, search, replacement, label) {
  if (!content.includes(search)) {
    throw new Error(`Could not find ${label || search.slice(0, 80)}`);
  }
  return content.replace(search, replacement);
}

function insertBefore(content, marker, insertion, label = marker) {
  if (content.includes(insertion.trim().slice(0, 60))) {
    return content;
  }
  if (!content.includes(marker)) {
    throw new Error(`Could not find insertion marker: ${label}`);
  }
  return content.replace(marker, `${insertion}\n${marker}`);
}

function insertAfter(content, marker, insertion, label = marker) {
  if (content.includes(insertion.trim().slice(0, 60))) {
    return content;
  }
  const index = content.indexOf(marker);
  if (index === -1) {
    throw new Error(`Could not find insertion marker: ${label}`);
  }
  const end = index + marker.length;
  return `${content.slice(0, end)}${insertion}${content.slice(end)}`;
}

function ensureImport(content, importLine) {
  if (content.includes(importLine)) return content;

  const importBlockMatch = content.match(/^(?:import[\s\S]*?;\n)+/);
  if (!importBlockMatch) {
    return `${importLine}\n${content}`;
  }

  const insertAt = importBlockMatch[0].length;
  return `${content.slice(0, insertAt)}${importLine}\n${content.slice(insertAt)}`;
}

function ensureStateFile() {
  const target = file("app/state/persistedDrafts.ts");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target)) return;

  fs.writeFileSync(
    target,
    `const STORAGE_KEY = "kata.studio.persistedDrafts.v1";\n\ntype DraftMap = Record<string, unknown>;\n\nlet memoryDrafts: DraftMap = readPersistedDrafts();\nconst sessionFiles = new Map<string, File>();\n\nexport function getPersistedDraft<T extends Record<string, unknown>>(key: string, fallback: T): T {\n  const value = memoryDrafts[key];\n  return { ...fallback, ...(isRecord(value) ? value : {}) } as T;\n}\n\nexport function hasPersistedDraft(key: string): boolean {\n  const value = memoryDrafts[key];\n  return isRecord(value) && Object.keys(value).length > 0;\n}\n\nexport function setPersistedDraft<T extends Record<string, unknown>>(key: string, value: T): void {\n  memoryDrafts = {\n    ...memoryDrafts,\n    [key]: {\n      ...(isRecord(memoryDrafts[key]) ? memoryDrafts[key] : {}),\n      ...value,\n    },\n  };\n  writePersistedDrafts(memoryDrafts);\n}\n\nexport function clearPersistedDraft(key: string): void {\n  const { [key]: _removed, ...rest } = memoryDrafts;\n  memoryDrafts = rest;\n  writePersistedDrafts(memoryDrafts);\n}\n\nexport function getSessionFile<T extends File = File>(key: string): T | null {\n  return (sessionFiles.get(key) as T | undefined) || null;\n}\n\nexport function setSessionFile(key: string, file: File | null | undefined): void {\n  if (file) {\n    sessionFiles.set(key, file);\n  } else {\n    sessionFiles.delete(key);\n  }\n}\n\nfunction readPersistedDrafts(): DraftMap {\n  if (typeof localStorage === "undefined") return {};\n\n  try {\n    const raw = localStorage.getItem(STORAGE_KEY);\n    const parsed = raw ? JSON.parse(raw) : {};\n    return isRecord(parsed) ? parsed : {};\n  } catch {\n    return {};\n  }\n}\n\nfunction writePersistedDrafts(value: DraftMap): void {\n  if (typeof localStorage === "undefined") return;\n\n  try {\n    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));\n  } catch {\n    // Ignore storage quota/private-mode errors. The in-memory store still keeps data while the app is open.\n  }\n}\n\nfunction isRecord(value: unknown): value is Record<string, unknown> {\n  return Boolean(value) && typeof value === "object" && !Array.isArray(value);\n}\n`,
    "utf8"
  );
  console.log("created app/state/persistedDrafts.ts");
}

function patchModelDefaults() {
  update("app/utils/modelDefaults.ts", (content) => {
    return ensureIncludes(content, "DEFAULT_SPEECH_RATE", (next) =>
      next.replace(
        /export const DEFAULT_SENTENCE_SILENCE = ([^;]+);/,
        "export const DEFAULT_SENTENCE_SILENCE = $1;\nexport const DEFAULT_SPEECH_RATE = 0.85;"
      )
    );
  });
}

function patchI18n() {
  update("app/i18n.tsx", (content) => {
    let next = content;
    const sentenceHelpRegex = /sentenceSilenceHelp: "[^"]*",/g;
    const matches = [...next.matchAll(sentenceHelpRegex)];

    if (!next.includes('speechRate: "Reading speed: {rate}x"')) {
      const enMatch = matches[0];
      if (!enMatch || enMatch.index === undefined) {
        throw new Error("Could not find English sentenceSilenceHelp in app/i18n.tsx");
      }
      const insertAt = enMatch.index + enMatch[0].length;
      next = `${next.slice(0, insertAt)}\n    speechRate: "Reading speed: {rate}x",\n    speechRateHelp: "Lower values read slower. Try 0.75-0.9 for Vietnamese storytelling.",${next.slice(insertAt)}`;
    }

    if (!next.includes('speechRate: "Tốc độ đọc: {rate}x"')) {
      const updatedMatches = [...next.matchAll(sentenceHelpRegex)];
      const viMatch = updatedMatches[1];
      if (!viMatch || viMatch.index === undefined) {
        throw new Error("Could not find Vietnamese sentenceSilenceHelp in app/i18n.tsx");
      }
      const insertAt = viMatch.index + viMatch[0].length;
      next = `${next.slice(0, insertAt)}\n    speechRate: "Tốc độ đọc: {rate}x",\n    speechRateHelp: "Giảm xuống để đọc chậm hơn. Kể truyện tiếng Việt nên thử 0.75-0.9.",${next.slice(insertAt)}`;
    }

    return next;
  });
}

function patchAudioOutput() {
  update("server/utils/audioOutput.ts", (content) => {
    if (content.includes("function clampSpeechRate") || content.includes("export function clampSpeechRate")) return content;
    return insertBefore(
      content,
      "export function sanitizeFileBaseName",
      `export function clampSpeechRate(value: unknown): number {\n  const numberValue = Number(value);\n\n  if (Number.isNaN(numberValue)) {\n    return 0.85;\n  }\n\n  return Math.min(Math.max(numberValue, 0.5), 1.4);\n}\n`
    );
  });
}

function patchPiperModelTypes() {
  update("server/models/PiperModel.ts", (content) => {
    if (content.includes("speechRate?: number")) return content;
    return content.replace("  sentenceSilence?: number;\n", "  sentenceSilence?: number;\n  speechRate?: number;\n");
  });
}

function patchPiperService() {
  update("server/services/PiperService.ts", (content) => {
    let next = content;
    next = next.replace("  sentenceSilence: number;\n  piperExe: string;", "  sentenceSilence: number;\n  speechRate?: number;\n  piperExe: string;");
    next = next.replace("  sentenceSilence: number;\n  piperExe: string;", "  sentenceSilence: number;\n  speechRate?: number;\n  piperExe: string;");

    if (!next.includes("--length_scale")) {
      next = next.replace(
        '    "--sentence_silence",\n    String(params.sentenceSilence),\n',
        '    "--sentence_silence",\n    String(params.sentenceSilence),\n    "--length_scale",\n    String(toPiperLengthScale(params.speechRate)),\n'
      );
    }

    if (!next.includes("function toPiperLengthScale")) {
      next = insertBefore(
        next,
        "function buildPiperError",
        `function toPiperLengthScale(speechRate: unknown): number {\n  const rate = Number(speechRate);\n  const clampedRate = Number.isNaN(rate) ? 0.85 : Math.min(Math.max(rate, 0.5), 1.4);\n\n  return Number((1 / clampedRate).toFixed(3));\n}\n`
      );
    }

    return next;
  });
}

function patchTtsGenerationService() {
  update("server/services/TtsGenerationService.ts", (content) => {
    let next = content;
    next = next.replace("clampSentenceSilence,", "clampSentenceSilence,\n  clampSpeechRate,");
    next = next.replace("  sentenceSilence?: number;\n};", "  sentenceSilence?: number;\n  speechRate?: number;\n};");
    next = next.replace("    sentenceSilence: body.sentenceSilence,\n", "    sentenceSilence: body.sentenceSilence,\n    speechRate: body.speechRate,\n");

    if (!next.includes("const finalSpeechRate = clampSpeechRate(params.speechRate);")) {
      next = next.replaceAll(
        "  const finalSentenceSilence = clampSentenceSilence(params.sentenceSilence);\n",
        "  const finalSentenceSilence = clampSentenceSilence(params.sentenceSilence);\n  const finalSpeechRate = clampSpeechRate(params.speechRate);\n"
      );
    }

    next = next.replaceAll(
      "    sentenceSilence: finalSentenceSilence,\n    piperExe,",
      "    sentenceSilence: finalSentenceSilence,\n    speechRate: finalSpeechRate,\n    piperExe,"
    );

    if (!next.includes("speechRate: finalSpeechRate,")) {
      // The replacements above cover both generation and preview; this is a safeguard for older source variants.
      next = next.replaceAll(
        "    sentenceSilence: finalSentenceSilence,\n",
        "    sentenceSilence: finalSentenceSilence,\n    speechRate: finalSpeechRate,\n"
      );
    }

    return next;
  });
}

function patchTtsApi() {
  update("app/api/ttsApi.ts", (content) => {
    let next = content;
    if (!next.includes("speechRate: number")) {
      next = next.replaceAll("  sentenceSilence: number;\n", "  sentenceSilence: number;\n  speechRate: number;\n");
    }
    return next;
  });
}

function patchVideoApi() {
  update("app/api/videoApi.ts", (content) => {
    let next = content;
    if (!next.includes("speechRate: number;")) {
      next = next.replace("  sentenceSilence: number;\n", "  sentenceSilence: number;\n  speechRate: number;\n");
    }
    if (!next.includes('formData.append("speechRate"')) {
      next = next.replace(
        '  formData.append("sentenceSilence", String(payload.sentenceSilence));\n',
        '  formData.append("sentenceSilence", String(payload.sentenceSilence));\n  formData.append("speechRate", String(payload.speechRate));\n'
      );
    }
    return next;
  });
}

function patchSpeechPreviewButton() {
  update("app/components/SpeechPreviewButton.tsx", (content) => {
    let next = content;
    if (!next.includes("speechRate: number;")) {
      next = next.replace("  sentenceSilence: number;\n", "  sentenceSilence: number;\n  speechRate: number;\n");
    }
    if (!next.includes("  speechRate,")) {
      next = next.replace("  sentenceSilence,\n", "  sentenceSilence,\n  speechRate,\n");
    }
    if (!next.includes("        speechRate,")) {
      next = next.replace("        sentenceSilence,\n", "        sentenceSilence,\n        speechRate,\n");
    }
    return next;
  });
}

function patchTtsHook() {
  update("app/hooks/useTtsGenerator.ts", (content) => {
    let next = content;
    next = ensureImport(next, 'import { getPersistedDraft, hasPersistedDraft, setPersistedDraft } from "../state/persistedDrafts";');
    next = next.replace("  DEFAULT_SENTENCE_SILENCE,", "  DEFAULT_SENTENCE_SILENCE,\n  DEFAULT_SPEECH_RATE,");

    if (!next.includes("type TtsPersistedDraft")) {
      next = insertBefore(
        next,
        "export function useTtsGenerator()",
        `type TtsPersistedDraft = {\n  modelKey?: string;\n  proModeId?: string;\n  text?: string;\n  fileName?: string;\n  sentenceSilence?: number;\n  speechRate?: number;\n};\n`
      );
    }

    if (!next.includes('getPersistedDraft<TtsPersistedDraft>("tts"')) {
      next = next.replace(
        "  const { t } = useI18n();\n",
        "  const { t } = useI18n();\n  const persistedDraft = getPersistedDraft<TtsPersistedDraft>(\"tts\", {});\n  const hasStoredDraft = hasPersistedDraft(\"tts\");\n"
      );
    }

    next = next.replace("useState(DEFAULT_MODEL_KEY)", "useState(persistedDraft.modelKey || DEFAULT_MODEL_KEY)");
    next = next.replace("useState(\"\")", "useState(persistedDraft.proModeId || \"\")");
    next = next.replace("useState(DEFAULT_VI_TEXT)", "useState(persistedDraft.text || DEFAULT_VI_TEXT)");
    next = next.replace("useState(\"than-mo-tap-1\")", "useState(persistedDraft.fileName || \"than-mo-tap-1\")");
    next = next.replace(
      "useState(DEFAULT_SENTENCE_SILENCE)",
      "useState(persistedDraft.sentenceSilence ?? DEFAULT_SENTENCE_SILENCE)"
    );

    if (!next.includes("const [speechRate, setSpeechRate]")) {
      next = next.replace(
        "  const [sentenceSilence, setSentenceSilence] = useState(persistedDraft.sentenceSilence ?? DEFAULT_SENTENCE_SILENCE);\n",
        "  const [sentenceSilence, setSentenceSilence] = useState(persistedDraft.sentenceSilence ?? DEFAULT_SENTENCE_SILENCE);\n  const [speechRate, setSpeechRate] = useState(persistedDraft.speechRate ?? DEFAULT_SPEECH_RATE);\n"
      );
    }

    if (!next.includes("setPersistedDraft(\"tts\"")) {
      next = insertBefore(
        next,
        "  useEffect(() => {\n    void loadInitialData();\n  }, []);",
        `  useEffect(() => {\n    setPersistedDraft("tts", {\n      modelKey,\n      proModeId,\n      text,\n      fileName,\n      sentenceSilence,\n      speechRate,\n    });\n  }, [modelKey, proModeId, text, fileName, sentenceSilence, speechRate]);\n`
      );
    }

    next = next.replace("      if (firstAvailable) {\n        applyPiperDefaults(firstAvailable);\n      }", "      if (firstAvailable && !hasStoredDraft) {\n        applyPiperDefaults(firstAvailable);\n      }");

    next = next.replace("generateAudio({ text, modelKey, sentenceSilence, fileName })", "generateAudio({ text, modelKey, sentenceSilence, speechRate, fileName })");
    next = next.replace("    setSentenceSilence(DEFAULT_SENTENCE_SILENCE);\n", "    setSentenceSilence(DEFAULT_SENTENCE_SILENCE);\n    setSpeechRate(DEFAULT_SPEECH_RATE);\n");

    if (!next.includes("    speechRate,\n")) {
      next = next.replace("    sentenceSilence,\n", "    sentenceSilence,\n    speechRate,\n");
    }
    if (!next.includes("    setSpeechRate,")) {
      next = next.replace("    setSentenceSilence,\n", "    setSentenceSilence,\n    setSpeechRate,\n");
    }

    return next;
  });
}

function patchTtsPage() {
  update("app/components/TtsPage.tsx", (content) => {
    let next = content;
    if (!next.includes("speechRate={tts.speechRate}")) {
      next = next.replace("            sentenceSilence={tts.sentenceSilence}\n", "            sentenceSilence={tts.sentenceSilence}\n            speechRate={tts.speechRate}\n");
    }

    if (!next.includes("<SpeechRateField tts={tts} />")) {
      next = next.replace(
        "        ) : (\n          <SentenceSilenceField tts={tts} />\n        )}",
        "        ) : (\n          <>\n            <SentenceSilenceField tts={tts} />\n            <SpeechRateField tts={tts} />\n          </>\n        )}"
      );
    }

    if (!next.includes("function SpeechRateField")) {
      next = insertBefore(
        next,
        "function TextField({ tts }: { tts: TtsState })",
        `function SpeechRateField({ tts }: { tts: TtsState }) {\n  const { t } = useI18n();\n\n  return (\n    <Field label={t("speechRate", { rate: tts.speechRate.toFixed(2) })} hint={t("speechRateHelp")}>\n      <input\n        id="speechRate"\n        className="range"\n        type="range"\n        min="0.5"\n        max="1.4"\n        step="0.05"\n        value={tts.speechRate}\n        onChange={(event) => tts.setSpeechRate(Number(event.target.value))}\n      />\n    </Field>\n  );\n}\n`
      );
    }
    return next;
  });
}

function patchVideoHook() {
  update("app/hooks/useVideoStudio.ts", (content) => {
    let next = content;
    next = ensureImport(next, 'import { getPersistedDraft, getSessionFile, hasPersistedDraft, setPersistedDraft, setSessionFile } from "../state/persistedDrafts";');
    next = next.replace("  DEFAULT_SENTENCE_SILENCE,", "  DEFAULT_SENTENCE_SILENCE,\n  DEFAULT_SPEECH_RATE,");

    if (!next.includes("type VideoPersistedDraft")) {
      next = insertBefore(
        next,
        "export function useVideoStudio()",
        `type VideoPersistedDraft = {\n  modelKey?: string;\n  proModeId?: string;\n  text?: string;\n  audioFileName?: string;\n  audioSourceMode?: VideoAudioSourceMode;\n  selectedAudioPath?: string;\n  sentenceSilence?: number;\n  speechRate?: number;\n  backgroundType?: VideoBackgroundType;\n  aspectRatio?: VideoAspectRatio;\n  fitMode?: VideoFitMode;\n  videoFileName?: string;\n  youtubeForm?: typeof EMPTY_YOUTUBE_UPLOAD;\n};\n`
      );
    }

    if (!next.includes('getPersistedDraft<VideoPersistedDraft>("video"')) {
      next = next.replace(
        "  const { t } = useI18n();\n",
        "  const { t } = useI18n();\n  const persistedDraft = getPersistedDraft<VideoPersistedDraft>(\"video\", {});\n  const hasStoredDraft = hasPersistedDraft(\"video\");\n"
      );
    }

    next = next.replace("useState(DEFAULT_MODEL_KEY)", "useState(persistedDraft.modelKey || DEFAULT_MODEL_KEY)");
    next = next.replace("useState(\"\")", "useState(persistedDraft.proModeId || \"\")");
    next = next.replace("useState(DEFAULT_VI_TEXT)", "useState(persistedDraft.text || DEFAULT_VI_TEXT)");
    next = next.replace("useState(\"video-audio\")", "useState(persistedDraft.audioFileName || \"video-audio\")");
    next = next.replace("useState<VideoAudioSourceMode>(\"new\")", "useState<VideoAudioSourceMode>(persistedDraft.audioSourceMode || \"new\")");
    next = next.replace("useState(\"\")", "useState(persistedDraft.selectedAudioPath || \"\")");
    next = next.replace(
      "useState(DEFAULT_SENTENCE_SILENCE)",
      "useState(persistedDraft.sentenceSilence ?? DEFAULT_SENTENCE_SILENCE)"
    );
    if (!next.includes("const [speechRate, setSpeechRate]")) {
      next = next.replace(
        "  const [sentenceSilence, setSentenceSilence] = useState(persistedDraft.sentenceSilence ?? DEFAULT_SENTENCE_SILENCE);\n",
        "  const [sentenceSilence, setSentenceSilence] = useState(persistedDraft.sentenceSilence ?? DEFAULT_SENTENCE_SILENCE);\n  const [speechRate, setSpeechRate] = useState(persistedDraft.speechRate ?? DEFAULT_SPEECH_RATE);\n"
      );
    }
    next = next.replace("useState<File | null>(null)", "useState<File | null>(() => getSessionFile(\"video.uploadedAudioFile\"))");
    next = next.replace("useState<File | null>(null)", "useState<File | null>(() => getSessionFile(\"video.backgroundFile\"))");
    next = next.replace("useState<VideoBackgroundType>(\"image\")", "useState<VideoBackgroundType>(persistedDraft.backgroundType || \"image\")");
    next = next.replace("useState<VideoAspectRatio>(\"16:9\")", "useState<VideoAspectRatio>(persistedDraft.aspectRatio || \"16:9\")");
    next = next.replace("useState<VideoFitMode>(\"cover\")", "useState<VideoFitMode>(persistedDraft.fitMode || \"cover\")");
    next = next.replace("useState(\"truyen-audio-video\")", "useState(persistedDraft.videoFileName || \"truyen-audio-video\")");
    next = next.replace("useState(EMPTY_YOUTUBE_UPLOAD)", "useState(persistedDraft.youtubeForm || EMPTY_YOUTUBE_UPLOAD)");

    if (!next.includes("setPersistedDraft(\"video\"")) {
      next = insertBefore(
        next,
        "  useEffect(() => {\n    const storedRefreshToken",
        `  useEffect(() => {\n    setPersistedDraft("video", {\n      modelKey,\n      proModeId,\n      text,\n      audioFileName,\n      audioSourceMode,\n      selectedAudioPath,\n      sentenceSilence,\n      speechRate,\n      backgroundType,\n      aspectRatio,\n      fitMode,\n      videoFileName,\n      youtubeForm,\n    });\n  }, [modelKey, proModeId, text, audioFileName, audioSourceMode, selectedAudioPath, sentenceSilence, speechRate, backgroundType, aspectRatio, fitMode, videoFileName, youtubeForm]);\n\n  useEffect(() => {\n    setSessionFile("video.backgroundFile", backgroundFile);\n  }, [backgroundFile]);\n\n  useEffect(() => {\n    setSessionFile("video.uploadedAudioFile", uploadedAudioFile);\n  }, [uploadedAudioFile]);\n`
      );
    }

    next = next.replace("      if (firstAvailable) {\n        setModelKey(firstAvailable.key);", "      if (firstAvailable && !hasStoredDraft) {\n        setModelKey(firstAvailable.key);");

    if (!next.includes("              speechRate,")) {
      next = next.replace("              sentenceSilence,\n", "              sentenceSilence,\n              speechRate,\n");
    }

    if (!next.includes("    speechRate,\n")) {
      next = next.replace("    sentenceSilence,\n", "    sentenceSilence,\n    speechRate,\n");
    }
    if (!next.includes("    setSpeechRate,")) {
      next = next.replace("    setSentenceSilence,\n", "    setSentenceSilence,\n    setSpeechRate,\n");
    }

    return next;
  });
}

function patchVideoPage() {
  update("app/components/video/VideoStudioPage.tsx", (content) => {
    let next = content;
    if (!next.includes("speechRate={video.speechRate}")) {
      next = next.replace("            sentenceSilence={video.sentenceSilence}\n", "            sentenceSilence={video.sentenceSilence}\n            speechRate={video.speechRate}\n");
    }

    if (!next.includes("<VideoSpeechRateField video={video} />")) {
      const sentenceFieldPattern = /(\) : \(\s*)(<Field label=\{t\("sentenceSilence", \{ seconds: video\.sentenceSilence \}\)\} hint=\{t\("sentenceSilenceHelp"\)\}>[\s\S]*?<\/Field>)(\s*\))/;
      next = next.replace(sentenceFieldPattern, (_match, start, field, end) => {
        return `${start}<>\n            ${field}\n            <VideoSpeechRateField video={video} />\n          </>${end}`;
      });
    }

    if (!next.includes("function VideoSpeechRateField")) {
      next = insertBefore(
        next,
        "function ProModeFields",
        `function VideoSpeechRateField({ video }: { video: VideoState }) {\n  const { t } = useI18n();\n\n  return (\n    <Field label={t("speechRate", { rate: video.speechRate.toFixed(2) })} hint={t("speechRateHelp")}>\n      <input\n        id="videoSpeechRate"\n        className="range"\n        type="range"\n        min="0.5"\n        max="1.4"\n        step="0.05"\n        value={video.speechRate}\n        onChange={(event) => video.setSpeechRate(Number(event.target.value))}\n      />\n    </Field>\n  );\n}\n`
      );
    }
    return next;
  });
}

function patchWebExtractorHook() {
  const filePath = "app/hooks/useWebTextExtractor.ts";
  if (!fs.existsSync(file(filePath))) return;

  update(filePath, (content) => {
    let next = content;
    next = next.replace('import { useState } from "react";', 'import { useEffect, useState } from "react";');
    next = ensureImport(next, 'import { getPersistedDraft, setPersistedDraft } from "../state/persistedDrafts";');

    if (!next.includes("type WebExtractPersistedDraft")) {
      next = insertBefore(
        next,
        "export function useWebTextExtractor",
        `type WebExtractPersistedDraft = {\n  sourcePageUrl?: string;\n  hrefSelector?: string;\n  urlList?: string;\n  selector?: string;\n  appendMode?: boolean;\n};\n`
      );
    }

    if (!next.includes('getPersistedDraft<WebExtractPersistedDraft>("webExtract"')) {
      next = next.replace(
        "  const { t } = useI18n();\n",
        "  const { t } = useI18n();\n  const persistedDraft = getPersistedDraft<WebExtractPersistedDraft>(\"webExtract\", {});\n"
      );
    }

    next = next.replace("useState(\"\")", "useState(persistedDraft.urlList || \"\")");
    next = next.replace("useState(DEFAULT_SELECTOR)", "useState(persistedDraft.selector || DEFAULT_SELECTOR)");
    next = next.replace("useState(false)", "useState(Boolean(persistedDraft.appendMode))");
    next = next.replace("useState(\"a[href]\")", "useState(persistedDraft.hrefSelector || \"a[href]\")");

    if (!next.includes("setPersistedDraft(\"webExtract\"")) {
      const marker = "  const urls = parseUrls(urlList);";
      next = insertBefore(
        next,
        marker,
        `  useEffect(() => {\n    setPersistedDraft("webExtract", {\n      sourcePageUrl: typeof sourcePageUrl === "string" ? sourcePageUrl : undefined,\n      hrefSelector: typeof hrefSelector === "string" ? hrefSelector : undefined,\n      urlList,\n      selector,\n      appendMode,\n    });\n  }, [typeof sourcePageUrl === "string" ? sourcePageUrl : undefined, typeof hrefSelector === "string" ? hrefSelector : undefined, urlList, selector, appendMode]);\n`
      );
    }

    return next;
  });
}

function patchYoutubeHook() {
  const filePath = "app/hooks/useYoutubeUpload.ts";
  if (!fs.existsSync(file(filePath))) return;

  update(filePath, (content) => {
    let next = content;
    next = ensureImport(next, 'import { getPersistedDraft, getSessionFile, setPersistedDraft, setSessionFile } from "../state/persistedDrafts";');

    if (!next.includes("type YoutubePersistedDraft")) {
      next = insertBefore(
        next,
        "export function useYoutubeUpload()",
        `type YoutubePersistedDraft = {\n  uploadForm?: typeof EMPTY_YOUTUBE_UPLOAD;\n};\n`
      );
    }

    if (!next.includes('getPersistedDraft<YoutubePersistedDraft>("youtube"')) {
      next = next.replace(
        "  const { t } = useI18n();\n",
        "  const { t } = useI18n();\n  const persistedDraft = getPersistedDraft<YoutubePersistedDraft>(\"youtube\", {});\n"
      );
    }

    next = next.replace("useState(EMPTY_YOUTUBE_UPLOAD)", "useState(persistedDraft.uploadForm || EMPTY_YOUTUBE_UPLOAD)");
    next = next.replace("useState<File | null>(null)", "useState<File | null>(() => getSessionFile(\"youtube.videoFile\"))");

    if (!next.includes("setPersistedDraft(\"youtube\"")) {
      next = insertBefore(
        next,
        "  useEffect(() => {\n    const storedRefreshToken",
        `  useEffect(() => {\n    setPersistedDraft("youtube", { uploadForm });\n  }, [uploadForm]);\n\n  useEffect(() => {\n    setSessionFile("youtube.videoFile", videoFile);\n  }, [videoFile]);\n`
      );
    }

    return next;
  });
}

function patchServerVideoBody() {
  update("server/models/Video.ts", (content) => content.includes("speechRate?: number") ? content : content.replace("  voiceId?: string;\n", "  voiceId?: string;\n  speechRate?: number;\n"));
}

function main() {
  ensureStateFile();
  patchModelDefaults();
  patchI18n();
  patchAudioOutput();
  patchPiperModelTypes();
  patchServerVideoBody();
  patchPiperService();
  patchTtsGenerationService();
  patchTtsApi();
  patchVideoApi();
  patchSpeechPreviewButton();
  patchTtsHook();
  patchTtsPage();
  patchVideoHook();
  patchVideoPage();
  patchWebExtractorHook();
  patchYoutubeHook();

  console.log("Done. Run: npm run dev");
}

main();
