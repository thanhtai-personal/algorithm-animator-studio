import { useEffect, useMemo } from "react";
import * as THREE from "three";

export function AlgorithmBranding3D() {
  return (
    <group>
      <FacadeAd
        position={[-8.7, 2.55, -8.0]}
        width={5.0}
        height={1.75}
        brand="KATA.MAKEUP"
        url="https://www.kata.makeup/"
        accent="#d792a4"
      />
      <RoadsideBillboard
        position={[8.4, 3.25, -9.1]}
        brand="THIÊN ĐẠO CHI LỘ"
        url="https://thiendaochilo.vercel.app/"
        accent="#c4a55f"
      />
    </group>
  );
}

function FacadeAd({ position, width, height, brand, url, accent }: {
  position: [number, number, number];
  width: number;
  height: number;
  brand: string;
  url: string;
  accent: string;
}) {
  const texture = useBrandTexture(brand, url, accent, "facade");
  return (
    <group position={position}>
      <mesh position={[0, -1.10, -0.28]}>
        <boxGeometry args={[width + 0.7, height + 2.5, 1.25]} />
        <meshStandardMaterial color="#3e454a" roughness={0.88} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0, 0.37]}>
        <boxGeometry args={[width + 0.18, height + 0.18, 0.12]} />
        <meshStandardMaterial color="#252b30" roughness={0.58} metalness={0.48} />
      </mesh>
      <mesh position={[0, 0, 0.445]} renderOrder={2}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

function RoadsideBillboard({ position, brand, url, accent }: {
  position: [number, number, number];
  brand: string;
  url: string;
  accent: string;
}) {
  const texture = useBrandTexture(brand, url, accent, "billboard");
  return (
    <group position={position}>
      {[-2.1, 2.1].map((x) => (
        <mesh key={x} position={[x, -1.75, -0.12]}>
          <boxGeometry args={[0.12, 3.5, 0.12]} />
          <meshStandardMaterial color="#5b6267" roughness={0.54} metalness={0.70} />
        </mesh>
      ))}
      <mesh>
        <boxGeometry args={[5.6, 2.05, 0.13]} />
        <meshStandardMaterial color="#272d31" roughness={0.60} metalness={0.50} />
      </mesh>
      <mesh position={[0, 0, 0.073]} renderOrder={2}>
        <planeGeometry args={[5.38, 1.83]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

function useBrandTexture(brand: string, url: string, accent: string, style: "facade" | "billboard") {
  const texture = useMemo(() => makeBrandTexture(brand, url, accent, style), [brand, url, accent, style]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function makeBrandTexture(brand: string, url: string, accent: string, style: "facade" | "billboard") {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 420;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, style === "facade" ? "#15191d" : "#11161a");
  gradient.addColorStop(1, style === "facade" ? "#252a2e" : "#20262b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.80;
  ctx.fillRect(58, 58, 8, 304);
  ctx.globalAlpha = 1;

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `800 ${brand.length > 18 ? 76 : 92}px Arial, Helvetica, sans-serif`;
  ctx.fillText(brand, 104, 178, 990);

  ctx.fillStyle = "rgba(233,238,241,0.60)";
  ctx.font = "600 42px Arial, Helvetica, sans-serif";
  ctx.fillText(url, 108, 282, 930);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}
