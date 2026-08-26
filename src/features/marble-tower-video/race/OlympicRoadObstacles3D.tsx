import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import * as CANNON from "cannon-es";
import * as THREE from "three";
import type { RacePhysics } from "../physics/RacePhysics";
import type { OlympicRoadObstacle } from "../track/olympicRoadCourse";
import type { CourseSample } from "../track/towerCourseSampler";

function SyncBody({ body, children }: { body: CANNON.Body; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(body.position.x, body.position.y, body.position.z);
    ref.current.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
  });
  return <group ref={ref}>{children}</group>;
}

function HazardDiamond() {
  return (
    <group>
      <mesh position={[0, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.68, 10]} />
        <meshStandardMaterial color="#24282b" roughness={0.52} />
      </mesh>
      <mesh position={[0, 0.88, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[0.55, 0.55, 0.13]} />
        <meshStandardMaterial color="#ffd21f" roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.88, -0.075]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.28, 0.28, 0.02]} />
        <meshBasicMaterial color="#17191b" />
      </mesh>
    </group>
  );
}

function SlalomPost() {
  return (
    <group>
      <mesh position={[0, 0.68, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.29, 1.36, 14]} />
        <meshStandardMaterial color="#202326" roughness={0.5} />
      </mesh>
      {[0.32, 0.68, 1.04].map((height) => (
        <mesh key={height} position={[0, height, 0]}>
          <cylinderGeometry args={[0.215, 0.215, 0.13, 14]} />
          <meshBasicMaterial color="#ffd42b" />
        </mesh>
      ))}
    </group>
  );
}

function ChoiceGate() {
  return (
    <group>
      <mesh position={[0, 0.13, 0]} castShadow>
        <boxGeometry args={[0.94, 0.26, 0.58]} />
        <meshStandardMaterial color="#23282d" metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.96, 1.25, 0.34]} />
        <meshStandardMaterial color="#d9e3e8" metalness={0.32} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0.93, -0.18]}>
        <boxGeometry args={[0.7, 0.78, 0.035]} />
        <meshBasicMaterial color="#14222b" />
      </mesh>
      <mesh position={[0, 0.93, -0.205]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.32, 0.32, 0.025]} />
        <meshBasicMaterial color="#43ef8d" toneMapped={false} />
      </mesh>
    </group>
  );
}

function TrafficLight() {
  const colors = ["#ff304f", "#ffbd2e", "#45e66c"];
  return (
    <group>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.27, 0.34, 0.44, 12]} />
        <meshStandardMaterial color="#f2b927" roughness={0.46} />
      </mesh>
      <mesh position={[0, 0.88, 0]} castShadow>
        <boxGeometry args={[0.92, 1.06, 0.65]} />
        <meshStandardMaterial color="#181b1e" roughness={0.38} metalness={0.42} />
      </mesh>
      {colors.map((color, index) => (
        <mesh key={color} position={[0, 1.18 - index * 0.3, -0.35]}>
          <circleGeometry args={[0.11, 18]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function PlacedObstacle({ obstacle, sample }: { obstacle: OlympicRoadObstacle; sample: CourseSample }) {
  return (
    <group position={sample.point} quaternion={sample.quaternion}>
      <group position={[obstacle.lateral, 0.08, 0]}>
        {obstacle.kind === "hazard-diamond" && <HazardDiamond />}
        {obstacle.kind === "slalom-post" && <SlalomPost />}
        {obstacle.kind === "choice-gate" && <ChoiceGate />}
        {obstacle.kind === "traffic-light" && <TrafficLight />}
      </group>
    </group>
  );
}

function StartGate({ physics }: { physics: RacePhysics }) {
  const width = physics.course.trackWidth;
  return (
    <SyncBody body={physics.startGate}>
      <mesh castShadow>
        <boxGeometry args={[width, 1.5, 0.3]} />
        <meshStandardMaterial color="#e1e7eb" metalness={0.52} roughness={0.3} />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => (
        <mesh key={index} position={[-width / 2 + 0.48 + index * 0.92, 0, -0.18]} rotation={[0, 0, -0.55]}>
          <boxGeometry args={[0.48, 0.13, 0.035]} />
          <meshBasicMaterial color={index % 2 ? "#f7cd28" : "#222529"} />
        </mesh>
      ))}
    </SyncBody>
  );
}

function ShowcaseSweeper({ body, width }: { body: CANNON.Body; width: number }) {
  return (
    <SyncBody body={body}>
      <mesh castShadow>
        <boxGeometry args={[width * 0.86, 0.3, 0.42]} />
        <meshStandardMaterial color="#2795e8" roughness={0.38} metalness={0.24} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * width * 0.34, 0.02, 0]}>
          <boxGeometry args={[0.72, 0.38, 0.56]} />
          <meshStandardMaterial color="#ffd02b" roughness={0.42} />
        </mesh>
      ))}
      <mesh><cylinderGeometry args={[0.38, 0.44, 0.72, 18]} /><meshStandardMaterial color="#eef3f5" metalness={0.6} roughness={0.24} /></mesh>
    </SyncBody>
  );
}

function TrafficSweeper({ body, width }: { body: CANNON.Body; width: number }) {
  return (
    <SyncBody body={body}>
      <mesh castShadow>
        <boxGeometry args={[width * 0.86, 0.34, 0.48]} />
        <meshStandardMaterial color="#202326" roughness={0.4} metalness={0.38} />
      </mesh>
      {[-0.34, 0, 0.34].map((x, index) => (
        <mesh key={x} position={[x * width, 0.2, -0.26]}>
          <sphereGeometry args={[0.13, 14, 10]} />
          <meshStandardMaterial color={["#ff3452", "#ffc42d", "#45e66b"][index]} emissive={["#ff3452", "#ffc42d", "#45e66b"][index]} emissiveIntensity={1.2} />
        </mesh>
      ))}
      <mesh><cylinderGeometry args={[0.36, 0.42, 0.78, 16]} /><meshStandardMaterial color="#f0b921" roughness={0.4} /></mesh>
    </SyncBody>
  );
}

function FinalPivot({ body, width }: { body: CANNON.Body; width: number }) {
  return (
    <SyncBody body={body}>
      <mesh castShadow>
        <boxGeometry args={[width * 0.86, 0.3, 0.38]} />
        <meshStandardMaterial color="#ff7b23" roughness={0.38} />
      </mesh>
      {[-0.3, 0, 0.3].map((x) => (
        <mesh key={x} position={[x * width, 0.17, -0.21]} rotation={[0, 0, -0.48]}>
          <boxGeometry args={[0.55, 0.1, 0.03]} />
          <meshBasicMaterial color="#fff1d0" />
        </mesh>
      ))}
      <mesh><cylinderGeometry args={[0.4, 0.46, 0.8, 16]} /><meshStandardMaterial color="#d72934" roughness={0.4} /></mesh>
    </SyncBody>
  );
}

export function OlympicRoadObstacles3D({ physics }: { physics: RacePhysics }) {
  const { samples, roadObstacles, trackWidth } = physics.course;
  return (
    <group>
      <StartGate physics={physics} />
      <ShowcaseSweeper body={physics.spinnerA.body} width={trackWidth} />
      <TrafficSweeper body={physics.spinnerB.body} width={trackWidth} />
      <FinalPivot body={physics.finalCross.body} width={trackWidth} />
      {roadObstacles.map((obstacle) => (
        <PlacedObstacle
          key={obstacle.id}
          obstacle={obstacle}
          sample={samples[Math.round(obstacle.progress * (samples.length - 1))]}
        />
      ))}
    </group>
  );
}
