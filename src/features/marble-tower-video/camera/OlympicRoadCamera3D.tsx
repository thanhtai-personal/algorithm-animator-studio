import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { RacePhysics } from "../physics/RacePhysics";

const focus = new THREE.Vector3();
const desired = new THREE.Vector3();
const look = new THREE.Vector3();

export function OlympicRoadCamera3D({ physics }: { physics: RacePhysics }) {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 28, -25));
  useFrame((_, delta) => {
    const leader = physics.getLeader();
    if (!leader) return;
    const samples = physics.course.samples;
    const sample = samples[Math.max(0, Math.min(leader.progressIndex, samples.length - 1))];
    const progress = leader.progressIndex / (samples.length - 1);
    focus.set(leader.body.position.x, leader.body.position.y, leader.body.position.z);
    const spiral = progress >= 0.29 && progress <= 0.53;
    const finish = progress > 0.9;
    const behind = finish ? 8.2 : spiral ? 6.5 : 9.6;
    const lift = finish ? 4.2 : spiral ? 9.4 : 5.8;
    const side = spiral ? 6.2 : finish ? 4.8 : 3.4;
    desired.copy(focus).addScaledVector(sample.tangent, -behind).addScaledVector(sample.normal, lift).addScaledVector(sample.right, side);
    camera.position.lerp(desired, 1 - Math.exp(-delta * 4.2));
    look.copy(focus).addScaledVector(sample.tangent, finish ? 4.2 : 3.2).addScaledVector(sample.normal, 0.42);
    lookTarget.current.lerp(look, 1 - Math.exp(-delta * 6));
    camera.lookAt(lookTarget.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = spiral ? 55 : finish ? 48 : 51;
      camera.fov = THREE.MathUtils.lerp(camera.fov, fov, 1 - Math.exp(-delta * 3.4));
      camera.updateProjectionMatrix();
    }
  });
  return null;
}
