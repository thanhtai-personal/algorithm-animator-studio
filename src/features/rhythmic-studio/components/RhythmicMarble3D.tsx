import { forwardRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import type { BallStyle, StudioSettings } from "../types";

function stripedTexture(base: string, stripe: string) {
  const width = 128;
  const height = 64;
  const data = new Uint8Array(width * height * 4);
  const baseColor = new THREE.Color(base);
  const stripeColor = new THREE.Color(stripe);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const diagonal = (x + y * 2) % 34;
      const useStripe = diagonal < 12;
      const color = useStripe ? stripeColor : baseColor;
      const offset = (y * width + x) * 4;
      data[offset] = Math.round(color.r * 255);
      data[offset + 1] = Math.round(color.g * 255);
      data[offset + 2] = Math.round(color.b * 255);
      data[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1.4, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function MarbleMaterial({ style, settings, liveColor }: {
  style: BallStyle;
  settings: StudioSettings;
  liveColor: THREE.Color;
}) {
  const stripeMap = useMemo(
    () => stripedTexture(settings.ballBaseColor, settings.ballStripeColor),
    [settings.ballBaseColor, settings.ballStripeColor],
  );
  useEffect(() => () => stripeMap.dispose(), [stripeMap]);

  if (style === "chrome") {
    return (
      <meshPhysicalMaterial
        color="#dbe8f5"
        metalness={1}
        roughness={0.08}
        clearcoat={1}
        clearcoatRoughness={0.06}
        envMapIntensity={1.4}
      />
    );
  }
  if (style === "glass") {
    return (
      <meshPhysicalMaterial
        color={settings.ballBaseColor}
        metalness={0.02}
        roughness={0.04}
        transmission={0.9}
        thickness={0.85}
        ior={1.46}
        clearcoat={1}
        clearcoatRoughness={0.03}
        attenuationColor={settings.ballBaseColor}
        attenuationDistance={2.4}
        transparent
        opacity={0.94}
      />
    );
  }
  if (style === "neon") {
    return (
      <meshStandardMaterial
        color={settings.ballBaseColor}
        emissive={settings.ballBaseColor}
        emissiveIntensity={1.45}
        metalness={0.18}
        roughness={0.22}
      />
    );
  }
  if (style === "striped") {
    return (
      <meshPhysicalMaterial
        map={stripeMap}
        metalness={0.08}
        roughness={0.28}
        clearcoat={0.72}
        clearcoatRoughness={0.14}
      />
    );
  }
  if (style === "prism") {
    return (
      <meshPhysicalMaterial
        color="#d8e7ff"
        metalness={0.38}
        roughness={0.12}
        clearcoat={1}
        clearcoatRoughness={0.05}
        iridescence={1}
        iridescenceIOR={1.55}
        iridescenceThicknessRange={[180, 720]}
        envMapIntensity={1.35}
      />
    );
  }
  return (
    <meshPhysicalMaterial
      color={liveColor}
      metalness={0.08}
      roughness={0.27}
      clearcoat={0.55}
      clearcoatRoughness={0.16}
    />
  );
}

export interface RhythmicMarbleHandle extends THREE.Group {
  impactStrength?: number;
}

export const RhythmicMarble3D = forwardRef<THREE.Group, {
  settings: StudioSettings;
  liveColor: THREE.Color;
}>(function RhythmicMarble3D({ settings, liveColor }, ref) {
  return (
    <group ref={ref}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1, 48, 32]} />
        <MarbleMaterial style={settings.ballStyle} settings={settings} liveColor={liveColor} />
      </mesh>
      {settings.ballStyle === "glass" && (
        <mesh scale={0.82}>
          <sphereGeometry args={[1, 28, 20]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.055} side={THREE.BackSide} />
        </mesh>
      )}
      {settings.ballStyle === "neon" && (
        <pointLight color={settings.ballBaseColor} intensity={8} distance={4.5} decay={2} />
      )}
    </group>
  );
});
