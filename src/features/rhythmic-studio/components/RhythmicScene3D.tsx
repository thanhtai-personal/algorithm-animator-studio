import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CourseItemOverride, NoteEvent, StudioSettings } from "../types";
import type { MarblePlatform, MarblePoint } from "../lib/marbleCourse";
import { buildMarbleCourse, marbleAtTime } from "../lib/marbleCourse";
import { RhythmicMarble3D } from "./RhythmicMarble3D";
import { RhythmicPlatformField3D } from "./RhythmicPlatformField3D";
import { RhythmicEnvironment3D, RhythmicLightingRig3D } from "./RhythmicEnvironment3D";
import { RhythmicVfx3D, type RhythmicVfxHandle } from "./RhythmicVfx3D";

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

function noteDensity(events: NoteEvent[], timeMs: number, windowMs = 900) {
  const start = firstEventAtOrAfter(events, timeMs);
  let count = 0;
  for (let index = start; index < events.length && events[index].timeMs <= timeMs + windowMs; index += 1) {
    count += 1;
    if (count >= 16) break;
  }
  return count / Math.max(1, windowMs / 1000);
}

function cameraLookAheadMs(settings: StudioSettings) {
  if (settings.cameraProfile === "comet") return 620;
  if (settings.cameraProfile === "xylophone") return 520;
  if (settings.cameraProfile === "tube-board") return 440;
  return 380;
}

function worldPoint(point: Pick<MarblePoint, "x" | "y">) {
  return new THREE.Vector3((point.x - COURSE_WIDTH / 2) * WORLD_SCALE, -point.y * WORLD_SCALE, 0);
}

function SceneContent(props: Omit<Props, "settings"> & { settings: StudioSettings; platforms: MarblePlatform[] }) {
  const { camera, invalidate } = useThree();
  const marbleRef = useRef<THREE.Group>(null);
  const vfxRef = useRef<RhythmicVfxHandle>(null);
  const marbleColor = useMemo(() => new THREE.Color(props.settings.ballBaseColor), [props.settings.ballBaseColor]);
  const initialMarble = useMemo(() => marbleAtTime(props.timeMs, props.events, props.platforms, props.settings, props.courseOverrides), [props.courseOverrides, props.events, props.platforms, props.settings, props.timeMs]);
  const [focusIndex, setFocusIndex] = useState(initialMarble.platformIndex);
  const focusIndexRef = useRef(initialMarble.platformIndex);
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
    const lookAheadMs = cameraLookAheadMs(props.settings);
    const ahead = marbleAtTime(Math.min(props.durationMs, timeMs + lookAheadMs), props.events, props.platforms, props.settings, props.courseOverrides);
    if (marble.platformIndex !== focusIndexRef.current) {
      focusIndexRef.current = marble.platformIndex;
      setFocusIndex(marble.platformIndex);
    }
    const world = worldPoint(marble);
    const aheadWorld = worldPoint(ahead);
    const marbleMesh = marbleRef.current;
    if (marbleMesh) {
      const distance = world.distanceTo(previousWorld.current);
      const radius = Math.max(0.12, props.settings.ballSize * WORLD_SCALE);
      const impactIndex = firstEventAtOrAfter(props.events, timeMs);
      const nextImpact = props.events[impactIndex]?.timeMs ?? Number.POSITIVE_INFINITY;
      const previousImpact = props.events[impactIndex - 1]?.timeMs ?? Number.NEGATIVE_INFINITY;
      const impactDistance = Math.min(Math.abs(nextImpact - timeMs), Math.abs(timeMs - previousImpact));
      const impact = Math.exp(-Math.max(0, impactDistance) / 62);
      marbleMesh.position.copy(world);
      marbleMesh.rotation.x += distance / radius * 0.58;
      marbleMesh.rotation.z -= (world.x - previousWorld.current.x) / radius * 0.52;
      marbleMesh.scale.set(
        radius * (1 + impact * 0.045),
        radius * (1 - impact * 0.085),
        radius * (1 + impact * 0.045),
      );
      marbleColor.set(marble.color);
      const surface = marbleMesh.children[0] as THREE.Mesh | undefined;
      const material = surface?.material as THREE.MeshStandardMaterial | undefined;
      if (material && props.settings.ballStyle === "classic") material.color.copy(marbleColor);
    }
    previousWorld.current.copy(world);
    vfxRef.current?.update(timeMs);

    const jumpDistance = world.distanceTo(aheadWorld);
    const density = noteDensity(props.events, timeMs);
    const profileZoom = props.settings.cameraProfile === "xylophone" ? -0.5 : (props.settings.cameraProfile === "comet" ? 0.45 : 0);
    const adaptiveZ = THREE.MathUtils.clamp(CAMERA_Z + profileZoom + jumpDistance * 0.22 - Math.min(1.1, density * 0.045), 8.7, 13.2);
    const anchorOffset = (0.5 - props.settings.cameraAnchor) * 8.2;
    const lateralLead = THREE.MathUtils.clamp((aheadWorld.x - world.x) * 0.22, -0.7, 0.7);
    cameraTarget.set(world.x + lateralLead, world.y + anchorOffset, adaptiveZ);
    const baseEase = THREE.MathUtils.clamp(props.settings.cameraSmoothing, 0.03, 0.65);
    const followEase = snapCamera ? 1 : 1 - Math.pow(1 - baseEase, Math.max(0.25, deltaSeconds * 60));
    camera.position.lerp(cameraTarget, followEase);
    lookTarget.set(
      THREE.MathUtils.lerp(world.x, aheadWorld.x, 0.5),
      THREE.MathUtils.lerp(world.y - 0.45, aheadWorld.y, 0.58),
      0,
    );
    camera.lookAt(lookTarget);
    const perspective = camera as THREE.PerspectiveCamera;
    const targetFov = THREE.MathUtils.clamp(CAMERA_FOV + jumpDistance * 0.7 - density * 0.09, 34, 46);
    perspective.fov = THREE.MathUtils.lerp(perspective.fov, targetFov, followEase * 0.45);
    perspective.updateProjectionMatrix();
    const bankTarget = THREE.MathUtils.clamp((aheadWorld.x - world.x) * -0.018, -0.055, 0.055);
    perspective.rotation.z = THREE.MathUtils.lerp(perspective.rotation.z, bankTarget, followEase * 0.32);
  }, [camera, cameraTarget, lookTarget, props.courseOverrides, props.durationMs, props.events, props.platforms, props.settings, marbleColor]);

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
      <RhythmicLightingRig3D settings={props.settings} />
      <RhythmicEnvironment3D settings={props.settings} />
      <RhythmicPlatformField3D
        platforms={props.platforms}
        settings={props.settings}
        focusIndex={focusIndex}
        selectedNodeIndex={props.selectedNodeIndex}
        onSelectNode={props.onSelectNode}
      />
      <RhythmicVfx3D
        ref={vfxRef}
        events={props.events}
        platforms={props.platforms}
        settings={props.settings}
        courseOverrides={props.courseOverrides}
      />
      <RhythmicMarble3D ref={marbleRef} settings={props.settings} liveColor={marbleColor} />
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
