import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import type { CourseItemOverride, NoteEvent, StudioSettings } from "../types";
import type { MarblePlatform } from "../lib/marbleCourse";
import { RHYTHMIC_WORLD_SCALE, setWorldPoint, visualMarbleAtTime } from "./RhythmicMotion3D";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";

const MAX_TRAIL = 18;
const MAX_PARTICLES = 48;

function firstEventAfter(events: NoteEvent[], timeMs: number) {
  let low = 0;
  let high = events.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (events[mid].timeMs <= timeMs) low = mid + 1;
    else high = mid;
  }
  return low;
}

function hash(index: number, salt: number) {
  const raw = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return raw - Math.floor(raw);
}

function effectColorFromBall(target: THREE.Color, settings: StudioSettings, white: THREE.Color) {
  target.set(settings.ballBaseColor);
  if (settings.ballStyle === "striped") target.lerp(new THREE.Color(settings.ballStripeColor), 0.28);
  if (settings.ballStyle === "glass" || settings.ballStyle === "chrome") target.lerp(white, 0.26);
  if (settings.ballStyle === "prism") target.offsetHSL(0.04, 0.08, 0.05);
  return target;
}

function trailProfile(settings: StudioSettings) {
  const userLength = THREE.MathUtils.clamp(settings.trailLength, 0, 48);
  if (userLength <= 0) return { duration: 0, count: 0 };
  let duration = 150;
  if (settings.terrainProfile === "tube-board") duration = 88;
  if (settings.terrainProfile === "comet") duration = 240;
  if (settings.terrainProfile === "xylophone") duration = 68;
  if (settings.ballStyle === "glass" || settings.ballStyle === "chrome") duration *= 0.72;
  if (settings.ballStyle === "neon" || settings.ballStyle === "prism") duration *= 1.08;
  const count = Math.min(MAX_TRAIL, Math.max(1, Math.round(userLength * 0.36)));
  const durationScale = THREE.MathUtils.lerp(0.42, 1.55, userLength / 48);
  return { duration: duration * durationScale, count };
}

function particleBudget(settings: StudioSettings) {
  const requested = THREE.MathUtils.clamp(Math.round(settings.particleCount), 0, MAX_PARTICLES);
  const density = THREE.MathUtils.clamp(settings.spectralDensity, 0, 1.5);
  return Math.min(MAX_PARTICLES, Math.round(requested * THREE.MathUtils.lerp(0.45, 1.25, density / 1.5)));
}

export interface RhythmicVfxHandle {
  update: (timeMs: number) => void;
}

export const RhythmicVfx3D = forwardRef<RhythmicVfxHandle, {
  events: NoteEvent[];
  platforms: MarblePlatform[];
  settings: StudioSettings;
  courseOverrides: CourseItemOverride[];
  resolveSettings?: StudioSettingsResolver;
}>(function RhythmicVfx3D({ events, platforms, settings, courseOverrides, resolveSettings }, ref) {
  const trailRef = useRef<THREE.InstancedMesh>(null);
  const particleRef = useRef<THREE.InstancedMesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const helper = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const white = useMemo(() => new THREE.Color("#ffffff"), []);
  const hidden = useMemo(() => new THREE.Matrix4().makeScale(0, 0, 0), []);
  const pointA = useMemo(() => new THREE.Vector3(), []);
  const pointB = useMemo(() => new THREE.Vector3(), []);
  const midpoint = useMemo(() => new THREE.Vector3(), []);
  const delta = useMemo(() => new THREE.Vector3(), []);

  useImperativeHandle(ref, () => ({
    update(timeMs: number) {
      const trail = trailRef.current;
      const particles = particleRef.current;
      const ring = ringRef.current;
      const profile = trailProfile(settings);
      const radius = Math.max(0.06, settings.ballSize * RHYTHMIC_WORLD_SCALE);
      const sensitivity = THREE.MathUtils.clamp(settings.animationSensitivity, 0, 1.5);

      if (trail) {
        const sampleStep = Math.max(8, profile.duration / Math.max(1, profile.count) * 0.62);
        for (let index = 0; index < MAX_TRAIL; index += 1) {
          if (index >= profile.count) {
            trail.setMatrixAt(index, hidden);
            continue;
          }
          const t = profile.count <= 1 ? 0 : index / (profile.count - 1);
          const sampleTime = Math.max(0, timeMs - t * profile.duration);
          const sample = visualMarbleAtTime(sampleTime, events, platforms, settings, courseOverrides, resolveSettings);
          const previous = visualMarbleAtTime(Math.max(0, sampleTime - sampleStep), events, platforms, settings, courseOverrides, resolveSettings);
          setWorldPoint(pointA, sample);
          setWorldPoint(pointB, previous);
          midpoint.copy(pointA).add(pointB).multiplyScalar(0.5);
          delta.copy(pointA).sub(pointB);
          const length = Math.max(radius * 0.18, delta.length() * 0.58 + radius * 0.12);
          const thickness = radius * Math.max(0.045, (0.21 + sensitivity * 0.035) - t * 0.15);
          helper.position.copy(midpoint);
          helper.scale.set(length, thickness, thickness);
          helper.rotation.set(0, 0, Math.atan2(delta.y, delta.x));
          helper.updateMatrix();
          trail.setMatrixAt(index, helper.matrix);
          effectColorFromBall(color, settings, white);
          trail.setColorAt(index, color);
        }
        trail.instanceMatrix.needsUpdate = true;
        if (trail.instanceColor) trail.instanceColor.needsUpdate = true;
      }

      const impactIndex = firstEventAfter(events, timeMs) - 1;
      const event = events[impactIndex];
      const impactDuration = 170 + sensitivity * 55;
      const age = event ? timeMs - event.timeMs : Number.POSITIVE_INFINITY;
      const impactActive = Boolean(event) && age >= 0 && age <= impactDuration;
      const visibleParticles = particleBudget(settings);
      if (!impactActive) {
        if (particles) {
          for (let index = 0; index < MAX_PARTICLES; index += 1) particles.setMatrixAt(index, hidden);
          particles.instanceMatrix.needsUpdate = true;
        }
        if (ring) ring.visible = false;
        return;
      }

      const impactSample = visualMarbleAtTime(event.timeMs, events, platforms, settings, courseOverrides, resolveSettings);
      const impactPoint = setWorldPoint(pointA, impactSample);
      const life = THREE.MathUtils.clamp(age / impactDuration, 0, 1);
      const impactColor = effectColorFromBall(color, settings, white).clone();
      if (particles) {
        for (let index = 0; index < MAX_PARTICLES; index += 1) {
          if (index >= visibleParticles) {
            particles.setMatrixAt(index, hidden);
            continue;
          }
          const angle = hash(impactIndex + 1, index + 11) * Math.PI * 2;
          const speed = (0.34 + hash(impactIndex + 17, index + 31) * 0.82) * (0.78 + sensitivity * 0.28);
          const lift = (0.18 + hash(impactIndex + 29, index + 7) * 0.52) * (0.8 + sensitivity * 0.24);
          helper.position.set(
            impactPoint.x + Math.cos(angle) * speed * life,
            impactPoint.y + Math.sin(angle) * speed * life + lift * life - 0.46 * life * life,
            impactPoint.z + (hash(impactIndex + 41, index + 19) - 0.5) * 0.36 * life,
          );
          helper.scale.setScalar(Math.max(0.001, (1 - life) * (0.025 + hash(index, 43) * 0.045) * (0.8 + sensitivity * 0.25)));
          helper.rotation.set(0, 0, 0);
          helper.updateMatrix();
          particles.setMatrixAt(index, helper.matrix);
          color.copy(impactColor);
          if (index % 5 === 0) color.lerp(white, 0.42);
          particles.setColorAt(index, color);
        }
        particles.instanceMatrix.needsUpdate = true;
        if (particles.instanceColor) particles.instanceColor.needsUpdate = true;
      }
      if (ring) {
        ring.visible = settings.impactRipple && settings.ringPulseSensitivity > 0;
        if (ring.visible) {
          const ringSensitivity = THREE.MathUtils.clamp(settings.ringPulseSensitivity, 0, 1.5);
          ring.position.copy(impactPoint);
          ring.rotation.set(0, 0, 0);
          ring.scale.setScalar(0.28 + life * (0.72 + ringSensitivity * 0.72));
          const material = ring.material as THREE.MeshBasicMaterial;
          material.color.copy(impactColor);
          material.opacity = (1 - life) * (0.14 + ringSensitivity * 0.24);
        }
      }
    },
  }), [color, courseOverrides, delta, events, helper, hidden, midpoint, platforms, pointA, pointB, resolveSettings, settings, white]);

  const trailOpacity = settings.glowAnimation ? (settings.terrainProfile === "comet" ? 0.42 : 0.24) : 0.14;
  return (
    <group>
      <instancedMesh ref={trailRef} args={[undefined, undefined, MAX_TRAIL]} frustumCulled={false}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial transparent opacity={trailOpacity} vertexColors depthWrite={false} blending={settings.glowAnimation ? THREE.AdditiveBlending : THREE.NormalBlending} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={particleRef} args={[undefined, undefined, MAX_PARTICLES]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial transparent opacity={0.68} vertexColors depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <mesh ref={ringRef} visible={false}>
        <torusGeometry args={[0.42, 0.016, 8, 48]} />
        <meshBasicMaterial transparent opacity={0.36} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
});
