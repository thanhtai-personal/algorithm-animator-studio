import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { RacePhysics } from "../physics/RacePhysics";
import { COURSE_SAMPLES } from "../track/towerCourseSampler";
import { cameraShotForSection } from "./raceCameraPlan";

const leaderFocus = new THREE.Vector3();
const packFocus = new THREE.Vector3();
const desired = new THREE.Vector3();
const look = new THREE.Vector3();

export function RaceCamera3D({ physics }: { physics: RacePhysics }) {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 35, -5));

  useFrame((_, delta) => {
    const ranked = physics.getRanked().filter((marble) => marble.alive).slice(0, 4);
    const leader = ranked[0];
    if (!leader) return;

    const sample = COURSE_SAMPLES[leader.progressIndex];
    const shot = cameraShotForSection(sample.section.id, physics.getTimelineSeconds(), physics.hasStarted());
    leaderFocus.set(leader.body.position.x, leader.body.position.y, leader.body.position.z);
    packFocus.set(0, 0, 0);
    ranked.forEach((marble) => {
      packFocus.x += marble.body.position.x;
      packFocus.y += marble.body.position.y;
      packFocus.z += marble.body.position.z;
    });
    packFocus.multiplyScalar(1 / ranked.length).lerp(leaderFocus, 0.58);

    // Local track axes keep the shot on the same side of a bend. This avoids
    // the hard angle flips caused by choosing a new radial candidate each frame.
    desired.copy(packFocus)
      .addScaledVector(sample.tangent, -shot.behind)
      .addScaledVector(sample.normal, shot.lift)
      .addScaledVector(sample.right, shot.side);

    const positionAlpha = 1 - Math.exp(-delta * 3.8);
    const lookAlpha = 1 - Math.exp(-delta * 5.4);
    camera.position.lerp(desired, positionAlpha);
    look.copy(packFocus)
      .addScaledVector(sample.tangent, 2.8)
      .addScaledVector(sample.normal, 0.55);
    lookTarget.current.lerp(look, lookAlpha);
    camera.lookAt(lookTarget.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, shot.fov, 1 - Math.exp(-delta * 3));
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
