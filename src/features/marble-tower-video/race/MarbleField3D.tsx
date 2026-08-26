import { Trail } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { MARBLES, type MarbleId } from "../marble/marbleCatalog";
import type { RacePhysics } from "../physics/RacePhysics";

function PlayerMarker({ color }: { color: string }) {
  return <group position={[0, 1.03, 0]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.58, 0.07, 12, 32]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
    <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.16, 0.36, 18]} /><meshBasicMaterial color="#fff" toneMapped={false} /></mesh>
  </group>;
}

function MarbleMesh({ id, physics, playerId }: { id: MarbleId; physics: RacePhysics; playerId: MarbleId }) {
  const config = MARBLES.find((marble) => marble.id === id)!;
  const group = useRef<THREE.Group>(null);
  const ballRotation = useRef<THREE.Group>(null);
  const runtime = physics.getMarble(id);
  useFrame(() => {
    if (!group.current || !ballRotation.current || !runtime) return;
    group.current.visible = runtime.alive;
    if (!runtime.alive) return;
    const { body } = runtime;
    if (![body.position.x, body.position.y, body.position.z].every(Number.isFinite)) return;
    group.current.position.set(body.position.x, body.position.y, body.position.z);
    ballRotation.current.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
  });
  const content = <group ref={group} position={runtime ? [runtime.body.position.x, runtime.body.position.y, runtime.body.position.z] : [0, 0, 0]}>
    <group ref={ballRotation}>
      <mesh castShadow><sphereGeometry args={[0.43, 30, 22]} /><meshPhysicalMaterial color={config.color} emissive={config.color} emissiveIntensity={0.12} roughness={0.12} metalness={0.22} clearcoat={1} clearcoatRoughness={0.06} /></mesh>
      <mesh scale={0.62} position={[-0.11, 0.13, 0.18]}><sphereGeometry args={[0.43, 18, 14]} /><meshPhysicalMaterial color={config.accent} transparent opacity={0.42} roughness={0.08} metalness={0.05} /></mesh>
    </group>
    {id === playerId ? <PlayerMarker color={config.color} /> : null}
  </group>;
  return id === playerId ? <Trail width={0.58} length={5} color={config.color} attenuation={(t) => t * t}>{content}</Trail> : content;
}

export function MarbleField3D({ physics, playerId }: { physics: RacePhysics; playerId: MarbleId }) {
  return <>{MARBLES.map((marble) => <MarbleMesh key={marble.id} id={marble.id} physics={physics} playerId={playerId} />)}</>;
}
