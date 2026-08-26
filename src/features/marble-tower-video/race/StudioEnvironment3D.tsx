import { Environment, Lightformer } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

function graffitiTexture(seed: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#26313e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const colors = ['#ff6f7d', '#ffd766', '#41dec4', '#6cb3ff', '#b680ff'];
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
  ctx.fillStyle = '#eff5fb';
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
        <meshStandardMaterial color="#5a6470" metalness={0.86} roughness={0.25} />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => (
        <mesh key={index} position={[0, -14 + index * 4, 0]}>
          <cylinderGeometry args={[2.4, 2.4, 0.22, 28]} />
          <meshStandardMaterial color="#aeb8c3" metalness={0.68} roughness={0.28} />
        </mesh>
      ))}
    </group>
  );
}

function WallAccents() {
  return (
    <group>
      {[-18, 0, 18].map((x) => (
        <mesh key={`line-${x}`} position={[x, 6.5, 61.55]}>
          <planeGeometry args={[9, 0.34]} />
          <meshBasicMaterial color="#ffe670" toneMapped={false} />
        </mesh>
      ))}
      {[-18, 0, 18].map((x) => (
        <mesh key={`line-v-${x}`} position={[x, 19, 61.55]}>
          <planeGeometry args={[9, 0.18]} />
          <meshBasicMaterial color="#6fe4ff" toneMapped={false} />
        </mesh>
      ))}
      {[-20, -6, 8, 22].map((z, index) => (
        <mesh key={`left-accent-${z}`} position={[-49.55, 8 + index * 4.7, z]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[8, 0.28]} />
          <meshBasicMaterial color={index % 2 ? '#ff95d8' : '#ffd98c'} toneMapped={false} />
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
      <color attach="background" args={['#aeb9c3']} />
      <fog attach="fog" args={['#b9c4cd', 62, 132]} />
      <ambientLight intensity={0.58} />
      <directionalLight
        castShadow
        intensity={3}
        color="#fff5e4"
        position={[-18, 46, -20]}
        shadow-mapSize-width={1536}
        shadow-mapSize-height={1536}
        shadow-camera-far={100}
      />
      <pointLight position={[18, 22, 10]} intensity={80} distance={48} color="#d8eeff" />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={5} color="#fff4db" position={[-20, 25, -18]} scale={[14, 20, 1]} />
        <Lightformer form="rect" intensity={3} color="#b8dcff" position={[22, 18, 28]} rotation={[0, Math.PI, 0]} scale={[12, 14, 1]} />
      </Environment>

      <mesh position={[0, -0.28, 12]} receiveShadow>
        <boxGeometry args={[96, 0.5, 96]} />
        <meshStandardMaterial color="#a4acb4" roughness={0.92} metalness={0.04} />
      </mesh>
      <mesh position={[0, -0.02, 12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[88, 88]} />
        <meshStandardMaterial color="#c8d0d7" roughness={0.95} />
      </mesh>
      <mesh position={[0, 18, 62]} receiveShadow>
        <boxGeometry args={[96, 36, 0.5]} />
        <meshStandardMaterial color="#c6d0da" roughness={0.84} />
      </mesh>
      <mesh position={[-50, 18, 12]} receiveShadow>
        <boxGeometry args={[0.5, 36, 96]} />
        <meshStandardMaterial color="#cdd6de" roughness={0.84} />
      </mesh>
      <mesh position={[0, 15, 61.65]}>
        <planeGeometry args={[27, 12]} />
        <meshStandardMaterial map={graffitiA} roughness={0.72} />
      </mesh>
      <mesh position={[-49.65, 12, 13]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[24, 10]} />
        <meshStandardMaterial map={graffitiB} roughness={0.72} />
      </mesh>
      <WallAccents />

      {[-24, -12, 0, 12, 24].map((x) => (
        <group key={x} position={[x, 25, 61.2]}>
          <mesh>
            <boxGeometry args={[8, 13, 0.18]} />
            <meshBasicMaterial color="#f2f8ff" toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, -0.12]}>
            <boxGeometry args={[0.22, 13, 0.22]} />
            <meshStandardMaterial color="#8b96a1" metalness={0.74} />
          </mesh>
        </group>
      ))}

      {[-26, -13, 0, 13, 26].map((x) => (
        <mesh key={x} position={[x, 18, 18]} castShadow>
          <boxGeometry args={[0.35, 36, 0.35]} />
          <meshStandardMaterial color="#7d8790" metalness={0.84} roughness={0.28} />
        </mesh>
      ))}

      {[-22, 0, 22].map((x) => (
        <mesh key={`floor-mark-${x}`} position={[x, 0.01, 27]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[9, 0.3]} />
          <meshBasicMaterial color="#fff7bf" toneMapped={false} />
        </mesh>
      ))}
      <TowerCore />
    </group>
  );
}
