import { Environment, Lightformer } from "@react-three/drei";

export function OlympicRoadEnvironment3D() {
  return (
    <group>
      <color attach="background" args={["#071722"]} />
      <fog attach="fog" args={["#0a1e2d", 110, 330]} />
      <ambientLight intensity={0.95} />
      <hemisphereLight intensity={1.2} color="#dff5ff" groundColor="#16405c" />
      <directionalLight
        castShadow
        intensity={3.2}
        color="#fff4de"
        position={[-42, 88, -80]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={180}
        shadow-camera-bottom={-180}
        shadow-camera-near={1}
        shadow-camera-far={520}
      />
      <pointLight position={[32, 32, 82]} intensity={88} distance={120} color="#8bdcff" />
      <pointLight position={[-34, 20, 198]} intensity={68} distance={110} color="#ffd34f" />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={5.2} color="#f2fbff" position={[-24, 34, -28]} scale={[24, 28, 1]} />
        <Lightformer form="rect" intensity={4.4} color="#73dfff" position={[34, 22, 150]} rotation={[0, Math.PI, 0]} scale={[22, 28, 1]} />
      </Environment>
      {[-68, 68].map((x, index) => (
        <mesh key={x} position={[x, 0.08, 90]}>
          <boxGeometry args={[0.32, 0.28, 360]} />
          <meshStandardMaterial
            color={index ? "#37d9ff" : "#ff6fca"}
            emissive={index ? "#158aaa" : "#8a245f"}
            emissiveIntensity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}
