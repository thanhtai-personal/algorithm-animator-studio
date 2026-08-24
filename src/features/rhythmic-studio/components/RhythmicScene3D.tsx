import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CourseItemOverride, NoteEvent, StudioSettings } from "../types";
import type { RhythmicPresetId } from "../lib/studioPresets";
import { buildPresetMixPlan, createPresetMixSettingsResolver } from "../lib/presetMix";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";
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
  presetMixEnabled: boolean;
  activePresetId: RhythmicPresetId | null;
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
  const base = settings.cameraProfile === "comet" ? 560
    : settings.cameraProfile === "xylophone" ? 460
      : settings.cameraProfile === "tube-board" ? 380
        : 420;
  return base * THREE.MathUtils.clamp(settings.cameraLookAhead, 0.5, 1.5);
}

function RendererQuality({ recording }: { recording: boolean }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.transmissionResolutionScale = recording ? 1 : 0.72;
  }, [gl, recording]);
  return null;
}

function SceneContent(props: Props & { platforms: MarblePlatform[]; resolveSettings: StudioSettingsResolver }) {
  const { camera, invalidate } = useThree();
  const marbleMotionRef = useRef<THREE.Group>(null);
  const marbleRef = useRef<THREE.Group>(null);
  const vfxRef = useRef<RhythmicVfxHandle>(null);
  const initialSample = useMemo(
    () => visualMarbleAtTime(props.timeMs, props.events, props.platforms, props.settings, props.courseOverrides, props.resolveSettings),
    [props.courseOverrides, props.events, props.platforms, props.resolveSettings, props.settings, props.timeMs],
  );
  const initialVisualSettings = useMemo(() => props.resolveSettings(initialSample.segmentIndex), [initialSample.segmentIndex, props.resolveSettings]);
  const [activeVisualSettings, setActiveVisualSettings] = useState(initialVisualSettings);
  const activeSettingsRef = useRef(initialVisualSettings);
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
    const sample = visualMarbleAtTime(timeMs, props.events, props.platforms, props.settings, props.courseOverrides, props.resolveSettings);
    const frameSettings = props.resolveSettings(sample.segmentIndex);
    if (frameSettings !== activeSettingsRef.current) {
      activeSettingsRef.current = frameSettings;
      setActiveVisualSettings(frameSettings);
    }
    const lookAheadMs = cameraLookAheadMs(frameSettings);
    const ahead = visualMarbleAtTime(
      Math.min(props.durationMs, timeMs + lookAheadMs),
      props.events,
      props.platforms,
      props.settings,
      props.courseOverrides,
      props.resolveSettings,
    );
    const sampleWindow = 10;
    const before = visualMarbleAtTime(
      Math.max(0, timeMs - sampleWindow),
      props.events,
      props.platforms,
      props.settings,
      props.courseOverrides,
      props.resolveSettings,
    );
    const after = visualMarbleAtTime(
      Math.min(props.durationMs, timeMs + sampleWindow),
      props.events,
      props.platforms,
      props.settings,
      props.courseOverrides,
      props.resolveSettings,
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
      const radius = Math.max(0.06, frameSettings.ballSize * RHYTHMIC_WORLD_SCALE);
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
      const squash = frameSettings.pulseAnimation
        ? impactSquash(sample.impactAgeMs) * THREE.MathUtils.clamp(frameSettings.animationSensitivity, 0, 1.5)
        : 0;
      marbleMotion.scale.set(
        radius * (1 + squash * 0.32),
        radius * (1 - squash),
        radius * (1 + squash * 0.32),
      );
      marbleMesh.quaternion.copy(rollQuaternion.current);
    }

    previousWorld.copy(world);
    previousTimeRef.current = timeMs;
    initializedRef.current = true;
    vfxRef.current?.update(timeMs);

    const jumpDistance = world.distanceTo(aheadWorld);
    const density = noteDensity(props.events, timeMs);
    const speed = velocity.length();
    const isXylophone = frameSettings.cameraProfile === "xylophone";
    const isTubeBoard = frameSettings.cameraProfile === "tube-board";
    const isComet = frameSettings.cameraProfile === "comet";
    const profileZoom = isXylophone ? 1.95 : isComet ? 0.92 : isTubeBoard ? 1.05 : 0.4;
    const adaptiveZ = THREE.MathUtils.clamp(
      CAMERA_Z + profileZoom + jumpDistance * (isComet ? 0.15 : 0.13) + Math.min(0.42, speed * 0.015) - Math.min(0.58, density * 0.028),
      isXylophone ? 11.9 : isTubeBoard ? 10.1 : 9.6,
      isXylophone ? 15.9 : isTubeBoard ? 13.7 : 13.6,
    ) * THREE.MathUtils.clamp(frameSettings.cameraDistance, 0.8, 1.3);
    const anchorOffset = (0.5 - frameSettings.cameraAnchor) * 6.4;
    const lateralFactor = isXylophone ? 0.13 : isTubeBoard ? 0.16 : 0.2;
    const lateralClamp = isXylophone ? 0.42 : isTubeBoard ? 0.48 : 0.62;
    const verticalFactor = isXylophone ? 0.006 : isTubeBoard ? 0.0075 : 0.009;
    const frameLead = isComet ? 0.22 : isTubeBoard ? 0.16 : isXylophone ? 0.14 : 0.16;
    const framedX = THREE.MathUtils.lerp(world.x, aheadWorld.x, frameLead);
    const framedY = THREE.MathUtils.lerp(world.y, aheadWorld.y, frameLead * 0.7);
    const lateralLead = THREE.MathUtils.clamp((aheadWorld.x - world.x) * lateralFactor + velocity.x * (lateralFactor * 0.04), -lateralClamp, lateralClamp);
    const verticalLag = THREE.MathUtils.clamp(velocity.y * verticalFactor, -0.18, 0.24);
    const observerOffsetX = isXylophone ? 0.62 : isTubeBoard ? 0.52 : isComet ? -0.38 : 0.3;
    const observerLiftY = isXylophone ? 0.34 : isTubeBoard ? 0.22 : isComet ? 0.12 : 0.16;
    cameraTarget.set(framedX + lateralLead + observerOffsetX, framedY + anchorOffset - verticalLag + observerLiftY, adaptiveZ + world.z * (isComet ? 0.14 : 0.08));

    const damping = 5.4 + THREE.MathUtils.clamp(frameSettings.cameraSmoothing, 0.03, 0.65) * 12.5;
    if (snapCamera || !Number.isFinite(camera.position.x)) {
      camera.position.copy(cameraTarget);
    } else {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, cameraTarget.x, damping, deltaSeconds);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraTarget.y, damping, deltaSeconds);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraTarget.z, damping * 0.74, deltaSeconds);
    }

    lookTarget.set(
      THREE.MathUtils.lerp(world.x, aheadWorld.x, isComet ? 0.68 : isTubeBoard ? 0.64 : 0.6),
      THREE.MathUtils.lerp(world.y - (isXylophone ? 0.18 : 0.28), aheadWorld.y, isComet ? 0.5 : 0.46),
      THREE.MathUtils.lerp(world.z, aheadWorld.z, isComet ? 0.5 : 0.38),
    );
    if (snapCamera || smoothedLook.lengthSq() === 0) smoothedLook.copy(lookTarget);
    else {
      smoothedLook.x = THREE.MathUtils.damp(smoothedLook.x, lookTarget.x, damping * 1.28, deltaSeconds);
      smoothedLook.y = THREE.MathUtils.damp(smoothedLook.y, lookTarget.y, damping * 1.28, deltaSeconds);
      smoothedLook.z = THREE.MathUtils.damp(smoothedLook.z, lookTarget.z, damping * 1.22, deltaSeconds);
    }
    camera.lookAt(smoothedLook);

    const perspective = camera as THREE.PerspectiveCamera;
    const targetFov = THREE.MathUtils.clamp(
      CAMERA_FOV + jumpDistance * (isComet ? 0.48 : isXylophone ? 0.32 : 0.35) - density * 0.045,
      isComet ? 35.5 : isXylophone ? 34 : 34.5,
      isComet ? 43.2 : isXylophone ? 39.8 : 40.8,
    );
    perspective.fov = snapCamera ? targetFov : THREE.MathUtils.damp(perspective.fov, targetFov, 6.2, deltaSeconds);
    perspective.updateProjectionMatrix();
    const bankStrength = isXylophone ? 0.0022 : isTubeBoard ? 0.0028 : 0.0042;
    const bankLimit = isXylophone ? 0.014 : isTubeBoard ? 0.018 : 0.028;
    const bankTarget = THREE.MathUtils.clamp(-velocity.x * bankStrength, -bankLimit, bankLimit);
    perspective.rotation.z = snapCamera ? bankTarget : THREE.MathUtils.damp(perspective.rotation.z, bankTarget, 4.8, deltaSeconds);
  }, [
    afterWorld,
    aheadWorld,
    beforeWorld,
    camera,
    cameraTarget,
    deltaQuaternion,
    displacement,
    lookTarget,
    previousWorld,
    props.courseOverrides,
    props.durationMs,
    props.events,
    props.platforms,
    props.resolveSettings,
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
      <RendererQuality recording={props.recording} />
      <PerspectiveCamera makeDefault fov={CAMERA_FOV} near={0.1} far={180} position={[0, 0, CAMERA_Z]} />
      <RhythmicLightingRig3D settings={props.settings} />
      <RhythmicEnvironment3D settings={props.settings} backgroundUrl={props.backgroundUrl} />
      <RhythmicCourseItems3D
        platforms={props.platforms}
        overrides={props.courseOverrides}
        settings={props.settings}
        focusIndex={focusIndex}
        events={props.events}
        resolveSettings={props.resolveSettings}
      />
      <RhythmicPlatformField3D
        platforms={props.platforms}
        settings={props.settings}
        courseOverrides={props.courseOverrides}
        focusIndex={focusIndex}
        selectedNodeIndex={props.selectedNodeIndex}
        onSelectNode={props.onSelectNode}
        resolveSettings={props.resolveSettings}
      />
      <RhythmicVfx3D
        ref={vfxRef}
        events={props.events}
        platforms={props.platforms}
        settings={activeVisualSettings}
        courseOverrides={props.courseOverrides}
        resolveSettings={props.resolveSettings}
      />
      <group ref={marbleMotionRef}>
        <RhythmicMarble3D ref={marbleRef} settings={activeVisualSettings} />
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

  const mixPlan = useMemo(
    () => buildPresetMixPlan(props.events, props.presetMixEnabled, props.activePresetId),
    [props.activePresetId, props.events, props.presetMixEnabled],
  );
  const resolveSettings = useMemo(
    () => createPresetMixSettingsResolver(props.settings, mixPlan),
    [mixPlan, props.settings],
  );
  const platforms = useMemo(
    () => buildMarbleCourse(props.events, props.settings, RHYTHMIC_COURSE_WIDTH, resolveSettings),
    [props.events, props.settings, resolveSettings],
  );

  return (
    <div className="relative h-[66vh] max-h-[1280px] max-w-full aspect-[9/16] overflow-hidden rounded-xl bg-slate-950">
      <Canvas
        frameloop={props.playing ? "always" : "demand"}
        dpr={props.recording ? 2 : props.playing ? [1, 1.35] : [1, 1.15]}
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance", stencil: false }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          if (props.canvasRef) props.canvasRef.current = gl.domElement;
        }}
        onPointerMissed={() => props.onSelectNode(null)}
      >
        <color attach="background" args={[props.settings.backgroundColor]} />
        <SceneContent {...props} platforms={platforms} resolveSettings={resolveSettings} />
      </Canvas>
      <div className="pointer-events-none absolute left-2 top-2 rounded-md border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 backdrop-blur">
        WebGL 3D · {props.presetMixEnabled ? "preset mix" : props.recording ? "recording" : props.playing ? "live" : "ready"}
      </div>
    </div>
  );
}
