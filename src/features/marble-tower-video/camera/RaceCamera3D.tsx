import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { RacePhysics } from "../physics/RacePhysics";
import { COURSE_SAMPLES } from "../track/towerCourseSampler";

const leaderFocus = new THREE.Vector3();
const packFocus = new THREE.Vector3();
const look = new THREE.Vector3();
const rayOrigin = new THREE.Vector3();
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

function lineOfSightScore(scene: THREE.Scene, raycaster: THREE.Raycaster, origin: THREE.Vector3, candidate: THREE.Vector3) {
  rayDirection.copy(candidate).sub(origin);
  const distance = rayDirection.length();
  if (distance < 0.5) return 0;
  rayDirection.multiplyScalar(1 / distance);
  raycaster.set(origin, rayDirection);
  raycaster.near = 0.75;
  raycaster.far = Math.max(0.8, distance - 0.7);
  const hit = raycaster.intersectObjects(scene.children, true).find((entry) => !cameraIgnored(entry.object));
  return hit ? Math.max(0, Math.min(1, hit.distance / distance)) : 1;
}

function sectionFraming(section: string) {
  if (section === "switchback" || section === "hairpin" || section === "spiral") {
    return { behind: 15.5, lift: 16.5, side: 9.5, fov: 65 };
  }
  if (section === "spinner" || section === "chimes" || section === "chaos") {
    return { behind: 16.5, lift: 15, side: 9.5, fov: 64 };
  }
  if (section === "piano") return { behind: 18, lift: 13.5, side: 6.5, fov: 62 };
  if (section === "tunnel") return { behind: 15, lift: 15.5, side: 8.5, fov: 64 };
  if (section === "finish") return { behind: 19, lift: 15.5, side: -8, fov: 64 };
  return { behind: 17, lift: 13.8, side: 7.2, fov: 63 };
}

export function RaceCamera3D({ physics }: { physics: RacePhysics }) {
  const { camera, scene } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 30, 0));
  const visibleTarget = useRef(new THREE.Vector3(0, 43, -30));
  const raycaster = useRef(new THREE.Raycaster());
  const frameCounter = useRef(0);

  useFrame((_, delta) => {
    const ranked = physics.getRanked().filter((marble) => marble.alive).slice(0, 3);
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
    packFocus.multiplyScalar(1 / ranked.length).lerp(leaderFocus, 0.42);

    candidateA.copy(packFocus)
      .addScaledVector(sample.tangent, -framing.behind)
      .addScaledVector(sample.normal, framing.lift)
      .addScaledVector(sample.right, framing.side);
    candidateB.copy(packFocus)
      .addScaledVector(sample.tangent, -framing.behind * 0.9)
      .addScaledVector(sample.normal, framing.lift * 1.1)
      .addScaledVector(sample.right, -framing.side);
    candidateC.copy(packFocus)
      .addScaledVector(sample.tangent, -framing.behind * 0.72)
      .addScaledVector(sample.normal, framing.lift * 1.42)
      .addScaledVector(sample.right, framing.side * 0.22);
    candidateD.copy(packFocus)
      .addScaledVector(sample.tangent, -framing.behind * 0.5)
      .addScaledVector(sample.normal, framing.lift * 1.72);

    frameCounter.current += 1;
    if (frameCounter.current % 4 === 1) {
      rayOrigin.copy(leaderFocus).addScaledVector(sample.normal, 1.15).addScaledVector(sample.tangent, 0.45);
      const candidates = [candidateA, candidateB, candidateC, candidateD];
      let best = candidateD;
      let bestScore = -1;
      candidates.forEach((candidate, index) => {
        const score = lineOfSightScore(scene, raycaster.current, rayOrigin, candidate) - index * 0.018;
        if (score > bestScore) {
          bestScore = score;
          best = candidate;
        }
      });
      visibleTarget.current.copy(bestScore < 0.55 ? candidateD : best);
    }

    const positionAlpha = 1 - Math.exp(-delta * 3.1);
    const lookAlpha = 1 - Math.exp(-delta * 5.4);
    camera.position.lerp(visibleTarget.current, positionAlpha);
    look.copy(packFocus).addScaledVector(sample.tangent, 5.8).addScaledVector(sample.normal, 0.9);
    lookTarget.current.lerp(look, lookAlpha);
    camera.lookAt(lookTarget.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, framing.fov, 1 - Math.exp(-delta * 2.8));
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
