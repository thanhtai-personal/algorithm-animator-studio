import { useEffect, useRef, type MutableRefObject } from "react";
import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Frame } from "@/lib/algorithms";
import type { Theme } from "@/lib/renderer";
import { AlgorithmBars3D } from "./AlgorithmBars3D";
import { AlgorithmGraph3D } from "./AlgorithmGraph3D";


let cachedWebGLSupport: boolean | null = null;

export function hasAlgorithm3DWebGLSupport() {
  if (cachedWebGLSupport != null) return cachedWebGLSupport;
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  try {
    const context = canvas.getContext("webgl2", { powerPreference: "high-performance" }) || canvas.getContext("webgl");
    cachedWebGLSupport = Boolean(context);
    if (context) {
      try { context.getExtension("WEBGL_lose_context")?.loseContext(); } catch { /* best effort */ }
    }
    return cachedWebGLSupport;
  } catch {
    cachedWebGLSupport = false;
    return false;
  }
}

export type AlgorithmScene3DProps = {
  frame: Frame;
  previousFrame?: Frame | null;
  frameIndex: number;
  width: number;
  height: number;
  theme: Theme;
  deterministicProgress?: number;
  canvasRef?: MutableRefObject<HTMLCanvasElement | null>;
  exportMode?: boolean;
};

export function AlgorithmScene3D(props: AlgorithmScene3DProps) {
  useEffect(() => () => {
    if (props.canvasRef) props.canvasRef.current = null;
  }, [props.canvasRef]);
  return (
    <Canvas
      frameloop={props.exportMode ? "demand" : "always"}
      dpr={props.exportMode ? 1 : [1, 1.15]}
      shadows
      camera={{ fov: props.height > props.width ? 41 : 38, near: 0.1, far: 120, position: [10, 8.8, 15] }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance", stencil: false, preserveDrawingBuffer: Boolean(props.exportMode) }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        if (props.canvasRef) props.canvasRef.current = gl.domElement;
      }}
    >
      <AlgorithmEnvironment3D theme={props.theme} />
      <AlgorithmCamera3D frame={props.frame} width={props.width} height={props.height} exportMode={Boolean(props.exportMode)} />
      {props.frame.graph ? (
        <AlgorithmGraph3D frame={props.frame} theme={props.theme} />
      ) : (
        <AlgorithmBars3D frame={props.frame} previousFrame={props.previousFrame} theme={props.theme} deterministicProgress={props.deterministicProgress} />
      )}
    </Canvas>
  );
}

function AlgorithmEnvironment3D({ theme }: { theme: Theme }) {
  return (
    <>
      <color attach="background" args={[theme.bg]} />
      <fog attach="fog" args={[theme.bg, 23, 55]} />
      <hemisphereLight args={["#dbeafe", "#020617", 0.72]} />
      <directionalLight
        castShadow
        position={[-9, 14, 10]}
        intensity={2.65}
        color="#fff7ed"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={15}
        shadow-camera-bottom={-10}
        shadow-camera-near={0.5}
        shadow-camera-far={48}
        shadow-bias={-0.00035}
        shadow-normalBias={0.03}
      />
      <pointLight position={[10, 7, 5]} intensity={22} distance={32} decay={2} color={theme.highlight} />
      <pointLight position={[-9, 4, -8]} intensity={16} distance={28} decay={2} color={theme.swap} />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={4.5} color="#e0f2fe" position={[-7, 10, 8]} scale={[8, 12, 1]} />
        <Lightformer form="rect" intensity={3.2} color={theme.highlight} position={[8, 6, -6]} rotation={[0, Math.PI, 0]} scale={[6, 10, 1]} />
      </Environment>
      <mesh position={[0, -0.22, 0]} receiveShadow>
        <boxGeometry args={[28, 0.38, 22]} />
        <meshStandardMaterial color="#0b1220" roughness={0.72} metalness={0.28} />
      </mesh>
      <GridFloor3D color={theme.highlight} />
      <mesh position={[0, 6.5, -8.8]} receiveShadow>
        <boxGeometry args={[28, 13, 0.28]} />
        <meshStandardMaterial color="#111827" roughness={0.62} metalness={0.18} />
      </mesh>
      <mesh position={[0, 6.5, -8.62]}>
        <planeGeometry args={[20, 7.6]} />
        <meshStandardMaterial color="#0f172a" emissive={theme.highlight} emissiveIntensity={0.025} roughness={0.36} metalness={0.42} />
      </mesh>
    </>
  );
}

function GridFloor3D({ color }: { color: string }) {
  return <gridHelper args={[28, 28, color, "#1e293b"]} position={[0, 0.01, 0]} />;
}

function AlgorithmCamera3D({ frame, width, height, exportMode }: { frame: Frame; width: number; height: number; exportMode: boolean }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, frame.graph ? 1.2 : 3.5, 0));
  const desired = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    const portrait = height > width;
    const graph = Boolean(frame.graph);
    desired.current.set(
      graph ? (portrait ? 10.8 : 12.4) : (portrait ? 10.5 : 11.8),
      graph ? (portrait ? 13.2 : 11.4) : (portrait ? 9.6 : 8.6),
      graph ? (portrait ? 17.8 : 15.2) : (portrait ? 18.8 : 15.4),
    );
    desiredTarget.current.set(0, graph ? 1.2 : 3.4, graph ? 0.2 : 0);
    const ease = exportMode ? 1 : 1 - Math.exp(-delta * 5.5);
    camera.position.lerp(desired.current, ease);
    target.current.lerp(desiredTarget.current, ease);
    camera.lookAt(target.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      const desiredFov = portrait ? (graph ? 43 : 39) : (graph ? 40 : 36);
      camera.fov = THREE.MathUtils.lerp(camera.fov, desiredFov, ease);
      camera.updateProjectionMatrix();
    }
  });
  return null;
}
