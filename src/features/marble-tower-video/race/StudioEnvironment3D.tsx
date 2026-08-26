import { Environment, Lightformer } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

function graffitiTexture(seed: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#20242a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const colors = ['#f05b74', '#ffd04c', '#36d7bc', '#4f8cff', '#aa61ff'];
  for (let i = 0; i < 26; i += 1) {
    const x = (Math.sin(i * 9.2 + seed) * 0.5 + 0.5) * canvas.width;
    const y = (Math.cos(i * 5.7 + seed) * 0.5 + 0.5) * canvas.height;
    ctx.strokeStyle = colors[(i + seed) % colors.length];
    ctx.lineWidth = 12 + (i % 4) * 7;
    ctx.beginPath();
    ctx.arc(x, y, 45 + (i % 5) * 24, i * 0.3, i * 0.3 + Math.PI * 1.4);
    ctx.stroke();
  }
  ctx.font = '900 148px Arial';
  ctx.fillStyle = '#d7dde5';
  ctx.globalAlpha = 0.84;
  ctx.fillText('MBR', 330, 320);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function TowerCore() {
  return (
    <group position={[0, 17, 12]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.55, 1.9, 34, 24]} />
        <meshStandardMaterial color="#101317" metalness={0.78} roughness={0.3} />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => (
        <mesh key={index} position={[0, -14 + index * 4, 0]}>
          <cylinderGeometry args={[2.4, 2.4, 0.22, 28]} />
          <meshStandardMaterial color="#242a31" metalness={0.84} roughness={0.24} />
        </mesh>
      ))}
    </group>
  );
}

export function StudioEnvironment3D() {
  const graffitiA = useMemo(() => graffitiTexture(2), []);
  const graffitiB = useMemo(() => graffitiTexture(5), []);
  return (
    <group>
      <color attach="background" args={['#aeb3b6']} />
      <fog attach="fog" args={['#b9bdc0', 45, 105]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        intensity={2.8}
        color="#fff4df"
        position={[-18, 46, -20]}
        shadow-mapSize-width={1536}
        shadow-mapSize-height={1536}
        shadow-camera-far={100}
      />
      <pointLight position={[18, 22, 10]} intensity={90} distance={45} color="#d8eeff" />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={5} color="#fff4db" position={[-20, 25, -18]} scale={[14, 20, 1]} />
        <Lightformer form="rect" intensity={3} color="#b8dcff" position={[22, 18, 28]} rotation={[0, Math.PI, 0]} scale={[12, 14, 1]} />
      </Environment>

      <mesh position={[0, -0.28, 12]} receiveShadow>
        <boxGeometry args={[70, 0.5, 70]} />
        <meshStandardMaterial color="#74787a" roughness={0.92} metalness={0.02} />
      </mesh>
      <mesh position={[0, 18, 42]} receiveShadow>
        <boxGeometry args={[70, 36, 0.5]} />
        <meshStandardMaterial color="#8b8e90" roughness={0.86} />
      </mesh>
      <mesh position={[-34, 18, 12]} receiveShadow>
        <boxGeometry args={[0.5, 36, 62]} />
        <meshStandardMaterial color="#85898c" roughness={0.86} />
      </mesh>
      <mesh position={[0, 15, 41.65]}>
        <planeGeometry args={[27, 12]} />
        <meshStandardMaterial map={graffitiA} roughness={0.72} />
      </mesh>
      <mesh position={[-33.65, 12, 13]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[24, 10]} />
        <meshStandardMaterial map={graffitiB} roughness={0.72} />
      </mesh>

      {[-24, -12, 0, 12, 24].map((x) => (
        <group key={x} position={[x, 25, 41.2]}>
          <mesh>
            <boxGeometry args={[8, 13, 0.18]} />
            <meshBasicMaterial color="#e8f5ff" toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, -0.12]}>
            <boxGeometry args={[0.22, 13, 0.22]} />
            <meshStandardMaterial color="#34383c" metalness={0.7} />
          </mesh>
        </group>
      ))}

      {[-26, -13, 0, 13, 26].map((x) => (
        <mesh key={x} position={[x, 18, 10]} castShadow>
          <boxGeometry args={[0.35, 36, 0.35]} />
          <meshStandardMaterial color="#353a3f" metalness={0.82} roughness={0.34} />
        </mesh>
      ))}
      <TowerCore />
    </group>
  );
}
