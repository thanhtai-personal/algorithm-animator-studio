import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  ALGORITHM_VIDEO_AD_SLOTS,
  createDefaultAlgorithmVideoAds,
  getAlgorithmVideoAd,
  type AlgorithmVideoAd,
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
              ad={ad}
              slotLabel={slot.label.vi}
            />
          );
        }
        return (
          <RoadsideBillboard
            key={slot.id}
            slotId={slot.id}
            position={[5.15, 2.55, -10.9]}
            rotationY={-0.14}
            ad={ad}
            slotLabel={slot.label.vi}
          />
        );
      })}
    </group>
  );
}

function FacadeAd({ position, width, height, ad, slotLabel }: {
  slotId: AlgorithmVideoAdSlotId;
  position: [number, number, number];
  width: number;
  height: number;
  ad: AlgorithmVideoAd;
  slotLabel: string;
}) {
  const texture = useBrandTexture(ad, slotLabel, "facade");
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

function RoadsideBillboard({ position, ad, slotLabel, rotationY = 0 }: {
  slotId: AlgorithmVideoAdSlotId;
  position: [number, number, number];
  ad: AlgorithmVideoAd;
  slotLabel: string;
  rotationY?: number;
}) {
  const texture = useBrandTexture(ad, slotLabel, "billboard");
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

function useBrandTexture(ad: AlgorithmVideoAd, slotLabel: string, style: "facade" | "billboard") {
  const texture = useMemo(() => makeBrandTexture(ad, slotLabel, style), [ad, slotLabel, style]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function makeBrandTexture(ad: AlgorithmVideoAd, slotLabel: string, style: "facade" | "billboard") {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 420;
  const ctx = canvas.getContext("2d")!;

  if (ad.creative === "kata_rental") drawKataRentalCreative(ctx, canvas, ad);
  else drawStandardCreative(ctx, canvas, ad, slotLabel, style);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function drawStandardCreative(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  ad: AlgorithmVideoAd,
  slotLabel: string,
  style: "facade" | "billboard",
) {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, style === "facade" ? "#15191d" : "#11161a");
  gradient.addColorStop(1, style === "facade" ? "#252a2e" : "#20262b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (ad.id !== "none") {
    ctx.fillStyle = ad.accent;
    ctx.globalAlpha = 0.80;
    ctx.fillRect(58, 58, 8, 304);
    ctx.globalAlpha = 1;

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `800 ${ad.brand.length > 18 ? 72 : 88}px Arial, Helvetica, sans-serif`;
    ctx.fillText(ad.brand, 104, 168, 990);

    const secondary = ad.url || (ad.id === "test" ? slotLabel : ad.subtitle) || "";
    if (secondary) {
      ctx.fillStyle = "rgba(233,238,241,0.60)";
      ctx.font = "600 38px Arial, Helvetica, sans-serif";
      ctx.fillText(secondary, 108, 276, 930);
    }
  }

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
}

function drawKataRentalCreative(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, ad: AlgorithmVideoAd) {
  const burgundy = ad.accent;
  const gold = ad.accentSecondary ?? "#c5a163";
  const cream = "#efe4cf";
  const creamDark = "#ded0b8";

  const background = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  background.addColorStop(0, "#f7efdf");
  background.addColorStop(0.58, cream);
  background.addColorStop(1, creamDark);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Warm edge vignette gives the board a photographed storefront feel without
  // baking the reference photo into every export.
  const vignette = ctx.createRadialGradient(600, 190, 70, 600, 190, 720);
  vignette.addColorStop(0, "rgba(255,255,255,0.12)");
  vignette.addColorStop(1, "rgba(84,49,37,0.12)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(93,55,48,0.20)";
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
  ctx.strokeStyle = gold;
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 2;
  ctx.strokeRect(38, 38, canvas.width - 76, canvas.height - 76);
  ctx.globalAlpha = 1;

  // Small sponsor marker: visible enough for a paid placement, secondary to KATA.
  roundedRect(ctx, 54, 48, 184, 34, 17);
  ctx.fillStyle = burgundy;
  ctx.fill();
  ctx.fillStyle = "rgba(255,248,236,0.92)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 17px Arial, Helvetica, sans-serif";
  ctx.fillText("KATA RENTAL", 146, 65);

  ctx.textAlign = "left";
  ctx.fillStyle = burgundy;
  ctx.font = "900 134px Georgia, 'Times New Roman', serif";
  ctx.fillText(ad.brand, 58, 180);

  ctx.fillStyle = "#553b3a";
  ctx.font = "700 41px Arial, Helvetica, sans-serif";
  ctx.fillText(ad.subtitle ?? "TIỆM THUÊ ĐỒ · MAKEUP", 390, 164, 730);

  ctx.fillStyle = gold;
  ctx.fillRect(392, 196, 650, 3);

  ctx.fillStyle = "rgba(77,54,51,0.84)";
  ctx.font = "700 25px Arial, Helvetica, sans-serif";
  ctx.fillText("TRANG PHỤC  ·  PHỤ KIỆN  ·  MAKEUP", 392, 232, 720);

  // CTA is deliberately more prominent than the raw full URL: it remains legible
  // after a 1080p video is scaled down by Shorts/Reels players.
  roundedRect(ctx, 54, 292, 555, 72, 16);
  ctx.fillStyle = burgundy;
  ctx.fill();
  ctx.fillStyle = "rgba(255,248,236,0.96)";
  ctx.font = "800 21px Arial, Helvetica, sans-serif";
  ctx.fillText("XEM MẪU & THÔNG TIN THUÊ", 78, 318);
  ctx.fillStyle = "rgba(255,248,236,0.78)";
  ctx.font = "600 22px Arial, Helvetica, sans-serif";
  ctx.fillText(ad.displayUrl ?? "kata.makeup/vi/kata", 78, 345, 500);

  ctx.fillStyle = "#523938";
  ctx.font = "800 25px Arial, Helvetica, sans-serif";
  ctx.fillText(ad.contact ?? "", 665, 309, 450);
  ctx.fillStyle = "rgba(75,53,49,0.74)";
  ctx.font = "600 20px Arial, Helvetica, sans-serif";
  ctx.fillText(ad.address ?? "", 665, 344, 465);
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
