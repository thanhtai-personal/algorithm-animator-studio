import { Environment, Lightformer } from "@react-three/drei";

export function OlympicRoadEnvironment3D() {
  return (
    <group>
      <color attach="background" args={["#071722"]} />
      <fog attach="fog" args={["#0a1e2d", 78, 148]} />
      <ambientLight intensity={1.05} />
      <hemisphereLight intensity={1.25} color="#dff5ff" groundColor="#16405c" />
      <directionalLight castShadow intensity={3.8} color="#fff4de" position={[-18, 42, -22]}
        shadow-mapSize-width={1536} shadow-mapSize-height={1536} shadow-camera-far={110} />
      <pointLight position={[18, 22, 12]} intensity={125} distance={70} color="#8bdcff" />
      <pointLight position={[-20, 13, -6]} intensity={82} distance={58} color="#ffd34f" />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={6} color="#f2fbff" position={[-18, 26, -24]} scale={[18, 22, 1]} />
        <Lightformer form="rect" intensity={5} color="#73dfff" position={[24, 15, 24]} rotation={[0, Math.PI, 0]} scale={[14, 18, 1]} />
      </Environment>
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <boxGeometry args={[92, 0.6, 104]} />
        <meshStandardMaterial color="#174d6c" roughness={0.86} metalness={0.08} />
      </mesh>
      {[-30, -18, -6, 6, 18, 30].map((x, index) => (
        <mesh key={x} position={[x, 0.01, 6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.16, 82]} />
          <meshBasicMaterial color={index % 2 ? "#2d7ca3" : "#24536f"} toneMapped={false} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 45.5, 0.12, 0]}>
          <boxGeometry args={[0.5, 0.5, 104]} />
          <meshStandardMaterial color={side > 0 ? "#37d9ff" : "#ffd23b"} emissive={side > 0 ? "#158aaa" : "#9a6b12"} emissiveIntensity={1.2} />
        </mesh>
      ))}
    </group>
  );
}
