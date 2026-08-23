import { forwardRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import type { BallStyle, StudioSettings } from "../types";

function stripedTexture(base: string, stripe: string) {
  const width = 384;
  const height = 192;
  const data = new Uint8Array(width * height * 4);
  const baseColor = new THREE.Color(base);
  const stripeColor = new THREE.Color(stripe);
  const highlight = new THREE.Color("#fff8ef");
  for (let y = 0; y < height; y += 1) {
    const v = (y + 0.5) / height;
    for (let x = 0; x < width; x += 1) {
      const u = (x + 0.5) / width;
      const wave = Math.sin((u * Math.PI * 2 + Math.sin(v * Math.PI) * 0.82) * 2.5);
      const edge = Math.abs(wave);
      const useStripe = wave > 0.18;
      const color = useStripe ? stripeColor.clone() : baseColor.clone();
      if (edge < 0.12) color.lerp(highlight, 0.22);
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
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
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
        color="#e4edf5"
        metalness={1}
        roughness={0.055}
        clearcoat={1}
        clearcoatRoughness={0.025}
        envMapIntensity={1.9}
      />
    );
  }
  if (style === "glass") {
    return (
      <meshPhysicalMaterial
        color={settings.ballBaseColor}
        metalness={0}
        roughness={0.025}
        transmission={0.96}
        thickness={1.08}
        ior={1.48}
        clearcoat={1}
        clearcoatRoughness={0.018}
        attenuationColor={settings.ballBaseColor}
        attenuationDistance={2.1}
        envMapIntensity={1.75}
      />
    );
  }
  if (style === "neon") {
    return (
      <meshPhysicalMaterial
        color={settings.ballBaseColor}
        emissive={settings.ballBaseColor}
        emissiveIntensity={1.08}
        metalness={0.15}
        roughness={0.16}
        clearcoat={0.88}
        clearcoatRoughness={0.08}
      />
    );
  }
  if (style === "striped") {
    return (
      <meshPhysicalMaterial
        map={stripeMap}
        metalness={0.04}
        roughness={0.2}
        clearcoat={0.92}
        clearcoatRoughness={0.08}
        envMapIntensity={1.35}
      />
    );
  }
  if (style === "prism") {
    return (
      <meshPhysicalMaterial
        color="#e5efff"
        metalness={0.26}
        roughness={0.075}
        clearcoat={1}
        clearcoatRoughness={0.025}
        iridescence={1}
        iridescenceIOR={1.52}
        iridescenceThicknessRange={[160, 820]}
        envMapIntensity={1.8}
      />
    );
  }
  return (
    <meshPhysicalMaterial
      color={liveColor}
      metalness={0.05}
      roughness={0.2}
      clearcoat={0.86}
      clearcoatRoughness={0.09}
      envMapIntensity={1.35}
    />
  );
}

export const RhythmicMarble3D = forwardRef<THREE.Group, {
  settings: StudioSettings;
  liveColor: THREE.Color;
}>(function RhythmicMarble3D({ settings, liveColor }, ref) {
  return (
    <group ref={ref}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1, 64, 48]} />
        <MarbleMaterial style={settings.ballStyle} settings={settings} liveColor={liveColor} />
      </mesh>
      {settings.ballStyle === "glass" && (
        <>
          <mesh scale={0.34}>
            <sphereGeometry args={[1, 32, 24]} />
            <meshPhysicalMaterial color={settings.ballStripeColor} roughness={0.22} metalness={0.08} clearcoat={0.8} transparent opacity={0.72} />
          </mesh>
          <mesh scale={0.79}>
            <sphereGeometry args={[1, 32, 24]} />
            <meshBasicMaterial color="#dff7ff" transparent opacity={0.025} side={THREE.BackSide} />
          </mesh>
        </>
      )}
      {settings.ballStyle === "prism" && (
        <mesh scale={0.32}>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial color={settings.ballBaseColor} emissive={settings.ballBaseColor} emissiveIntensity={0.18} roughness={0.2} metalness={0.55} />
        </mesh>
      )}
      {settings.ballStyle === "neon" && (
        <>
          <mesh scale={0.78}>
            <sphereGeometry args={[1, 32, 24]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.09} />
          </mesh>
          <pointLight color={settings.ballBaseColor} intensity={4.8} distance={4.2} decay={2} />
        </>
      )}
    </group>
  );
});
