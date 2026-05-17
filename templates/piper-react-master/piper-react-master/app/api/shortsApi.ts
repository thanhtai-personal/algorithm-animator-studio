import { buildApiUrl, withRuntimeSettingsHeaders } from "../utils/appSettingsStorage";
import type { VideoAspectRatio, VideoFitMode } from "./videoApi";

export type SortAlgorithm =
  | "bubble"
  | "selection"
  | "insertion"
  | "quick"
  | "merge"
  | "heap"
  | "counting"
  | "radix"
  | "shell"
  | "custom";

export type AiShortsConfigResponse = {
  ok: boolean;
  configured: boolean;
  provider: string;
  model: string;
};

export type AiShortsVideoResult = {
  ok: boolean;
  fileName: string;
  relativePath: string;
  videoUrl: string;
  source: "ai" | "edit";
  prompt?: string;
  provider?: string;
  model?: string;
};

export type GenerateAiShortsPayload = {
  algorithm: SortAlgorithm;
  customAlgorithmName?: string;
  itemCount: number;
  durationSeconds: number;
  stylePrompt: string;
  palettePrompt: string;
  extraPrompt: string;
  videoFileName: string;
};

export type EditAiShortsPayload = {
  relativePath: string;
  aspectRatio: VideoAspectRatio;
  fitMode: VideoFitMode;
  trimStartSeconds: number;
  maxDurationSeconds: number;
  videoFileName: string;
};

export async function getAiShortsConfig(): Promise<AiShortsConfigResponse> {
  const response = await fetch(buildApiUrl("/api/shorts/config"), {
    headers: withRuntimeSettingsHeaders(),
  });
  return parseShortsResponse<AiShortsConfigResponse>(response);
}

export async function generateAiShorts(payload: GenerateAiShortsPayload): Promise<AiShortsVideoResult> {
  const response = await fetch(buildApiUrl("/api/shorts/generate"), {
    method: "POST",
    headers: withRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return parseShortsResponse<AiShortsVideoResult>(response);
}

export async function editAiShorts(payload: EditAiShortsPayload): Promise<AiShortsVideoResult> {
  const response = await fetch(buildApiUrl("/api/shorts/edit"), {
    method: "POST",
    headers: withRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return parseShortsResponse<AiShortsVideoResult>(response);
}

async function parseShortsResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string; detail?: string };

  if (!response.ok) {
    throw new Error(data.detail || data.error || "AI Shorts request failed.");
  }

  return data as T;
}
