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
const outputRoot = path.resolve(process.argv[3] || "artifacts/super-mario-3d-runtime");
const presetIndex = Number(process.argv[4] ?? 2);
const midiPath = path.resolve("src/assets/audios/midis/SuperMarioMakerTitleTheme.mid");
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
    const task = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) task.reject(new Error(message.error.message));
    else task.resolve(message.result);
  }
  if (message.method === "Runtime.exceptionThrown") browserErrors.push(message.params.exceptionDetails?.text || "Runtime exception");
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") browserErrors.push(message.params.entry.text);
});
socket.on("close", () => {
  for (const task of pending.values()) task.reject(new Error("Browser debugging connection closed."));
  pending.clear();
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

async function waitFor(expression, label, timeoutMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

async function screenshot(name) {
  const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const targetPath = path.join(runDir, name);
  fs.writeFileSync(targetPath, Buffer.from(result.data, "base64"));
  return targetPath;
}

async function seekTo(ratio) {
  const moved = await evaluate(`(() => {
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
  if (!moved) throw new Error("Timeline slider was not found.");
  await new Promise((resolve) => setTimeout(resolve, 1_000));
}

async function uploadMidi() {
  const result = await send("Runtime.evaluate", {
    expression: `document.querySelector('input[type="file"][accept*=".mid"]')`,
    returnByValue: false,
  });
  const objectId = result.result.objectId;
  if (!objectId) throw new Error("MIDI file input was not found.");
  const described = await send("DOM.describeNode", { objectId });
  await send("DOM.setFileInputFiles", {
    files: [midiPath],
    backendNodeId: described.node.backendNodeId,
  });
}

function downloadedWebms() {
  return fs.readdirSync(runDir)
    .filter((name) => name.endsWith(".webm") && !name.endsWith(".crdownload"))
    .map((name) => path.join(runDir, name));
}

async function exportClip() {
  const previous = new Set(downloadedWebms());
  const clicked = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => /Export clip WebM|Xuất đoạn WebM/i.test(item.textContent || ''));
    if (!button || button.disabled) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error("WebM export button was unavailable.");
  await waitFor(`(() => [...document.querySelectorAll('button')].some((item) => /Recording WebM|Đang ghi WebM/i.test(item.textContent || '')))()`, "recording start", 15_000);
  const started = Date.now();
  while (Date.now() - started < 90_000) {
    const result = downloadedWebms().find((file) => !previous.has(file) && fs.statSync(file).size > 0);
    if (result) {
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      const targetPath = path.join(runDir, `super-mario-preset-${presetIndex}-3d.webm`);
      fs.renameSync(result, targetPath);
      return targetPath;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("3D clip did not download.");
}

function verifyMedia(filePath) {
  const result = spawnSync(ffprobePath, [
    "-v", "error", "-count_frames",
    "-show_entries", "stream=codec_name,codec_type,width,height,sample_rate,channels,nb_read_frames:format=duration",
    "-of", "json", filePath,
  ], { encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error(result.stderr);
  const probe = JSON.parse(result.stdout);
  const video = probe.streams.find((stream) => stream.codec_type === "video");
  const audio = probe.streams.find((stream) => stream.codec_type === "audio");
  const frameCount = Number(video?.nb_read_frames ?? 0);
  const readLastTimestamp = (stream, entries) => {
    const timestamps = spawnSync(ffprobePath, [
      "-v", "error", "-select_streams", stream,
      "-show_entries", entries, "-of", "csv=p=0", filePath,
    ], { encoding: "utf8", windowsHide: true });
    if (timestamps.status !== 0) throw new Error(timestamps.stderr);
    const last = timestamps.stdout.trim().split(/\r?\n/).at(-1)?.split(",").map(Number) ?? [];
    return last.filter(Number.isFinite).reduce((sum, value) => sum + value, 0);
  };
  const declaredDuration = Number(probe.format.duration);
  const videoDuration = readLastTimestamp("v:0", "frame=best_effort_timestamp_time");
  const audioDuration = readLastTimestamp("a:0", "packet=pts_time,duration_time");
  const durationSeconds = Number.isFinite(declaredDuration) ? declaredDuration : Math.max(videoDuration, audioDuration);
  const summary = {
    videoCodec: video?.codec_name,
    width: video?.width,
    height: video?.height,
    frameCount,
    durationSeconds: Number(durationSeconds.toFixed(3)),
    videoDurationSeconds: Number(videoDuration.toFixed(3)),
    effectiveFps: Number((frameCount / videoDuration).toFixed(1)),
    audioCodec: audio?.codec_name,
    sampleRate: Number(audio?.sample_rate ?? 0),
    channels: audio?.channels,
  };
  if (summary.width !== 720 || summary.height !== 1280) throw new Error(`Unexpected export dimensions: ${JSON.stringify(summary)}`);
  if (!audio || summary.sampleRate !== 48_000 || summary.channels !== 2) throw new Error(`Invalid export audio: ${JSON.stringify(summary)}`);
  if (!Number.isFinite(summary.durationSeconds) || !Number.isFinite(summary.effectiveFps) || summary.videoDurationSeconds < 14 || summary.durationSeconds < 14 || summary.effectiveFps < 40) {
    throw new Error(`Unstable export: ${JSON.stringify(summary)}`);
  }
  return summary;
}

function createContactSheet(videoPath) {
  const targetPath = path.join(runDir, "super-mario-3d-contact-sheet.png");
  const result = spawnSync(ffmpegPath, [
    "-y", "-v", "error", "-i", videoPath,
    "-vf", "fps=2/3,scale=240:-1,tile=5x2", "-frames:v", "1", targetPath,
  ], { encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error(`Contact sheet failed: ${result.stderr}`);
  return targetPath;
}

async function inspectPageState() {
  await send("Runtime.enable");
  await send("Log.enable");
  await new Promise((resolve) => setTimeout(resolve, 500));
  const state = await evaluate(`(() => ({
    url: location.href,
    title: document.title,
    visibilityState: document.visibilityState,
    hasFocus: document.hasFocus(),
    sourceFiles: [...document.querySelectorAll('input[type="file"]')].map((input) => ({
      accept: input.accept,
      files: [...(input.files || [])].map((file) => file.name),
    })),
    presetCount: document.querySelectorAll('button.rhythmic-preset').length,
    canvasCount: document.querySelectorAll('canvas').length,
    gpu: (() => {
      const canvas = document.querySelector('canvas');
      const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
      const debug = gl?.getExtension('WEBGL_debug_renderer_info');
      return debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER);
    })(),
    sliders: [...document.querySelectorAll('[role="slider"]')].map((slider) => ({
      label: slider.getAttribute('aria-label'),
      min: slider.getAttribute('aria-valuemin'),
      max: slider.getAttribute('aria-valuemax'),
      now: slider.getAttribute('aria-valuenow'),
    })),
    text: (document.body?.innerText || '').split('\\n').filter((line) => /MIDI|course|đường chạy|\\d{2}:\\d{2}|SuperMario|3D|error|lỗi/i.test(line)).slice(0, 80),
  }))()`);
  const rafFps = await evaluate(`new Promise((resolve) => {
    let frames = 0;
    const started = performance.now();
    const sample = () => {
      frames += 1;
      if (performance.now() - started >= 1000) resolve(Number((frames * 1000 / (performance.now() - started)).toFixed(1)));
      else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  })`);
  return { ...state, rafFps };
}

if (process.argv[5] === "inspect") {
  const state = await inspectPageState();
  process.stdout.write(`${JSON.stringify({ state, browserErrors }, null, 2)}\n`);
  socket.close();
  process.exit(0);
}

try {
  await send("Page.enable");
  await send("Page.bringToFront");
  await send("DOM.enable");
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1200, deviceScaleFactor: 1, mobile: false });
  await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: runDir, eventsEnabled: true });
  await waitFor(`document.querySelectorAll('button.rhythmic-preset').length >= 7`, "preset controls");

  await evaluate(`(() => {
    const button = document.querySelectorAll('button.rhythmic-preset')[${presetIndex}];
    if (button?.getAttribute('aria-pressed') !== 'true') button?.click();
  })()`);
  await waitFor(`document.querySelectorAll('button.rhythmic-preset')[${presetIndex}]?.getAttribute('aria-pressed') === 'true'`, "requested preset");
  const sourceAlreadyLoaded = await evaluate(`/SuperMarioMakerTitleTheme\\.mid/i.test(document.body?.innerText || '')`);
  if (!sourceAlreadyLoaded) await uploadMidi();
  await waitFor(`(() => {
    const body = document.body?.innerText || '';
    const timeline = document.querySelector('[role="slider"][aria-label="Marble music timeline"]');
    return /SuperMarioMakerTitleTheme\.mid/i.test(body)
      && !/Preparing marble course|Đang chuẩn bị đường chạy/i.test(body)
      && Number(timeline?.getAttribute('aria-valuemax') || 0) >= 149000;
  })()`, "Super Mario MIDI course", 180_000);

  await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => /3D WebGL|WebGL 3D/.test(item.textContent || ''));
    if (button?.getAttribute('aria-pressed') !== 'true') button?.click();
  })()`);
  await waitFor(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => /3D WebGL|WebGL 3D/.test(item.textContent || ''));
    return button?.getAttribute('aria-pressed') === 'true' && /3D master ready|Bản 3D sẵn sàng/.test(document.body.innerText);
  })()`, "3D WebGL scene");

  const screenshots = [];
  for (const ratio of [0.04, 0.12, 0.3, 0.55, 0.8]) {
    await seekTo(ratio);
    screenshots.push(await screenshot(`three-${String(Math.round(ratio * 100)).padStart(2, "0")}.png`));
  }

  await seekTo(0.12);
  const clipped = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((item) => item.textContent?.trim() === '15s');
    button?.click();
    return Boolean(button);
  })()`);
  if (!clipped) throw new Error("15-second trim control was not found.");
  await new Promise((resolve) => setTimeout(resolve, 500));
  const videoPath = await exportClip();
  const media = verifyMedia(videoPath);
  const contactSheet = createContactSheet(videoPath);
  const bodySummary = await evaluate(`(() => ({
    title: document.title,
    activePreset: [...document.querySelectorAll('button.rhythmic-preset')].findIndex((item) => item.getAttribute('aria-pressed') === 'true'),
    active3D: [...document.querySelectorAll('button')].find((item) => /3D WebGL|WebGL 3D/.test(item.textContent || ''))?.getAttribute('aria-pressed') === 'true',
    canvasCount: document.querySelectorAll('canvas').length,
    sourceLoaded: /SuperMarioMakerTitleTheme\\.mid/i.test(document.body.innerText),
  }))()`);
  const unexpectedErrors = [...new Set(browserErrors)].filter((error) => !/(?:localhost|127\.0\.0\.1):5050\b|Failed to load resource: net::ERR_CONNECTION_REFUSED/.test(error));
  if (unexpectedErrors.length) throw new Error(`Unexpected browser errors: ${JSON.stringify(unexpectedErrors)}`);
  const report = { runDir, midiPath, bodySummary, screenshots, videoPath, contactSheet, media };
  fs.writeFileSync(path.join(runDir, "runtime-report.json"), JSON.stringify(report, null, 2));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  socket.close();
}
