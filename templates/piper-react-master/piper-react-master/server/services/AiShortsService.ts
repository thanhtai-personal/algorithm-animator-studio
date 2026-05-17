import fs from "node:fs/promises";
import type { AiShortsVideoResult, EditAiShortsBody, GenerateAiShortsBody, SortAlgorithm } from "../models/AiShorts";
import type { VideoAspectRatio, VideoFitMode } from "../models/Video";
import { getAiShortsConfig } from "../config/aiShortsConfig";
import { createVideoOutput, resolveGeneratedVideoPath } from "../utils/videoOutput";
import { runFfmpeg } from "../utils/ffmpeg";
import { normalizeVideoAspectRatio, normalizeVideoFitMode } from "./VideoService";
import type { RuntimeEnvValues } from "./EnvFileService";

const ALGORITHM_LABELS: Record<SortAlgorithm, string> = {
  bubble: "Bubble Sort",
  selection: "Selection Sort",
  insertion: "Insertion Sort",
  quick: "Quick Sort",
  merge: "Merge Sort",
  heap: "Heap Sort",
  counting: "Counting Sort",
  radix: "Radix Sort",
  shell: "Shell Sort",
  custom: "Custom sorting algorithm",
};

const VIDEO_DIMENSIONS: Record<VideoAspectRatio, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
};

const GEMINI_DEFAULT_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_DEFAULT_MODEL = "veo-3.1-fast-generate-preview";
const GEMINI_PROVIDER = "gemini-veo";
const GEMINI_ALLOWED_DURATIONS = [4, 6, 8] as const;

export function readAiShortsConfig(envOverrides?: RuntimeEnvValues) {
  const config = getAiShortsConfig(envOverrides);
  return {
    ok: true,
    configured: Boolean(config.apiKey),
    provider: GEMINI_PROVIDER,
    model: config.model,
  };
}

export async function generateAiSortShort(params: {
  body: GenerateAiShortsBody;
  envOverrides?: RuntimeEnvValues;
}): Promise<AiShortsVideoResult> {
  const config = getAiShortsConfig(params.envOverrides);
  if (!config.apiKey) {
    throw new Error("Chưa cấu hình AI_SHORTS_API_KEY. Vào Hướng dẫn → Gemini Veo để lấy key từ Google AI Studio.");
  }

  const payload = normalizeGenerateBody(params.body);
  const prompt = buildSortPrompt(payload);
  const videoDownloadUrl = await callGeminiVeoApi(config, prompt, payload.durationSeconds);
  const output = createVideoOutput(payload.videoFileName || `gemini-veo-${payload.algorithm}-short`, params.envOverrides);

  await downloadGeminiVideo(videoDownloadUrl, output.outputPath, config.apiKey);

  return {
    ok: true,
    fileName: output.outputFileName,
    relativePath: output.relativePath,
    videoUrl: output.videoUrl,
    source: "ai",
    prompt,
    provider: GEMINI_PROVIDER,
    model: config.model,
  };
}

export async function editAiShort(params: {
  body: EditAiShortsBody;
  envOverrides?: RuntimeEnvValues;
}): Promise<AiShortsVideoResult> {
  const relativePath = String(params.body.relativePath || "").trim();
  if (!relativePath) {
    throw new Error("Thiếu video cần chỉnh sửa.");
  }

  const inputPath = resolveGeneratedVideoPath(relativePath, params.envOverrides).absolutePath;
  const output = createVideoOutput(params.body.videoFileName || "ai-short-edited", params.envOverrides);
  const aspectRatio = normalizeVideoAspectRatio(params.body.aspectRatio);
  const fitMode = normalizeVideoFitMode(params.body.fitMode);
  const trimStartSeconds = clampNumber(params.body.trimStartSeconds, 0, 600, 0);
  const maxDurationSeconds = clampNumber(params.body.maxDurationSeconds, 0, 600, 0);

  await runFfmpeg(
    buildEditArgs({
      aspectRatio,
      fitMode,
      inputPath,
      maxDurationSeconds,
      outputPath: output.outputPath,
      trimStartSeconds,
    }),
    params.envOverrides
  );

  return {
    ok: true,
    fileName: output.outputFileName,
    relativePath: output.relativePath,
    videoUrl: output.videoUrl,
    source: "edit",
  };
}

function normalizeGenerateBody(body: GenerateAiShortsBody) {
  const algorithm = isSortAlgorithm(body.algorithm) ? body.algorithm : "bubble";
  return {
    algorithm,
    customAlgorithmName: String(body.customAlgorithmName || "").trim(),
    durationSeconds: normalizeGeminiDuration(body.durationSeconds),
    extraPrompt: String(body.extraPrompt || "").trim(),
    itemCount: clampNumber(body.itemCount, 5, 80, 20),
    palettePrompt: String(body.palettePrompt || "neon cyan, violet, amber accents").trim(),
    stylePrompt: String(body.stylePrompt || "cute animated bars, high contrast, satisfying motion").trim(),
    videoFileName: String(body.videoFileName || `gemini-veo-${algorithm}-short`).trim(),
  };
}

function normalizeGeminiDuration(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 8;
  }

  return GEMINI_ALLOWED_DURATIONS.reduce((closest, current) => {
    return Math.abs(current - numeric) < Math.abs(closest - numeric) ? current : closest;
  }, 8 as (typeof GEMINI_ALLOWED_DURATIONS)[number]);
}

function buildSortPrompt(payload: ReturnType<typeof normalizeGenerateBody>) {
  const algorithmName = payload.algorithm === "custom" ? payload.customAlgorithmName || ALGORITHM_LABELS.custom : ALGORITHM_LABELS[payload.algorithm];
  return [
    `Create a vertical 9:16 YouTube Shorts video visualizing ${algorithmName}.`,
    `Use ${payload.itemCount} sortable items. Make the compare/swap/move steps easy to understand without narration.`,
    `Target duration: ${payload.durationSeconds} seconds. Output must be an MP4 video.`,
    `Style: ${payload.stylePrompt}.`,
    `Color palette: ${payload.palettePrompt}.`,
    `Use a clean animated educational style, readable labels, strong motion clarity, and no copyrighted characters or logos.`,
    payload.extraPrompt ? `Extra instructions: ${payload.extraPrompt}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function callGeminiVeoApi(
  config: ReturnType<typeof getAiShortsConfig>,
  prompt: string,
  durationSeconds: number
): Promise<string> {
  const baseUrl = normalizeGeminiBaseUrl(config.apiUrl);
  const model = encodeURIComponent(config.model || GEMINI_DEFAULT_MODEL);
  const startResponse = await fetch(`${baseUrl}/models/${model}:predictLongRunning`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": config.apiKey,
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        aspectRatio: "9:16",
        durationSeconds: String(durationSeconds),
        numberOfVideos: 1,
      },
    }),
  });

  const startData = (await startResponse.json().catch(() => ({}))) as GeminiOperationResponse;
  if (!startResponse.ok) {
    throw new Error(readGeminiError(startData, `Gemini Veo lỗi HTTP ${startResponse.status}`));
  }

  const operationName = typeof startData.name === "string" ? startData.name : "";
  if (!operationName) {
    throw new Error("Gemini Veo không trả operation name.");
  }

  return pollGeminiVeoOperation(baseUrl, config.apiKey, operationName);
}

async function pollGeminiVeoOperation(baseUrl: string, apiKey: string, operationName: string) {
  const operationUrl = `${baseUrl}/${operationName}`;
  const maxAttempts = 72;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await delay(attempt === 0 ? 3000 : 5000);

    const response = await fetch(operationUrl, {
      headers: { "x-goog-api-key": apiKey },
    });
    const data = (await response.json().catch(() => ({}))) as GeminiOperationResponse;

    if (!response.ok) {
      throw new Error(readGeminiError(data, `Gemini Veo polling lỗi HTTP ${response.status}`));
    }

    if (!data.done) {
      continue;
    }

    if (data.error) {
      throw new Error(readGeminiError(data, "Gemini Veo không tạo được video."));
    }

    const uri = findGeminiVideoUri(data);
    if (uri) {
      return uri;
    }

    throw new Error("Gemini Veo hoàn tất nhưng không trả video URI.");
  }

  throw new Error("Gemini Veo tạo video quá lâu. Hãy thử lại sau hoặc giảm độ phức tạp prompt.");
}

async function downloadGeminiVideo(videoUrl: string, outputPath: string, apiKey: string) {
  const response = await fetch(videoUrl, {
    headers: { "x-goog-api-key": apiKey },
  });

  if (!response.ok) {
    throw new Error(`Không tải được video Gemini Veo. HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outputPath, buffer);
}

function normalizeGeminiBaseUrl(value: string) {
  return (value || GEMINI_DEFAULT_API_URL).replace(/\/+$/, "");
}

function findGeminiVideoUri(data: GeminiOperationResponse) {
  const samples = data.response?.generateVideoResponse?.generatedSamples;
  if (Array.isArray(samples)) {
    for (const sample of samples) {
      const uri = sample?.video?.uri;
      if (typeof uri === "string" && uri.trim()) {
        return uri.trim();
      }
    }
  }

  const generatedVideos = data.response?.generatedVideos;
  if (Array.isArray(generatedVideos)) {
    for (const item of generatedVideos) {
      const uri = item?.video?.uri;
      if (typeof uri === "string" && uri.trim()) {
        return uri.trim();
      }
    }
  }

  return "";
}

function readGeminiError(data: GeminiOperationResponse, fallback: string) {
  const message = data.error?.message || data.message;
  return typeof message === "string" && message.trim() ? message.trim() : fallback;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildEditArgs(params: {
  inputPath: string;
  outputPath: string;
  aspectRatio: VideoAspectRatio;
  fitMode: VideoFitMode;
  trimStartSeconds: number;
  maxDurationSeconds: number;
}) {
  const dimensions = VIDEO_DIMENSIONS[params.aspectRatio];
  const videoFilter = buildVideoFilter(dimensions.width, dimensions.height, params.fitMode);
  return [
    "-y",
    ...(params.trimStartSeconds > 0 ? ["-ss", String(params.trimStartSeconds)] : []),
    "-i",
    params.inputPath,
    ...(params.maxDurationSeconds > 0 ? ["-t", String(params.maxDurationSeconds)] : []),
    "-vf",
    videoFilter,
    "-c:v",
    "libx264",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    params.outputPath,
  ];
}

function buildVideoFilter(width: number, height: number, fitMode: VideoFitMode) {
  if (fitMode === "contain") {
    return [
      `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`,
      "setsar=1",
    ].join(",");
  }

  return [`scale=${width}:${height}:force_original_aspect_ratio=increase`, `crop=${width}:${height}`, "setsar=1"].join(",");
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, numeric));
}

function isSortAlgorithm(value: unknown): value is SortAlgorithm {
  return typeof value === "string" && value in ALGORITHM_LABELS;
}

type GeminiOperationResponse = {
  name?: string;
  done?: boolean;
  message?: string;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
  response?: {
    generateVideoResponse?: {
      generatedSamples?: Array<{
        video?: {
          uri?: string;
        };
      }>;
    };
    generatedVideos?: Array<{
      video?: {
        uri?: string;
      };
    }>;
  };
};
