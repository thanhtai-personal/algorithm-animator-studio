import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders } from "@/lib/runtimeSettings";
import type { RemotionHealthResponse, RemotionRenderResponse, RemotionVideoInputProps } from "./remotionVideoTypes";

export async function renderRemotionVideo(input: RemotionVideoInputProps) {
  return parseApiResponse<RemotionRenderResponse>(await fetch(buildApiUrl("/api/video/render-remotion"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(input),
  }));
}

export async function checkRemotionHealth() {
  return parseApiResponse<RemotionHealthResponse>(await fetch(buildApiUrl("/api/video/remotion/health"), {
    headers: buildRuntimeSettingsHeaders(),
  }));
}
