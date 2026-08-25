import { forwardRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import type { BallStyle, StudioSettings } from "../types";

const PATCHWORK_FACE_COLORS = ["#22c8e8", "#ff3cad", "#ffb11b", "#2c70ed", "#ef3340", "#21c56b", "#6346d8", "#16b8c4"];
const MULTICOLOR_GLASS_CORE = [
  { color: "#e9af32", position: [-0.18, 0.14, 0.02], rotation: [0.2, 0.5, -0.45] },
  { color: "#3399c1", position: [0.14, 0.18, 0.04], rotation: [-0.4, 0.1, 0.7] },
  { color: "#db5a4d", position: [0.2, -0.12, -0.02], rotation: [0.55, -0.35, 0.2] },
  { color: "#6cae67", position: [-0.12, -0.2, 0.08], rotation: [-0.15, 0.75, -0.2] },
  { color: "#7560ae", position: [0.02, 0.01, -0.17], rotation: [0.75, 0.25, 0.55] },
] as const;

/** A non-indexed low-poly sphere lets each face keep one solid reference color. */
export function createPatchworkGeometry() {
  const source = new THREE.IcosahedronGeometry(1, 2);
  const geometry = source.index ? source.toNonIndexed() : source.clone();
  source.dispose();
  const position = geometry.getAttribute("position");
  const colors = new THREE.Float32BufferAttribute(new Float32Array(position.count * 3), 3);
  for (let vertex = 0; vertex < position.count; vertex += 3) {
    const face = Math.floor(vertex / 3);
    const color = new THREE.Color(PATCHWORK_FACE_COLORS[(face * 5 + Math.floor(face / 7)) % PATCHWORK_FACE_COLORS.length]);
    colors.setXYZ(vertex, color.r, color.g, color.b);
    colors.setXYZ(vertex + 1, color.r, color.g, color.b);
    colors.setXYZ(vertex + 2, color.r, color.g, color.b);
  }
  geometry.setAttribute("color", colors);
  geometry.computeVertexNormals();
  return geometry;
}

function marblePatternTexture(style: BallStyle, base: string, stripe: string) {
  const width = 384;
  const height = 192;
  const data = new Uint8Array(width * height * 4);
  const baseColor = new THREE.Color(base);
  const stripeColor = new THREE.Color(stripe);
  const highlight = new THREE.Color("#fff8ef");
  const rainbow = ["#ff3b30", "#ffcc00", "#34c759", "#22d3ee", "#3478f6", "#af52de"].map((color) => new THREE.Color(color));
  for (let y = 0; y < height; y += 1) {
    const v = (y + 0.5) / height;
    for (let x = 0; x < width; x += 1) {
      const u = (x + 0.5) / width;
      let color = baseColor.clone();
      if (style === "rainbow") {
        const band = Math.floor(((u + Math.sin(v * Math.PI * 2) * 0.035 + 1) % 1) * rainbow.length);
        color = rainbow[Math.min(rainbow.length - 1, band)].clone();
      } else if (style === "flower") {
        const localX = ((u * 6) % 1) - 0.5;
        const localY = ((v * 3) % 1) - 0.5;
        const centerDistance = Math.hypot(localX, localY);
        let petal = false;
        for (let index = 0; index < 5; index += 1) {
          const angle = index * Math.PI * 0.4;
          petal ||= Math.hypot(localX - Math.cos(angle) * 0.17, localY - Math.sin(angle) * 0.17) < 0.13;
        }
        if (petal) color = highlight.clone();
        if (centerDistance < 0.09) color = stripeColor.clone();
      } else {
        const wave = Math.sin((u * Math.PI * 2 + Math.sin(v * Math.PI) * 0.82) * 2.5);
        color = wave > 0.18 ? stripeColor.clone() : baseColor.clone();
        if (Math.abs(wave) < 0.12) color.lerp(highlight, 0.22);
      }
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

function MarbleMaterial({ style, settings }: { style: BallStyle; settings: StudioSettings }) {
  const patternMap = useMemo(
    () => marblePatternTexture(style, settings.ballBaseColor, settings.ballStripeColor),
    [settings.ballBaseColor, settings.ballStripeColor, style],
  );
  useEffect(() => () => patternMap.dispose(), [patternMap]);

  if (style === "chrome") {
    return (
      <meshPhysicalMaterial
        color={settings.ballBaseColor}
        metalness={1}
        roughness={0.065}
        clearcoat={1}
        clearcoatRoughness={0.025}
        envMapIntensity={2.05}
      />
    );
  }
  if (style === "glass") {
    return (
      <meshPhysicalMaterial
        color={settings.ballBaseColor}
        metalness={0}
        roughness={0.025}
        transmission={0.92}
        thickness={1.08}
        ior={1.48}
        clearcoat={1}
        clearcoatRoughness={0.018}
        attenuationColor={settings.ballBaseColor}
        attenuationDistance={1.45}
        envMapIntensity={1.85}
      />
    );
  }
  if (style === "neon") {
    return (
      <meshPhysicalMaterial
        color={settings.ballBaseColor}
        emissive={settings.ballBaseColor}
        emissiveIntensity={settings.glowAnimation ? 0.92 : 0.28}
        metalness={0.12}
        roughness={0.14}
        clearcoat={0.9}
        clearcoatRoughness={0.07}
        envMapIntensity={1.25}
      />
    );
  }
  if (style === "multicolor-glass") {
    return (
      <meshPhysicalMaterial
        color="#c9f3e5"
        roughness={0.025}
        transmission={0.94}
        thickness={0.92}
        ior={1.5}
        clearcoat={1}
        clearcoatRoughness={0.018}
        attenuationColor="#6cb9a8"
        attenuationDistance={2.1}
        envMapIntensity={1.9}
      />
    );
  }
  if (style === "fire") {
    return <meshPhysicalMaterial color="#ff6a19" emissive="#ff2a0a" emissiveIntensity={1.35} metalness={0.08} roughness={0.12} clearcoat={1} clearcoatRoughness={0.04} />;
  }
  if (style === "water") {
    return <meshPhysicalMaterial color="#36dff2" roughness={0.02} transmission={0.86} thickness={1.2} ior={1.34} clearcoat={1} attenuationColor="#159ed1" attenuationDistance={1.2} envMapIntensity={1.9} />;
  }
  if (style === "patchwork") {
    return (
      <meshPhysicalMaterial
        vertexColors
        flatShading
        metalness={0.03}
        roughness={0.36}
        clearcoat={0.24}
        clearcoatRoughness={0.22}
        envMapIntensity={1.28}
      />
    );
  }
  if (style === "striped" || style === "flower" || style === "rainbow") {
    return (
      <meshPhysicalMaterial
        map={patternMap}
        metalness={0.04}
        roughness={0.2}
        clearcoat={0.92}
        clearcoatRoughness={0.08}
        envMapIntensity={1.4}
      />
    );
  }
  if (style === "prism") {
    return (
      <meshPhysicalMaterial
        color={settings.ballBaseColor}
        metalness={0.22}
        roughness={0.07}
        clearcoat={1}
        clearcoatRoughness={0.025}
        iridescence={1}
        iridescenceIOR={1.52}
        iridescenceThicknessRange={[160, 820]}
        envMapIntensity={1.9}
      />
    );
  }
  return (
    <meshPhysicalMaterial
      color={settings.ballBaseColor}
      metalness={0.04}
      roughness={0.19}
      clearcoat={0.9}
      clearcoatRoughness={0.08}
      envMapIntensity={1.45}
    />
  );
}

export const RhythmicMarble3D = forwardRef<THREE.Group, {
  settings: StudioSettings;
}>(function RhythmicMarble3D({ settings }, ref) {
  const patchworkGeometry = useMemo(
    () => settings.ballStyle === "patchwork" ? createPatchworkGeometry() : null,
    [settings.ballStyle],
  );
  useEffect(() => () => patchworkGeometry?.dispose(), [patchworkGeometry]);
  const glowStrength = THREE.MathUtils.clamp(settings.animationSensitivity, 0, 1.5);
  const luminous = settings.ballStyle === "neon" || settings.ballStyle === "fire" || settings.ballStyle === "water";
  const haloOpacity = luminous ? 0.2 : 0.11 + glowStrength * 0.025;
  const lightIntensity = settings.ballStyle === "fire" ? 5.2 : luminous ? 4.4 : 2.1 + glowStrength * 0.45;
  const glowColor = settings.ballStyle === "fire" ? "#ff4d12" : settings.ballStyle === "water" ? "#31ddff" : settings.ballBaseColor;

  return (
    <group ref={ref}>
      <mesh castShadow receiveShadow geometry={patchworkGeometry ?? undefined}>
        {!patchworkGeometry && <sphereGeometry args={[1, 64, 48]} />}
        <MarbleMaterial style={settings.ballStyle} settings={settings} />
      </mesh>
      {settings.ballStyle === "glass" && (
        <>
          <mesh scale={0.34}>
            <sphereGeometry args={[1, 32, 24]} />
            <meshPhysicalMaterial color={settings.ballStripeColor} roughness={0.22} metalness={0.08} clearcoat={0.8} transparent opacity={0.72} />
          </mesh>
          <mesh scale={0.79}>
            <sphereGeometry args={[1, 32, 24]} />
            <meshBasicMaterial color="#dff7ff" transparent opacity={0.025} side={THREE.BackSide} depthWrite={false} />
          </mesh>
        </>
      )}
      {settings.ballStyle === "prism" && (
        <mesh scale={0.3}>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial color={settings.ballStripeColor} emissive={settings.ballBaseColor} emissiveIntensity={0.1} roughness={0.18} metalness={0.52} />
        </mesh>
      )}
      {settings.ballStyle === "multicolor-glass" && (
        <group data-marble-core="multicolor-glass" rotation={[0.18, -0.24, 0.16]}>
          {MULTICOLOR_GLASS_CORE.map((piece, index) => (
            <mesh
              key={piece.color}
              position={piece.position}
              rotation={piece.rotation}
              scale={[0.52, 0.18, 0.3]}
            >
              <icosahedronGeometry args={[1, 2]} />
              <meshPhysicalMaterial
                color={piece.color}
                emissive={piece.color}
                emissiveIntensity={0.05}
                roughness={0.18}
                clearcoat={0.72}
                clearcoatRoughness={0.1}
                transparent
                opacity={0.84}
              />
            </mesh>
          ))}
          <mesh scale={0.78}>
            <sphereGeometry args={[1, 36, 28]} />
            <meshBasicMaterial color="#e5fff7" transparent opacity={0.025} side={THREE.BackSide} depthWrite={false} />
          </mesh>
        </group>
      )}
      {settings.ballStyle === "fire" && <mesh scale={0.48}><icosahedronGeometry args={[1, 2]} /><meshBasicMaterial color="#fff3a1" transparent opacity={0.72} /></mesh>}
      {settings.ballStyle === "water" && <><mesh scale={0.32}><sphereGeometry args={[1, 28, 20]} /><meshPhysicalMaterial color="#d9fcff" transmission={0.62} roughness={0.06} transparent opacity={0.68} /></mesh><mesh position={[0.38, 0.32, 0.66]} scale={0.12}><sphereGeometry args={[1, 18, 12]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.72} /></mesh></>}
      {settings.glowAnimation && (
        <>
          <mesh scale={luminous ? 1.14 : 1.1}>
            <sphereGeometry args={[1, 32, 24]} />
            <meshBasicMaterial
              color={glowColor}
              transparent
              opacity={haloOpacity}
              side={THREE.BackSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
          <mesh scale={luminous ? 1.32 : 1.25}>
            <sphereGeometry args={[1, 24, 18]} />
            <meshBasicMaterial color={glowColor} transparent opacity={haloOpacity * 0.22} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
          <pointLight color={glowColor} intensity={lightIntensity} distance={luminous ? 5.2 : 3.8} decay={2} />
        </>
      )}
    </group>
  );
});
