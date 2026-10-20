import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders } from "@/lib/runtimeSettings";

export type MathV1DefaultAudio = {
  enabled:boolean;
  relativePath?:string;
  audioUrl?:string;
  codec?:string;
  durationSeconds?:number;
};
export async function getMathV1DefaultAudio() {
  return parseApiResponse<MathV1DefaultAudio>(
    await fetch(buildApiUrl("/api/video/math-v1/default-audio"),{
      headers:buildRuntimeSettingsHeaders(),
    }),
  );
}
export async function uploadMathV1DefaultAudio(file:File) {
  const form=new FormData();
  form.append("audio",file,file.name);
  return parseApiResponse<MathV1DefaultAudio>(
    await fetch(buildApiUrl("/api/video/math-v1/default-audio"),{
      method:"POST",
      headers:buildRuntimeSettingsHeaders(), // Browser provides multipart boundary.
      body:form,
    }),
  );
}
