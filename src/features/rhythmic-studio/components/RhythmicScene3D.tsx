import { memo, useEffect, type MutableRefObject } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";
import type { MarblePlatform } from "../lib/marbleCourse";
import type { CourseItemOverride, InstrumentHitEvent, NoteEvent, StudioSettings } from "../types";
import { RhythmicSceneContent3D } from "./RhythmicSceneContent3D";
import { rhythmicRecordingRenderProfile } from "./rhythmicSceneMath3D";
import type { ChaseCoursePlan } from "../lib/chaseCourse";

export interface RhythmicScene3DProps {
  events: NoteEvent[];
  settings: StudioSettings;
  durationMs: number;
  frameWidth: number;
  frameHeight: number;
  timeMs: number;
  playing: boolean;
  recording: boolean;
  playbackToken: number;
  playbackStartMs: number;
  playbackEndMs: number;
  courseOverrides: CourseItemOverride[];
  backgroundUrl?: string;
  selectedNodeIndex: number | null;
  onSelectNode: (index: number | null) => void;
  onNote: (hit: InstrumentHitEvent) => void;
  onTime: (timeMs: number) => void;
  onEnded: () => void;
  canvasRef?: MutableRefObject<HTMLCanvasElement | null>;
  platforms: MarblePlatform[];
  resolveSettings: StudioSettingsResolver;
  chasePlan?: ChaseCoursePlan | null;
}

export function hasRhythmicWebGLSupport() {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  try {
    const context = canvas.getContext("webgl2", { powerPreference: "high-performance" }) || canvas.getContext("webgl");
    if (!context) return false;
    try {
      context.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      // Capability probing succeeded; releasing the temporary context is best-effort.
    }
    return true;
  } catch {
    return false;
  }
}

function RhythmicScene3DImpl(props: RhythmicScene3DProps) {
  const recordingProfile = rhythmicRecordingRenderProfile(props.settings.exportFps);
  useEffect(() => () => {
    if (props.canvasRef) props.canvasRef.current = null;
  }, [props.canvasRef]);

  return (
    <div
      data-testid="rhythmic-three-frame"
      className="relative max-h-[66vh] max-w-full overflow-hidden rounded-xl bg-slate-950"
      style={{ aspectRatio: `${props.frameWidth} / ${props.frameHeight}`, width: `min(100%, calc(66vh * ${props.frameWidth / props.frameHeight}))` }}
    >
      <Canvas
        frameloop={props.playing || props.recording ? "always" : "demand"}
        dpr={props.recording ? recordingProfile.dpr : props.playing ? [1, 1.15] : [1, 1.1]}
        shadows={props.settings.instrumentShadowsEnabled}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          // Export repaints this WebGL canvas onto a fixed-size 2D surface on a
          // separate timer. Preserve the completed frame until that copy runs.
          preserveDrawingBuffer: true,
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1;
          gl.shadowMap.enabled = props.settings.instrumentShadowsEnabled;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          if (props.canvasRef) props.canvasRef.current = gl.domElement;
        }}
        onPointerMissed={() => props.onSelectNode(null)}
      >
        <color attach="background" args={[props.settings.backgroundColor]} />
        <RhythmicSceneContent3D {...props} />
      </Canvas>
      <div className="pointer-events-none absolute left-2 top-2 rounded-md border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 backdrop-blur">
        WebGL 3D · {props.recording ? "recording" : props.playing ? "live" : "ready"}
      </div>
    </div>
  );
}


function sameRhythmicSceneProps(prev: RhythmicScene3DProps, next: RhythmicScene3DProps) {
  const sameExceptTime = prev.events === next.events
    && prev.settings === next.settings
    && prev.durationMs === next.durationMs
    && prev.frameWidth === next.frameWidth
    && prev.frameHeight === next.frameHeight
    && prev.playing === next.playing
    && prev.recording === next.recording
    && prev.playbackToken === next.playbackToken
    && prev.playbackStartMs === next.playbackStartMs
    && prev.playbackEndMs === next.playbackEndMs
    && prev.courseOverrides === next.courseOverrides
    && prev.backgroundUrl === next.backgroundUrl
    && prev.selectedNodeIndex === next.selectedNodeIndex
    && prev.onSelectNode === next.onSelectNode
    && prev.onNote === next.onNote
    && prev.onTime === next.onTime
    && prev.onEnded === next.onEnded
    && prev.canvasRef === next.canvasRef
    && prev.platforms === next.platforms
    && prev.resolveSettings === next.resolveSettings
    && prev.chasePlan === next.chasePlan;
  if (!sameExceptTime) return false;
  if (prev.timeMs === next.timeMs) return true;
  return (prev.playing || prev.recording) && (next.playing || next.recording);
}

// timeMs is advanced inside the R3F render loop while playing. Ignoring the
// MobX/UI clock here keeps parent timeline updates from reconciling the whole
// WebGL scene 10-15 times per second. Paused seeks still render immediately.
export const RhythmicScene3D = memo(RhythmicScene3DImpl, sameRhythmicSceneProps);
