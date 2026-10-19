import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders } from "@/lib/runtimeSettings";

export type GeneratedNarrationClip = { cueId:string; audioRelativePath:string };
export type MathNarrationMixResult = {
  ok:true;relativePath:string;audioUrl:string;cueCount:number;totalCues:number;
  durationSeconds:number;warnings:string[];
};
export async function mixMathNarrationClips(clips:GeneratedNarrationClip[]) {
  return parseApiResponse<MathNarrationMixResult>(await fetch(buildApiUrl("/api/video/math-narration/mix"),{
    method:"POST",
    headers:buildRuntimeSettingsHeaders({"Content-Type":"application/json"}),
    body:JSON.stringify({clips}),
  }));
}
