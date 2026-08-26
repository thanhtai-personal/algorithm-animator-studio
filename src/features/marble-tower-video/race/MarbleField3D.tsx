import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MARBLES, type MarbleId } from "../marble/marbleCatalog";
import type { RacePhysics } from "../physics/RacePhysics";
import { MARBLE_RADIUS } from "../track/towerCourse";

function MarbleMesh({ id, physics }: { id: MarbleId; physics: RacePhysics }) {
  const config = MARBLES.find((marble) => marble.id === id)!;
  const group = useRef<THREE.Group>(null);
  const ballRotation = useRef<THREE.Group>(null);
  const runtime = physics.getMarble(id);
  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: config.color,
    metalness: 0.18,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    transmission: id === "white" ? 0.15 : 0.03,
    thickness: 0.8,
    emissive: new THREE.Color(config.color),
    emissiveIntensity: 0.08,
  }), [config.color, id]);

  useFrame(() => {
    if (!group.current || !ballRotation.current || !runtime) return;
    group.current.visible = runtime.alive;
    if (!runtime.alive) return;
    const { body } = runtime;
    if (![body.position.x, body.position.y, body.position.z].every(Number.isFinite)) return;
    group.current.position.set(body.position.x, body.position.y, body.position.z);
    ballRotation.current.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
  });

  return <group ref={group} position={runtime ? [runtime.body.position.x, runtime.body.position.y, runtime.body.position.z] : [0, 0, 0]}>
    <group ref={ballRotation}>
      <mesh castShadow material={material}>
        <sphereGeometry args={[MARBLE_RADIUS, 28, 20]} />
      </mesh>
      <mesh scale={0.7} position={[-0.15, 0.18, -0.32]}>
        <sphereGeometry args={[MARBLE_RADIUS * 0.42, 16, 10]} />
        <meshBasicMaterial color={config.accent} transparent opacity={0.42} />
      </mesh>
    </group>
  </group>;
}

export function MarbleField3D({ physics }: { physics: RacePhysics }) {
  return <group>{MARBLES.map((marble) => <MarbleMesh key={marble.id} id={marble.id} physics={physics} />)}</group>;
}
