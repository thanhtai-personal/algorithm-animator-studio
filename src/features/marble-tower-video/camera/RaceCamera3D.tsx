import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { RacePhysics } from "../physics/RacePhysics";
import { COURSE_SAMPLES } from "../track/towerCourseSampler";

const look = new THREE.Vector3();
const desired = new THREE.Vector3();
const focus = new THREE.Vector3();

export function RaceCamera3D({ physics }: { physics: RacePhysics }) {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 30, 0));

  useFrame((_, delta) => {
    const leader = physics.getLeader();
    if (!leader) return;
    const sample = COURSE_SAMPLES[leader.progressIndex];
    const section = sample.section.id;
    focus.set(leader.body.position.x, leader.body.position.y, leader.body.position.z);

    let behind = 8.2;
    let lift = 3.6;
    let side = 2.0;
    let fov = 48;
    if (section === "switchback" || section === "hairpin" || section === "spiral") {
      behind = 5.5;
      lift = 7.0;
      side = 9.0;
      fov = 55;
    } else if (section === "spinner" || section === "chimes" || section === "chaos") {
      behind = 3.5;
      lift = 5.0;
      side = 7.0;
      fov = 52;
    } else if (section === "piano") {
      behind = 10.5;
      lift = 3.0;
      side = 1.2;
      fov = 46;
    } else if (section === "tunnel") {
      behind = 7.0;
      lift = 2.5;
      side = 0.6;
      fov = 50;
    } else if (section === "finish") {
      behind = 11.0;
      lift = 5.0;
      side = -4.0;
      fov = 49;
    }

    desired.copy(focus)
      .addScaledVector(sample.tangent, -behind)
      .addScaledVector(sample.normal, lift)
      .addScaledVector(sample.right, side);

    if (section === "chaos") {
      desired.x += Math.sin(performance.now() * 0.015) * 0.18;
      desired.y += Math.cos(performance.now() * 0.019) * 0.12;
    }

    const positionAlpha = 1 - Math.exp(-delta * 3.2);
    const lookAlpha = 1 - Math.exp(-delta * 5.2);
    camera.position.lerp(desired, positionAlpha);
    look.copy(focus).addScaledVector(sample.tangent, 2.3).addScaledVector(sample.normal, 0.35);
    lookTarget.current.lerp(look, lookAlpha);
    camera.lookAt(lookTarget.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, fov, 1 - Math.exp(-delta * 2.6));
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
