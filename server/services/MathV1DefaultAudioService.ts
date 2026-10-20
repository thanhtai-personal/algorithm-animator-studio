import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { GENERATED_PUBLIC_PATH, SERVER_ORIGIN, buildGeneratedFileUrl, getGeneratedDir } from "../config/paths";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import { runFfprobe } from "../utils/ffmpeg";

const ROOT_NAME = "math-v1-default";
const BASE_NAME = "reference-voice";
const DURATION = 15217 / 25;
const MAX_BYTES = 40 * 1024 * 1024;
const AUDIO_EXTENSIONS = { mp3: ".mp3", aac: ".m4a", pcm_s16le: ".wav" } as const;
type SupportedCodec = keyof typeof AUDIO_EXTENSIONS;
type ProbeResult = {
  streams?: { codec_type?: string; codec_name?: string; sample_rate?: string; channels?: number }[];
  format?: { duration?: string };
};
export type DefaultAudioMetadata = { fileName: string; codec: SupportedCodec; durationSeconds: number };
function baseDir(envOverrides:RuntimeEnvValues) {
  const env = readEnvValues(envOverrides);
  return path.join(getGeneratedDir(env.SERVER_DATA_DIR), ROOT_NAME);
}
function metadataFile(envOverrides:RuntimeEnvValues) {
  return path.join(baseDir(envOverrides),"default.json");
}
/** Persistent, server-owned generated audio. A chat attachment is not implicitly copied to a user's computer. */
export function getMathV1DefaultAudio(envOverrides:RuntimeEnvValues={}) {
  try {
    const data=JSON.parse(fs.readFileSync(metadataFile(envOverrides),"utf8")) as DefaultAudioMetadata;
    if(!Object.prototype.hasOwnProperty.call(AUDIO_EXTENSIONS,data.codec))return {enabled:false as const};
    if(data.fileName!==BASE_NAME+AUDIO_EXTENSIONS[data.codec])return {enabled:false as const};
    const absolutePath=path.join(baseDir(envOverrides),data.fileName);
    if(!fs.existsSync(absolutePath))return {enabled:false as const};
    const env=readEnvValues(envOverrides);
    const relativePath=`${ROOT_NAME}/${data.fileName}`;
    return {
      enabled:true as const,relativePath,
      audioUrl:buildGeneratedFileUrl(GENERATED_PUBLIC_PATH,relativePath,env.SERVER_ORIGIN||SERVER_ORIGIN),
      durationSeconds:data.durationSeconds,codec:data.codec,
    };
  }catch{return {enabled:false as const};}
}
export async function importMathV1DefaultAudio(sourcePath:string, envOverrides:RuntimeEnvValues={}) {
  if(!fs.existsSync(sourcePath))throw new Error("Không tìm thấy file âm thanh.");
  const stat=fs.statSync(sourcePath);
  if(!stat.isFile()||stat.size<1024||stat.size>MAX_BYTES)throw new Error("File audio phải dưới 40 MB.");
  const probe=await runFfprobe(["-v","error","-show_entries",
    "format=duration:stream=codec_type,codec_name,sample_rate,channels","-of","json",sourcePath],envOverrides);
  const data=JSON.parse(probe.stdout) as ProbeResult;
  const audio=data.streams?.find(s=>s.codec_type==="audio");
  if(!audio||data.streams?.some(s=>s.codec_type==="video"))throw new Error("Chỉ nhận file audio, không nhận video.");
  const codec=audio.codec_name as SupportedCodec|undefined;
  if(!codec||!Object.prototype.hasOwnProperty.call(AUDIO_EXTENSIONS,codec))
    throw new Error("Chỉ hỗ trợ MP3, M4A/AAC hoặc PCM WAV.");
  const duration=Number(data.format?.duration);
  if(!Number.isFinite(duration)||Math.abs(duration-DURATION)>1)
    throw new Error(`Audio phải dài xấp xỉ ${DURATION.toFixed(2)} giây; file này dài ${duration.toFixed(2)} giây.`);
  const dest=baseDir(envOverrides);
  fs.mkdirSync(dest,{recursive:true});
  const fileName=BASE_NAME+AUDIO_EXTENSIONS[codec],absolutePath=path.join(dest,fileName);
  const temporary=path.join(dest,`upload-${randomUUID()}.tmp`);
  try{
    fs.copyFileSync(sourcePath,temporary);
    fs.renameSync(temporary,absolutePath);
    const meta:DefaultAudioMetadata={fileName,codec,durationSeconds:duration};
    fs.writeFileSync(metadataFile(envOverrides),JSON.stringify(meta,null,2)+"\n");
    for(const ext of Object.values(AUDIO_EXTENSIONS)){
      if(ext!==AUDIO_EXTENSIONS[codec])fs.rmSync(path.join(dest,BASE_NAME+ext),{force:true});
    }
  }finally{fs.rmSync(temporary,{force:true});}
  return getMathV1DefaultAudio(envOverrides);
}
