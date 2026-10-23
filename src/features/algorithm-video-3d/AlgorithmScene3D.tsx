import { useEffect, type MutableRefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Frame } from "@/lib/algorithms";
import type { Theme } from "@/lib/renderer";
import type { AlgorithmVideoAdSelection } from "@/lib/algorithmVideoAds";
import { AlgorithmBars3D } from "./AlgorithmBars3D";
import { AlgorithmGraph3D } from "./AlgorithmGraph3D";
import { AlgorithmStage3D } from "./AlgorithmStage3D";
import { AlgorithmSwapCranes3D } from "./AlgorithmSwapCranes3D";

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
  ads?: AlgorithmVideoAdSelection;
  storyMode?: boolean;
};

export function AlgorithmScene3D(props: AlgorithmScene3DProps) {
  const graph = Boolean(props.frame.graph);
  const progress = props.deterministicProgress ?? 1;
  useEffect(() => () => {
    if (props.canvasRef) props.canvasRef.current = null;
  }, [props.canvasRef]);

  return (
    <Canvas
      frameloop="demand"
      dpr={props.exportMode ? 1 : [0.85, 1]}
      shadows={false}
      camera={{
        fov: props.height > props.width ? 39 : 34,
        near: 0.1,
        far: 90,
        position: [10.5, 8.2, 16.4],
      }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        preserveDrawingBuffer: Boolean(props.exportMode),
      }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        if (props.canvasRef) props.canvasRef.current = gl.domElement;
      }}
    >
      <AlgorithmStage3D theme={props.theme} graph={graph} ads={props.ads} />
      <AlgorithmCamera3D frame={props.frame} width={props.width} height={props.height} />
      <RenderInvalidator frameIndex={props.frameIndex} progress={progress} width={props.width} height={props.height} />
      {props.frame.graph ? (
        <AlgorithmGraph3D frame={props.frame} theme={props.theme} deterministicProgress={progress} />
      ) : (
        <>
          <AlgorithmBars3D frame={props.frame} previousFrame={props.previousFrame} theme={props.theme} deterministicProgress={progress} storyMode={props.storyMode} />
          <AlgorithmSwapCranes3D frame={props.frame} previousFrame={props.previousFrame} theme={props.theme} progress={progress} />
        </>
      )}
    </Canvas>
  );
}

function AlgorithmCamera3D({ frame, width, height }: { frame: Frame; width: number; height: number }) {
  const { camera } = useThree();
  const portrait = height > width;
  const graph = Boolean(frame.graph);

  useEffect(() => {
    // Keep the composition locked. Selection/compare/visit are communicated by
    // lighting only; moving lookAt/FOV on every active index makes the video jitter.
    const position = graph
      ? new THREE.Vector3(portrait ? 7.8 : 8.8, portrait ? 11.8 : 10.0, portrait ? 21.5 : 18.4)
      : new THREE.Vector3(portrait ? 6.7 : 7.4, portrait ? 8.7 : 7.45, portrait ? 25.2 : 22.8);
    const target = new THREE.Vector3(0, graph ? 1.0 : 2.15, graph ? -0.2 : 0.18);

    camera.position.copy(position);
    camera.lookAt(target);
    camera.rotation.z = 0;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = portrait ? (graph ? 44 : 42) : (graph ? 40 : 39);
      camera.updateProjectionMatrix();
    }
  }, [camera, portrait, graph]);
  return null;
}

function RenderInvalidator({ frameIndex, progress, width, height }: { frameIndex: number; progress: number; width: number; height: number }) {
  const { invalidate } = useThree();
  useEffect(() => invalidate(), [invalidate, frameIndex, progress, width, height]);
  return null;
}
