import * as THREE from "three";
import type { PlatformStyle } from "../types";

export function selectedColor(color: string, selected: boolean) {
  if (!selected) return color;
  return `#${new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.38).getHexString()}`;
}

export function SurfaceMaterial({ style, color, selected, glow = 0 }: { style: PlatformStyle; color: string; selected: boolean; glow?: number }) {
  const value = selectedColor(color, selected);
  const glowStrength = THREE.MathUtils.clamp(glow, 0, 1.5);
  if (style.startsWith("glass") || style === "glass") {
    const frosted = style === "glass-frosted";
    const acrylic = style === "glass-acrylic";
    return (
      <meshPhysicalMaterial
        color={value}
        transmission={frosted ? 0.38 : acrylic ? 0.74 : 0.9}
        roughness={frosted ? 0.34 : acrylic ? 0.12 : 0.055}
        metalness={0}
        thickness={acrylic ? 0.42 : 0.72}
        ior={acrylic ? 1.49 : 1.46}
        clearcoat={1}
        clearcoatRoughness={frosted ? 0.22 : 0.035}
        attenuationColor={value}
        attenuationDistance={2.8}
        envMapIntensity={1.45}
        emissive={value}
        emissiveIntensity={glowStrength * 0.08}
      />
    );
  }
  if (style === "prism") {
    return (
      <meshPhysicalMaterial
        color={value}
        roughness={0.12}
        metalness={0.3}
        clearcoat={1}
        clearcoatRoughness={0.04}
        iridescence={1}
        iridescenceIOR={1.5}
        iridescenceThicknessRange={[180, 680]}
        envMapIntensity={1.55}
        emissive={value}
        emissiveIntensity={glowStrength * 0.14}
      />
    );
  }
  if (style.includes("neon") || style === "comet-pad" || style === "glass-optic") {
    return (
      <meshPhysicalMaterial
        color={value}
        emissive={value}
        emissiveIntensity={(selected ? 0.82 : 0.025) + glowStrength * 0.78}
        roughness={0.2}
        metalness={0.16}
        clearcoat={0.72}
        clearcoatRoughness={0.12}
      />
    );
  }
  if (style.includes("rail") || style === "instrument-cymbal" || style === "instrument-wire" || style === "pipe-rail") {
    return <meshStandardMaterial color={value} roughness={0.18} metalness={0.86} envMapIntensity={1.35} emissive={value} emissiveIntensity={glowStrength * 0.05} />;
  }
  return (
    <meshPhysicalMaterial
      color={value}
      roughness={0.25}
      metalness={0.16}
      clearcoat={0.62}
      clearcoatRoughness={0.12}
      envMapIntensity={1.2}
      emissive={value}
      emissiveIntensity={glowStrength * 0.06}
    />
  );
}

export function EndBolt({ x, y, z, color = "#d9e1ea" }: { x: number; y: number; z: number; color?: string }) {
  return (
    <mesh position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.035, 0.035, 0.028, 14]} />
      <meshStandardMaterial color={color} roughness={0.22} metalness={0.88} />
    </mesh>
  );
}
