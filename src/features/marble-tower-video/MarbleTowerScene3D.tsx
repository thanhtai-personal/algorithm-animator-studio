import { Sparkles } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { InstrumentHitEvent, NoteEvent, StudioSettings } from "@/features/rhythmic-studio/types";
import { rhythmicRecordingRenderProfile } from "@/features/rhythmic-studio/components/rhythmicSceneMath3D";
import {
  firstTowerEventAtOrAfter,
  towerCourseMetrics,
  towerRacerPose,
  type TowerCourseMetrics,
} from "./towerMotion";
import { TowerMarbles3D } from "./TowerMarbles3D";
import { TowerTrack3D } from "./TowerTrack3D";
import { TowerVideoHud3D } from "./TowerVideoHud3D";

const UI_INTERVAL_MS = 70;
const NOTE_COLORS = ["#5eeeff", "#9c7dff", "#ff5eb8", "#ffd55c", "#66f2a2"];

function hitForEvent(event: NoteEvent, index: number): InstrumentHitEvent {
  const color = NOTE_COLORS[Math.abs(event.midi + index) % NOTE_COLORS.length];
  return { event, platformIndex: index, platformStyle: "piano-key", noteColor: color, chordEvents: [event], chordColors: [color] };
}

function PlaybackDriver({
  events,
  durationMs,
  playing,
  playbackToken,
  playbackStartMs,
  playbackEndMs,
  timeMs,
  timeRef,
  onNote,
  onTime,
  onEnded,
}: {
  events: NoteEvent[];
  durationMs: number;
  playing: boolean;
  playbackToken: number;
  playbackStartMs: number;
  playbackEndMs: number;
  timeMs: number;
  timeRef: MutableRefObject<number>;
  onNote: (hit: InstrumentHitEvent) => void;
  onTime: (timeMs: number) => void;
  onEnded: () => void;
}) {
  const { invalidate } = useThree();
  const epochRef = useRef(performance.now() - playbackStartMs);
  const nextEventRef = useRef(firstTowerEventAtOrAfter(events, playbackStartMs));
  const endedTokenRef = useRef<number | null>(null);
  const lastUiRef = useRef(0);

  useEffect(() => {
    timeRef.current = playbackStartMs;
    epochRef.current = performance.now() - playbackStartMs;
    nextEventRef.current = firstTowerEventAtOrAfter(events, playbackStartMs);
    endedTokenRef.current = null;
  }, [events, playbackStartMs, playbackToken, timeRef]);

  useEffect(() => {
    if (!playing) {
      timeRef.current = timeMs;
      invalidate();
    }
  }, [invalidate, playing, timeMs, timeRef]);

  useFrame(() => {
    if (!playing) return;
    const endMs = playbackEndMs || durationMs;
    const current = Math.min(endMs, Math.max(0, performance.now() - epochRef.current));
    timeRef.current = current;
    while (nextEventRef.current < events.length && events[nextEventRef.current].timeMs <= current + 2) {
      const index = nextEventRef.current;
      onNote(hitForEvent(events[index], index));
      nextEventRef.current += 1;
    }
    const now = performance.now();
    if (now - lastUiRef.current >= UI_INTERVAL_MS) {
      lastUiRef.current = now;
      onTime(current);
    }
    if (current >= endMs && endedTokenRef.current !== playbackToken) {
      endedTokenRef.current = playbackToken;
      onTime(endMs);
      onEnded();
    }
  });
  return null;
}

function TowerCamera({ timeRef, durationMs, drive }: { timeRef: MutableRefObject<number>; durationMs: number; drive: number }) {
  const { camera } = useThree();
  const desired = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    const pose = towerRacerPose(timeRef.current, durationMs, 0, drive);
    const baseProgress = pose.progress;
    if (baseProgress > 0.91) desired.set(pose.x + 9.5, pose.y + 5.2, pose.z - 4.5);
    else if (baseProgress > 0.77) desired.set(pose.x - 8.4, pose.y + 7.2, pose.z - 12.5);
    else if (baseProgress > 0.45 && baseProgress < 0.58) desired.set(pose.x, pose.y + 5.1, pose.z - 10.5);
    else desired.set(pose.x + 4.6, pose.y + 6.2, pose.z - 11.2);
    camera.position.lerp(desired, 1 - Math.exp(-delta * 5.2));
    look.set(pose.x, pose.y + 0.35, pose.z + 8.2);
    camera.lookAt(look);
  });
  return null;
}

function ArenaDecor({ metrics }: { metrics: TowerCourseMetrics }) {
  return <>
    <gridHelper args={[Math.max(220, metrics.finishZ + 60), 64, "#25366e", "#151c3d"]} position={[0, -4.5, metrics.finishZ / 2]} />
    <Sparkles count={110} scale={[34, 22, Math.max(180, metrics.finishZ)]} position={[0, 9, metrics.finishZ / 2]} size={1.6} speed={0.16} opacity={0.3} color="#9edcff" />
  </>;
}

function SceneWorld(props: MarbleTowerScene3DProps & { timeRef: MutableRefObject<number>; metrics: TowerCourseMetrics }) {
  return <>
    <color attach="background" args={[props.settings.backgroundColor || "#050718"]} />
    <fog attach="fog" args={[props.settings.backgroundColor || "#050718", 28, Math.min(170, 95 + props.metrics.zScale * 16)]} />
    <hemisphereLight args={["#b7d9ff", "#070814", 1.25]} />
    <directionalLight position={[8, 18, -8]} intensity={2.35} color="#dce8ff" castShadow />
    <pointLight position={[-8, 8, 38 * props.metrics.zScale]} intensity={16} distance={42} color="#4cefff" />
    <pointLight position={[8, 7, 96 * props.metrics.zScale]} intensity={14} distance={38} color="#c555ff" />
    <TowerTrack3D metrics={props.metrics} timeRef={props.timeRef} />
    <TowerMarbles3D settings={props.settings} timeRef={props.timeRef} durationMs={props.durationMs} drive={props.drive} />
    <ArenaDecor metrics={props.metrics} />
    <TowerCamera timeRef={props.timeRef} durationMs={props.durationMs} drive={props.drive} />
    <TowerVideoHud3D timeRef={props.timeRef} durationMs={props.durationMs} drive={props.drive} recording={props.recording} title={props.settings.titleText} />
    <PlaybackDriver events={props.events} durationMs={props.durationMs} playing={props.playing} playbackToken={props.playbackToken} playbackStartMs={props.playbackStartMs} playbackEndMs={props.playbackEndMs} timeMs={props.timeMs} timeRef={props.timeRef} onNote={props.onNote} onTime={props.onTime} onEnded={props.onEnded} />
  </>;
}

export type MarbleTowerScene3DProps = {
  events: NoteEvent[];
  settings: StudioSettings;
  durationMs: number;
  timeMs: number;
  playing: boolean;
  recording: boolean;
  playbackToken: number;
  playbackStartMs: number;
  playbackEndMs: number;
  drive: number;
  frameWidth: number;
  frameHeight: number;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  onNote: (hit: InstrumentHitEvent) => void;
  onTime: (timeMs: number) => void;
  onEnded: () => void;
};

export function MarbleTowerScene3D(props: MarbleTowerScene3DProps) {
  const timeRef = useRef(props.timeMs);
  const metrics = useMemo(() => towerCourseMetrics(props.durationMs, props.drive), [props.drive, props.durationMs]);
  const recordingProfile = rhythmicRecordingRenderProfile(props.settings.exportFps);
  const clearRef = useCallback(() => { props.canvasRef.current = null; }, [props.canvasRef]);
  useEffect(() => clearRef, [clearRef]);

  return <div className="relative h-full w-full overflow-hidden rounded-xl bg-slate-950">
    <Canvas
      frameloop={props.playing || props.recording ? "always" : "demand"}
      dpr={props.recording ? recordingProfile.dpr : props.playing ? [1, 1.35] : [1, 1.15]}
      shadows={props.settings.instrumentShadowsEnabled}
      camera={{ fov: 54, near: 0.08, far: Math.max(300, metrics.finishZ + 100), position: [4, 13, -12] }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance", stencil: false, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
        gl.shadowMap.enabled = props.settings.instrumentShadowsEnabled;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        props.canvasRef.current = gl.domElement;
      }}
    >
      <SceneWorld {...props} timeRef={timeRef} metrics={metrics} />
    </Canvas>
  </div>;
}
