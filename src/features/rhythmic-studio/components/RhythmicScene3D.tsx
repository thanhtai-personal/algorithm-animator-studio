import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CourseItemOverride, NoteEvent, StudioSettings } from "../types";
import type { MarblePlatform } from "../lib/marbleCourse";
import { buildMarbleCourse } from "../lib/marbleCourse";
import { RhythmicMarble3D } from "./RhythmicMarble3D";
import { RhythmicPlatformField3D } from "./RhythmicPlatformField3D";
import { RhythmicCourseItems3D } from "./RhythmicCourseItems3D";
import { RhythmicEnvironment3D, RhythmicLightingRig3D } from "./RhythmicEnvironment3D";
import { RhythmicVfx3D, type RhythmicVfxHandle } from "./RhythmicVfx3D";
import {
  impactSquash,
  RHYTHMIC_COURSE_WIDTH,
  RHYTHMIC_WORLD_SCALE,
  setWorldPoint,
  visualMarbleAtTime,
} from "./RhythmicMotion3D";

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
  backgroundUrl?: string;
  selectedNodeIndex: number | null;
  onSelectNode: (index: number | null) => void;
  onNote: (event: NoteEvent) => void;
  onTime: (timeMs: number) => void;
  onEnded: () => void;
  canvasRef?: MutableRefObject<HTMLCanvasElement | null>;
}

const CAMERA_Z = 10.15;
const CAMERA_FOV = 37;
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
  if (settings.cameraProfile === "comet") return 650;
  if (settings.cameraProfile === "xylophone") return 540;
  if (settings.cameraProfile === "tube-board") return 470;
  return 420;
}

function SceneContent(props: Omit<Props, "settings"> & { settings: StudioSettings; platforms: MarblePlatform[] }) {
  const { camera, invalidate } = useThree();
  const marbleMotionRef = useRef<THREE.Group>(null);
  const marbleRef = useRef<THREE.Group>(null);
  const vfxRef = useRef<RhythmicVfxHandle>(null);
  const marbleColor = useMemo(() => new THREE.Color(props.settings.ballBaseColor), [props.settings.ballBaseColor]);
  const initialSample = useMemo(
    () => visualMarbleAtTime(props.timeMs, props.events, props.platforms, props.settings, props.courseOverrides),
    [props.courseOverrides, props.events, props.platforms, props.settings, props.timeMs],
  );
  const [focusIndex, setFocusIndex] = useState(initialSample.platformIndex);
  const focusIndexRef = useRef(initialSample.platformIndex);
  const currentTimeRef = useRef(props.timeMs);
  const playbackEpochRef = useRef(performance.now() - props.playbackStartMs);
  const nextNoteIndex = useRef(firstEventAtOrAfter(props.events, props.playbackStartMs));
  const lastUiUpdate = useRef(0);
  const endedToken = useRef<number | null>(null);
  const previousTimeRef = useRef(props.timeMs);
  const previousWorld = useMemo(() => new THREE.Vector3(), []);
  const world = useMemo(() => new THREE.Vector3(), []);
  const aheadWorld = useMemo(() => new THREE.Vector3(), []);
  const beforeWorld = useMemo(() => new THREE.Vector3(), []);
  const afterWorld = useMemo(() => new THREE.Vector3(), []);
  const displacement = useMemo(() => new THREE.Vector3(), []);
  const velocity = useMemo(() => new THREE.Vector3(), []);
  const rollAxis = useMemo(() => new THREE.Vector3(), []);
  const rollQuaternion = useRef(new THREE.Quaternion());
  const deltaQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const smoothedLook = useMemo(() => new THREE.Vector3(), []);
  const initializedRef = useRef(false);

  const syncScene = useCallback((timeMs: number, deltaSeconds: number, snapCamera = false) => {
    const sample = visualMarbleAtTime(timeMs, props.events, props.platforms, props.settings, props.courseOverrides);
    const lookAheadMs = cameraLookAheadMs(props.settings);
    const ahead = visualMarbleAtTime(
      Math.min(props.durationMs, timeMs + lookAheadMs),
      props.events,
      props.platforms,
      props.settings,
      props.courseOverrides,
    );
    const sampleWindow = 10;
    const before = visualMarbleAtTime(
      Math.max(0, timeMs - sampleWindow),
      props.events,
      props.platforms,
      props.settings,
      props.courseOverrides,
    );
    const after = visualMarbleAtTime(
      Math.min(props.durationMs, timeMs + sampleWindow),
      props.events,
      props.platforms,
      props.settings,
      props.courseOverrides,
    );

    if (sample.platformIndex !== focusIndexRef.current) {
      focusIndexRef.current = sample.platformIndex;
      setFocusIndex(sample.platformIndex);
    }

    setWorldPoint(world, sample);
    setWorldPoint(aheadWorld, ahead);
    setWorldPoint(beforeWorld, before);
    setWorldPoint(afterWorld, after);
    velocity.copy(afterWorld).sub(beforeWorld).multiplyScalar(1000 / Math.max(1, sampleWindow * 2));

    const marbleMotion = marbleMotionRef.current;
    const marbleMesh = marbleRef.current;
    if (marbleMotion && marbleMesh) {
      const radius = Math.max(0.12, props.settings.ballSize * RHYTHMIC_WORLD_SCALE);
      const timeDelta = timeMs - previousTimeRef.current;
      displacement.copy(world).sub(previousWorld);
      const distance = displacement.length();
      if (initializedRef.current && timeDelta > 0 && timeDelta < 120 && distance > 0.0001 && distance < 2.5) {
        rollAxis.set(displacement.y, -displacement.x, 0);
        if (rollAxis.lengthSq() > 1e-7) {
          rollAxis.normalize();
          deltaQuaternion.setFromAxisAngle(rollAxis, Math.min(1.18, distance / radius));
          rollQuaternion.current.premultiply(deltaQuaternion).normalize();
        }
      }

      // Keep impact deformation in world space and spin on an inner group. Scaling
      // the same rotating group made the squash axis whirl around the sphere.
      marbleMotion.position.copy(world);
      const squash = impactSquash(sample.impactAgeMs);
      marbleMotion.scale.set(
        radius * (1 + squash * 0.32),
        radius * (1 - squash),
        radius * (1 + squash * 0.32),
      );
      marbleMesh.quaternion.copy(rollQuaternion.current);
      marbleColor.set(sample.color);
      const surface = marbleMesh.children[0] as THREE.Mesh | undefined;
      const material = surface?.material as THREE.MeshStandardMaterial | undefined;
      if (material && props.settings.ballStyle === "classic") material.color.copy(marbleColor);
    }

    previousWorld.copy(world);
    previousTimeRef.current = timeMs;
    initializedRef.current = true;
    vfxRef.current?.update(timeMs);

    const jumpDistance = world.distanceTo(aheadWorld);
    const density = noteDensity(props.events, timeMs);
    const speed = velocity.length();
    const profileZoom = props.settings.cameraProfile === "xylophone" ? 1.25 : (props.settings.cameraProfile === "comet" ? 0.5 : 0);
    const adaptiveZ = THREE.MathUtils.clamp(
      CAMERA_Z + profileZoom + jumpDistance * 0.18 + Math.min(0.45, speed * 0.018) - Math.min(0.75, density * 0.035),
      props.settings.cameraProfile === "xylophone" ? 10.4 : 8.8,
      props.settings.cameraProfile === "xylophone" ? 15.1 : 12.8,
    );
    const anchorOffset = (0.5 - props.settings.cameraAnchor) * 7.2;
    const lateralLead = THREE.MathUtils.clamp((aheadWorld.x - world.x) * 0.28 + velocity.x * 0.018, -0.95, 0.95);
    const verticalLag = THREE.MathUtils.clamp(velocity.y * 0.012, -0.32, 0.32);
    cameraTarget.set(world.x + lateralLead, world.y + anchorOffset - verticalLag, adaptiveZ + world.z * 0.18);

    const damping = 4.8 + THREE.MathUtils.clamp(props.settings.cameraSmoothing, 0.03, 0.65) * 14;
    if (snapCamera || !Number.isFinite(camera.position.x)) {
      camera.position.copy(cameraTarget);
    } else {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, cameraTarget.x, damping, deltaSeconds);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraTarget.y, damping, deltaSeconds);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraTarget.z, damping * 0.82, deltaSeconds);
    }

    lookTarget.set(
      THREE.MathUtils.lerp(world.x, aheadWorld.x, 0.58),
      THREE.MathUtils.lerp(world.y - 0.36, aheadWorld.y, 0.46),
      THREE.MathUtils.lerp(world.z, aheadWorld.z, 0.42),
    );
    if (snapCamera || smoothedLook.lengthSq() === 0) smoothedLook.copy(lookTarget);
    else {
      smoothedLook.x = THREE.MathUtils.damp(smoothedLook.x, lookTarget.x, damping * 1.18, deltaSeconds);
      smoothedLook.y = THREE.MathUtils.damp(smoothedLook.y, lookTarget.y, damping * 1.18, deltaSeconds);
      smoothedLook.z = THREE.MathUtils.damp(smoothedLook.z, lookTarget.z, damping * 1.18, deltaSeconds);
    }
    camera.lookAt(smoothedLook);

    const perspective = camera as THREE.PerspectiveCamera;
    const targetFov = THREE.MathUtils.clamp(CAMERA_FOV + jumpDistance * (props.settings.cameraProfile === "xylophone" ? 0.5 : 0.56) - density * 0.055, props.settings.cameraProfile === "xylophone" ? 37 : 34.5, props.settings.cameraProfile === "xylophone" ? 44.5 : 43.5);
    perspective.fov = snapCamera ? targetFov : THREE.MathUtils.damp(perspective.fov, targetFov, 5.5, deltaSeconds);
    perspective.updateProjectionMatrix();
    const bankTarget = THREE.MathUtils.clamp(-velocity.x * 0.006, -0.042, 0.042);
    perspective.rotation.z = snapCamera ? bankTarget : THREE.MathUtils.damp(perspective.rotation.z, bankTarget, 4.2, deltaSeconds);
  }, [
    afterWorld,
    aheadWorld,
    beforeWorld,
    camera,
    cameraTarget,
    deltaQuaternion,
    displacement,
    lookTarget,
    marbleColor,
    previousWorld,
    props.courseOverrides,
    props.durationMs,
    props.events,
    props.platforms,
    props.settings,
    rollAxis,
    smoothedLook,
    velocity,
    world,
  ]);

  useEffect(() => {
    currentTimeRef.current = props.playbackStartMs;
    playbackEpochRef.current = performance.now() - props.playbackStartMs;
    nextNoteIndex.current = firstEventAtOrAfter(props.events, props.playbackStartMs);
    previousTimeRef.current = props.playbackStartMs;
    initializedRef.current = false;
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
      <RhythmicEnvironment3D settings={props.settings} backgroundUrl={props.backgroundUrl} />
      <RhythmicCourseItems3D
        platforms={props.platforms}
        overrides={props.courseOverrides}
        settings={props.settings}
        focusIndex={focusIndex}
      />
      <RhythmicPlatformField3D
        platforms={props.platforms}
        settings={props.settings}
        courseOverrides={props.courseOverrides}
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
      <group ref={marbleMotionRef}>
        <RhythmicMarble3D ref={marbleRef} settings={props.settings} liveColor={marbleColor} />
      </group>
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
  useEffect(() => () => {
    if (props.canvasRef) props.canvasRef.current = null;
  }, [props.canvasRef]);

  const platforms = useMemo(
    () => buildMarbleCourse(props.events, props.settings, RHYTHMIC_COURSE_WIDTH),
    [props.events, props.settings.platformGap, props.settings.platformWidth, props.settings.platformThickness, props.settings.platformTilt, props.settings.laneSpread, props.settings.minBounceDistance, props.settings.bounceHeight, props.settings.ballSize, props.settings.prismStart, props.settings.prismEnd, props.settings.autoSyncGaps, props.settings.terrainProfile, props.settings.colorPaletteMode],
  );

  return (
    <div className="relative h-[66vh] max-h-[1280px] max-w-full aspect-[9/16] overflow-hidden rounded-xl bg-slate-950">
      <Canvas
        frameloop={props.playing ? "always" : "demand"}
        dpr={props.playing ? [1, 1.25] : [0.85, 1]}
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance", stencil: false }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.04;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          if (props.canvasRef) props.canvasRef.current = gl.domElement;
        }}
        onPointerMissed={() => props.onSelectNode(null)}
      >
        <color attach="background" args={[props.settings.backgroundColor]} />
        <SceneContent {...props} platforms={platforms} />
      </Canvas>
      <div className="pointer-events-none absolute left-2 top-2 rounded-md border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 backdrop-blur">
        WebGL · {props.playing ? "cinematic preview" : "quality idle"}
      </div>
    </div>
  );
}
