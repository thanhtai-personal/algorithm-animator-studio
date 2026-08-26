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

    // Keep the leader as the focal point, but frame enough of the tower to
    // show upcoming track and nearby competitors instead of sitting on the marble.
    let behind = 11.5;
    let lift = 5.0;
    let side = 2.8;
    let fov = 53;
    if (section === "switchback" || section === "hairpin" || section === "spiral") {
      behind = 8.5;
      lift = 8.5;
      side = 10.5;
      fov = 58;
    } else if (section === "spinner" || section === "chimes" || section === "chaos") {
      behind = 6.5;
      lift = 6.5;
      side = 8.0;
      fov = 56;
    } else if (section === "piano") {
      behind = 14.0;
      lift = 4.2;
      side = 1.8;
      fov = 51;
    } else if (section === "tunnel") {
      behind = 9.5;
      lift = 3.3;
      side = 1.0;
      fov = 54;
    } else if (section === "finish") {
      behind = 15.0;
      lift = 6.5;
      side = -5.5;
      fov = 54;
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
    look.copy(focus).addScaledVector(sample.tangent, 3.8).addScaledVector(sample.normal, 0.5);
    lookTarget.current.lerp(look, lookAlpha);
    camera.lookAt(lookTarget.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, fov, 1 - Math.exp(-delta * 2.6));
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
