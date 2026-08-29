import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { getAlgorithmVideoAd, type AlgorithmVideoAdId } from "@/lib/algorithmVideoAds";

export function AlgorithmBranding3D({ adId = "none" }: { adId?: AlgorithmVideoAdId }) {
  const ad = getAlgorithmVideoAd(adId);
  if (ad.id === "none") return null;
  return ad.placement === "facade" ? (
    <FacadeAd
      position={[-6.35, 2.48, -9.4]}
      width={4.25}
      height={1.45}
      brand={ad.brand}
      url={ad.url}
      accent={ad.accent}
    />
  ) : (
    <RoadsideBillboard
      position={[5.15, 2.55, -10.9]}
      rotationY={-0.14}
      brand={ad.brand}
      url={ad.url}
      accent={ad.accent}
    />
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
    <group position={position} rotation={[0, 0.1, 0]}>
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

function RoadsideBillboard({ position, brand, url, accent, rotationY = 0 }: {
  position: [number, number, number];
  brand: string;
  url: string;
  accent: string;
  rotationY?: number;
}) {
  const texture = useBrandTexture(brand, url, accent, "billboard");
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-2.1, 2.1].map((x) => (
        <group key={x} position={[x, -1.85, -0.12]}>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.14, 3.7, 0.14]} />
            <meshStandardMaterial color="#5b6267" roughness={0.54} metalness={0.70} />
          </mesh>
          <mesh position={[0, -1.82, 0]}>
            <boxGeometry args={[0.52, 0.18, 0.52]} />
            <meshStandardMaterial color="#444b50" roughness={0.76} metalness={0.24} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.06, -0.02]}>
        <boxGeometry args={[5.7, 2.14, 0.16]} />
        <meshStandardMaterial color="#272d31" roughness={0.60} metalness={0.50} />
      </mesh>
      <mesh position={[0, 0.06, 0.09]} renderOrder={2}>
        <planeGeometry args={[5.34, 1.76]} />
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
