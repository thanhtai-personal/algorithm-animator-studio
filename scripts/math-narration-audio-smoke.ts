/**
 * Actual FFmpeg codec smoke test for Task 06, no copyrighted source audio.
 * Two synthetic tones placed at exact 25fps-aligned frame offsets.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import ffmpeg from "@ffmpeg-installer/ffmpeg";
import ffprobe from "@ffprobe-installer/ffprobe";
import { buildNarrationFilterGraph } from "../src/features/math-video/mathNarrationMixPlan";

const dir=fs.mkdtempSync(path.join(os.tmpdir(),"kai-math-narration-"));
try {
  const files=[path.join(dir,"cue1.wav"),path.join(dir,"cue2.wav")];
  const times=[{startFrame:250,endFrame:500},{startFrame:1000,endFrame:1075}];
  for (const [i,file] of files.entries()) {
    execFileSync(ffmpeg.path,["-hide_banner","-loglevel","error","-y","-f","lavfi",
      "-i",`sine=frequency=${440+i*220}:sample_rate=48000:duration=1`,
      "-ac","2",file]);
  }
  const output=path.join(dir,"mixed.m4a");
  execFileSync(ffmpeg.path,["-hide_banner","-loglevel","error","-y",
    ...files.flatMap(f=>["-i",f]),"-filter_complex",buildNarrationFilterGraph(times),
    "-map","[out]","-c:a","aac","-b:a","160k","-ar","48000","-ac","2",output],
    {maxBuffer:2*1024*1024});
  const raw=execFileSync(ffprobe.path,["-v","error","-show_entries",
    "format=duration:stream=codec_name,sample_rate","-of","json",output],
    {encoding:"utf8"});
  const probe=JSON.parse(raw);
  assert.ok(Math.abs(Number(probe.format.duration)-608.68)<0.03,"Output must cover the 15,217-frame composition");
  assert.equal(probe.streams[0].codec_name,"aac");
  assert.equal(probe.streams[0].sample_rate,"48000");
  assert.ok(fs.statSync(output).size>1000);
  console.log(JSON.stringify({ok:true,audioSeconds:probe.format.duration,
    codec:probe.streams[0].codec_name,samplesPerSecond:probe.streams[0].sample_rate}));
} finally {
  fs.rmSync(dir,{recursive:true,force:true});
}
