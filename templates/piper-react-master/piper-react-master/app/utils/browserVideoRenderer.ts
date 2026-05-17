import type { GenerateVideoResponse, VideoAspectRatio, VideoBackgroundType, VideoFitMode } from "../api/videoApi";
import { addBrowserResource } from "./browserResourceStore";
import { getPreferredVideoMimeType } from "./publicRuntime";

export type BrowserVideoRenderPayload = {
  audioFile?: File;
  audioUrl?: string;
  aspectRatio: VideoAspectRatio;
  backgroundFile: File;
  backgroundType: VideoBackgroundType;
  fitMode: VideoFitMode;
  videoFileName: string;
  backgroundMusicUrl?: string;
  backgroundMusicVolume?: number;
  backgroundMusicLoop?: boolean;
  backgroundMusicFadeIn?: number;
  backgroundMusicFadeOut?: number;
};

const FPS = 30;
const DEFAULT_DURATION_SECONDS = 8;

export async function renderBrowserVideo(payload: BrowserVideoRenderPayload): Promise<GenerateVideoResponse> {
  if (typeof window === "undefined") {
    throw new Error("Chỉ có thể tạo video bằng trình duyệt ở phía client.");
  }

  const canvas = document.createElement("canvas") as HTMLCanvasElement & {
    captureStream?: (frameRate?: number) => MediaStream;
  };
  const captureStream = canvas.captureStream?.bind(canvas);

  if (!captureStream || typeof MediaRecorder === "undefined") {
    throw new Error("Trình duyệt này chưa hỗ trợ tạo video bằng canvas recorder.");
  }

  const { width, height } = getCanvasSize(payload.aspectRatio);
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Không tạo được canvas context để render video.");
  }

  const background = await loadBackground(payload);
  const audio = await setupAudio({
    audioFile: payload.audioFile,
    audioUrl: payload.audioUrl,
    backgroundMusicUrl: payload.backgroundMusicUrl,
    backgroundMusicVolume: payload.backgroundMusicVolume,
    backgroundMusicLoop: payload.backgroundMusicLoop,
    backgroundMusicFadeIn: payload.backgroundMusicFadeIn,
    backgroundMusicFadeOut: payload.backgroundMusicFadeOut,
  });
  const durationSeconds = Math.max(1, audio.durationSeconds || background.durationSeconds || DEFAULT_DURATION_SECONDS);
  const videoStream = captureStream(FPS);
  const mixedStream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...audio.stream.getAudioTracks(),
  ]);
  const mimeType = getPreferredVideoMimeType();
  const recorder = new MediaRecorder(mixedStream, mimeType ? { mimeType } : undefined);
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size) {
      chunks.push(event.data);
    }
  };

  const stopped = new Promise<void>((resolve, reject) => {
    recorder.onstop = () => resolve();
    recorder.onerror = () => reject(new Error("MediaRecorder thất bại."));
  });

  try {
    if (background.play) {
      await background.play();
    }
    if (audio.play) {
      await audio.play();
    }

    recorder.start(250);
    await renderFrames({ context, width, height, background, durationSeconds, fitMode: payload.fitMode });
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
    await stopped;
  } finally {
    background.cleanup();
    audio.cleanup();
    mixedStream.getTracks().forEach((track) => track.stop());
  }

  const outputBlob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
  const fileName = withVideoExtension(payload.videoFileName, outputBlob.type);
  const resource = await addBrowserResource({ blob: outputBlob, fileName, kind: "video" });

  return {
    ok: true,
    audio: {
      ok: true,
      fileName: payload.audioFile?.name,
      relativePath: payload.audioFile?.name || "browser-session-audio",
    },
    video: {
      ok: true,
      durationSeconds,
      fileName: resource.fileName,
      relativePath: resource.relativePath,
      videoUrl: resource.url,
      ffmpegWarning: "Video được tạo bằng Browser Recorder, không dùng FFmpeg local.",
    },
  };
}

type LoadedBackground = {
  cleanup: () => void;
  draw: (context: CanvasRenderingContext2D, width: number, height: number, fitMode: VideoFitMode) => void;
  durationSeconds?: number;
  play?: () => Promise<void>;
};

type LoadedAudio = {
  cleanup: () => void;
  durationSeconds?: number;
  play?: () => Promise<void>;
  stream: MediaStream;
};

async function loadBackground(payload: BrowserVideoRenderPayload): Promise<LoadedBackground> {
  const objectUrl = URL.createObjectURL(payload.backgroundFile);

  if (payload.backgroundType === "video") {
    const video = document.createElement("video");
    video.src = objectUrl;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    await waitForMediaMetadata(video);

    return {
      cleanup() {
        video.pause();
        URL.revokeObjectURL(objectUrl);
      },
      durationSeconds: Number.isFinite(video.duration) ? video.duration : undefined,
      draw(context, width, height, fitMode) {
        drawMedia(context, video, width, height, fitMode);
      },
      play: () => video.play(),
    };
  }

  const image = new Image();
  image.src = objectUrl;
  await waitForImage(image);

  return {
    cleanup() {
      URL.revokeObjectURL(objectUrl);
    },
    draw(context, width, height, fitMode) {
      drawMedia(context, image, width, height, fitMode);
    },
  };
}

async function setupAudio(params: {
  audioFile?: File;
  audioUrl?: string;
  backgroundMusicUrl?: string;
  backgroundMusicVolume?: number;
  backgroundMusicLoop?: boolean;
  backgroundMusicFadeIn?: number;
  backgroundMusicFadeOut?: number;
}): Promise<LoadedAudio> {
  if (!params.audioFile && !params.audioUrl && !params.backgroundMusicUrl) {
    return {
      cleanup() {},
      stream: new MediaStream(),
    };
  }

  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();
  const tracks: Array<{
    element: HTMLAudioElement;
    source: MediaElementAudioSourceNode;
    gain: GainNode;
    objectUrl?: string;
    baseGain: number;
    fadeIn: number;
    fadeOut: number;
    isBackground: boolean;
  }> = [];

  async function addAudioTrack(input: {
    file?: File;
    url?: string;
    baseGain: number;
    loop: boolean;
    fadeIn: number;
    fadeOut: number;
    isBackground: boolean;
  }) {
    if (!input.file && !input.url) {
      return undefined;
    }

    const element = document.createElement("audio");
    const objectUrl = input.file ? URL.createObjectURL(input.file) : undefined;
    const source = audioContext.createMediaElementSource(element);
    const gain = audioContext.createGain();

    element.crossOrigin = "anonymous";
    element.src = objectUrl || input.url || "";
    element.loop = input.loop;
    element.preload = "auto";
    source.connect(gain);
    gain.connect(destination);
    await waitForMediaMetadata(element);

    tracks.push({
      element,
      source,
      gain,
      objectUrl,
      baseGain: input.baseGain,
      fadeIn: input.fadeIn,
      fadeOut: input.fadeOut,
      isBackground: input.isBackground,
    });

    return Number.isFinite(element.duration) ? element.duration : undefined;
  }

  const narrationDuration = await addAudioTrack({
    file: params.audioFile,
    url: params.audioUrl,
    baseGain: 1,
    loop: false,
    fadeIn: 0,
    fadeOut: 0,
    isBackground: false,
  });
  const backgroundMusicDuration = await addAudioTrack({
    url: params.backgroundMusicUrl,
    baseGain: clamp(params.backgroundMusicVolume ?? 0.12, 0, 1),
    loop: params.backgroundMusicLoop !== false,
    fadeIn: clamp(params.backgroundMusicFadeIn ?? 1.5, 0, 30),
    fadeOut: clamp(params.backgroundMusicFadeOut ?? 2, 0, 30),
    isBackground: true,
  });
  const durationSeconds = narrationDuration || backgroundMusicDuration;

  return {
    cleanup() {
      tracks.forEach((track) => {
        track.element.pause();
        track.source.disconnect();
        track.gain.disconnect();
        if (track.objectUrl) {
          URL.revokeObjectURL(track.objectUrl);
        }
      });
      void audioContext.close();
    },
    durationSeconds,
    play: async () => {
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const currentTime = audioContext.currentTime;
      tracks.forEach((track) => {
        track.element.currentTime = 0;
        track.gain.gain.cancelScheduledValues(currentTime);

        if (track.isBackground) {
          const targetGain = track.baseGain;
          if (track.fadeIn > 0) {
            track.gain.gain.setValueAtTime(0, currentTime);
            track.gain.gain.linearRampToValueAtTime(targetGain, currentTime + track.fadeIn);
          } else {
            track.gain.gain.setValueAtTime(targetGain, currentTime);
          }

          if (durationSeconds && track.fadeOut > 0 && durationSeconds > track.fadeOut) {
            const fadeStart = currentTime + durationSeconds - track.fadeOut;
            track.gain.gain.setValueAtTime(targetGain, fadeStart);
            track.gain.gain.linearRampToValueAtTime(0, currentTime + durationSeconds);
          }
        } else {
          track.gain.gain.setValueAtTime(track.baseGain, currentTime);
        }
      });

      await Promise.all(tracks.map((track) => track.element.play()));
    },
    stream: destination.stream,
  };
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

async function renderFrames(params: {
  background: LoadedBackground;
  context: CanvasRenderingContext2D;
  durationSeconds: number;
  fitMode: VideoFitMode;
  height: number;
  width: number;
}) {
  const start = performance.now();
  const durationMs = params.durationSeconds * 1000;

  return new Promise<void>((resolve) => {
    function drawFrame(now: number) {
      const elapsed = now - start;
      params.context.fillStyle = "#070717";
      params.context.fillRect(0, 0, params.width, params.height);
      params.background.draw(params.context, params.width, params.height, params.fitMode);
      drawProgressOverlay(params.context, params.width, params.height, Math.min(1, elapsed / durationMs));

      if (elapsed >= durationMs) {
        resolve();
        return;
      }

      requestAnimationFrame(drawFrame);
    }

    requestAnimationFrame(drawFrame);
  });
}

function drawMedia(
  context: CanvasRenderingContext2D,
  media: CanvasImageSource & { videoWidth?: number; videoHeight?: number; naturalWidth?: number; naturalHeight?: number },
  canvasWidth: number,
  canvasHeight: number,
  fitMode: VideoFitMode
) {
  const mediaWidth = media.videoWidth || media.naturalWidth || canvasWidth;
  const mediaHeight = media.videoHeight || media.naturalHeight || canvasHeight;
  const scale = fitMode === "contain"
    ? Math.min(canvasWidth / mediaWidth, canvasHeight / mediaHeight)
    : Math.max(canvasWidth / mediaWidth, canvasHeight / mediaHeight);
  const targetWidth = mediaWidth * scale;
  const targetHeight = mediaHeight * scale;
  const targetX = (canvasWidth - targetWidth) / 2;
  const targetY = (canvasHeight - targetHeight) / 2;

  context.drawImage(media, targetX, targetY, targetWidth, targetHeight);
}

function drawProgressOverlay(context: CanvasRenderingContext2D, width: number, height: number, progress: number) {
  const barHeight = Math.max(4, Math.round(height * 0.006));
  context.fillStyle = "rgba(255,255,255,0.18)";
  context.fillRect(0, height - barHeight, width, barHeight);
  context.fillStyle = "rgba(255,255,255,0.86)";
  context.fillRect(0, height - barHeight, width * progress, barHeight);
}

function getCanvasSize(aspectRatio: VideoAspectRatio) {
  return aspectRatio === "9:16" ? { width: 720, height: 1280 } : { width: 1280, height: 720 };
}

function waitForImage(image: HTMLImageElement) {
  return new Promise<void>((resolve, reject) => {
    if (image.complete && image.naturalWidth > 0) {
      resolve();
      return;
    }

    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Không đọc được file nền."));
  });
}

function waitForMediaMetadata(media: HTMLMediaElement) {
  return new Promise<void>((resolve, reject) => {
    if (media.readyState >= 1) {
      resolve();
      return;
    }

    media.onloadedmetadata = () => resolve();
    media.onerror = () => reject(new Error("Không đọc được media đầu vào."));
  });
}

function withVideoExtension(fileName: string, mimeType: string) {
  const base = (fileName || "browser-video")
    .replace(/\.[a-z0-9]+$/i, "")
    .trim() || "browser-video";
  const extension = mimeType.includes("mp4") ? ".mp4" : ".webm";

  return `${base}${extension}`;
}
