import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  ALGORITHM_VIDEO_AD_SLOTS,
  createDefaultAlgorithmVideoAds,
  getAlgorithmVideoAd,
  type AlgorithmVideoAdSelection,
  type AlgorithmVideoAdSlotId,
} from "@/lib/algorithmVideoAds";

export function AlgorithmBranding3D({ ads = createDefaultAlgorithmVideoAds() }: { ads?: AlgorithmVideoAdSelection }) {
  return (
    <group>
      {ALGORITHM_VIDEO_AD_SLOTS.map((slot) => {
        const ad = getAlgorithmVideoAd(ads[slot.id]);
        if (slot.placement === "facade") {
          return (
            <FacadeAd
              key={slot.id}
              slotId={slot.id}
              position={[-6.35, 2.48, -9.4]}
              width={4.25}
              height={1.45}
              brand={ad.brand}
              subtitle={ad.id === "test" ? slot.label.vi : ad.subtitle}
              url={ad.url}
              accent={ad.accent}
              empty={ad.id === "none"}
            />
          );
        }
        return (
          <RoadsideBillboard
            key={slot.id}
            slotId={slot.id}
            position={[5.15, 2.55, -10.9]}
            rotationY={-0.14}
            brand={ad.brand}
            subtitle={ad.id === "test" ? slot.label.vi : ad.subtitle}
            url={ad.url}
            accent={ad.accent}
            empty={ad.id === "none"}
          />
        );
      })}
    </group>
  );
}

function FacadeAd({ position, width, height, brand, subtitle, url, accent, empty }: {
  slotId: AlgorithmVideoAdSlotId;
  position: [number, number, number];
  width: number;
  height: number;
  brand: string;
  subtitle?: string;
  url?: string;
  accent: string;
  empty: boolean;
}) {
  const texture = useBrandTexture(brand, subtitle, url, accent, "facade", empty);
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

function RoadsideBillboard({ position, brand, subtitle, url, accent, empty, rotationY = 0 }: {
  slotId: AlgorithmVideoAdSlotId;
  position: [number, number, number];
  brand: string;
  subtitle?: string;
  url?: string;
  accent: string;
  empty: boolean;
  rotationY?: number;
}) {
  const texture = useBrandTexture(brand, subtitle, url, accent, "billboard", empty);
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

function useBrandTexture(
  brand: string,
  subtitle: string | undefined,
  url: string | undefined,
  accent: string,
  style: "facade" | "billboard",
  empty: boolean,
) {
  const texture = useMemo(
    () => makeBrandTexture(brand, subtitle, url, accent, style, empty),
    [brand, subtitle, url, accent, style, empty],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function makeBrandTexture(
  brand: string,
  subtitle: string | undefined,
  url: string | undefined,
  accent: string,
  style: "facade" | "billboard",
  empty: boolean,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 420;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, style === "facade" ? "#15191d" : "#11161a");
  gradient.addColorStop(1, style === "facade" ? "#252a2e" : "#20262b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!empty) {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.80;
    ctx.fillRect(58, 58, 8, 304);
    ctx.globalAlpha = 1;

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `800 ${brand.length > 18 ? 72 : 88}px Arial, Helvetica, sans-serif`;
    ctx.fillText(brand, 104, 168, 990);

    const secondary = url || subtitle || "";
    if (secondary) {
      ctx.fillStyle = "rgba(233,238,241,0.60)";
      ctx.font = "600 38px Arial, Helvetica, sans-serif";
      ctx.fillText(secondary, 108, 276, 930);
    }
  }

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
