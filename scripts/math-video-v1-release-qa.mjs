#!/usr/bin/env node
/**
 * KAI Math v1 release gate. Nonzero exit for any failed validation.
 * Default: inspect source manifest only (NOT release approval).
 * --video /path/to/rendered.mp4: verify decoded 15,217 frames / 25 FPS / 720p.
 * --require-audio: require 48kHz AAC voice track in MP4.
 * --release: require explicit reviewed-fidelity evidence in an external JSON file
 *   supplied by --acceptance; never self-certify source fidelity.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require=createRequire(import.meta.url);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const value=(flag)=>{const i=args.indexOf(flag);return i<0?null:args[i+1]||null;};
const has=(flag)=>args.includes(flag);
const problems=[],checks=[],warnings=[];
function check(name,condition,detail=""){
  checks.push({name,passed:Boolean(condition),detail});
  if(!condition)problems.push(name+(detail?": "+detail:""));
}
function number(v){return typeof v==="number"&&Number.isFinite(v)?v:null;}
function within(actual,wanted,epsilon){return number(actual)!==null&&Math.abs(actual-wanted)<=epsilon;}
function ratio(s){const a=String(s||"0/0").split("/").map(Number);return a.length===2&&a[1]?a[0]/a[1]:NaN;}
function loadJSON(file){return JSON.parse(fs.readFileSync(file,"utf8"));}
function probe(file){
  let executable=process.env.FFPROBE_EXE||"";
  if(!executable){try{executable=require("@ffprobe-installer/ffprobe").path;}catch{executable="ffprobe";}}
  const output=execFileSync(executable,[
    "-v","error","-count_frames","-show_entries",
    "stream=codec_type,codec_name,width,height,avg_frame_rate,nb_read_frames,duration,sample_rate:format=duration",
    "-of","json",file,
  ],{encoding:"utf8",maxBuffer:4*1024*1024});
  return JSON.parse(output);
}
try{
  const manifest=loadJSON(path.join(root,"docs/video-references/math-sincos-v1.scene-manifest.json"));
  const fps=manifest.source?.fps,frames=manifest.source?.totalFrames;
  const chapters=manifest.sceneChapters||[],beats=manifest.referenceBeats||[];
  check("source-format",fps===25&&frames===15217&&manifest.source.width===1280&&manifest.source.height===720);
  check("source-not-frame-certified",manifest.verification.sourceShotBoundariesVerified===false,
    "A coarse timeline must not claim verified source cuts.");
  check("chapters-count",chapters.length===12);
  check("beats-count",beats.length===36);
  function continuous(items,from,to){
    if(!items.length)return false;
    let current=from;
    for(const item of items){
      if(!Number.isInteger(item.startFrame)||!Number.isInteger(item.endFrame)
        ||item.startFrame!==current||item.endFrame<=current)return false;
      current=item.endFrame;
    }
    return current===to;
  }
  check("chapters-continuous",continuous(chapters,0,frames));
  check("reference-beats-continuous",continuous(beats,1000,frames));
  check("beat-in-own-chapter",beats.every(beat=>chapters.some(ch=>
    beat.chapterId===ch.id&&beat.startFrame>=ch.startFrame&&beat.endFrame<=ch.endFrame)));
  check("unique-beat-ids",new Set(beats.map(b=>b.id)).size===36);
  check("timebase",within(frames/fps,608.68,1e-8));
  if(!has("--video"))warnings.push("No rendered MP4 supplied: source/manifest validation only, not release verification.");
  if(has("--video")){
    const videoPath=value("--video");
    check("video-present",Boolean(videoPath&&fs.existsSync(videoPath)));
    if(videoPath&&fs.existsSync(videoPath)){
      const meta=probe(videoPath);
      const streams=meta.streams||[];
      const video=streams.find(s=>s.codec_type==="video");
      const audio=streams.find(s=>s.codec_type==="audio");
      check("video-h264",video?.codec_name==="h264");
      check("video-720p",video?.width===1280&&video?.height===720);
      check("video-constant-fps",within(ratio(video?.avg_frame_rate),25,0.0001),
        String(video?.avg_frame_rate||"missing"));
      check("video-decoded-frames",Number(video?.nb_read_frames)===15217,
        `found ${video?.nb_read_frames||"none"}, expected 15217`);
      check("video-length",within(Number(video?.duration),608.68,0.05));
      check("container-length",within(Number(meta.format?.duration),608.68,0.1));
      if(has("--require-audio")){
        check("audio-present",Boolean(audio));
        check("audio-aac",audio?.codec_name==="aac");
        check("audio-48khz",Number(audio?.sample_rate)===48000);
      } else if(!audio){
        warnings.push("Rendered MP4 contains no audio. Task 06 voiceover acceptance remains outstanding.");
      }
    }
  }
  if(has("--release")){
    check("release-requires-voice-track",has("--require-audio"));
    const accepted=value("--acceptance");
    check("acceptance-evidence-provided",Boolean(accepted&&fs.existsSync(accepted)));
    if(accepted&&fs.existsSync(accepted)){
      const evidence=loadJSON(accepted);
      check("source-visuals-reviewed",evidence.visualReviewed===true);
      check("source-audio-rights-reviewed",evidence.audioRightsReviewed===true);
      check("narration-reviewed",evidence.narrationReviewed===true);
      check("explicit-source-fidelity-accepted",evidence.overallFidelityAccepted===true);
      check("source-checksum-accepted",evidence.referenceSourceSha256===manifest.source.sha256);
      check("reviewer-identified",typeof evidence.reviewedBy==="string"&&evidence.reviewedBy.trim().length>=2);
      check("review-date-present",typeof evidence.reviewedAt==="string"&&/^20\\d\\d-\\d{2}-\\d{2}/.test(evidence.reviewedAt));
      check("all-scenes-reviewed",Array.isArray(evidence.reviewedBeatIds)
        && beats.every(beat=>evidence.reviewedBeatIds.includes(beat.id)));
    }
    check("release-video-present",has("--video"));
  }
  const report={
    ok:problems.length===0,releaseReady:problems.length===0&&has("--release"),
    mode:has("--release")?"release":has("--video")?"render-check":"manifest-only",
    checks,warnings,problems,checkedAt:new Date().toISOString(),
  };
  console.log(JSON.stringify(report,null,2));
  if(problems.length)process.exitCode=1;
}catch(error){
  console.error(JSON.stringify({ok:false,releaseReady:false,error:error instanceof Error?error.message:String(error)}));
  process.exitCode=1;
}
