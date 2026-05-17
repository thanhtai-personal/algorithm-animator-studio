export const PUBLIC_WEB_BUILD = import.meta.env.VITE_PUBLIC_WEB === "true";

export function isDesktopRuntime() {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.includes("electron") || window.location.protocol === "file:";
}

export function isBrowserSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function isCanvasVideoRecorderSupported() {
  if (typeof window === "undefined") {
    return false;
  }

  const canvas = document.createElement("canvas") as HTMLCanvasElement & {
    captureStream?: (frameRate?: number) => MediaStream;
  };

  return typeof canvas.captureStream === "function" && typeof window.MediaRecorder !== "undefined";
}

export function getPreferredVideoMimeType() {
  if (typeof window === "undefined" || typeof window.MediaRecorder === "undefined") {
    return "";
  }

  return [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm",
  ].find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || "";
}
