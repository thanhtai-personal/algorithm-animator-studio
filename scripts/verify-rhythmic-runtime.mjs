import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import WebSocket from "ws";

const require = createRequire(import.meta.url);
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

const port = Number(process.argv[2] || 9333);
const outputRoot = path.resolve(process.argv[3] || "artifacts/rhythmic-runtime");
const runDir = path.join(outputRoot, `run-${Date.now()}`);
fs.mkdirSync(runDir, { recursive: true });

const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
const target = targets.find((item) => item.type === "page" && item.url.includes("/algorithms/rhythmic"));
if (!target) throw new Error("Rhythmic Studio browser target was not found.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.once("open", resolve);
  socket.once("error", reject);
});

let nextId = 1;
const pending = new Map();
const browserErrors = [];
socket.on("message", (raw) => {
  const message = JSON.parse(String(raw));
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
  if (message.method === "Runtime.exceptionThrown") {
    browserErrors.push(message.params.exceptionDetails?.text || "Runtime exception");
  }
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
    const { text, url } = message.params.entry;
    browserErrors.push(url ? `${text} (${url})` : text);
  }
});

function send(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Browser evaluation failed");
  return result.result.value;
}

async function waitFor(expression, label, timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

async function screenshot(name) {
  const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const filePath = path.join(runDir, name);
  fs.writeFileSync(filePath, Buffer.from(result.data, "base64"));
  return filePath;
}

async function seekTo(ratio) {
  await evaluate(`(() => {
    const timeline = document.querySelector('[role="slider"][aria-label="Marble music timeline"]');
    if (!timeline) return false;
    const bounds = timeline.getBoundingClientRect();
    timeline.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      clientX: bounds.left + bounds.width * ${ratio},
      clientY: bounds.top + bounds.height / 2,
    }));
    return true;
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 1_200));
}

function downloadedWebms() {
  return fs.readdirSync(runDir)
    .filter((name) => name.toLowerCase().endsWith(".webm") && !name.endsWith(".crdownload"))
    .map((name) => path.join(runDir, name));
}

function classifyBrowserErrors(errors) {
  const unique = [...new Set(errors)];
  const expected = unique.filter((error) => /(?:localhost|127\.0\.0\.1):5050\b/.test(error));
  const unexpected = unique.filter((error) => !expected.includes(error));
  return { expected, unexpected };
}

function verifyMedia(filePath, mode) {
  const result = spawnSync(ffprobePath, [
    "-v", "error",
    "-count_frames",
    "-show_entries", "stream=index,codec_name,codec_type,width,height,sample_rate,channels,nb_read_frames:packet=stream_index,pts_time",
    "-of", "json",
    filePath,
  ], { encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error(`ffprobe failed for ${mode}: ${result.stderr}`);
  const probe = JSON.parse(result.stdout);
  const video = probe.streams.find((stream) => stream.codec_type === "video");
  const audio = probe.streams.find((stream) => stream.codec_type === "audio");
  const videoPackets = probe.packets.filter((packet) => packet.stream_index === video?.index && Number.isFinite(Number(packet.pts_time)));
  const firstPts = Number(videoPackets[0]?.pts_time ?? 0);
  const lastPts = Number(videoPackets.at(-1)?.pts_time ?? 0);
  const durationSeconds = Math.max(0.001, lastPts - firstPts);
  const frameCount = Number(video?.nb_read_frames ?? 0);
  const effectiveFps = Math.max(0, frameCount - 1) / durationSeconds;
  const volumeResult = spawnSync(ffmpegPath, [
    "-v", "info", "-i", filePath, "-map", "0:a:0", "-af", "volumedetect", "-f", "null", "NUL",
  ], { encoding: "utf8", windowsHide: true });
  const maxVolumeDb = Number(volumeResult.stderr.match(/max_volume:\s*(-?[\d.]+) dB/)?.[1]);
  const summary = {
    videoCodec: video?.codec_name,
    width: video?.width,
    height: video?.height,
    frameCount,
    durationSeconds: Number(durationSeconds.toFixed(3)),
    effectiveFps: Number(effectiveFps.toFixed(1)),
    audioCodec: audio?.codec_name,
    sampleRate: Number(audio?.sample_rate ?? 0),
    channels: audio?.channels,
    maxVolumeDb,
  };
  if (summary.width !== 720 || summary.height !== 1280) throw new Error(`${mode} export is not 720x1280: ${JSON.stringify(summary)}`);
  if (!audio || summary.sampleRate !== 48_000 || summary.channels !== 2) throw new Error(`${mode} export audio is invalid: ${JSON.stringify(summary)}`);
  if (summary.effectiveFps < 40) throw new Error(`${mode} export is below the 40 FPS stability floor: ${JSON.stringify(summary)}`);
  if (!Number.isFinite(maxVolumeDb) || maxVolumeDb < -24 || maxVolumeDb > -2) throw new Error(`${mode} export audio is outside the mastered range: ${JSON.stringify(summary)}`);
  return summary;
}

async function exportWebm(mode, targetName) {
  const previous = new Set(downloadedWebms());
  const clicked = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => /WebM/i.test(item.textContent || ''));
    if (!button || button.disabled) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`The ${mode} WebM export button was unavailable.`);
  await waitFor(`(() => [...document.querySelectorAll('button')].some((item) => /Recording WebM|Đang ghi WebM/i.test(item.textContent || '')))()`, `${mode} recording start`, 15_000);
  const started = Date.now();
  let downloaded;
  while (Date.now() - started < 45_000) {
    downloaded = downloadedWebms().find((file) => !previous.has(file) && fs.statSync(file).size > 0);
    if (downloaded) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!downloaded) throw new Error(`${mode} export did not download a WebM file.`);
  const stableSize = fs.statSync(downloaded).size;
  await new Promise((resolve) => setTimeout(resolve, 800));
  if (fs.statSync(downloaded).size !== stableSize) await new Promise((resolve) => setTimeout(resolve, 800));
  const targetPath = path.join(runDir, targetName);
  fs.renameSync(downloaded, targetPath);
  return { path: targetPath, bytes: fs.statSync(targetPath).size };
}

try {
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1200, deviceScaleFactor: 1, mobile: false });
  await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: runDir, eventsEnabled: true });

  await waitFor(`(() => {
    const body = document.body?.innerText || '';
    const preparing = /Preparing marble course|Đang chuẩn bị đường chạy/i.test(body);
    return !preparing && document.querySelectorAll('canvas').length > 0 && /3D WebGL|WebGL 3D/.test(body);
  })()`, "prepared 3D course");

  await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => /3D WebGL|WebGL 3D/.test(item.textContent || ''));
    if (button?.getAttribute('aria-pressed') !== 'true') button?.click();
  })()`);
  await waitFor(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => /3D WebGL|WebGL 3D/.test(item.textContent || ''));
    return button?.getAttribute('aria-pressed') === 'true' && /3D master ready|Bản 3D sẵn sàng/.test(document.body.innerText);
  })()`, "active 3D WebGL mode");

  await seekTo(0.52);
  const threeScreenshot = await screenshot("three-mid-song.png");
  const initial = await evaluate(`(() => {
    const canvases = [...document.querySelectorAll('canvas')];
    const active3D = [...document.querySelectorAll('button')].find((item) => /3D WebGL|WebGL 3D/.test(item.textContent || ''));
    return {
      title: document.title,
      bodyHasThreeReady: /3D master ready|Bản 3D sẵn sàng/.test(document.body.innerText),
      active3D: active3D?.getAttribute('aria-pressed') === 'true',
      canvasCount: canvases.length,
      canvases: canvases.map((canvas) => ({ width: canvas.width, height: canvas.height, clientWidth: canvas.clientWidth, clientHeight: canvas.clientHeight })),
      webgl2: Boolean(canvases.some((canvas) => canvas.getContext('webgl2'))),
      timecode: [...document.querySelectorAll('p')].map((item) => item.textContent).find((text) => /^00:0[2-4]\./.test(text || '')) || null,
    };
  })()`);
  if (!initial.active3D || !initial.bodyHasThreeReady || initial.canvasCount < 1) {
    throw new Error(`3D readiness assertion failed: ${JSON.stringify(initial)}`);
  }
  fs.writeFileSync(path.join(runDir, "three-checkpoint.json"), JSON.stringify({ initial, browserErrors }, null, 2));
  process.stdout.write(`3D scene ready: ${JSON.stringify(initial)}\n`);

  const threeExport = await exportWebm("3D", "rhythmic-3d.webm");
  process.stdout.write(`3D export ready: ${JSON.stringify(threeExport)}\n`);
  await waitFor(`(() => ![...document.querySelectorAll('button')].some((item) => /Recording WebM|Đang ghi WebM/i.test(item.textContent || '')))()`, "3D recording completion", 15_000);

  const switched = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => /2D Canvas|Canvas 2D/.test(item.textContent || ''));
    if (!button || button.disabled) return false;
    button.click();
    return true;
  })()`);
  if (!switched) throw new Error("Could not select the 2D Canvas mode.");
  await waitFor(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => /2D Canvas|Canvas 2D/.test(item.textContent || ''));
    return button?.getAttribute('aria-pressed') === 'true' && /2D ready|2D sẵn sàng/.test(document.body.innerText);
  })()`, "active 2D Canvas mode");
  await seekTo(0.52);
  const twoScreenshot = await screenshot("two-mid-song.png");
  const twoExport = await exportWebm("2D", "rhythmic-2d.webm");
  process.stdout.write(`2D export ready: ${JSON.stringify(twoExport)}\n`);

  const media = {
    three: verifyMedia(threeExport.path, "3D"),
    two: verifyMedia(twoExport.path, "2D"),
  };
  process.stdout.write(`Media verified: ${JSON.stringify(media)}\n`);
  const classifiedErrors = classifyBrowserErrors(browserErrors);
  if (classifiedErrors.unexpected.length) {
    throw new Error(`Unexpected browser errors: ${JSON.stringify(classifiedErrors.unexpected)}`);
  }
  const report = { runDir, initial, browserErrors: classifiedErrors, threeScreenshot, twoScreenshot, threeExport, twoExport, media };
  fs.writeFileSync(path.join(runDir, "runtime-report.json"), JSON.stringify(report, null, 2));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  socket.close();
}
