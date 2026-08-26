import { Environment, Lightformer } from "@react-three/drei";

export function OlympicRoadEnvironment3D() {
  return (
    <group>
      <color attach="background" args={["#090d12"]} />
      <fog attach="fog" args={["#0b1118", 56, 118]} />
      <ambientLight intensity={0.72} />
      <directionalLight castShadow intensity={3.2} color="#fff2dc" position={[-18, 42, -22]}
        shadow-mapSize-width={1536} shadow-mapSize-height={1536} shadow-camera-far={110} />
      <pointLight position={[18, 22, 12]} intensity={95} distance={60} color="#8bdcff" />
      <pointLight position={[-20, 13, -6]} intensity={70} distance={50} color="#ff4f7b" />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={5} color="#e9f7ff" position={[-18, 26, -24]} scale={[18, 22, 1]} />
        <Lightformer form="rect" intensity={4} color="#73dfff" position={[24, 15, 24]} rotation={[0, Math.PI, 0]} scale={[14, 18, 1]} />
      </Environment>
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <boxGeometry args={[92, 0.6, 104]} />
        <meshStandardMaterial color="#161d25" roughness={0.92} metalness={0.08} />
      </mesh>
      {[-30, -18, -6, 6, 18, 30].map((x, index) => (
        <mesh key={x} position={[x, 0.01, 6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.16, 82]} />
          <meshBasicMaterial color={index % 2 ? "#17425b" : "#29243f"} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
