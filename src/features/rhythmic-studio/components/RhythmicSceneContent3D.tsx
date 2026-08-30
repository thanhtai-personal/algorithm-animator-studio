import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { RhythmicScene3DProps } from "./RhythmicScene3D";
import { RhythmicCourseItems3D } from "./RhythmicCourseItems3D";
import { RhythmicEnvironment3D } from "./RhythmicEnvironment3D";
import { RhythmicLightingRig3D } from "./RhythmicLightingRig3D";
import { RhythmicGuideRails3D } from "./RhythmicGuideRails3D";
import { RhythmicMarble3D } from "./RhythmicMarble3D";
import { RhythmicChaseMarbles3D, type RhythmicChaseMarblesHandle } from "./RhythmicChaseMarbles3D";
import { RhythmicPlatformField3D } from "./RhythmicPlatformField3D";
import { RhythmicTitle3D } from "./RhythmicTitle3D";
import { RhythmicSubscribeReminder3D } from "./RhythmicSubscribeReminder3D";
import { RhythmicVfx3D, type RhythmicVfxHandle } from "./RhythmicVfx3D";
import { impactSquash, RHYTHMIC_WORLD_SCALE, setWorldPoint, visualChaseFocusAtTime, visualMarbleAtTime } from "./RhythmicMotion3D";
import {
  cameraDepthProfile,
  cameraFollowDamping,
  cameraLookAheadMs,
  courseBackdropBounds,
  crossedRhythmicHit,
  firstEventAtOrAfter,
  noteDensity,
  platformImpactStrength,
  rhythmicRecordingRenderProfile,
  RHYTHMIC_CAMERA_FOV,
  RHYTHMIC_CAMERA_Z,
  RHYTHMIC_UI_UPDATE_MS,
  steadyCameraAxisTarget,
  wallScoreCameraFov,
} from "./rhythmicSceneMath3D";
import { emitDueRhythmicHits } from "../lib/chaseAudioScheduler";
import { settingsForChaseOwner } from "../engine/chaseCoursePlanner";
import { isKorobeinikiWallLayout } from "../lib/korobeinikiReferenceLayout";
import { usesSharedWallScore } from "../lib/wallScoreLayout";
import { KorobeinikiReferenceDecor3D } from "./KorobeinikiReferenceDecor3D";
import {
  advanceRhythmicPlaybackFrameClock,
  createRhythmicPlaybackFrameClock,
} from "./rhythmicPlaybackFrameClock";

function RendererQuality({ recording, shadowsEnabled, exportFps, continuousRecordingShadows = false }: {
  recording: boolean;
  shadowsEnabled: boolean;
  exportFps: number;
  continuousRecordingShadows?: boolean;
}) {
  const { gl, invalidate } = useThree();
  const shadowElapsedRef = useRef(0);
  useEffect(() => {
    const profile = rhythmicRecordingRenderProfile(exportFps);
    gl.transmissionResolutionScale = recording ? profile.transmissionResolutionScale : 0.68;
    gl.shadowMap.enabled = shadowsEnabled;
    // Shadow maps are one of the most expensive passes in this scene. Most
    // presets refresh them at a capped rate, but the Korobeiniki reference wall
    // uses long wall shadows that expose a stale shadow-map edge during export.
    // Refresh that small reference scene every encoded render frame instead.
    gl.shadowMap.autoUpdate = recording && continuousRecordingShadows;
    gl.shadowMap.needsUpdate = shadowsEnabled;
    shadowElapsedRef.current = 0;
    invalidate();
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [continuousRecordingShadows, exportFps, gl, invalidate, recording, shadowsEnabled]);

  useFrame((_, delta) => {
    if (!shadowsEnabled || (recording && continuousRecordingShadows)) return;
    shadowElapsedRef.current += Math.min(0.1, delta);
    const shadowFps = recording ? Math.min(30, Math.max(20, exportFps)) : 24;
    const interval = 1 / shadowFps;
    if (shadowElapsedRef.current < interval) return;
    shadowElapsedRef.current %= interval;
    gl.shadowMap.needsUpdate = true;
  }, -20);
  return null;
}

function sceneSampleAt(props: RhythmicScene3DProps, timeMs: number) {
  return props.chasePlan
    ? visualChaseFocusAtTime(timeMs, props.chasePlan, props.settings, props.resolveSettings)
    : visualMarbleAtTime(timeMs, props.events, props.platforms, props.settings, props.courseOverrides, props.resolveSettings);
}

export function RhythmicSceneContent3D(props: RhythmicScene3DProps) {
  const { camera, invalidate } = useThree();
  const marbleMotionRef = useRef<THREE.Group>(null);
  const marbleRef = useRef<THREE.Group>(null);
  const chaseMarblesRef = useRef<RhythmicChaseMarblesHandle>(null);
  const vfxRef = useRef<RhythmicVfxHandle>(null);
  const initialSample = useMemo(
    () => sceneSampleAt(props, props.timeMs),
    [props.chasePlan, props.courseOverrides, props.events, props.platforms, props.resolveSettings, props.settings, props.timeMs],
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
  const playbackClockRef = useRef(createRhythmicPlaybackFrameClock(
    props.playbackToken,
    props.playbackStartMs,
    performance.now(),
  ));
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
    const sample = sceneSampleAt(props, timeMs);
    const frameSettings = props.resolveSettings(sample.segmentIndex);
    if (frameSettings !== activeSettingsRef.current) {
      activeSettingsRef.current = frameSettings;
      setActiveVisualSettings(frameSettings);
    }
    const lookAheadMs = cameraLookAheadMs(frameSettings);
    const ahead = sceneSampleAt(props, Math.min(props.durationMs, timeMs + lookAheadMs));
    const farAhead = sceneSampleAt(props, Math.min(props.durationMs, timeMs + lookAheadMs * 1.72));
    const sampleWindow = 10;
    const before = sceneSampleAt(props, Math.max(0, timeMs - sampleWindow));
    const after = sceneSampleAt(props, Math.min(props.durationMs, timeMs + sampleWindow));

    if (sample.platformIndex !== focusIndexRef.current) {
      focusIndexRef.current = sample.platformIndex;
      setFocusIndex(sample.platformIndex);
    }

    const impactOwner = props.chasePlan?.ownership.ownerByEventIndex[sample.platformIndex];
    const impactSettings = impactOwner ? settingsForChaseOwner(frameSettings, impactOwner) : frameSettings;
    const impactStrength = platformImpactStrength(sample.impactAgeMs, impactSettings);
    const impactNow = performance.now();
    const previousImpact = impactLightRef.current;
    const hitTimeMs = props.events[sample.platformIndex]?.timeMs;
    const crossedHit = hitTimeMs !== undefined
      && crossedRhythmicHit(previousTimeRef.current, timeMs, hitTimeMs);
    if (
      snapCamera
      || crossedHit
      || sample.platformIndex !== previousImpact.index
      || (impactNow - lastImpactRenderRef.current >= 56 && Math.abs(impactStrength - previousImpact.strength) >= 0.075)
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
    if (!props.chasePlan && marbleMotion && marbleMesh) {
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
    chaseMarblesRef.current?.update(timeMs);

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
    const isWallScore = usesSharedWallScore(frameSettings);
    const isStableKorobeiniki = isKorobeinikiWallLayout(frameSettings);
    const depthProfile = cameraDepthProfile(frameSettings);
    const adaptiveZ = THREE.MathUtils.clamp(
      RHYTHMIC_CAMERA_Z + depthProfile.offset + jumpDistance * (isComet ? 0.15 : 0.13) + Math.min(0.42, speed * 0.015) - Math.min(rollingSurface ? 0.24 : 0.58, density * (rollingSurface ? 0.012 : 0.028)),
      depthProfile.near,
      depthProfile.far,
    ) * THREE.MathUtils.clamp(frameSettings.cameraDistance, 0.8, 1.3);
    const anchorOffset = (0.5 - frameSettings.cameraAnchor) * 6.4;
    const lateralFactor = isStableKorobeiniki ? 0.018 : isWallScore ? 0.038 : rollingSurface ? 0.075 : isShowcase ? 0.09 : isXylophone ? 0.13 : isTubeBoard ? 0.16 : 0.2;
    const lateralClamp = isStableKorobeiniki ? 0.1 : isWallScore ? 0.12 : rollingSurface ? 0.26 : isShowcase ? 0.3 : isXylophone ? 0.42 : isTubeBoard ? 0.48 : 0.62;
    const verticalFactor = isStableKorobeiniki ? 0.0024 : isWallScore ? 0.0042 : isXylophone ? 0.006 : isTubeBoard ? 0.0075 : 0.009;
    const frameLead = isStableKorobeiniki ? 0.08 : isWallScore ? 0.14 : isShowcase ? 0.2 : isComet ? 0.2 : isTubeBoard ? 0.15 : isXylophone ? 0.13 : 0.15;
    const nearFramedX = THREE.MathUtils.lerp(world.x, aheadWorld.x, frameLead);
    const nearFramedY = THREE.MathUtils.lerp(world.y, aheadWorld.y, frameLead * 0.72);
    const futureWeight = isStableKorobeiniki ? 0.03 : isWallScore ? 0.09 : isShowcase ? 0.19 : isComet ? 0.12 : 0.08;
    const framedX = THREE.MathUtils.lerp(nearFramedX, farAheadWorld.x, futureWeight);
    const framedY = THREE.MathUtils.lerp(nearFramedY, farAheadWorld.y, futureWeight * 0.72);
    const lateralLead = THREE.MathUtils.clamp((aheadWorld.x - world.x) * lateralFactor + velocity.x * (lateralFactor * 0.04), -lateralClamp, lateralClamp);
    const verticalLag = THREE.MathUtils.clamp(velocity.y * verticalFactor, -0.18, 0.24);
    const observerOffsetX = isStableKorobeiniki ? 0.42 : isWallScore ? 0.48 : isShowcase ? 0.78 : isXylophone ? 0.62 : isTubeBoard ? 0.52 : isComet ? -0.38 : 0.3;
    const observerLiftY = isStableKorobeiniki ? 0.26 : isWallScore ? 0.22 : isShowcase ? 0.42 : isXylophone ? 0.34 : isTubeBoard ? 0.22 : isComet ? 0.12 : 0.16;
    const desiredCameraX = framedX + lateralLead + observerOffsetX;
    const stableCameraX = isWallScore && !snapCamera
      ? steadyCameraAxisTarget(camera.position.x, desiredCameraX, isStableKorobeiniki ? 0.56 : 0.48)
      : desiredCameraX;
    const desiredCameraY = framedY + anchorOffset - verticalLag + observerLiftY;
    const stableCameraY = isWallScore && !snapCamera
      ? steadyCameraAxisTarget(camera.position.y, desiredCameraY, isStableKorobeiniki ? 0.34 : 0.28)
      : desiredCameraY;
    cameraTarget.set(stableCameraX, stableCameraY, adaptiveZ + world.z * (isComet ? 0.14 : 0.08));

    const damping = cameraFollowDamping(frameSettings.cameraSmoothing, isWallScore);
    if (snapCamera || !Number.isFinite(camera.position.x)) camera.position.copy(cameraTarget);
    else {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, cameraTarget.x, damping, deltaSeconds);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraTarget.y, damping, deltaSeconds);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraTarget.z, damping * 0.74, deltaSeconds);
    }

    const lookX = THREE.MathUtils.lerp(world.x, aheadWorld.x, isStableKorobeiniki ? 0.4 : isShowcase ? 0.64 : isComet ? 0.62 : isTubeBoard ? 0.58 : 0.55);
    const lookDrop = isStableKorobeiniki ? 0.14 : isWallScore ? 0.18 : isShowcase ? 0.12 : isXylophone ? 0.18 : 0.28;
    const lookY = THREE.MathUtils.lerp(world.y - lookDrop, aheadWorld.y, isShowcase ? 0.5 : isComet ? 0.48 : 0.43);
    const desiredLookX = THREE.MathUtils.lerp(lookX, farAheadWorld.x, isComet ? 0.08 : 0.05);
    const stableLookX = isWallScore && !snapCamera && smoothedLook.lengthSq() > 0
      ? steadyCameraAxisTarget(smoothedLook.x, desiredLookX, isStableKorobeiniki ? 0.3 : 0.24)
      : desiredLookX;
    const desiredLookY = THREE.MathUtils.lerp(lookY, farAheadWorld.y, isComet ? 0.06 : 0.04);
    const stableLookY = isWallScore && !snapCamera && smoothedLook.lengthSq() > 0
      ? steadyCameraAxisTarget(smoothedLook.y, desiredLookY, isStableKorobeiniki ? 0.2 : 0.16)
      : desiredLookY;
    lookTarget.set(
      stableLookX,
      stableLookY,
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
    const targetFov = isWallScore
      ? wallScoreCameraFov(jumpDistance, density, isStableKorobeiniki)
      : THREE.MathUtils.clamp(
          RHYTHMIC_CAMERA_FOV + jumpDistance * (isShowcase ? 0.24 : isComet ? 0.48 : isXylophone ? 0.32 : 0.35) - density * (rollingSurface ? 0.018 : 0.045),
          isShowcase ? 35 : isComet ? 35.5 : isXylophone ? 34 : 34.5,
          isShowcase ? 41.5 : isComet ? 43.2 : isXylophone ? 39.8 : 40.8,
        );
    const nextFov = snapCamera ? targetFov : THREE.MathUtils.damp(perspective.fov, targetFov, 6.2, deltaSeconds);
    if (Math.abs(nextFov - perspective.fov) > 0.015) {
      perspective.fov = nextFov;
      perspective.updateProjectionMatrix();
    }
    const bankStrength = isWallScore ? 0 : rollingSurface ? 0.0007 : isShowcase ? 0.0012 : isXylophone ? 0.0022 : isTubeBoard ? 0.0028 : 0.0042;
    const bankLimit = isWallScore ? 0 : rollingSurface ? 0.006 : isShowcase ? 0.008 : isXylophone ? 0.014 : isTubeBoard ? 0.018 : 0.028;
    const bankTarget = THREE.MathUtils.clamp(-velocity.x * bankStrength, -bankLimit, bankLimit);
    perspective.rotation.z = snapCamera ? bankTarget : THREE.MathUtils.damp(perspective.rotation.z, bankTarget, 4.8, deltaSeconds);
  }, [afterWorld, aheadWorld, beforeWorld, farAheadWorld, camera, cameraTarget, deltaQuaternion, displacement, lookTarget, previousWorld, props.chasePlan, props.courseOverrides, props.durationMs, props.events, props.platforms, props.resolveSettings, props.settings, rollAxis, smoothedLook, velocity, world]);

  useEffect(() => {
    currentTimeRef.current = props.playbackStartMs;
    playbackClockRef.current = createRhythmicPlaybackFrameClock(
      props.playbackToken,
      props.playbackStartMs,
      performance.now(),
    );
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
    const now = performance.now();
    const frame = advanceRhythmicPlaybackFrameClock(playbackClockRef.current, {
      playbackToken: props.playbackToken,
      playbackStartMs: props.playbackStartMs,
      playbackEndMs: endMs,
      nowMs: now,
    });
    playbackClockRef.current = frame.clock;
    if (frame.reset) {
      nextNoteIndex.current = firstEventAtOrAfter(props.events, props.playbackStartMs);
      previousTimeRef.current = props.playbackStartMs;
      initializedRef.current = false;
      endedToken.current = null;
    }
    const timeMs = frame.timeMs;
    currentTimeRef.current = timeMs;
    nextNoteIndex.current = emitDueRhythmicHits({
      nextIndex: nextNoteIndex.current,
      timeMs,
      events: props.events,
      platforms: props.platforms,
      resolveSettings: props.resolveSettings,
      courseOverrides: props.courseOverrides,
      onNote: props.onNote,
    });
    // Starting an export rebuilds the frame clock in a React effect before the
    // first R3F frame. Carry a one-shot scene snap on the clock itself so the
    // camera cannot ease from the end of the previous preview into frame zero.
    syncScene(timeMs, delta, frame.snapScene);
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
    <RendererQuality
      recording={props.recording}
      shadowsEnabled={props.settings.instrumentShadowsEnabled}
      exportFps={props.settings.exportFps}
      continuousRecordingShadows={isKorobeinikiWallLayout(props.settings)}
    />
    <PerspectiveCamera makeDefault fov={RHYTHMIC_CAMERA_FOV} near={0.1} far={180} position={[0, 0, RHYTHMIC_CAMERA_Z]} />
    <RhythmicTitle3D text={isKorobeinikiWallLayout(props.settings) ? "" : props.settings.titleText} />
    <RhythmicLightingRig3D settings={props.settings} focus={smoothedLook} bounds={backdropBounds} recording={props.recording} />
    <RhythmicEnvironment3D settings={props.settings} backgroundUrl={props.backgroundUrl} bounds={backdropBounds}>
      <RhythmicSubscribeReminder3D timeRef={currentTimeRef} platforms={props.platforms} settings={props.settings} />
    </RhythmicEnvironment3D>
    {isKorobeinikiWallLayout(props.settings) && <KorobeinikiReferenceDecor3D platforms={props.platforms} />}
    <RhythmicCourseItems3D platforms={props.platforms} overrides={props.courseOverrides} settings={props.settings} focusIndex={focusIndex} events={props.events} resolveSettings={props.resolveSettings} />
    <RhythmicGuideRails3D platforms={props.platforms} settings={props.settings} focusIndex={focusIndex} />
    <RhythmicPlatformField3D platforms={props.platforms} settings={props.settings} courseOverrides={props.courseOverrides} focusIndex={focusIndex} selectedNodeIndex={props.selectedNodeIndex} onSelectNode={props.onSelectNode} resolveSettings={props.resolveSettings} impactIndex={impactLight.index} impactStrength={impactLight.strength} timeMs={currentTimeRef.current} />
    <RhythmicVfx3D ref={vfxRef} events={props.events} platforms={props.platforms} settings={activeVisualSettings} courseOverrides={props.courseOverrides} resolveSettings={props.resolveSettings} />
    {props.chasePlan
      ? <RhythmicChaseMarbles3D ref={chaseMarblesRef} plan={props.chasePlan} settings={props.settings} resolveSettings={props.resolveSettings} />
      : <group ref={marbleMotionRef}><RhythmicMarble3D ref={marbleRef} settings={activeVisualSettings} /></group>}
  </>;
}
