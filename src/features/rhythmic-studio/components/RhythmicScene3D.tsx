import { useEffect, type MutableRefObject } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";
import type { MarblePlatform } from "../lib/marbleCourse";
import type { CourseItemOverride, NoteEvent, StudioSettings } from "../types";
import { RhythmicSceneContent3D } from "./RhythmicSceneContent3D";

export interface RhythmicScene3DProps {
  events: NoteEvent[];
  settings: StudioSettings;
  durationMs: number;
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
  onNote: (event: NoteEvent) => void;
  onTime: (timeMs: number) => void;
  onEnded: () => void;
  canvasRef?: MutableRefObject<HTMLCanvasElement | null>;
  platforms: MarblePlatform[];
  resolveSettings: StudioSettingsResolver;
}

export function hasRhythmicWebGLSupport() {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  try {
    const context = canvas.getContext("webgl2", { powerPreference: "high-performance" }) || canvas.getContext("webgl");
    return Boolean(context);
  } catch {
    return false;
  }
}

export function RhythmicScene3D(props: RhythmicScene3DProps) {
  useEffect(() => () => {
    if (props.canvasRef) props.canvasRef.current = null;
  }, [props.canvasRef]);

  return (
    <div className="relative h-[66vh] max-h-[1280px] max-w-full aspect-[9/16] overflow-hidden rounded-xl bg-slate-950">
      <Canvas
        frameloop={props.playing ? "always" : "demand"}
        dpr={props.recording ? 2 : props.playing ? [1, 1.35] : [1, 1.15]}
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          preserveDrawingBuffer: true,
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1;
          gl.shadowMap.enabled = true;
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
