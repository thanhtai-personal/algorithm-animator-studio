import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import * as CANNON from "cannon-es";
import * as THREE from "three";
import type { RacePhysics } from "../physics/RacePhysics";

function SyncBody({ body, children }: { body: CANNON.Body; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(body.position.x, body.position.y, body.position.z);
    ref.current.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
  });
  return <group ref={ref}>{children}</group>;
}

function HazardBar({ body, width }: { body: CANNON.Body; width: number }) {
  return <SyncBody body={body}><group>
    <mesh castShadow><boxGeometry args={[width * 0.86, 0.28, 0.34]} /><meshStandardMaterial color="#f3bf22" roughness={0.42} metalness={0.34} /></mesh>
    {[-0.32, 0, 0.32].map((x) => <mesh key={x} position={[x * width, 0.15, 0]} rotation={[0, 0, -0.5]}>
      <boxGeometry args={[0.18, 0.04, 0.38]} /><meshBasicMaterial color="#17191c" />
    </mesh>)}
  </group></SyncBody>;
}

export function OlympicRoadObstacles3D({ physics }: { physics: RacePhysics }) {
  const width = physics.course.trackWidth;
  return (
    <group>
      <SyncBody body={physics.startGate}>
        <mesh castShadow><boxGeometry args={[width, 1.5, 0.3]} /><meshStandardMaterial color="#e2e7ec" metalness={0.76} roughness={0.24} /></mesh>
      </SyncBody>
      <HazardBar body={physics.spinnerA.body} width={width} />
      <HazardBar body={physics.spinnerB.body} width={width} />
      <HazardBar body={physics.finalCross.body} width={width} />
      {[0.54, 0.62, 0.69, 0.88, 0.925].map((progress, index) => {
        const sample = physics.course.samples[Math.round(progress * (physics.course.samples.length - 1))];
        return <group key={progress} position={sample.point} quaternion={sample.quaternion}>
          <mesh position={[index % 2 ? width * 0.28 : -width * 0.28, 0.34, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.42, 0.68, 12]} /><meshStandardMaterial color="#f2a51c" roughness={0.54} />
          </mesh>
        </group>;
      })}
    </group>
  );
}
