import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { RhythmicScene3DProps } from "./RhythmicScene3D";
import { RhythmicCourseItems3D } from "./RhythmicCourseItems3D";
import { RhythmicEnvironment3D } from "./RhythmicEnvironment3D";
import { RhythmicLightingRig3D } from "./RhythmicLightingRig3D";
import { RhythmicMarble3D } from "./RhythmicMarble3D";
import { RhythmicPlatformField3D } from "./RhythmicPlatformField3D";
import { RhythmicTitle3D } from "./RhythmicTitle3D";
import { RhythmicVfx3D, type RhythmicVfxHandle } from "./RhythmicVfx3D";
import { impactSquash, RHYTHMIC_WORLD_SCALE, setWorldPoint, visualMarbleAtTime } from "./RhythmicMotion3D";
import {
  cameraDepthProfile,
  cameraLookAheadMs,
  courseBackdropBounds,
  firstEventAtOrAfter,
  noteDensity,
  platformImpactStrength,
  rhythmicRecordingRenderProfile,
  RHYTHMIC_CAMERA_FOV,
  RHYTHMIC_CAMERA_Z,
  RHYTHMIC_UI_UPDATE_MS,
} from "./rhythmicSceneMath3D";
import { instrumentHitForPlatform } from "../lib/instrumentHitEvent";

function RendererQuality({ recording, shadowsEnabled, exportFps }: { recording: boolean; shadowsEnabled: boolean; exportFps: number }) {
  const { gl } = useThree();
  useEffect(() => {
    const profile = rhythmicRecordingRenderProfile(exportFps);
    gl.transmissionResolutionScale = recording ? profile.transmissionResolutionScale : 0.72;
    gl.shadowMap.enabled = shadowsEnabled;
    gl.shadowMap.needsUpdate = shadowsEnabled;
  }, [exportFps, gl, recording, shadowsEnabled]);
  return null;
}

export function RhythmicSceneContent3D(props: RhythmicScene3DProps) {
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
  const initialImpact = platformImpactStrength(initialSample.impactAgeMs, initialVisualSettings);
  const [impactLight, setImpactLight] = useState({ index: initialSample.platformIndex, strength: initialImpact });
  const impactLightRef = useRef({ index: initialSample.platformIndex, strength: initialImpact });
  const lastImpactRenderRef = useRef(0);
  const currentTimeRef = useRef(props.timeMs);
  const playbackEpochRef = useRef(performance.now() - props.playbackStartMs);
  const nextNoteIndex = useRef(firstEventAtOrAfter(props.events, props.playbackStartMs));
  const lastUiUpdate = useRef(0);
  const endedToken = useRef<number | null>(null);
  const previousTimeRef = useRef(props.timeMs);
  const previousWorld = useMemo(() => new THREE.Vector3(), []);
  const world = useMemo(() => new THREE.Vector3(), []);
  const aheadWorld = useMemo(() => new THREE.Vector3(), []);
  const farAheadWorld = useMemo(() => new THREE.Vector3(), []);
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
  const backdropBounds = useMemo(() => courseBackdropBounds(props.platforms.map((platform) => (
    -(platform.visualY ?? platform.y) * RHYTHMIC_WORLD_SCALE
  ))), [props.platforms]);

  const syncScene = useCallback((timeMs: number, deltaSeconds: number, snapCamera = false) => {
    const sample = visualMarbleAtTime(timeMs, props.events, props.platforms, props.settings, props.courseOverrides, props.resolveSettings);
    const frameSettings = props.resolveSettings(sample.segmentIndex);
    if (frameSettings !== activeSettingsRef.current) {
      activeSettingsRef.current = frameSettings;
      setActiveVisualSettings(frameSettings);
    }
    const lookAheadMs = cameraLookAheadMs(frameSettings);
    const ahead = visualMarbleAtTime(Math.min(props.durationMs, timeMs + lookAheadMs), props.events, props.platforms, props.settings, props.courseOverrides, props.resolveSettings);
    const farAhead = visualMarbleAtTime(Math.min(props.durationMs, timeMs + lookAheadMs * 1.72), props.events, props.platforms, props.settings, props.courseOverrides, props.resolveSettings);
    const sampleWindow = 10;
    const before = visualMarbleAtTime(Math.max(0, timeMs - sampleWindow), props.events, props.platforms, props.settings, props.courseOverrides, props.resolveSettings);
    const after = visualMarbleAtTime(Math.min(props.durationMs, timeMs + sampleWindow), props.events, props.platforms, props.settings, props.courseOverrides, props.resolveSettings);

    if (sample.platformIndex !== focusIndexRef.current) {
      focusIndexRef.current = sample.platformIndex;
      setFocusIndex(sample.platformIndex);
    }

    const impactStrength = platformImpactStrength(sample.impactAgeMs, frameSettings);
    const impactNow = performance.now();
    const previousImpact = impactLightRef.current;
    if (
      snapCamera
      || sample.platformIndex !== previousImpact.index
      || (impactNow - lastImpactRenderRef.current >= 32 && Math.abs(impactStrength - previousImpact.strength) >= 0.045)
      || (impactStrength === 0 && previousImpact.strength > 0)
    ) {
      const nextImpact = { index: sample.platformIndex, strength: impactStrength };
      impactLightRef.current = nextImpact;
      lastImpactRenderRef.current = impactNow;
      setImpactLight(nextImpact);
    }

    setWorldPoint(world, sample);
    setWorldPoint(aheadWorld, ahead);
    setWorldPoint(farAheadWorld, farAhead);
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
      marbleMotion.position.copy(world);
      const squash = frameSettings.pulseAnimation
        ? impactSquash(sample.impactAgeMs) * THREE.MathUtils.clamp(frameSettings.animationSensitivity, 0, 1.5)
        : 0;
      marbleMotion.scale.set(radius * (1 + squash * 0.32), radius * (1 - squash), radius * (1 + squash * 0.32));
      marbleMesh.quaternion.copy(rollQuaternion.current);
    }

    previousWorld.copy(world);
    previousTimeRef.current = timeMs;
    initializedRef.current = true;
    vfxRef.current?.update(timeMs);

    const jumpDistance = world.distanceTo(aheadWorld);
    const density = noteDensity(props.events, timeMs);
    const speed = velocity.length();
    const motionPlatform = props.platforms[Math.max(0, Math.min(props.platforms.length - 1, sample.platformIndex))];
    const rollingSurface = motionPlatform?.motionMode === "roll" || motionPlatform?.denseSurfaceId !== undefined;
    const isXylophone = frameSettings.cameraProfile === "xylophone";
    const isTubeBoard = frameSettings.cameraProfile === "tube-board";
    const isComet = frameSettings.cameraProfile === "comet";
    const isShowcase = frameSettings.instrumentFamily !== "auto";
    const depthProfile = cameraDepthProfile(frameSettings);
    const adaptiveZ = THREE.MathUtils.clamp(
      RHYTHMIC_CAMERA_Z + depthProfile.offset + jumpDistance * (isComet ? 0.15 : 0.13) + Math.min(0.42, speed * 0.015) - Math.min(rollingSurface ? 0.24 : 0.58, density * (rollingSurface ? 0.012 : 0.028)),
      depthProfile.near,
      depthProfile.far,
    ) * THREE.MathUtils.clamp(frameSettings.cameraDistance, 0.8, 1.3);
    const anchorOffset = (0.5 - frameSettings.cameraAnchor) * 6.4;
    const lateralFactor = rollingSurface ? 0.075 : isShowcase ? 0.09 : isXylophone ? 0.13 : isTubeBoard ? 0.16 : 0.2;
    const lateralClamp = rollingSurface ? 0.26 : isShowcase ? 0.3 : isXylophone ? 0.42 : isTubeBoard ? 0.48 : 0.62;
    const verticalFactor = isXylophone ? 0.006 : isTubeBoard ? 0.0075 : 0.009;
    const frameLead = isShowcase ? 0.2 : isComet ? 0.2 : isTubeBoard ? 0.15 : isXylophone ? 0.13 : 0.15;
    const nearFramedX = THREE.MathUtils.lerp(world.x, aheadWorld.x, frameLead);
    const nearFramedY = THREE.MathUtils.lerp(world.y, aheadWorld.y, frameLead * 0.72);
    const futureWeight = isShowcase ? 0.19 : isComet ? 0.12 : 0.08;
    const framedX = THREE.MathUtils.lerp(nearFramedX, farAheadWorld.x, futureWeight);
    const framedY = THREE.MathUtils.lerp(nearFramedY, farAheadWorld.y, futureWeight * 0.72);
    const lateralLead = THREE.MathUtils.clamp((aheadWorld.x - world.x) * lateralFactor + velocity.x * (lateralFactor * 0.04), -lateralClamp, lateralClamp);
    const verticalLag = THREE.MathUtils.clamp(velocity.y * verticalFactor, -0.18, 0.24);
    const observerOffsetX = isShowcase ? 0.78 : isXylophone ? 0.62 : isTubeBoard ? 0.52 : isComet ? -0.38 : 0.3;
    const observerLiftY = isShowcase ? 0.42 : isXylophone ? 0.34 : isTubeBoard ? 0.22 : isComet ? 0.12 : 0.16;
    cameraTarget.set(framedX + lateralLead + observerOffsetX, framedY + anchorOffset - verticalLag + observerLiftY, adaptiveZ + world.z * (isComet ? 0.14 : 0.08));

    const damping = 5.4 + THREE.MathUtils.clamp(frameSettings.cameraSmoothing, 0.03, 0.65) * 12.5;
    if (snapCamera || !Number.isFinite(camera.position.x)) camera.position.copy(cameraTarget);
    else {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, cameraTarget.x, damping, deltaSeconds);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraTarget.y, damping, deltaSeconds);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraTarget.z, damping * 0.74, deltaSeconds);
    }

    const lookX = THREE.MathUtils.lerp(world.x, aheadWorld.x, isShowcase ? 0.64 : isComet ? 0.62 : isTubeBoard ? 0.58 : 0.55);
    const lookY = THREE.MathUtils.lerp(world.y - (isShowcase ? 0.12 : isXylophone ? 0.18 : 0.28), aheadWorld.y, isShowcase ? 0.5 : isComet ? 0.48 : 0.43);
    lookTarget.set(
      THREE.MathUtils.lerp(lookX, farAheadWorld.x, isComet ? 0.08 : 0.05),
      THREE.MathUtils.lerp(lookY, farAheadWorld.y, isComet ? 0.06 : 0.04),
      THREE.MathUtils.lerp(world.z, aheadWorld.z, isComet ? 0.42 : 0.3),
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
      RHYTHMIC_CAMERA_FOV + jumpDistance * (isShowcase ? 0.24 : isComet ? 0.48 : isXylophone ? 0.32 : 0.35) - density * (rollingSurface ? 0.018 : 0.045),
      isShowcase ? 35 : isComet ? 35.5 : isXylophone ? 34 : 34.5,
      isShowcase ? 41.5 : isComet ? 43.2 : isXylophone ? 39.8 : 40.8,
    );
    perspective.fov = snapCamera ? targetFov : THREE.MathUtils.damp(perspective.fov, targetFov, 6.2, deltaSeconds);
    perspective.updateProjectionMatrix();
    const bankStrength = rollingSurface ? 0.0007 : isShowcase ? 0.0012 : isXylophone ? 0.0022 : isTubeBoard ? 0.0028 : 0.0042;
    const bankLimit = rollingSurface ? 0.006 : isShowcase ? 0.008 : isXylophone ? 0.014 : isTubeBoard ? 0.018 : 0.028;
    const bankTarget = THREE.MathUtils.clamp(-velocity.x * bankStrength, -bankLimit, bankLimit);
    perspective.rotation.z = snapCamera ? bankTarget : THREE.MathUtils.damp(perspective.rotation.z, bankTarget, 4.8, deltaSeconds);
  }, [afterWorld, aheadWorld, beforeWorld, farAheadWorld, camera, cameraTarget, deltaQuaternion, displacement, lookTarget, previousWorld, props.courseOverrides, props.durationMs, props.events, props.platforms, props.resolveSettings, props.settings, rollAxis, smoothedLook, velocity, world]);

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
      const index = nextNoteIndex.current;
      props.onNote(instrumentHitForPlatform(index, props.platforms, props.resolveSettings(index), props.courseOverrides));
      nextNoteIndex.current += 1;
    }
    syncScene(timeMs, delta);
    const now = performance.now();
    if (now - lastUiUpdate.current >= RHYTHMIC_UI_UPDATE_MS) {
      lastUiUpdate.current = now;
      props.onTime(timeMs);
    }
    if (timeMs >= endMs && endedToken.current !== props.playbackToken) {
      endedToken.current = props.playbackToken;
      props.onTime(endMs);
      props.onEnded();
    }
  });

  return <>
    <RendererQuality recording={props.recording} shadowsEnabled={props.settings.instrumentShadowsEnabled} exportFps={props.settings.exportFps} />
    <PerspectiveCamera makeDefault fov={RHYTHMIC_CAMERA_FOV} near={0.1} far={180} position={[0, 0, RHYTHMIC_CAMERA_Z]} />
    <RhythmicTitle3D text={props.settings.titleText} />
    <RhythmicLightingRig3D settings={props.settings} focus={smoothedLook} bounds={backdropBounds} recording={props.recording} />
    <RhythmicEnvironment3D settings={props.settings} backgroundUrl={props.backgroundUrl} bounds={backdropBounds} />
    <RhythmicCourseItems3D platforms={props.platforms} overrides={props.courseOverrides} settings={props.settings} focusIndex={focusIndex} events={props.events} resolveSettings={props.resolveSettings} />
    <RhythmicPlatformField3D platforms={props.platforms} settings={props.settings} courseOverrides={props.courseOverrides} focusIndex={focusIndex} selectedNodeIndex={props.selectedNodeIndex} onSelectNode={props.onSelectNode} resolveSettings={props.resolveSettings} impactIndex={impactLight.index} impactStrength={impactLight.strength} timeMs={props.timeMs} />
    <RhythmicVfx3D ref={vfxRef} events={props.events} platforms={props.platforms} settings={activeVisualSettings} courseOverrides={props.courseOverrides} resolveSettings={props.resolveSettings} />
    <group ref={marbleMotionRef}><RhythmicMarble3D ref={marbleRef} settings={activeVisualSettings} /></group>
  </>;
}
