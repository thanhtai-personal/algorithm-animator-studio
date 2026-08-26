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
    const leader = physics.getLeader();
    if (!leader) return;
    const samples = physics.course.samples;
    const sample = samples[Math.max(0, Math.min(leader.progressIndex, samples.length - 1))];
    const progress = leader.progressIndex / (samples.length - 1);
    const pack = physics.getRanked().filter((marble) => marble.alive).slice(0, 8);
    packCenter.set(0, 0, 0);
    pack.forEach((marble) => {
      packCenter.x += marble.body.position.x;
      packCenter.y += marble.body.position.y;
      packCenter.z += marble.body.position.z;
    });
    if (pack.length) packCenter.multiplyScalar(1 / pack.length);
    focus.set(leader.body.position.x, leader.body.position.y, leader.body.position.z).lerp(packCenter, 0.62);
    const shot = olympicRoadCameraShot(progress);
    const countdownDrift = physics.hasStarted() ? 0 : Math.sin(physics.getTimelineSeconds() * 0.72) * 1.2;
    desired.copy(focus)
      .addScaledVector(sample.tangent, -shot.behind)
      .addScaledVector(sample.normal, shot.lift)
      .addScaledVector(sample.right, shot.side + countdownDrift);
    camera.position.lerp(desired, 1 - Math.exp(-delta * 3.7));
    look.copy(focus).addScaledVector(sample.tangent, shot.lookAhead).addScaledVector(sample.normal, 0.38);
    lookTarget.current.lerp(look, 1 - Math.exp(-delta * 5.4));
    camera.lookAt(lookTarget.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, shot.fov, 1 - Math.exp(-delta * 3.2));
      camera.updateProjectionMatrix();
    }
  });
  return null;
}
