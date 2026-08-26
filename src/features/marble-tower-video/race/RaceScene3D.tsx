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

function Runtime({ physics, playing, playbackToken, playbackStartMs, playbackEndMs, durationMs, onTime, onEnded }: {
  physics: RacePhysics;
  playing: boolean;
  playbackToken: number;
  playbackStartMs: number;
  playbackEndMs: number;
  durationMs: number;
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
    const timeMs = Math.min(endMs, Math.max(0, performance.now() - epochRef.current));
    physics.advanceTo(timeMs / 1000);
    const now = performance.now();
    if (now - lastUiUpdate.current >= 64) {
      lastUiUpdate.current = now;
      onTime(timeMs);
    }
    if (timeMs >= endMs && endedToken.current !== playbackToken) {
      endedToken.current = playbackToken;
      onTime(endMs);
      onEnded();
    }
  }, -10);

  return null;
}

export function RaceScene3D(props: {
  driveMultiplier: number;
  playing: boolean;
  recording: boolean;
  playbackToken: number;
  playbackStartMs: number;
  playbackEndMs: number;
  durationMs: number;
  onTime: (timeMs: number) => void;
  onEnded: () => void;
  onComplete?: (result: RaceResult) => void;
  onReady?: (physics: RacePhysics) => void;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
}) {
  const physics = useMemo(
    () => new RacePhysics(props.onComplete ?? (() => undefined), props.driveMultiplier),
    [props.playbackToken],
  );
  useEffect(() => { physics.setDriveMultiplier(props.driveMultiplier); }, [physics, props.driveMultiplier]);
  useEffect(() => { props.onReady?.(physics); return () => physics.dispose(); }, [physics, props.onReady]);

  return <Canvas
    dpr={props.recording ? 1 : [1, 1.35]}
    shadows
    camera={{ fov: 50, near: 0.1, far: 300, position: [0, 40, -20] }}
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
        onTime={props.onTime}
        onEnded={props.onEnded}
      />
      <RaceCamera3D physics={physics} />
    </Suspense>
  </Canvas>;
}
