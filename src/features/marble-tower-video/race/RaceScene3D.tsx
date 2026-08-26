import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RacePhysics } from "../physics/RacePhysics";
import { StudioEnvironment3D } from "./StudioEnvironment3D";
import { TrackMeshes3D } from "./TrackMeshes3D";
import { ObstacleMeshes3D } from "./ObstacleMeshes3D";
import { MarbleField3D } from "./MarbleField3D";
import { RaceCamera3D } from "../camera/RaceCamera3D";
import type { RaceResult } from "./raceTypes";
import type { MarbleImpactKind } from "../physics/MarbleInteractionSystem";

function Runtime({ physics, playing, playbackToken, playbackStartMs, playbackEndMs, durationMs, stopAtPlaybackEnd, onTime, onEnded }: {
  physics: RacePhysics;
  playing: boolean;
  playbackToken: number;
  physicsRevision: number;
  playbackStartMs: number;
  playbackEndMs: number;
  durationMs: number;
  stopAtPlaybackEnd: boolean;
  onTime: (timeMs: number) => void;
  onEnded: () => void;
}) {
  const epochRef = useRef(performance.now() - playbackStartMs);
  const lastUiUpdate = useRef(0);
  const endedToken = useRef<number | null>(null);

  useEffect(() => {
    epochRef.current = performance.now() - playbackStartMs;
    endedToken.current = null;
    physics.advanceTo(playbackStartMs / 1000);
    onTime(playbackStartMs);
  }, [onTime, physics, playbackStartMs, playbackToken]);

  useFrame(() => {
    if (!playing) return;
    const endMs = playbackEndMs || durationMs;
    const elapsedMs = Math.max(0, performance.now() - epochRef.current);
    const timeMs = stopAtPlaybackEnd ? Math.min(endMs, elapsedMs) : elapsedMs;
    physics.advanceTo(timeMs / 1000);
    const now = performance.now();
    if (now - lastUiUpdate.current >= 64) {
      lastUiUpdate.current = now;
      onTime(timeMs);
    }
    if (stopAtPlaybackEnd && timeMs >= endMs && endedToken.current !== playbackToken) {
      endedToken.current = playbackToken;
      onTime(endMs);
      onEnded();
    }
  }, -10);

  return null;
}

export function RaceScene3D(props: {
  driveMultiplier: number;
  marbleCount: number;
  playing: boolean;
  recording: boolean;
  playbackToken: number;
  physicsRevision: number;
  playbackStartMs: number;
  playbackEndMs: number;
  durationMs: number;
  onTime: (timeMs: number) => void;
  onEnded: () => void;
  onComplete?: (result: RaceResult) => void;
  onImpactSound?: (kind: MarbleImpactKind, strength: number, pan: number, variant?: number) => void;
  stopAtPlaybackEnd?: boolean;
  onReady?: (physics: RacePhysics) => void;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
}) {
  const physics = useMemo(
    () => new RacePhysics(props.onComplete ?? (() => undefined), props.driveMultiplier, props.onImpactSound, props.marbleCount),
    [props.marbleCount, props.physicsRevision],
  );
  useEffect(() => { physics.setDriveMultiplier(props.driveMultiplier); }, [physics, props.driveMultiplier]);
  useEffect(() => { props.onReady?.(physics); return () => physics.dispose(); }, [physics, props.onReady]);

  return <Canvas
    dpr={props.recording ? 1 : [1, 1.35]}
    shadows
    camera={{ fov: 54, near: 0.1, far: 300, position: [0, 46, -30] }}
    gl={{ antialias: true, alpha: false, powerPreference: "high-performance", stencil: false }}
    onCreated={({ gl }) => {
      props.canvasRef.current = gl.domElement;
      gl.outputColorSpace = THREE.SRGBColorSpace;
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.05;
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
    }}
  >
    <Suspense fallback={null}>
      <StudioEnvironment3D />
      <TrackMeshes3D physics={physics} />
      <ObstacleMeshes3D physics={physics} />
      <MarbleField3D physics={physics} />
      <Runtime
        physics={physics}
        playing={props.playing}
        playbackToken={props.playbackToken}
        playbackStartMs={props.playbackStartMs}
        playbackEndMs={props.playbackEndMs}
        durationMs={props.durationMs}
        stopAtPlaybackEnd={props.stopAtPlaybackEnd ?? false}
        onTime={props.onTime}
        onEnded={props.onEnded}
      />
      <RaceCamera3D physics={physics} />
    </Suspense>
  </Canvas>;
}
