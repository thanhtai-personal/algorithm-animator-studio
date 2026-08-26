import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { RacePhysics } from "../physics/RacePhysics";
import { COURSE_SAMPLES } from "../track/towerCourseSampler";

const focus = new THREE.Vector3();
const look = new THREE.Vector3();
const rayOrigin = new THREE.Vector3();
const rayDirection = new THREE.Vector3();
const candidateA = new THREE.Vector3();
const candidateB = new THREE.Vector3();
const candidateC = new THREE.Vector3();

function cameraIgnored(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.userData.cameraIgnore) return true;
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
  raycaster.near = 0.65;
  raycaster.far = Math.max(0.7, distance - 0.55);
  const hit = raycaster.intersectObjects(scene.children, true)
    .find((entry) => !cameraIgnored(entry.object));
  return hit ? Math.max(0, Math.min(1, hit.distance / distance)) : 1;
}

function sectionFraming(section: string) {
  if (section === "switchback" || section === "hairpin" || section === "spiral") {
    return { behind: 8.2, lift: 11.5, side: 8.5, fov: 60 };
  }
  if (section === "spinner" || section === "chimes" || section === "chaos") {
    return { behind: 8.5, lift: 9.5, side: 8.2, fov: 59 };
  }
  if (section === "piano") return { behind: 12.5, lift: 7.2, side: 4.2, fov: 56 };
  if (section === "tunnel") return { behind: 8.5, lift: 8.8, side: 7.2, fov: 59 };
  if (section === "finish") return { behind: 13.5, lift: 9.5, side: -7.5, fov: 58 };
  return { behind: 11.5, lift: 7.5, side: 4.6, fov: 57 };
}

export function RaceCamera3D({ physics }: { physics: RacePhysics }) {
  const { camera, scene } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 30, 0));
  const visibleTarget = useRef(new THREE.Vector3(0, 40, -24));
  const raycaster = useRef(new THREE.Raycaster());
  const frameCounter = useRef(0);

  useFrame((_, delta) => {
    const leader = physics.getLeader();
    if (!leader) return;
    const sample = COURSE_SAMPLES[leader.progressIndex];
    const framing = sectionFraming(sample.section.id);
    focus.set(leader.body.position.x, leader.body.position.y, leader.body.position.z);

    candidateA.copy(focus)
      .addScaledVector(sample.tangent, -framing.behind)
      .addScaledVector(sample.normal, framing.lift)
      .addScaledVector(sample.right, framing.side);
    candidateB.copy(focus)
      .addScaledVector(sample.tangent, -framing.behind * 0.82)
      .addScaledVector(sample.normal, framing.lift * 1.2)
      .addScaledVector(sample.right, -framing.side * 0.92);
    candidateC.copy(focus)
      .addScaledVector(sample.tangent, -framing.behind * 0.48)
      .addScaledVector(sample.normal, framing.lift * 1.72)
      .addScaledVector(sample.right, framing.side * 0.12);

    frameCounter.current += 1;
    if (frameCounter.current % 5 === 1) {
      rayOrigin.copy(focus).addScaledVector(sample.normal, 1.05).addScaledVector(sample.tangent, 0.35);
      const candidates = [candidateA, candidateB, candidateC];
      let best = candidateC;
      let bestScore = -1;
      candidates.forEach((candidate, index) => {
        const score = lineOfSightScore(scene, raycaster.current, rayOrigin, candidate) - index * 0.025;
        if (score > bestScore) {
          bestScore = score;
          best = candidate;
        }
      });
      visibleTarget.current.copy(best);
    }

    if (sample.section.id === "chaos") {
      visibleTarget.current.x += Math.sin(performance.now() * 0.012) * 0.06;
      visibleTarget.current.y += Math.cos(performance.now() * 0.014) * 0.04;
    }

    const positionAlpha = 1 - Math.exp(-delta * 3.6);
    const lookAlpha = 1 - Math.exp(-delta * 6.2);
    camera.position.lerp(visibleTarget.current, positionAlpha);
    look.copy(focus).addScaledVector(sample.tangent, 4.6).addScaledVector(sample.normal, 0.7);
    lookTarget.current.lerp(look, lookAlpha);
    camera.lookAt(lookTarget.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, framing.fov, 1 - Math.exp(-delta * 3));
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
