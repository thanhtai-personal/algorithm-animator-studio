import type {
  AudioSourceMeta,
  ExportFps,
  NoteEvent,
  RhythmicRendererMode,
} from "../types";

export type TimingFidelity = "midi-exact" | "audio-onset" | "deterministic";

interface ProductionReadinessInput {
  sourceType: AudioSourceMeta["type"];
  requestedRenderer: RhythmicRendererMode;
  webglAvailable: boolean;
  exportFps: ExportFps;
  eventCount: number;
}

export interface ProductionReadiness {
  effectiveRenderer: RhythmicRendererMode;
  fallbackActive: boolean;
  timingFidelity: TimingFidelity;
  readyForExport: boolean;
  finalQuality: boolean;
}

export function formatStudioTimecode(timeMs: number) {
  const safeTime = Math.max(0, Math.floor(timeMs));
  const minutes = Math.floor(safeTime / 60_000);
  const seconds = Math.floor(safeTime % 60_000 / 1_000);
  const milliseconds = safeTime % 1_000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

export function activeEventPosition(events: NoteEvent[], timeMs: number) {
  let position = 0;
  for (let index = 0; index < events.length; index += 1) {
    if (events[index].timeMs > timeMs) break;
    position = index + 1;
  }
  return position;
}

export function resolveRhythmicRenderer(
  requested: RhythmicRendererMode,
  webglAvailable: boolean,
): RhythmicRendererMode {
  return requested === "three" && webglAvailable ? "three" : "legacy";
}

function timingFidelityForSource(sourceType: AudioSourceMeta["type"]): TimingFidelity {
  if (sourceType === "midi") return "midi-exact";
  if (sourceType === "audio") return "audio-onset";
  return "deterministic";
}

export function buildProductionReadiness(input: ProductionReadinessInput): ProductionReadiness {
  const effectiveRenderer = resolveRhythmicRenderer(input.requestedRenderer, input.webglAvailable);
  const readyForExport = input.eventCount > 0;
  return {
    effectiveRenderer,
    fallbackActive: input.requestedRenderer === "three" && effectiveRenderer === "legacy",
    timingFidelity: timingFidelityForSource(input.sourceType),
    readyForExport,
    finalQuality: readyForExport && effectiveRenderer === "three" && input.exportFps === 60,
  };
}
