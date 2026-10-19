#!/usr/bin/env node
/**
 * Verify actual decoded-frame count and technical quality of a Math Video MP4.
 * Usage: node scripts/verify-math-video-render.mjs file.mp4 [expectedFrames]
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import ffprobe from "@ffprobe-installer/ffprobe";

const filePath = process.argv[2];
const expectedFrames = Number(process.argv[3] ?? 15217);
if (!filePath || !Number.isInteger(expectedFrames) || expectedFrames < 1) {
  throw new Error("Usage: node scripts/verify-math-video-render.mjs path.mp4 [expectedFrames]");
}
assert.ok(fs.statSync(filePath).size > 1000, "MP4 is missing or empty");
const output = execFileSync(ffprobe.path, [
  "-v", "error", "-count_frames", "-select_streams", "v:0",
  "-show_entries", "stream=codec_name,width,height,avg_frame_rate,nb_read_frames,duration",
  "-of", "json", filePath,
], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
const video = JSON.parse(output).streams?.[0];
assert.ok(video, "No video stream found");
assert.equal(video.codec_name, "h264", "Wrong video codec");
assert.equal(video.width, 1280, "Wrong output width");
assert.equal(video.height, 720, "Wrong output height");
const [numerator, denominator] = String(video.avg_frame_rate).split("/").map(Number);
assert.ok(denominator > 0 && Math.abs(numerator / denominator - 25) < 0.0001, "Wrong FPS");
assert.equal(Number(video.nb_read_frames), expectedFrames, "Decoded frame count mismatch");
const actualDuration = Number(video.duration);
assert.ok(Number.isFinite(actualDuration), "Missing decoded video duration");
assert.ok(Math.abs(actualDuration - expectedFrames / 25) <= 0.04, "Video duration mismatch");
console.log(JSON.stringify({
  ok: true, filePath, frames: Number(video.nb_read_frames), fps: 25,
  durationSeconds: actualDuration, width: video.width, height: video.height,
  codec: video.codec_name, fileBytes: fs.statSync(filePath).size,
}, null, 2));
