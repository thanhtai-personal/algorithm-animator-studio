import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { RacePhysics } from "../physics/RacePhysics";
import { olympicRoadCameraShot } from "./olympicRoadCameraPlan";

const focus = new THREE.Vector3();
const desired = new THREE.Vector3();
const look = new THREE.Vector3();
const packCenter = new THREE.Vector3();

export function OlympicRoadCamera3D({ physics }: { physics: RacePhysics }) {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 28, -25));
  useFrame((_, delta) => {
    const ranked = physics.getRanked();
    const leader = ranked.find((marble) => marble.alive);
    if (!leader) return;
    const samples = physics.course.samples;
    const sample = samples[Math.max(0, Math.min(leader.progressIndex, samples.length - 1))];
    const progress = leader.progressIndex / (samples.length - 1);
    let packLength = 0;
    packCenter.set(0, 0, 0);
    for (const marble of ranked) {
      if (!marble.alive || packLength >= 8) continue;
      packCenter.x += marble.body.position.x;
      packCenter.y += marble.body.position.y;
      packCenter.z += marble.body.position.z;
      packLength += 1;
    }
    if (packLength) packCenter.multiplyScalar(1 / packLength);
    focus.set(leader.body.position.x, leader.body.position.y, leader.body.position.z).lerp(packCenter, 0.48);
    const shot = olympicRoadCameraShot(progress);
    const countdownDrift = physics.hasStarted() ? 0 : Math.sin(physics.getTimelineSeconds() * 0.72) * 0.8;

    // Map 2 is now a long open road. Follow the current road tangent instead
    // of locking the lens to a fixed module center; this keeps previous decks,
    // supports and distant turns from passing between camera and marbles.
    desired.copy(sample.point)
      .addScaledVector(sample.tangent, -shot.behind)
      .addScaledVector(sample.normal, shot.lift)
      .addScaledVector(sample.right, shot.side + countdownDrift);
    camera.position.lerp(desired, 1 - Math.exp(-delta * 4.5));
    look.copy(focus).addScaledVector(sample.tangent, shot.lookAhead).addScaledVector(sample.normal, 0.28);
    lookTarget.current.lerp(look, 1 - Math.exp(-delta * 6.2));
    camera.lookAt(lookTarget.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      const nextFov = THREE.MathUtils.lerp(camera.fov, shot.fov, 1 - Math.exp(-delta * 4));
      if (Math.abs(nextFov - camera.fov) > 0.015) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }
    }
  });
  return null;
}
