import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { RacePhysics } from "../physics/RacePhysics";
import { COURSE_SAMPLES } from "../track/towerCourseSampler";

const TOWER_CENTER = new THREE.Vector3(0, 0, 12);
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const leaderFocus = new THREE.Vector3();
const packFocus = new THREE.Vector3();
const look = new THREE.Vector3();
const leaderTarget = new THREE.Vector3();
const radial = new THREE.Vector3();
const radialLeft = new THREE.Vector3();
const radialRight = new THREE.Vector3();
const rayDirection = new THREE.Vector3();
const candidateA = new THREE.Vector3();
const candidateB = new THREE.Vector3();
const candidateC = new THREE.Vector3();
const candidateD = new THREE.Vector3();
const resolvedCandidate = new THREE.Vector3();

function cameraIgnored(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.userData.cameraIgnore) return true;
    if (current instanceof THREE.Mesh) {
      const materials = Array.isArray(current.material) ? current.material : [current.material];
      if (materials.some((material) => material.transparent && material.opacity < 0.9)) return true;
    }
    current = current.parent;
  }
  return false;
}

function firstOccluder(scene: THREE.Scene, raycaster: THREE.Raycaster, origin: THREE.Vector3, target: THREE.Vector3) {
  rayDirection.copy(target).sub(origin);
  const distance = rayDirection.length();
  if (distance < 1) return null;
  rayDirection.multiplyScalar(1 / distance);
  raycaster.set(origin, rayDirection);
  raycaster.near = 0.65;
  raycaster.far = Math.max(0.8, distance - 1.1);
  return raycaster.intersectObjects(scene.children, true).find((entry) => !cameraIgnored(entry.object)) ?? null;
}

function visibilityScore(scene: THREE.Scene, raycaster: THREE.Raycaster, candidate: THREE.Vector3, target: THREE.Vector3) {
  const hit = firstOccluder(scene, raycaster, candidate, target);
  if (!hit) return 1;
  const distance = candidate.distanceTo(target);
  return THREE.MathUtils.clamp(hit.distance / Math.max(1, distance), 0, 1);
}

function sectionFraming(section: string) {
  if (section === "switchback" || section === "hairpin" || section === "spiral") {
    return { radial: 20, behind: 5.5, lift: 8.2, fov: 66 };
  }
  if (section === "spinner" || section === "chimes" || section === "chaos") {
    return { radial: 21, behind: 4.5, lift: 7.6, fov: 66 };
  }
  if (section === "piano") return { radial: 21.5, behind: 6, lift: 6.8, fov: 64 };
  if (section === "tunnel") return { radial: 20, behind: 4, lift: 7.2, fov: 65 };
  if (section === "finish") return { radial: 22, behind: 4.5, lift: 7.5, fov: 64 };
  return { radial: 20, behind: 5.5, lift: 7.4, fov: 65 };
}

function keepOutsideTower(candidate: THREE.Vector3) {
  radial.set(candidate.x - TOWER_CENTER.x, 0, candidate.z - TOWER_CENTER.z);
  const distance = radial.length();
  if (distance < 10.5) {
    if (distance < 0.01) radial.set(1, 0, 0);
    else radial.multiplyScalar(1 / distance);
    candidate.x = TOWER_CENTER.x + radial.x * 10.5;
    candidate.z = TOWER_CENTER.z + radial.z * 10.5;
  }
  candidate.x = THREE.MathUtils.clamp(candidate.x, -44, 44);
  candidate.y = THREE.MathUtils.clamp(candidate.y, 1.4, 47);
  candidate.z = THREE.MathUtils.clamp(candidate.z, -34, 55);
  return candidate;
}

function localCeilingY(target: THREE.Vector3, leaderIndex: number) {
  let ceiling = Number.POSITIVE_INFINITY;
  COURSE_SAMPLES.forEach((sample, index) => {
    if (Math.abs(index - leaderIndex) < 18) return;
    if (sample.point.y <= target.y + 3.6) return;
    const dx = sample.point.x - target.x;
    const dz = sample.point.z - target.z;
    if (dx * dx + dz * dz > 105) return;
    ceiling = Math.min(ceiling, sample.point.y - 1.45);
  });
  return ceiling;
}

function fitBelowUpperDeck(candidate: THREE.Vector3, target: THREE.Vector3, ceilingY: number) {
  const minimum = target.y + 2.3;
  if (Number.isFinite(ceilingY)) candidate.y = Math.min(candidate.y, ceilingY);
  candidate.y = Math.max(minimum, candidate.y);
  return candidate;
}

function pullCameraBeforeOccluder(
  scene: THREE.Scene,
  raycaster: THREE.Raycaster,
  target: THREE.Vector3,
  candidate: THREE.Vector3,
) {
  const hit = firstOccluder(scene, raycaster, target, candidate);
  if (!hit) return resolvedCandidate.copy(candidate);
  rayDirection.copy(candidate).sub(target);
  const distance = rayDirection.length();
  if (distance < 1) return resolvedCandidate.copy(candidate);
  rayDirection.multiplyScalar(1 / distance);
  const safeDistance = Math.max(3.2, hit.distance - 1.45);
  if (safeDistance >= hit.distance || safeDistance >= distance - 0.8) return resolvedCandidate.copy(candidate);
  return resolvedCandidate.copy(target).addScaledVector(rayDirection, safeDistance);
}

export function RaceCamera3D({ physics }: { physics: RacePhysics }) {
  const { camera, scene } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 30, 0));
  const visibleTarget = useRef(new THREE.Vector3(0, 43, -30));
  const raycaster = useRef(new THREE.Raycaster());
  const frameCounter = useRef(0);

  useFrame((_, delta) => {
    const ranked = physics.getRanked().filter((marble) => marble.alive).slice(0, 4);
    const leader = ranked[0];
    if (!leader) return;
    const sample = COURSE_SAMPLES[leader.progressIndex];
    const framing = sectionFraming(sample.section.id);
    leaderFocus.set(leader.body.position.x, leader.body.position.y, leader.body.position.z);

    packFocus.set(0, 0, 0);
    ranked.forEach((marble) => {
      packFocus.x += marble.body.position.x;
      packFocus.y += marble.body.position.y;
      packFocus.z += marble.body.position.z;
    });
    packFocus.multiplyScalar(1 / ranked.length).lerp(leaderFocus, 0.52);

    radial.set(packFocus.x - TOWER_CENTER.x, 0, packFocus.z - TOWER_CENTER.z);
    if (radial.lengthSq() < 4) radial.set(sample.right.x, 0, sample.right.z);
    if (radial.lengthSq() < 0.01) radial.set(1, 0, 0);
    radial.normalize();
    radialLeft.copy(radial).applyAxisAngle(WORLD_UP, Math.PI * 0.28);
    radialRight.copy(radial).applyAxisAngle(WORLD_UP, -Math.PI * 0.28);

    const ceilingY = localCeilingY(packFocus, leader.progressIndex);
    candidateA.copy(packFocus)
      .addScaledVector(radial, framing.radial)
      .addScaledVector(sample.tangent, -framing.behind)
      .addScaledVector(WORLD_UP, framing.lift);
    candidateB.copy(packFocus)
      .addScaledVector(radialLeft, framing.radial + 2)
      .addScaledVector(sample.tangent, -framing.behind * 0.25)
      .addScaledVector(WORLD_UP, framing.lift * 0.82);
    candidateC.copy(packFocus)
      .addScaledVector(radialRight, framing.radial + 2)
      .addScaledVector(sample.tangent, framing.behind * 0.18)
      .addScaledVector(WORLD_UP, framing.lift * 0.82);
    candidateD.copy(packFocus)
      .addScaledVector(radial, framing.radial + 6)
      .addScaledVector(sample.tangent, -framing.behind * 0.1)
      .addScaledVector(WORLD_UP, Math.max(4.6, framing.lift * 0.62));

    [candidateA, candidateB, candidateC, candidateD].forEach((candidate) => {
      fitBelowUpperDeck(candidate, packFocus, ceilingY);
      keepOutsideTower(candidate);
    });

    frameCounter.current += 1;
    if (frameCounter.current % 3 === 1) {
      const target = look.copy(packFocus).addScaledVector(WORLD_UP, 0.85);
      leaderTarget.copy(leaderFocus).addScaledVector(WORLD_UP, 0.7);
      const candidates = [candidateA, candidateB, candidateC, candidateD];
      let best = candidateA;
      let bestScore = -1;
      candidates.forEach((candidate, index) => {
        const packScore = visibilityScore(scene, raycaster.current, candidate, target);
        const leaderScore = visibilityScore(scene, raycaster.current, candidate, leaderTarget);
        const score = Math.min(packScore, leaderScore) - index * 0.008;
        if (score > bestScore) {
          bestScore = score;
          best = candidate;
        }
      });
      const collisionSafe = pullCameraBeforeOccluder(scene, raycaster.current, target, best);
      fitBelowUpperDeck(collisionSafe, packFocus, ceilingY);
      keepOutsideTower(collisionSafe);
      visibleTarget.current.copy(collisionSafe);
    }

    const positionAlpha = 1 - Math.exp(-delta * 3.15);
    const lookAlpha = 1 - Math.exp(-delta * 5.5);
    camera.position.lerp(visibleTarget.current, positionAlpha);
    look.copy(packFocus).addScaledVector(sample.tangent, 4.6).addScaledVector(WORLD_UP, 0.78);
    lookTarget.current.lerp(look, lookAlpha);
    camera.lookAt(lookTarget.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, framing.fov, 1 - Math.exp(-delta * 2.8));
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
