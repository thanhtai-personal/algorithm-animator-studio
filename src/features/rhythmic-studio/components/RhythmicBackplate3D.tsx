import { useEffect, useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { StudioSettings } from "../types";

const BACKPLATE_DISTANCE = 13.35;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform float uBlur;
  uniform vec2 uTexel;
  varying vec2 vUv;

  vec4 blurredSample(vec2 uv) {
    if (uBlur < 0.01) return texture2D(uMap, uv);
    vec2 d = uTexel * uBlur;
    vec4 color = texture2D(uMap, uv) * 0.24;
    color += texture2D(uMap, uv + vec2(d.x, 0.0)) * 0.12;
    color += texture2D(uMap, uv - vec2(d.x, 0.0)) * 0.12;
    color += texture2D(uMap, uv + vec2(0.0, d.y)) * 0.12;
    color += texture2D(uMap, uv - vec2(0.0, d.y)) * 0.12;
    color += texture2D(uMap, uv + d) * 0.07;
    color += texture2D(uMap, uv - d) * 0.07;
    color += texture2D(uMap, uv + vec2(d.x, -d.y)) * 0.07;
    color += texture2D(uMap, uv + vec2(-d.x, d.y)) * 0.07;
    return color;
  }

  void main() {
    vec4 source = blurredSample(vUv);
    gl_FragColor = vec4(source.rgb, source.a * uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function RhythmicBackplate3D({ url, settings }: { url: string; settings: StudioSettings }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(url);
  const { gl, size } = useThree();
  const forward = useMemo(() => new THREE.Vector3(), []);
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: texture },
      uOpacity: { value: settings.backgroundImageOpacity },
      uBlur: { value: settings.backgroundImageBlur },
      uTexel: { value: new THREE.Vector2(1 / 1024, 1 / 1024) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  }), [texture]);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    texture.needsUpdate = true;
    const image = texture.image as { width?: number; height?: number } | undefined;
    if (image?.width && image?.height) material.uniforms.uTexel.value.set(1 / image.width, 1 / image.height);
  }, [gl, material, texture]);

  useEffect(() => {
    material.uniforms.uOpacity.value = settings.backgroundImageOpacity;
    material.uniforms.uBlur.value = settings.backgroundImageBlur;
  }, [material, settings.backgroundImageBlur, settings.backgroundImageOpacity]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ camera }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const perspective = camera as THREE.PerspectiveCamera;
    forward.set(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
    mesh.position.copy(camera.position).addScaledVector(forward, BACKPLATE_DISTANCE);
    mesh.quaternion.copy(camera.quaternion);

    const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(perspective.fov) / 2) * BACKPLATE_DISTANCE;
    const viewWidth = viewHeight * (size.width / Math.max(1, size.height));
    const image = texture.image as { width?: number; height?: number } | undefined;
    const imageAspect = image?.width && image?.height ? image.width / image.height : 16 / 9;
    const viewAspect = viewWidth / viewHeight;
    let width = viewWidth;
    let height = viewHeight;

    if (settings.backgroundImageFit === "cover") {
      if (imageAspect > viewAspect) {
        height = viewHeight * 1.08;
        width = height * imageAspect;
      } else {
        width = viewWidth * 1.08;
        height = width / imageAspect;
      }
    } else if (imageAspect > viewAspect) {
      width = viewWidth * 0.96;
      height = width / imageAspect;
    } else {
      height = viewHeight * 0.96;
      width = height * imageAspect;
    }
    mesh.scale.set(width, height, 1);
  });

  return (
    <mesh ref={meshRef} renderOrder={-900} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
