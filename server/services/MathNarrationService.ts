import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { GENERATED_PUBLIC_PATH, SERVER_ORIGIN, buildGeneratedFileUrl, getGeneratedDir } from "../config/paths";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import { resolveGeneratedResource } from "./ResourceService";
import { getAudioDurationSeconds, runFfmpeg } from "../utils/ffmpeg";
import { ensureDirectoryExists, getLocalDateFolderName } from "../utils/audioOutput";
import { MATH_NARRATION_CUES, mathNarrationCueById } from "../../src/features/math-video/mathNarrationCues";
import { MATH_FPS, MATH_FRAMES } from "../../src/features/math-video/mathTimeline";
import { buildNarrationFilterGraph } from "../../src/features/math-video/mathNarrationMixPlan";

export type MathNarrationMixClip = { cueId:string; audioRelativePath:string };
export type MathNarrationMixRequest = { clips:MathNarrationMixClip[] };
type FilterClip = { filePath:string; cueId:string; startFrame:number; endFrame:number; duration:number };

/**
 * Assemble user-created TTS clips against the global frame timeline.
 * Audio is deliberately never copied from the user-provided reference MP4.
 * All source files must already exist in KAI STUDIO's generated-audio library.
 */
export async function mixMathNarration(input:MathNarrationMixRequest, envOverrides:RuntimeEnvValues={}) {
  if (!Array.isArray(input?.clips) || input.clips.length < 1 || input.clips.length > MATH_NARRATION_CUES.length) {
    throw new Error("Cần 1 đến 37 file giọng đọc đã tạo hợp lệ.");
  }
  const seen=new Set<string>();
  const clips:FilterClip[]=input.clips.map(item=>{
    const cue=mathNarrationCueById.get(String(item?.cueId||""));
    if (!cue || seen.has(cue.id)) throw new Error("Mã phân cảnh giọng đọc không hợp lệ hoặc bị trùng.");
    seen.add(cue.id);
    const resolved=resolveGeneratedResource({kind:"audio",relativePath:String(item.audioRelativePath||"")},envOverrides);
    if (!fs.existsSync(resolved.absolutePath) || !fs.statSync(resolved.absolutePath).isFile()) {
      throw new Error(`Không tìm thấy audio đã tạo cho phân cảnh ${cue.id}.`);
    }
    return {
      filePath:resolved.absolutePath,cueId:cue.id,
      startFrame:cue.startFrame,endFrame:cue.endFrame,
      duration:(cue.endFrame-cue.startFrame)/MATH_FPS,
    };
  }).sort((a,b)=>a.startFrame-b.startFrame);

  const warnings:string[]=[];
  // Probe actual TTS lengths to explicitly warn when a voice line will be clipped.
  const measured=await Promise.all(clips.map(c=>getAudioDurationSeconds(c.filePath,envOverrides)));
  for (let i=0;i<clips.length;i++) {
    if(measured[i]>clips[i].duration+0.08) {
      warnings.push(`${clips[i].cueId}: giọng dài ${measured[i].toFixed(2)}s, cửa sổ ${clips[i].duration.toFixed(2)}s; phần vượt sẽ bị cắt.`);
    }
  }
  const env=readEnvValues(envOverrides);
  const folder=getLocalDateFolderName();
  const dir=path.join(getGeneratedDir(env.SERVER_DATA_DIR),"math-narration",folder);
  ensureDirectoryExists(dir);
  const filename=`math-sincos-voice-${randomUUID()}.m4a`;
  const target=path.join(dir,filename);
  const relativePath=`math-narration/${folder}/${filename}`;

  const filterGraph=buildNarrationFilterGraph(clips);
  const args=["-hide_banner","-loglevel","error","-y",
    ...clips.flatMap(c=>["-i",c.filePath]),
    "-filter_complex",filterGraph,"-map","[out]",
    "-c:a","aac","-b:a","160k","-ar","48000","-ac","2", "-movflags","+faststart",target];
  try {
    await runFfmpeg(args,envOverrides);
    if(!fs.existsSync(target) || fs.statSync(target).size<1000) throw new Error("Audio ghép bị rỗng.");
    return {
      ok:true,relativePath,
      audioUrl:buildGeneratedFileUrl(GENERATED_PUBLIC_PATH,relativePath,env.SERVER_ORIGIN||SERVER_ORIGIN),
      cueCount:clips.length,totalCues:MATH_NARRATION_CUES.length,
      durationSeconds:MATH_FRAMES/MATH_FPS,warnings,
    };
  } catch(e) {
    fs.rmSync(target,{force:true});
    throw e;
  }
}
