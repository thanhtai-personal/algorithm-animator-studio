/**
 * T07 integrated Remotion smoke test: bundle -> select -> H.264 MP4 -> ffprobe.
 * Run in an installed repository: node scripts/verify-fashion-fan-render.mjs
 * Does not require the original user-supplied source footage or any network images.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import ffprobe from "@ffprobe-installer/ffprobe";

const fps = 30;
const frameCount = 296;
const durationSeconds = frameCount / fps;
const outputDirectory = path.resolve("generated-videos");
const outputLocation = path.join(outputDirectory, "fashion-fan-t07-qa.mp4");
const inputProps = {
  presetId: "fashion-claw",
  language: "vi",
  aspectRatio: "9:16",
  durationSeconds,
  fps,
  backgroundMusicUrl: "",
  backgroundMusicVolume: 0,
  originalAudioVolume: 0,
  voiceoverAudioUrl: "",
  voiceoverVolume: 0,
  lyricTimings: {},
  videoSourceUrls: {},
  timelineVideoClips: [],
};

async function run() {
  fs.mkdirSync(outputDirectory, { recursive: true });
  const serveUrl = await bundle({
    entryPoint: path.resolve("src/features/remotion-video/remotion/index.ts"),
    onProgress: (progress) => process.stdout.write(`Bundling ${Math.round(progress * 100)}%\r`),
  });
  const selected = await selectComposition({
    serveUrl,
    id: "PresetVideo",
    inputProps,
  });
  if (selected.durationInFrames !== frameCount || selected.fps !== fps) {
    throw new Error(`Wrong Remotion composition: ${selected.durationInFrames} frames at ${selected.fps} FPS`);
  }
  await renderMedia({
    codec: "h264",
    composition: { ...selected, width: 360, height: 640 },
    serveUrl,
    inputProps,
    outputLocation,
    frameRange: [0, frameCount - 1],
    concurrency: 2,
  });
  const result = spawnSync(ffprobe.path, [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=nb_frames,width,height,avg_frame_rate",
    "-show_entries", "format=duration", "-of", "json", outputLocation,
  ], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`ffprobe failed: ${result.stderr}`);
  const info = JSON.parse(result.stdout);
  const track = info.streams?.[0];
  if (Number(track?.nb_frames) !== frameCount
      || track?.avg_frame_rate !== "30/1"
      || track.width !== 360
      || track.height !== 640) {
    throw new Error(`Video mismatch: ${JSON.stringify(info)}`);
  }
  const report = {
    status: "PASS",
    sourceReference: "fashion-fan-t01.reference.json",
    actualFrameCount: Number(track.nb_frames),
    fps: track.avg_frame_rate,
    width: track.width,
    height: track.height,
    duration: Number(info.format?.duration),
    notes: "Integrated vector-only preset output. Human frame matching remains a manual QA step.",
  };
  const reportFile = path.join(outputDirectory, "fashion-fan-t07-report.json");
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + "\n");
  process.stdout.write("\n" + JSON.stringify({ outputLocation, report }, null, 2) + "\n");
}

run().catch((error) => {
  console.error("T07 Remotion smoke test failed:", error);
  process.exitCode = 1;
});
