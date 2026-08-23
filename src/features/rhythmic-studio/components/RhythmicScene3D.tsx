import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CourseItemOverride, NoteEvent, StudioSettings } from "../types";
import type { MarblePlatform, MarblePoint } from "../lib/marbleCourse";
import { buildMarbleCourse, marbleAtTime } from "../lib/marbleCourse";

interface Props {
  events: NoteEvent[];
  settings: StudioSettings;
  durationMs: number;
  timeMs: number;
  playing: boolean;
  playbackToken: number;
  playbackStartMs: number;
  playbackEndMs: number;
  courseOverrides: CourseItemOverride[];
  selectedNodeIndex: number | null;
  onSelectNode: (index: number | null) => void;
  onNote: (event: NoteEvent) => void;
  onTime: (timeMs: number) => void;
  onEnded: () => void;
}

const COURSE_WIDTH = 720;
const WORLD_SCALE = 0.012;
const CAMERA_Z = 10.5;
const CAMERA_FOV = 39;
const UI_UPDATE_MS = 64;

function firstEventAtOrAfter(events: NoteEvent[], timeMs: number) {
  let low = 0;
  let high = events.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (events[mid].timeMs < timeMs) low = mid + 1;
    else high = mid;
  }
  return low;
}

function worldPoint(point: Pick<MarblePoint, "x" | "y">) {
  return new THREE.Vector3((point.x - COURSE_WIDTH / 2) * WORLD_SCALE, -point.y * WORLD_SCALE, 0);
}

function PlatformInstances({ platforms, settings, selectedNodeIndex, onSelectNode }: {
  platforms: MarblePlatform[];
  settings: StudioSettings;
  selectedNodeIndex: number | null;
  onSelectNode: (index: number | null) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const helper = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    platforms.forEach((platform, instanceIndex) => {
      helper.position.set(
        (platform.x - COURSE_WIDTH / 2) * WORLD_SCALE,
        -platform.y * WORLD_SCALE,
        0,
      );
      helper.rotation.set(0, 0, -platform.tiltRad);
      helper.scale.set(
        Math.max(0.26, platform.width * WORLD_SCALE),
        Math.max(0.11, platform.thickness * WORLD_SCALE),
        0.38,
      );
      helper.updateMatrix();
      mesh.setMatrixAt(instanceIndex, helper.matrix);
      color.set(platform.index === selectedNodeIndex ? "#ffffff" : platform.color);
      mesh.setColorAt(instanceIndex, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [color, helper, platforms, selectedNodeIndex, settings.platformThickness]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, Math.max(1, platforms.length)]}
      castShadow
      receiveShadow
      onClick={(event) => {
        event.stopPropagation();
        if (event.instanceId == null) return;
        onSelectNode(platforms[event.instanceId]?.index ?? null);
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.34} metalness={0.22} />
    </instancedMesh>
  );
}

function LightingRig() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 7, 9]} intensity={2.1} castShadow shadow-mapSize-width={512} shadow-mapSize-height={512} />
      <pointLight position={[-4, 1, 6]} intensity={18} distance={22} decay={2} color="#7dd3fc" />
      <pointLight position={[4, -7, 4]} intensity={13} distance={20} decay={2} color="#f0abfc" />
    </>
  );
}

function BasicEnvironment({ backgroundColor }: { backgroundColor: string }) {
  const color = useMemo(() => new THREE.Color(backgroundColor), [backgroundColor]);
  return (
    <>
      <mesh position={[0, -28, -3.2]} receiveShadow>
        <planeGeometry args={[28, 110]} />
        <meshStandardMaterial color={color} roughness={0.92} metalness={0.02} />
      </mesh>
      <mesh position={[0, -28, -2.85]}>
        <planeGeometry args={[22, 104, 16, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.025} wireframe />
      </mesh>
      <mesh position={[0, -18, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[28, 60]} />
        <meshStandardMaterial color="#111827" roughness={0.86} metalness={0.08} />
      </mesh>
    </>
  );
}

function SceneContent(props: Omit<Props, "settings"> & { settings: StudioSettings; platforms: MarblePlatform[] }) {
  const { camera, invalidate } = useThree();
  const marbleRef = useRef<THREE.Mesh>(null);
  const currentTimeRef = useRef(props.timeMs);
  const playbackEpochRef = useRef(performance.now() - props.playbackStartMs);
  const nextNoteIndex = useRef(firstEventAtOrAfter(props.events, props.playbackStartMs));
  const lastUiUpdate = useRef(0);
  const endedToken = useRef<number | null>(null);
  const previousWorld = useRef(new THREE.Vector3());
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  const syncScene = useCallback((timeMs: number, deltaSeconds: number, snapCamera = false) => {
    const marble = marbleAtTime(timeMs, props.events, props.platforms, props.settings, props.courseOverrides);
    const ahead = marbleAtTime(Math.min(props.durationMs, timeMs + 320), props.events, props.platforms, props.settings, props.courseOverrides);
    const world = worldPoint(marble);
    const aheadWorld = worldPoint(ahead);
    const marbleMesh = marbleRef.current;
    if (marbleMesh) {
      const distance = world.distanceTo(previousWorld.current);
      const radius = Math.max(0.12, props.settings.ballSize * WORLD_SCALE);
      marbleMesh.position.copy(world);
      marbleMesh.rotation.x += distance / radius * 0.5;
      marbleMesh.rotation.z -= (world.x - previousWorld.current.x) / radius * 0.45;
      marbleMesh.scale.setScalar(radius);
      const material = marbleMesh.material as THREE.MeshStandardMaterial;
      material.color.set(marble.color);
      material.emissive.set(marble.color).multiplyScalar(0.08);
    }
    previousWorld.current.copy(world);

    cameraTarget.set(world.x, world.y + 1.5, CAMERA_Z);
    const followEase = snapCamera ? 1 : 1 - Math.exp(-Math.max(0.001, deltaSeconds) * 7.5);
    camera.position.lerp(cameraTarget, followEase);
    lookTarget.set(
      THREE.MathUtils.lerp(world.x, aheadWorld.x, 0.42),
      THREE.MathUtils.lerp(world.y - 0.75, aheadWorld.y, 0.52),
      0,
    );
    camera.lookAt(lookTarget);
  }, [camera, cameraTarget, lookTarget, props.courseOverrides, props.durationMs, props.events, props.platforms, props.settings]);

  useEffect(() => {
    currentTimeRef.current = props.playbackStartMs;
    playbackEpochRef.current = performance.now() - props.playbackStartMs;
    nextNoteIndex.current = firstEventAtOrAfter(props.events, props.playbackStartMs);
    endedToken.current = null;
  }, [props.events, props.playbackStartMs, props.playbackToken]);

  useEffect(() => {
    if (props.playing) return;
    currentTimeRef.current = props.timeMs;
    syncScene(props.timeMs, 1 / 60, true);
    invalidate();
  }, [invalidate, props.playing, props.timeMs, syncScene]);

  useEffect(() => {
    if (!props.playing) return;
    syncScene(currentTimeRef.current, 1 / 60);
    invalidate();
  }, [invalidate, props.playing, syncScene]);

  useFrame((_, delta) => {
    if (!props.playing) return;
    const endMs = props.playbackEndMs || props.durationMs;
    const timeMs = Math.min(endMs, Math.max(0, performance.now() - playbackEpochRef.current));
    currentTimeRef.current = timeMs;

    while (nextNoteIndex.current < props.events.length && props.events[nextNoteIndex.current].timeMs <= timeMs) {
      props.onNote(props.events[nextNoteIndex.current]);
      nextNoteIndex.current += 1;
    }

    syncScene(timeMs, delta);
    const now = performance.now();
    if (now - lastUiUpdate.current >= UI_UPDATE_MS) {
      lastUiUpdate.current = now;
      props.onTime(timeMs);
    }
    if (timeMs >= endMs && endedToken.current !== props.playbackToken) {
      endedToken.current = props.playbackToken;
      props.onTime(endMs);
      props.onEnded();
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault fov={CAMERA_FOV} near={0.1} far={180} position={[0, 0, CAMERA_Z]} />
      <LightingRig />
      <BasicEnvironment backgroundColor={props.settings.backgroundColor} />
      <PlatformInstances platforms={props.platforms} settings={props.settings} selectedNodeIndex={props.selectedNodeIndex} onSelectNode={props.onSelectNode} />
      <mesh ref={marbleRef} castShadow>
        <sphereGeometry args={[1, 28, 20]} />
        <meshStandardMaterial color={props.settings.ballBaseColor} roughness={0.2} metalness={0.28} emissiveIntensity={0.18} />
      </mesh>
    </>
  );
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

export function RhythmicScene3D(props: Props) {
  const platforms = useMemo(
    () => buildMarbleCourse(props.events, props.settings, COURSE_WIDTH),
    [props.events, props.settings.platformGap, props.settings.platformWidth, props.settings.platformThickness, props.settings.platformTilt, props.settings.laneSpread, props.settings.minBounceDistance, props.settings.bounceHeight, props.settings.ballSize, props.settings.prismStart, props.settings.prismEnd, props.settings.autoSyncGaps, props.settings.terrainProfile, props.settings.colorPaletteMode],
  );

  return (
    <div className="relative h-[66vh] max-h-[1280px] max-w-full aspect-[9/16] overflow-hidden rounded-xl bg-slate-950">
      <Canvas
        frameloop={props.playing ? "always" : "demand"}
        dpr={props.playing ? [0.9, 1.2] : [0.75, 1]}
        shadows={props.playing}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onPointerMissed={() => props.onSelectNode(null)}
      >
        <color attach="background" args={[props.settings.backgroundColor]} />
        <SceneContent {...props} platforms={platforms} />
      </Canvas>
      <div className="pointer-events-none absolute left-2 top-2 rounded-md border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 backdrop-blur">
        WebGL · {props.playing ? "adaptive preview" : "demand idle"}
      </div>
    </div>
  );
}
