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
const radial = new THREE.Vector3();
const rayDirection = new THREE.Vector3();
const candidateA = new THREE.Vector3();
const candidateB = new THREE.Vector3();
const candidateC = new THREE.Vector3();
const candidateD = new THREE.Vector3();

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

function visibilityScore(scene: THREE.Scene, raycaster: THREE.Raycaster, candidate: THREE.Vector3, target: THREE.Vector3) {
  rayDirection.copy(target).sub(candidate);
  const distance = rayDirection.length();
  if (distance < 1) return 0;
  rayDirection.multiplyScalar(1 / distance);
  raycaster.set(candidate, rayDirection);
  raycaster.near = 0.8;
  raycaster.far = Math.max(1, distance - 1.4);
  const hit = raycaster.intersectObjects(scene.children, true).find((entry) => !cameraIgnored(entry.object));
  if (!hit) return 1;
  return THREE.MathUtils.clamp(hit.distance / distance, 0, 1);
}

function sectionFraming(section: string) {
  if (section === "switchback" || section === "hairpin" || section === "spiral") {
    return { radial: 20, behind: 5.5, lift: 15.5, fov: 65 };
  }
  if (section === "spinner" || section === "chimes" || section === "chaos") {
    return { radial: 21, behind: 4.5, lift: 15, fov: 65 };
  }
  if (section === "piano") return { radial: 21.5, behind: 6, lift: 13.5, fov: 63 };
  if (section === "tunnel") return { radial: 19.5, behind: 4, lift: 15.5, fov: 64 };
  if (section === "finish") return { radial: 22, behind: 5, lift: 16.5, fov: 64 };
  return { radial: 20, behind: 5.5, lift: 14.5, fov: 64 };
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
  candidate.y = THREE.MathUtils.clamp(candidate.y, 8, 54);
  candidate.z = THREE.MathUtils.clamp(candidate.z, -34, 55);
  return candidate;
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
    packFocus.multiplyScalar(1 / ranked.length).lerp(leaderFocus, 0.48);

    // Always favor the outside of the tower. The tower core therefore stays
    // behind the marbles instead of sitting between the lens and the leader.
    radial.set(packFocus.x - TOWER_CENTER.x, 0, packFocus.z - TOWER_CENTER.z);
    if (radial.lengthSq() < 4) radial.set(sample.right.x, 0, sample.right.z);
    if (radial.lengthSq() < 0.01) radial.set(1, 0, 0);
    radial.normalize();

    candidateA.copy(packFocus)
      .addScaledVector(radial, framing.radial)
      .addScaledVector(sample.tangent, -framing.behind)
      .addScaledVector(WORLD_UP, framing.lift);
    candidateB.copy(packFocus)
      .addScaledVector(radial, framing.radial + 4)
      .addScaledVector(sample.tangent, framing.behind * 0.35)
      .addScaledVector(WORLD_UP, framing.lift + 2.5);
    candidateC.copy(packFocus)
      .addScaledVector(radial, framing.radial - 2)
      .addScaledVector(sample.tangent, -framing.behind * 0.25)
      .addScaledVector(WORLD_UP, framing.lift + 8);
    candidateD.copy(packFocus)
      .addScaledVector(radial, framing.radial + 7)
      .addScaledVector(WORLD_UP, framing.lift + 7.5);

    [candidateA, candidateB, candidateC, candidateD].forEach(keepOutsideTower);

    frameCounter.current += 1;
    if (frameCounter.current % 3 === 1) {
      const target = look.copy(packFocus).addScaledVector(WORLD_UP, 1.05);
      const candidates = [candidateA, candidateB, candidateC, candidateD];
      let best = candidateC;
      let bestScore = -1;
      candidates.forEach((candidate, index) => {
        const score = visibilityScore(scene, raycaster.current, candidate, target) - index * 0.012;
        if (score > bestScore) {
          bestScore = score;
          best = candidate;
        }
      });
      visibleTarget.current.copy(bestScore < 0.78 ? candidateD : best);
    }

    const positionAlpha = 1 - Math.exp(-delta * 2.65);
    const lookAlpha = 1 - Math.exp(-delta * 5.2);
    camera.position.lerp(visibleTarget.current, positionAlpha);
    look.copy(packFocus).addScaledVector(sample.tangent, 5.2).addScaledVector(WORLD_UP, 1.1);
    lookTarget.current.lerp(look, lookAlpha);
    camera.lookAt(lookTarget.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, framing.fov, 1 - Math.exp(-delta * 2.6));
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
