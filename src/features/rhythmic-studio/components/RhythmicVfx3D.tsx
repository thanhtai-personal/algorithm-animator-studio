import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import type { CourseItemOverride, NoteEvent, StudioSettings } from "../types";
import type { MarblePlatform } from "../lib/marbleCourse";
import { RHYTHMIC_WORLD_SCALE, setWorldPoint, visualMarbleAtTime } from "./RhythmicMotion3D";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";

const MAX_TRAIL = 12;
const PARTICLES = 14;

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


function effectColorFromBall(target: THREE.Color, settings: StudioSettings, fallback: string, white: THREE.Color) {
  target.set(settings.ballBaseColor || fallback);
  if (settings.ballStyle === "striped") target.lerp(new THREE.Color(settings.ballStripeColor), 0.28);
  if (settings.ballStyle === "glass" || settings.ballStyle === "chrome") target.lerp(white, 0.34);
  if (settings.ballStyle === "prism") target.offsetHSL(0.04, 0.08, 0.06);
  if (settings.ballStyle === "classic") target.lerp(white, 0.08);
  return target;
}
function trailProfile(settings: StudioSettings) {
  let duration = 165;
  let count = 7;
  if (settings.terrainProfile === "tube-board") { duration = 92; count = 5; }
  if (settings.terrainProfile === "comet") { duration = 285; count = 10; }
  if (settings.terrainProfile === "xylophone") { duration = 62; count = 4; }
  if (settings.ballStyle === "glass" || settings.ballStyle === "chrome") duration *= 0.7;
  if (settings.ballStyle === "neon" || settings.ballStyle === "prism") duration *= 1.08;
  const userScale = THREE.MathUtils.clamp(0.7 + settings.trailLength / 30, 0.75, 1.25);
  return { duration: duration * userScale, count };
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
      const radius = Math.max(0.1, settings.ballSize * RHYTHMIC_WORLD_SCALE);

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
          const length = Math.max(radius * 0.24, delta.length() * 0.56 + radius * 0.18);
          const thickness = radius * Math.max(0.075, 0.28 - t * 0.19);
          helper.position.copy(midpoint);
          helper.scale.set(length, thickness, thickness);
          helper.rotation.set(0, 0, Math.atan2(delta.y, delta.x));
          helper.updateMatrix();
          trail.setMatrixAt(index, helper.matrix);
          effectColorFromBall(color, settings, sample.color, white);
          if (settings.terrainProfile === "xylophone") color.lerp(white, 0.22);
          trail.setColorAt(index, color);
        }
        trail.instanceMatrix.needsUpdate = true;
        if (trail.instanceColor) trail.instanceColor.needsUpdate = true;
      }

      const impactIndex = firstEventAfter(events, timeMs) - 1;
      const event = events[impactIndex];
      const age = event ? timeMs - event.timeMs : Number.POSITIVE_INFINITY;
      const impactActive = Boolean(event) && age >= 0 && age <= 220;
      if (!impactActive) {
        if (particles) {
          for (let index = 0; index < PARTICLES; index += 1) particles.setMatrixAt(index, hidden);
          particles.instanceMatrix.needsUpdate = true;
        }
        if (ring) ring.visible = false;
        return;
      }

      const impactSample = visualMarbleAtTime(event.timeMs, events, platforms, settings, courseOverrides, resolveSettings);
      const impactPoint = setWorldPoint(pointA, impactSample);
      const life = THREE.MathUtils.clamp(age / 220, 0, 1);
      const impactPlatformColor = platforms[Math.min(impactIndex, platforms.length - 1)]?.color ?? settings.ballBaseColor;
      const impactColor = `#${effectColorFromBall(new THREE.Color(), settings, impactPlatformColor, white).getHexString()}`;
      if (particles) {
        for (let index = 0; index < PARTICLES; index += 1) {
          const angle = hash(impactIndex + 1, index + 11) * Math.PI * 2;
          const speed = 0.55 + hash(impactIndex + 17, index + 31) * 1.25;
          const lift = 0.35 + hash(impactIndex + 29, index + 7) * 0.9;
          helper.position.set(
            impactPoint.x + Math.cos(angle) * speed * life,
            impactPoint.y + Math.sin(angle) * speed * life + lift * life - 0.62 * life * life,
            impactPoint.z + (hash(impactIndex + 41, index + 19) - 0.5) * 0.62 * life,
          );
          helper.scale.setScalar(Math.max(0.001, (1 - life) * (0.04 + hash(index, 43) * 0.05)));
          helper.rotation.set(0, 0, 0);
          helper.updateMatrix();
          particles.setMatrixAt(index, helper.matrix);
          color.set(index % 4 === 0 ? "#ffffff" : impactColor);
          particles.setColorAt(index, color);
        }
        particles.instanceMatrix.needsUpdate = true;
        if (particles.instanceColor) particles.instanceColor.needsUpdate = true;
      }
      if (ring) {
        ring.visible = true;
        ring.position.copy(impactPoint);
        ring.rotation.set(0, 0, 0);
        ring.scale.setScalar(0.34 + life * 1.1);
        const material = ring.material as THREE.MeshBasicMaterial;
        material.color.set(impactColor);
        material.opacity = (1 - life) * (settings.terrainProfile === "xylophone" ? 0.24 : 0.42);
      }
    },
  }), [color, courseOverrides, delta, events, helper, hidden, midpoint, platforms, pointA, pointB, resolveSettings, settings, white]);

  return (
    <group>
      <instancedMesh ref={trailRef} args={[undefined, undefined, MAX_TRAIL]} frustumCulled={false}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial transparent opacity={settings.terrainProfile === "comet" ? 0.5 : 0.22} vertexColors depthWrite={false} blending={settings.terrainProfile === "comet" ? THREE.AdditiveBlending : THREE.NormalBlending} />
      </instancedMesh>
      <instancedMesh ref={particleRef} args={[undefined, undefined, PARTICLES]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial transparent opacity={0.72} vertexColors depthWrite={false} />
      </instancedMesh>
      <mesh ref={ringRef} visible={false}>
        <torusGeometry args={[0.42, 0.018, 8, 40]} />
        <meshBasicMaterial transparent opacity={0.42} depthWrite={false} />
      </mesh>
    </group>
  );
});
