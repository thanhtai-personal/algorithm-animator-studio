import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import type { CourseItemOverride, NoteEvent, StudioSettings } from "../types";
import type { MarblePlatform, MarblePoint } from "../lib/marbleCourse";
import { marbleAtTime } from "../lib/marbleCourse";

const COURSE_WIDTH = 720;
const WORLD_SCALE = 0.012;
const MAX_TRAIL = 12;
const PARTICLES = 14;

function worldPoint(point: Pick<MarblePoint, "x" | "y">) {
  return new THREE.Vector3((point.x - COURSE_WIDTH / 2) * WORLD_SCALE, -point.y * WORLD_SCALE, 0.04);
}

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

function trailProfile(settings: StudioSettings) {
  let duration = 170;
  let count = 7;
  if (settings.terrainProfile === "tube-board") { duration = 105; count = 5; }
  if (settings.terrainProfile === "comet") { duration = 330; count = 12; }
  if (settings.terrainProfile === "xylophone") { duration = 75; count = 4; }
  if (settings.ballStyle === "glass" || settings.ballStyle === "chrome") duration *= 0.7;
  if (settings.ballStyle === "neon" || settings.ballStyle === "prism") duration *= 1.12;
  const userScale = THREE.MathUtils.clamp(0.7 + settings.trailLength / 30, 0.75, 1.3);
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
}>(function RhythmicVfx3D({ events, platforms, settings, courseOverrides }, ref) {
  const trailRef = useRef<THREE.InstancedMesh>(null);
  const particleRef = useRef<THREE.InstancedMesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const helper = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const hidden = useMemo(() => new THREE.Matrix4().makeScale(0, 0, 0), []);

  useImperativeHandle(ref, () => ({
    update(timeMs: number) {
      const trail = trailRef.current;
      const particles = particleRef.current;
      const ring = ringRef.current;
      const profile = trailProfile(settings);
      const radius = Math.max(0.1, settings.ballSize * WORLD_SCALE);

      if (trail) {
        for (let index = 0; index < MAX_TRAIL; index += 1) {
          if (index >= profile.count) {
            trail.setMatrixAt(index, hidden);
            continue;
          }
          const t = profile.count <= 1 ? 0 : index / (profile.count - 1);
          const sampleTime = Math.max(0, timeMs - t * profile.duration);
          const sample = marbleAtTime(sampleTime, events, platforms, settings, courseOverrides);
          const point = worldPoint(sample);
          const scale = radius * (0.42 - t * 0.27);
          helper.position.copy(point);
          helper.scale.setScalar(Math.max(0.018, scale));
          helper.rotation.set(0, 0, 0);
          helper.updateMatrix();
          trail.setMatrixAt(index, helper.matrix);
          color.set(sample.color);
          if (settings.terrainProfile === "xylophone") color.lerp(new THREE.Color("#ffffff"), 0.55);
          trail.setColorAt(index, color);
        }
        trail.instanceMatrix.needsUpdate = true;
        if (trail.instanceColor) trail.instanceColor.needsUpdate = true;
      }

      const impactIndex = firstEventAfter(events, timeMs) - 1;
      const event = events[impactIndex];
      const age = event ? timeMs - event.timeMs : Number.POSITIVE_INFINITY;
      const impactActive = Boolean(event) && age >= 0 && age <= 230;
      if (!impactActive) {
        if (particles) {
          for (let index = 0; index < PARTICLES; index += 1) particles.setMatrixAt(index, hidden);
          particles.instanceMatrix.needsUpdate = true;
        }
        if (ring) ring.visible = false;
        return;
      }

      const impactPoint = worldPoint(marbleAtTime(event.timeMs, events, platforms, settings, courseOverrides));
      const life = THREE.MathUtils.clamp(age / 230, 0, 1);
      const impactColor = platforms[Math.min(impactIndex, platforms.length - 1)]?.color ?? settings.ballBaseColor;
      if (particles) {
        for (let index = 0; index < PARTICLES; index += 1) {
          const angle = hash(impactIndex + 1, index + 11) * Math.PI * 2;
          const speed = 0.65 + hash(impactIndex + 17, index + 31) * 1.45;
          const lift = 0.45 + hash(impactIndex + 29, index + 7) * 1.15;
          helper.position.set(
            impactPoint.x + Math.cos(angle) * speed * life,
            impactPoint.y + Math.sin(angle) * speed * life + lift * life - 0.7 * life * life,
            impactPoint.z + (hash(impactIndex + 41, index + 19) - 0.5) * 0.75 * life,
          );
          helper.scale.setScalar(Math.max(0.001, (1 - life) * (0.055 + hash(index, 43) * 0.06)));
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
        ring.scale.setScalar(0.38 + life * 1.35);
        const material = ring.material as THREE.MeshBasicMaterial;
        material.color.set(impactColor);
        material.opacity = (1 - life) * (settings.terrainProfile === "xylophone" ? 0.32 : 0.52);
      }
    },
  }), [color, courseOverrides, events, helper, hidden, platforms, settings]);

  return (
    <group>
      <instancedMesh ref={trailRef} args={[undefined, undefined, MAX_TRAIL]} frustumCulled={false}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial transparent opacity={settings.terrainProfile === "comet" ? 0.58 : 0.28} vertexColors depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={particleRef} args={[undefined, undefined, PARTICLES]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial transparent opacity={0.78} vertexColors depthWrite={false} />
      </instancedMesh>
      <mesh ref={ringRef} visible={false}>
        <torusGeometry args={[0.42, 0.024, 8, 40]} />
        <meshBasicMaterial transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
});
