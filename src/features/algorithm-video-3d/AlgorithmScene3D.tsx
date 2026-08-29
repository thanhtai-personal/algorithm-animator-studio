import { useEffect, useMemo, type MutableRefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Frame } from "@/lib/algorithms";
import type { Theme } from "@/lib/renderer";
import { AlgorithmBars3D } from "./AlgorithmBars3D";
import { AlgorithmGraph3D } from "./AlgorithmGraph3D";
import { AlgorithmStage3D } from "./AlgorithmStage3D";
import { AlgorithmSwapCranes3D } from "./AlgorithmSwapCranes3D";
import { arrayLayout } from "./algorithm3dMath";

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
      <AlgorithmStage3D theme={props.theme} graph={graph} />
      <AlgorithmCamera3D frame={props.frame} width={props.width} height={props.height} progress={progress} />
      <RenderInvalidator frameIndex={props.frameIndex} progress={progress} width={props.width} height={props.height} />
      {props.frame.graph ? (
        <AlgorithmGraph3D frame={props.frame} theme={props.theme} deterministicProgress={progress} />
      ) : (
        <>
          <AlgorithmBars3D frame={props.frame} previousFrame={props.previousFrame} theme={props.theme} deterministicProgress={progress} />
          <AlgorithmSwapCranes3D frame={props.frame} previousFrame={props.previousFrame} theme={props.theme} progress={progress} />
        </>
      )}
    </Canvas>
  );
}

function AlgorithmCamera3D({ frame, width, height, progress }: { frame: Frame; width: number; height: number; progress: number }) {
  const { camera } = useThree();
  const portrait = height > width;
  const graph = Boolean(frame.graph);
  const focusX = graph ? graphFocusX(frame) : barFocusX(frame);
  const swapWide = frame.event === "swap" ? 1.15 + Math.sin(Math.PI * progress) * 0.85 : 0;
  const position = useMemo(() => new THREE.Vector3(
    graph ? (portrait ? 8.6 : 9.6) : (portrait ? 8.2 : 9.2),
    graph ? (portrait ? 12.2 : 10.5) : (portrait ? 9.5 : 8.35),
    graph ? (portrait ? 19.5 : 17.2) : (portrait ? 21.0 : 18.2) + swapWide * 1.35,
  ), [graph, portrait, swapWide]);
  const target = useMemo(() => new THREE.Vector3(
    focusX * (frame.event === "swap" ? 0.08 : 0.13),
    graph ? 1.0 : 2.55,
    graph ? -0.2 : -0.35,
  ), [focusX, graph, frame.event]);

  useEffect(() => {
    camera.position.copy(position);
    camera.lookAt(target);
    camera.rotation.z = 0;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = portrait ? (graph ? 43 : 40) : (graph ? 39 : frame.event === "swap" ? 37 : 35);
      camera.updateProjectionMatrix();
    }
  }, [camera, position, target, portrait, graph, frame.event]);
  return null;
}

function RenderInvalidator({ frameIndex, progress, width, height }: { frameIndex: number; progress: number; width: number; height: number }) {
  const { invalidate } = useThree();
  useEffect(() => invalidate(), [invalidate, frameIndex, progress, width, height]);
  return null;
}

function barFocusX(frame: Frame) {
  const active = [...frame.swap, ...frame.highlight, ...(frame.pivot != null ? [frame.pivot] : [])]
    .filter((value, index, array) => value >= 0 && array.indexOf(value) === index);
  if (!active.length || !frame.arr.length) return 0;
  const layout = arrayLayout(frame.arr);
  return active.reduce((sum, index) => sum + layout.xFor(index), 0) / active.length;
}

function graphFocusX(frame: Frame) {
  const graph = frame.graph;
  if (!graph || graph.current == null) return 0;
  const node = graph.nodes.find((candidate) => candidate.id === graph.current) ?? graph.nodes[graph.current];
  return node ? (node.x - 0.5) * 13.5 : 0;
}
