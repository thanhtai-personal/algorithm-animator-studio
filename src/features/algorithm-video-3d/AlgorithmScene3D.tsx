import { useEffect, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Frame } from "@/lib/algorithms";
import type { Theme } from "@/lib/renderer";
import { AlgorithmBars3D } from "./AlgorithmBars3D";
import { AlgorithmGraph3D } from "./AlgorithmGraph3D";
import { AlgorithmStage3D } from "./AlgorithmStage3D";
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
  useEffect(() => () => {
    if (props.canvasRef) props.canvasRef.current = null;
  }, [props.canvasRef]);

  return (
    <Canvas
      frameloop={props.exportMode ? "demand" : "always"}
      dpr={props.exportMode ? 1 : [1, 1.35]}
      shadows
      camera={{
        fov: props.height > props.width ? 39 : 34,
        near: 0.1,
        far: 120,
        position: [10.5, 8.4, 16.8],
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
        gl.toneMappingExposure = 1.13;
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        if (props.canvasRef) props.canvasRef.current = gl.domElement;
      }}
    >
      <AlgorithmStage3D theme={props.theme} graph={graph} />
      <AlgorithmCamera3D
        frame={props.frame}
        width={props.width}
        height={props.height}
        exportMode={Boolean(props.exportMode)}
        deterministicProgress={props.deterministicProgress}
      />
      {props.frame.graph ? (
        <AlgorithmGraph3D frame={props.frame} theme={props.theme} deterministicProgress={props.deterministicProgress} />
      ) : (
        <AlgorithmBars3D
          frame={props.frame}
          previousFrame={props.previousFrame}
          theme={props.theme}
          deterministicProgress={props.deterministicProgress}
        />
      )}
    </Canvas>
  );
}

function AlgorithmCamera3D({ frame, width, height, exportMode, deterministicProgress }: {
  frame: Frame;
  width: number;
  height: number;
  exportMode: boolean;
  deterministicProgress?: number;
}) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, frame.graph ? 1.3 : 3.2, 0));
  const desired = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());

  useFrame(({ clock }, delta) => {
    const portrait = height > width;
    const graph = Boolean(frame.graph);
    const focusX = graph ? graphFocusX(frame) : barFocusX(frame);
    const progress = deterministicProgress ?? ((Math.sin(clock.elapsedTime * 0.45) + 1) * 0.5);
    const eventPush = frame.event === "swap" ? Math.sin(Math.PI * progress) : 0;
    const orbit = exportMode ? 0 : Math.sin(clock.elapsedTime * 0.16) * 0.22;

    desired.current.set(
      (graph ? (portrait ? 10.4 : 11.9) : (portrait ? 9.8 : 11.25)) + orbit + focusX * 0.08,
      graph ? (portrait ? 12.6 : 10.8) : (portrait ? 9.25 : 8.05),
      (graph ? (portrait ? 18.4 : 16.25) : (portrait ? 19.4 : 16.55)) - eventPush * 0.48,
    );
    desiredTarget.current.set(focusX * 0.2, graph ? 1.15 : 3.15 + eventPush * 0.12, graph ? 0.15 : 0.35);

    const ease = exportMode ? 1 : 1 - Math.exp(-delta * 4.2);
    camera.position.lerp(desired.current, ease);
    target.current.lerp(desiredTarget.current, ease);
    camera.lookAt(target.current);
    camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, frame.event === "swap" ? -0.008 * eventPush : 0, ease);

    if (camera instanceof THREE.PerspectiveCamera) {
      const desiredFov = portrait ? (graph ? 41 : 37) : (graph ? 37 : 33.5);
      camera.fov = THREE.MathUtils.lerp(camera.fov, desiredFov + eventPush * 0.7, ease);
      camera.updateProjectionMatrix();
    }
  });
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
